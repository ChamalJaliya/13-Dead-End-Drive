// game-action.service.spec.ts — GameActionService
import { describe, it, expect } from 'vitest';
import { GameActionService } from '../../server/game-action.service.js';
import { InMemoryIdempotencyStore } from '../../network/eventRouter.js';
import { makeGameState } from '../fixtures/gameState.fixtures.js';
import { EngineError } from '../../engine/EngineError.js';
import type { SocketEvent } from '../../types/socket-events.js';

function expectEngineError(fn: () => unknown, code: string): void {
  try {
    fn();
    throw new Error('Expected EngineError');
  } catch (err: unknown) {
    expect(err).toBeInstanceOf(EngineError);
    expect((err as EngineError).code).toBe(code);
  }
}

describe('GameActionService', () => {
  const service = new GameActionService();
  const store = new InMemoryIdempotencyStore();

  it('rejects playerId mismatch', () => {
    const state = makeGameState();
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: 'player-other' as typeof state.activePlayerId,
      timestamp: new Date().toISOString(),
    };
    expect(() =>
      service.assertAuthorized(state.activePlayerId, state.gameId, event),
    ).toThrow();
  });

  it('applies ROLL_DICE for active player', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    };
    service.assertAuthorized(state.activePlayerId, state.gameId, event);
    const next = service.applyAction(state, event, store);
    expect(next.lastDiceRoll).not.toBeNull();
  });

  it('rejects duplicate eventId', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const eventId = crypto.randomUUID();
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId,
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    };
    service.applyAction(state, event, store);
    expectEngineError(
      () => service.applyAction(state, event, store),
      'IDEMPOTENCY_CONFLICT',
    );
  });
});
