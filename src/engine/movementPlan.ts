/**
 * movementPlan.ts — split vs combined dice allocation after a roll
 */

import type { GameState } from '../types/game-state.js';
import type { MovementPlan, PipCount } from '../types/enums.js';
import { EngineError } from './EngineError.js';

function combinedPips(die1: number, die2: number): PipCount {
  const total = die1 + die2;
  if (total < 1 || total > 12) {
    throw new EngineError('INVALID_MOVE', `Invalid combined pip count: ${total}`);
  }
  return total as PipCount;
}

export function applyMovementPlan(state: GameState, plan: MovementPlan): GameState {
  if (state.subPhase !== 'FIRST_MOVE' || state.movesUsedThisTurn !== 0) {
    throw new EngineError('INVALID_MOVE', 'Movement plan can only be chosen before the first move.');
  }
  if (!state.lastDiceRoll) {
    throw new EngineError('INVALID_MOVE', 'Roll dice before choosing how to use them.');
  }
  if (state.movementPlan === plan) {
    return state;
  }

  if (state.movementPlan === 'COMBINED' && plan === 'SPLIT') {
    throw new EngineError(
      'INVALID_MOVE',
      'Cannot switch to split dice after choosing combined movement.',
    );
  }

  const { die1, die2 } = state.lastDiceRoll;
  const pipsRemaining = plan === 'COMBINED' ? combinedPips(die1, die2) : die1;

  return {
    ...state,
    movementPlan: plan,
    pipsRemaining,
    firstMoveCharacterId: null,
    updatedAt: new Date().toISOString(),
  };
}
