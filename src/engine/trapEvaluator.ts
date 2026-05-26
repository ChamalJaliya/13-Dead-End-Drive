/**
 * trapEvaluator.ts
 * Rebuilt to match the REAL 13 Dead End Drive board game rules.
 *
 * Trap Mechanics:
 *   1. When landing on a trap cell, pendingTrapCell is set and subPhase is paused
 *      at AWAITING_TRAP_1 or AWAITING_TRAP_2.
 *   2. Player can PLAY_TRAP_CARD (matching trap or wild) → springs trap, eliminates pawn,
 *      spends trap, discards card.
 *   3. Player can DRAW_TRAP_CARD → draws top card from deck.
 *      - If DETECTIVE: advances detective track, discards card, player must draw again.
 *      - If TRAP/WILD: added to hand. Player can then play it (if matching) or decline.
 *   4. Player can DECLINE_TRAP → clears pendingTrapCell and resumes turn.
 */

import type { GameState, PlayerState }         from '../types/game-state.js';
import { rootedCharacterIdsForPlayer }         from './characterOwnership.js';
import type { PlayTrapCardEvent }               from '../types/socket-events.js';
import type { ActionCard, Character, TrapState, FireplacePortrait } from '../types/entities.js';
import type { CharacterId, CellId, PlayerId, TrapId }  from '../types/enums.js';
import { CHARACTER_IDS }                        from '../types/enums.js';
import { EngineError }                          from './EngineError.js';
import { cardMatchesTrap, drawCard, shuffleDeck } from './cardDeck.js';
import { advanceDetective }                     from './detectiveTrack.js';
import { exposeRootingForEliminated }           from './rootingReveal.js';

// =============================================================================
// Public API — Action Resolvers
// =============================================================================

/**
 * Handles playing a trap card or wild card to spring the pending trap.
 */
export function resolveTrapCard(state: GameState, event: PlayTrapCardEvent): GameState {
  const { playerId, payload } = event;
  const { cardId, targetCell } = payload;

  // ── Guard 1: Turn ownership ────────────────────────────────────────────────
  if (state.activePlayerId !== playerId) {
    throw new EngineError('NOT_YOUR_TURN', `It is not your turn.`);
  }

  // ── Guard 2: Verify pending trap space ─────────────────────────────────────
  if (state.pendingTrapCell === null || state.pendingTrapCell !== targetCell) {
    throw new EngineError('NO_PENDING_TRAP', 'There is no pending trap at this cell.');
  }

  const cell = state.board[targetCell];
  const trapId = cell?.trapRef;
  if (!cell || !trapId) {
    throw new EngineError('NO_PENDING_TRAP', 'Cell does not host a trap.');
  }

  const trap = state.traps[trapId];
  if (!trap || trap.state !== 'READY') {
    throw new EngineError('TRAP_ALREADY_SPENT', 'This trap has already been spent.');
  }

  // ── Guard 3: Card verification ─────────────────────────────────────────────
  const player = state.players[playerId];
  if (!player) {
    throw new EngineError('UNAUTHORIZED_ACTION', 'Player state not found.');
  }

  const cardIdx = player.hand.findIndex((c) => c.cardId === cardId);
  if (cardIdx === -1) {
    throw new EngineError('CARD_NOT_IN_HAND', 'The specified card is not in your hand.');
  }

  const card = player.hand[cardIdx]!;
  if (!cardMatchesTrap(card, trapId)) {
    throw new EngineError('WRONG_TRAP_CARD', 'This card does not match the pending trap.');
  }

  if (
    state.pendingTrapDrawnCardId !== null &&
    cardId !== state.pendingTrapDrawnCardId
  ) {
    throw new EngineError(
      'INVALID_MOVE',
      'After drawing on a trap, you may only play the card you just drew.',
    );
  }

  if (
    state.pendingTrapDrawnCardId === null &&
    state.pendingTrapHandCardIds !== null &&
    !state.pendingTrapHandCardIds.includes(cardId)
  ) {
    throw new EngineError(
      'INVALID_MOVE',
      'You cannot play a trap card that was not in your hand when you landed on this trap.',
    );
  }

  // ── Step 1: Remove card from hand and push to discard ──────────────────────
  const updatedHand = player.hand.filter((_, idx) => idx !== cardIdx);
  const updatedPlayer: PlayerState = {
    ...player,
    hand: updatedHand,
  };

  let nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
    discardPile: [...state.discardPile, card],
  };

  // ── Step 2: Fire the trap! ─────────────────────────────────────────────────
  nextState = fireTrap(nextState, trapId, event.timestamp);

  // ── Step 3: Advance subPhase and resume turn flow ──────────────────────────
  nextState = advanceSubPhaseAfterTrap(clearTrapPendingFlags(nextState));

  return nextState;
}

