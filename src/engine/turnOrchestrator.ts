/**
 * turnOrchestrator.ts
 * Master turn orchestrator for 13 Dead End Drive.
 * Enforces the game's transactional sub-phase state machine:
 *
 *   AWAITING_ROLL   → player rolls both dice
 *   FIRST_MOVE      → player moves one character. If it lands on a trap, pauses at AWAITING_TRAP_1.
 *   AWAITING_TRAP_1 → play matching card, draw from deck, or decline. Resumes to SECOND_MOVE.
 *   SECOND_MOVE     → player moves another character. Pauses at AWAITING_TRAP_2 on trap.
 *   AWAITING_TRAP_2 → resolve trap. Resumes to TURN_END.
 *   TURN_END        → rotates turn to next non-eliminated player.
 */

import type { GameState }         from '../types/game-state.js';
import type { SocketEvent, MovePawnEvent, PlayTrapCardEvent } from '../types/socket-events.js';
import type { CharacterId, PlayerId } from '../types/enums.js';
import { applyPortraitStackRotation } from './portraitStack.js';
import { EngineError }             from './EngineError.js';
import { rollDice, applyDiceRoll } from './diceRoller.js';
import { applyMovementPlan } from './movementPlan.js';
import { moveCharacter }           from './moveCharacter.js';
import { resolveTrapCard, resolveDrawCard, resolveTrapDecline } from './trapEvaluator.js';
import { evaluateWinCondition }    from './winCondition.js';

export function processTurn(state: GameState, event: SocketEvent): GameState {
  if (state.phase === 'GAME_OVER') {
    throw new EngineError(
      'GAME_ALREADY_OVER',
      'Cannot execute turn actions after the game has ended.'
    );
  }

  const { playerId, timestamp } = event;

  // ── Guard 1: Turn ownership (all client-initiated events must come from active player) ──
  if (state.activePlayerId !== playerId) {
    throw new EngineError(
      'NOT_YOUR_TURN',
      `It is ${state.activePlayerId}'s turn, not ${playerId}'s.`
    );
  }

  let nextState: GameState;

  switch (event.type) {
    case 'ROLL_DICE': {
      if (state.subPhase !== 'AWAITING_ROLL') {
        throw new EngineError('INVALID_MOVE', 'Dice have already been rolled this turn.');
      }
      const roll = rollDice(playerId);
      nextState = applyDiceRoll(state, roll);
      break;
    }

    case 'CHOOSE_MOVEMENT_PLAN':
      nextState = applyMovementPlan(state, event.payload.plan);
      break;

    case 'CHANGE_PORTRAIT': {
      // Allowed only on doubles before any movement has occurred in the FIRST_MOVE subphase
      if (state.subPhase !== 'FIRST_MOVE' || state.movesUsedThisTurn !== 0) {
        throw new EngineError('INVALID_MOVE', 'Cannot change the portrait at this time.');
      }
      if (!state.lastDiceRoll || !state.lastDiceRoll.isDoubles) {
        throw new EngineError('INVALID_MOVE', 'Changing the portrait requires a doubles roll.');
      }

      nextState = changePortraitOnDoubles(state, timestamp);
      break;
    }

    case 'MOVE_PAWN': {
      nextState = moveCharacter(state, event as MovePawnEvent);
      nextState = evaluateWinCondition(nextState);

      // If no trap is pending and we entered TURN_END, wrap up the turn
      if (nextState.subPhase === 'TURN_END' && nextState.pendingTrapCell === null) {
        nextState = rotateTurn(nextState, timestamp);
      }
      break;
    }

    case 'PLAY_TRAP_CARD': {
      if (state.subPhase !== 'AWAITING_TRAP_1' && state.subPhase !== 'AWAITING_TRAP_2') {
        throw new EngineError('NO_PENDING_TRAP', 'There is no pending trap space to resolve.');
      }
      nextState = resolveTrapCard(state, event as PlayTrapCardEvent);
      nextState = evaluateWinCondition(nextState);

      if (nextState.subPhase === 'TURN_END' && nextState.pendingTrapCell === null) {
        nextState = rotateTurn(nextState, timestamp);
      }
      break;
    }

    case 'DRAW_TRAP_CARD': {
      if (state.subPhase !== 'AWAITING_TRAP_1' && state.subPhase !== 'AWAITING_TRAP_2') {
        throw new EngineError('NO_PENDING_TRAP', 'There is no pending trap space to resolve.');
      }
      nextState = resolveDrawCard(state, playerId, timestamp);
      nextState = evaluateWinCondition(nextState);
      break;
    }

    case 'DECLINE_TRAP': {
      if (state.subPhase !== 'AWAITING_TRAP_1' && state.subPhase !== 'AWAITING_TRAP_2') {
        throw new EngineError('NO_PENDING_TRAP', 'There is no pending trap space to resolve.');
      }
      nextState = resolveTrapDecline(state, playerId, timestamp);
      nextState = evaluateWinCondition(nextState);

      if (nextState.subPhase === 'TURN_END' && nextState.pendingTrapCell === null) {
        nextState = rotateTurn(nextState, timestamp);
      }
      break;
    }

    default: {
      nextState = state;
      break;
    }
  }

  return nextState;
}

