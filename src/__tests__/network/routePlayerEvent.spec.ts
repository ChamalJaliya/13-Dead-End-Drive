/**
 * routePlayerEvent.spec.ts
 * Unit tests for idempotent event routing into the turn orchestrator.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { routePlayerEvent, InMemoryIdempotencyStore } from '../../network/eventRouter.js';
import { EngineError } from '../../engine/EngineError.js';
import {
  makeGameState,
  makeFirstMoveState,
  PLAYER_A_ID,
  GAME_ID,
} from '../fixtures/gameState.fixtures.js';
import type { SocketEvent } from '../../types/socket-events.js';

function expectEngineError(fn: () => unknown, code: string): void {
  let caught: unknown;
  try { fn(); } catch (e) { caught = e; }
  expect(caught).toBeInstanceOf(EngineError);
  expect((caught as EngineError).code).toBe(code);
}

describe('eventRouter', () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it('routes a valid event through processTurn and records idempotency', () => {
    const state = makeGameState({
      subPhase: 'AWAITING_ROLL',
      lastDiceRoll: null,
    });

    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: 'evt-idem-001',
      gameId: GAME_ID,
      playerId: PLAYER_A_ID,
      timestamp: '2026-05-25T12:00:00Z',
    };

    const next = routePlayerEvent(state, event, store);
    expect(next.subPhase).toBe('FIRST_MOVE');
    expect(store.hasProcessed(GAME_ID, 'evt-idem-001')).toBe(true);
  });

  it('throws IDEMPOTENCY_CONFLICT when the same eventId is submitted twice', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: 'evt-dup-001',
      gameId: GAME_ID,
      playerId: PLAYER_A_ID,
      timestamp: '2026-05-25T12:00:00Z',
    };

    routePlayerEvent(state, event, store);
    expectEngineError(() => routePlayerEvent(state, event, store), 'IDEMPOTENCY_CONFLICT');
  });

  it('allows a second distinct eventId in the same turn', () => {
    let state = makeFirstMoveState(1, 2);

    state = routePlayerEvent(state, {
      type: 'MOVE_PAWN',
      eventId: 'evt-move-1',
      gameId: GAME_ID,
      playerId: PLAYER_A_ID,
      timestamp: '2026-05-25T12:00:00Z',
      payload: {
        characterId: 'SMOTHERS',
        fromCell: 'RC_1',
        toCell: 'HALL_1',
        pipsUsed: 1,
        path: ['RC_1', 'HALL_1'],
      },
    }, store);

    expect(state.subPhase === 'SECOND_MOVE' || state.subPhase === 'AWAITING_TRAP_1').toBe(true);
    expect(store.hasProcessed(GAME_ID, 'evt-move-1')).toBe(true);
  });
});
