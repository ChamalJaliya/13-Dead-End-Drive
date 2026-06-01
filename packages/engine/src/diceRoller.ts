/**
 * diceRoller.ts
 * Server-authoritative dice roll for 13 Dead End Drive.
 * Real game: two standard six-sided movement dice.
 * On doubles: player may optionally change the portrait before moving.
 */

import type { DiceRollResult }  from '@ded/types/game-state.js';
import type { GameState }       from '@ded/types/game-state.js';
import type { MovementDie }     from '@ded/types/enums.js';

// ── Single die ────────────────────────────────────────────────────────────────

function rollD6(): MovementDie {
  return (Math.floor(Math.random() * 6) + 1) as MovementDie;
}

// ── Roll both dice and build the result snapshot ──────────────────────────────

export function rollDice(rolledBy: string): DiceRollResult {
  const die1 = rollD6();
  const die2 = rollD6();
  return {
    die1,
    die2,
    isDoubles: die1 === die2,
    rolledBy,
    rolledAt:  new Date().toISOString(),
  };
}

// ── Apply a dice roll to the game state ───────────────────────────────────────

export function applyDiceRoll(state: GameState, roll: DiceRollResult): GameState {
  return {
    ...state,
    lastDiceRoll:      roll,
    pipsRemaining:     roll.die1,       // default split plan until CHOOSE_MOVEMENT_PLAN
    movementPlan:      'SPLIT',
    firstMoveCharacterId: null,
    movesUsedThisTurn: 0,
    pendingTrapCell:   null,
    pendingTrapHandCardIds: null,
    pendingTrapDrawnCardId: null,
    // Move to FIRST_MOVE sub-phase.
    // If doubles, the client is notified and may optionally change the portrait
    // before making their first move (CHANGE_PORTRAIT event is optional).
    subPhase:          'FIRST_MOVE',
    updatedAt:         new Date().toISOString(),
  };
}
