/**
 * eventRouter.ts
 * Idempotent event routing layer — Phase 3.4.
 * All transport entry points must route player actions through here before processTurn().
 */

import type { GameState } from '../types/game-state.js';
import type { SocketEvent } from '../types/socket-events.js';
import type { GameId } from '../types/enums.js';
import { EngineError } from '../engine/EngineError.js';
import { processTurn } from '../engine/turnOrchestrator.js';

export interface IdempotencyStore {
  hasProcessed(gameId: GameId, eventId: string): boolean;
  markProcessed(gameId: GameId, eventId: string): void;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly processed = new Map<GameId, Set<string>>();

  public hasProcessed(gameId: GameId, eventId: string): boolean {
    return this.processed.get(gameId)?.has(eventId) ?? false;
  }

  public markProcessed(gameId: GameId, eventId: string): void {
    let set = this.processed.get(gameId);
    if (!set) {
      set = new Set();
      this.processed.set(gameId, set);
    }
    set.add(eventId);
  }

  public clearRoom(gameId: GameId): void {
    this.processed.delete(gameId);
  }
}

/**
 * Routes a player socket event through idempotency guard + pure turn orchestrator.
 */
export function routePlayerEvent(
  state: GameState,
  event: SocketEvent,
  store: IdempotencyStore,
): GameState {
  if (store.hasProcessed(state.gameId, event.eventId)) {
    throw new EngineError(
      'IDEMPOTENCY_CONFLICT',
      `Event ${event.eventId} was already processed for game ${state.gameId}.`,
    );
  }

  const nextState = processTurn(state, event);
  store.markProcessed(state.gameId, event.eventId);
  return nextState;
}