/**
 * Draws the top trap deck card (detective auto-advances; trap cards go to hand).
 * Used for TRAP_DRAW board spaces and pending-trap draws.
 */
export interface TrapDrawResult {
  readonly state: GameState;
  readonly drawnCard: ActionCard | null;
}

export function drawTrapCardFromDeck(
  state: GameState,
  playerId: PlayerId,
  timestamp: string,
): TrapDrawResult {
  const drawResult = drawCard(state.deck);
  if (!drawResult) {
    if (state.discardPile.length > 0) {
      const cleanState = {
        ...state,
        deck: shuffleDeck([...state.discardPile]),
        discardPile: [],
      };
      return drawTrapCardFromDeck(cleanState, playerId, timestamp);
    }
    throw new EngineError('INVALID_MOVE', 'The card deck is empty.');
  }

  const { card, remainingDeck } = drawResult;
  let nextState: GameState = {
    ...state,
    deck: remainingDeck,
    updatedAt: timestamp,
  };

  if (card.isDetective) {
    nextState = {
      ...nextState,
      discardPile: [...nextState.discardPile, card],
    };
    nextState = advanceDetective(nextState);
    return { state: nextState, drawnCard: card };
  }

  const player = nextState.players[playerId];
  if (player) {
    const updatedPlayer: PlayerState = {
      ...player,
      hand: [...player.hand, card],
    };
    nextState = {
      ...nextState,
      players: {
        ...nextState.players,
        [playerId]: updatedPlayer,
      },
    };
  }

  return { state: nextState, drawnCard: card };
}

/**
 * Handles drawing a card from the deck when on a pending trap cell.
 */
export function resolveDrawCard(state: GameState, playerId: PlayerId, timestamp: string): GameState {
  if (state.activePlayerId !== playerId) {
    throw new EngineError('NOT_YOUR_TURN', `It is not your turn.`);
  }

  if (state.pendingTrapCell === null) {
    throw new EngineError('NO_PENDING_TRAP', 'There is no pending trap to draw for.');
  }

  const cell = state.board[state.pendingTrapCell];
  const trapId = cell?.trapRef;
  if (!trapId) {
    throw new EngineError('NO_PENDING_TRAP', 'Pending cell is not a trap.');
  }

  let nextState = state;
  let drawnCard: ActionCard | null = null;

  do {
    const drawResult = drawTrapCardFromDeck(nextState, playerId, timestamp);
    nextState = drawResult.state;
    drawnCard = drawResult.drawnCard;
    if (nextState.phase === 'GAME_OVER') {
      return nextState;
    }
  } while (drawnCard?.isDetective === true);

  if (!drawnCard || !cardMatchesTrap(drawnCard, trapId)) {
    return advanceSubPhaseAfterTrap(clearTrapPendingFlags(nextState));
  }

  return {
    ...nextState,
    pendingTrapHandCardIds: null,
    pendingTrapDrawnCardId: drawnCard.cardId,
  };
}

/**
 * Handles declining to spring a trap.
 */
export function resolveTrapDecline(state: GameState, playerId: PlayerId, timestamp: string): GameState {
  // ── Guard 1: Turn ownership ────────────────────────────────────────────────
  if (state.activePlayerId !== playerId) {
    throw new EngineError('NOT_YOUR_TURN', `It is not your turn.`);
  }

  // ── Guard 2: Verify pending trap space ─────────────────────────────────────
  if (state.pendingTrapCell === null) {
    throw new EngineError('NO_PENDING_TRAP', 'There is no pending trap to decline.');
  }

  // Decline simply resumes the turn flow without firing the trap
  let nextState: GameState = {
    ...state,
    updatedAt: timestamp,
  };

  nextState = advanceSubPhaseAfterTrap(nextState);

  return nextState;
}

// =============================================================================
// Internal Helpers
// =============================================================================

function clearTrapPendingFlags(state: GameState): GameState {
  return {
    ...state,
    pendingTrapHandCardIds: null,
    pendingTrapDrawnCardId: null,
  };
}

function advanceSubPhaseAfterTrap(state: GameState): GameState {
  const die2 = state.lastDiceRoll?.die2 ?? state.pipsRemaining ?? 2;

  if (state.subPhase === 'AWAITING_TRAP_1') {
    return {
      ...clearTrapPendingFlags(state),
      pendingTrapCell: null,
      pipsRemaining: die2,
      subPhase: 'SECOND_MOVE',
    };
  }

  return {
    ...clearTrapPendingFlags(state),
    pendingTrapCell: null,
    pipsRemaining: null,
    subPhase: 'TURN_END',
  };
}

