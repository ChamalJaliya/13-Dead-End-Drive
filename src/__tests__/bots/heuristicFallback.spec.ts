// heuristicFallback.spec.ts — pickHeuristicAction

import { describe, expect, it } from 'vitest';
import { pickHeuristicAction } from '../../bots/heuristicFallback.js';
import { enumerateLegalActions } from '../../bots/legalActions.js';
import { makeGameState, PLAYER_A_ID } from '../fixtures/gameState.fixtures.js';

describe('pickHeuristicAction', () => {
  it('returns a valid index for roll dice', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL', activePlayerId: PLAYER_A_ID });
    const legal = enumerateLegalActions(state, PLAYER_A_ID);
    const idx = pickHeuristicAction(legal, state, PLAYER_A_ID, 'NORMAL');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(legal.length);
  });

  it('throws when legal list is empty', () => {
    const state = makeGameState({ phase: 'GAME_OVER' });
    expect(() =>
      pickHeuristicAction([], state, PLAYER_A_ID, 'EASY'),
    ).toThrow();
  });
});
