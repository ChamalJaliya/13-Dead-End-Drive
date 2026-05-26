/**
 * detectiveTrack.ts
 * Rebuilt to match the REAL 13 Dead End Drive board game rules.
 *
 * Detective Track:
 *   1. Advances 1 step when a DETECTIVE card is drawn.
 *   2. When detective reaches maxSteps (13), the game ends.
 *   3. Whoever controls the current portrait heir wins.
 */

import type { GameState } from '../types/game-state.js';
import { EngineError }     from './EngineError.js';
import { evaluateWinCondition } from './winCondition.js';

export function advanceDetective(state: GameState): GameState {
  if (state.phase === 'GAME_OVER') {
    throw new EngineError(
      'GAME_ALREADY_OVER',
      'Cannot advance the detective after the game has ended.'
    );
  }

  const { currentStep, maxSteps } = state.detectivePosition;
  const newStep = currentStep + 1;
  const isAtExit = newStep >= maxSteps;

  const updatedDetective = {
    ...state.detectivePosition,
    currentStep: newStep,
    isAtExit,
  };

  let nextState: GameState = {
    ...state,
    detectivePosition: updatedDetective,
    updatedAt: new Date().toISOString(),
  };

  // Evaluate win condition immediately in case detective reaches exit
  nextState = evaluateWinCondition(nextState);

  return nextState;
}