/**
 * Springs a trap, spending it, eliminating all characters on lethal cells,
 * and performing all cascade checks (portrait rotation, player elimination).
 */
export function fireTrap(state: GameState, trapId: TrapId, timestamp: string): GameState {
  const trap = state.traps[trapId];
  if (!trap || trap.state !== 'READY') {
    return state;
  }

  // Spend the trap
  const updatedTrap: TrapState = { ...trap, state: 'SPENT' };
  let updatedTraps = { ...state.traps, [trapId]: updatedTrap };

  // Collect characters to eliminate
  const eliminatedIds: CharacterId[] = [];
  for (const charId of CHARACTER_IDS) {
    const character = state.characters[charId];
    if (
      character &&
      character.status === 'ALIVE' &&
      trap.eliminatesOnCells.includes(character.position)
    ) {
      eliminatedIds.push(charId);
    }
  }

  let updatedCharacters = { ...state.characters };
  let updatedBoard = { ...state.board };

  // Eliminate occupants
  for (const charId of eliminatedIds) {
    const char = updatedCharacters[charId]!;
    updatedCharacters[charId] = {
      ...char,
      status: 'ELIMINATED',
      eliminationCause: 'TRAP',
      isPortraitHeir: false,
    };

    // Remove from board cell occupants list
    const cell = updatedBoard[char.position];
    if (cell) {
      updatedBoard[char.position] = {
        ...cell,
        occupants: cell.occupants.filter((id) => id !== charId),
      };
    }
  }

  // Handle portrait heir elimination
  let updatedPortrait = state.activePortrait;
  const heirWasEliminated =
    state.activePortrait.currentHeirId !== 'AUNT_AGATHA' &&
    eliminatedIds.includes(state.activePortrait.currentHeirId);

  if (heirWasEliminated) {
    updatedPortrait = rotatePortrait(state, updatedCharacters, state.activePortrait.currentHeirId);
    // Apply isPortraitHeir flag to new heir
    const newHeirId = updatedPortrait.currentHeirId;
    if (newHeirId !== 'AUNT_AGATHA') {
      const newHeirChar = updatedCharacters[newHeirId];
      if (newHeirChar) {
        updatedCharacters[newHeirId] = {
          ...newHeirChar,
          isPortraitHeir: true,
        };
      }
    }
  }

  // Re-calculate player elimination flags
  const updatedPlayers = computePlayerElimination(state.players, updatedCharacters);

  let nextState: GameState = {
    ...state,
    traps: updatedTraps,
    characters: updatedCharacters,
    board: updatedBoard,
    activePortrait: updatedPortrait,
    players: updatedPlayers,
    updatedAt: timestamp,
  };

  nextState = exposeRootingForEliminated(nextState, eliminatedIds);

  return nextState;
}

function rotatePortrait(
  state: GameState,
  characters: Record<CharacterId, Character>,
  eliminatedHeirId: CharacterId,
): FireplacePortrait {
  // Pick the first ALIVE character that isn't the eliminated heir
  let nextHeirId: CharacterId | undefined;
  for (const charId of CHARACTER_IDS) {
    if (charId === eliminatedHeirId) continue;
    const char = characters[charId];
    if (char && char.status === 'ALIVE') {
      nextHeirId = charId;
      break;
    }
  }

  const resolvedHeirId = nextHeirId ?? eliminatedHeirId;

  const remainingStack = state.activePortrait.portraitStack.filter(
    (id) => id !== eliminatedHeirId,
  );
  const stackWithHeir =
    remainingStack.length > 0
      ? remainingStack
      : [...state.activePortrait.portraitStack];

  return {
    currentHeirId: resolvedHeirId,
    portraitStack: stackWithHeir,
    portraitHistory: [...state.activePortrait.portraitHistory, eliminatedHeirId],
    lastChangedOnTurn: state.turnNumber,
    lastChangedReason: 'HEIR_ELIMINATED',
  };
}

function computePlayerElimination(
  players: Record<PlayerId, PlayerState>,
  characters: Record<CharacterId, Character>,
): Record<PlayerId, PlayerState> {
  const updated = { ...players };
  for (const pid of Object.keys(players)) {
    const p = players[pid]!;
    const allEliminated = rootedCharacterIdsForPlayer(p).every((charId) => {
      const char = characters[charId];
      return !char || char.status === 'ELIMINATED';
    });

    updated[pid] = {
      ...p,
      isEliminated: allEliminated,
    };
  }
  return updated;
}
