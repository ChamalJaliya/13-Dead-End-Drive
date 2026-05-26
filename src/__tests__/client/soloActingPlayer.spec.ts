// soloActingPlayer.spec.ts — resolveActingPlayerId for solo hot-seat control

import { describe, expect, it } from 'vitest';
import { resolveActingPlayerId } from '../../client/soloActingPlayer.js';
import {
  makeGameState,
  PLAYER_A_ID,
  PLAYER_B_ID,
} from '../fixtures/gameState.fixtures.js';

describe('resolveActingPlayerId', () => {
  it('returns activePlayerId in solo mode even when local seat is Player A', () => {
    const state = makeGameState({
      activePlayerId: PLAYER_B_ID,
    });
    expect(resolveActingPlayerId(state, PLAYER_A_ID, 'solo')).toBe(PLAYER_B_ID);
  });

  it('returns localPlayerId in multiplayer when it is not the active turn', () => {
    const state = makeGameState({
      activePlayerId: PLAYER_B_ID,
    });
    expect(resolveActingPlayerId(state, PLAYER_A_ID, 'multiplayer')).toBe(PLAYER_A_ID);
  });

  it('returns activePlayerId in solo when local seat matches active', () => {
    const state = makeGameState({
      activePlayerId: PLAYER_A_ID,
    });
    expect(resolveActingPlayerId(state, PLAYER_A_ID, 'solo')).toBe(PLAYER_A_ID);
  });
});
