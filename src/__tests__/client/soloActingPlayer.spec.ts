// soloActingPlayer.spec.ts — resolveActingPlayerId and isHumanTurn

import { describe, expect, it } from 'vitest';
import { resolveActingPlayerId, isHumanTurn } from '../../client/soloActingPlayer.js';
import {
  makeGameState,
  PLAYER_A_ID,
  PLAYER_B_ID,
} from '../fixtures/gameState.fixtures.js';

describe('resolveActingPlayerId', () => {
  it('always returns localPlayerId in solo mode', () => {
    const state = makeGameState({ activePlayerId: PLAYER_B_ID });
    expect(resolveActingPlayerId(state, PLAYER_A_ID, 'solo')).toBe(PLAYER_A_ID);
  });

  it('returns localPlayerId in local mode', () => {
    const state = makeGameState({ activePlayerId: PLAYER_B_ID });
    expect(resolveActingPlayerId(state, PLAYER_A_ID, 'local')).toBe(PLAYER_A_ID);
  });
});

describe('isHumanTurn', () => {
  it('is true in solo only when active seat is the local human', () => {
    const state = makeGameState({ activePlayerId: PLAYER_A_ID });
    expect(isHumanTurn(state, PLAYER_A_ID, 'solo')).toBe(true);
    expect(isHumanTurn(state, PLAYER_B_ID, 'solo')).toBe(false);
  });
});