// =============================================================================
// Helper Functions
// =============================================================================

function changePortraitOnDoubles(state: GameState, timestamp: string): GameState {
  const currentHeirId = state.activePortrait.currentHeirId;
  const updatedPortrait = applyPortraitStackRotation(
    state.activePortrait,
    state.turnNumber,
    'DOUBLES_ROLL',
  );
  const nextHeirId = updatedPortrait.currentHeirId;

  const updatedCharacters = { ...state.characters };
  if (currentHeirId !== 'AUNT_AGATHA' && updatedCharacters[currentHeirId]) {
    updatedCharacters[currentHeirId] = {
      ...updatedCharacters[currentHeirId]!,
      isPortraitHeir: false,
    };
  }
  if (nextHeirId !== 'AUNT_AGATHA' && updatedCharacters[nextHeirId]) {
    updatedCharacters[nextHeirId] = {
      ...updatedCharacters[nextHeirId]!,
      isPortraitHeir: true,
    };
  }

  return {
    ...state,
    characters: updatedCharacters,
    activePortrait: updatedPortrait,
    updatedAt: timestamp,
  };
}

function rotateTurn(state: GameState, timestamp: string): GameState {
  const currentIdx = state.turnOrder.indexOf(state.activePlayerId);
  const orderLength = state.turnOrder.length;

  if (orderLength === 0) return state;

  // Scan order starting from the next player, skip eliminated ones
  let nextIdx = (currentIdx + 1) % orderLength;
  while (nextIdx !== currentIdx) {
    const nextPlayerId = state.turnOrder[nextIdx]!;
    const nextPlayer = state.players[nextPlayerId];
    if (nextPlayer && !nextPlayer.isEliminated) {
      break;
    }
    nextIdx = (nextIdx + 1) % orderLength;
  }

  const newActivePlayerId = state.turnOrder[nextIdx]!;
  
  // turnNumber increments when turn index wraps back or is lower than previous index
  let newTurnNumber = state.turnNumber;
  if (nextIdx <= currentIdx) {
    newTurnNumber += 1;
  }

  return {
    ...state,
    activePlayerId: newActivePlayerId,
    turnNumber:     newTurnNumber,
    subPhase:       'AWAITING_ROLL',
    lastDiceRoll:      null,
    pipsRemaining:     null,
    movementPlan:      null,
    firstMoveCharacterId: null,
    movesUsedThisTurn: 0,
    pendingTrapCell:   null,
    pendingTrapHandCardIds: null,
    pendingTrapDrawnCardId: null,
    updatedAt:      timestamp,
  };
}
