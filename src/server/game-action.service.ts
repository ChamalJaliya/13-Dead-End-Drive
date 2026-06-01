/**
 * game-action.service.ts — authoritative apply + auth checks for player actions.
 */

import { EngineError } from '../engine/EngineError.js';
import { routePlayerEvent, type IdempotencyStore } from '../network/eventRouter.js';
import type { GameState } from '../types/game-state.js';
import type { SocketEvent } from '../types/socket-events.js';
import type { PlayerId } from '../types/enums.js';

export class GameActionService {
  public assertAuthorized(
    registeredPlayerId: PlayerId,
    registeredRoomId: string,
    event: SocketEvent,
  ): void {
    if (registeredPlayerId !== event.playerId) {
      throw new EngineError(
        'UNAUTHORIZED_ACTION',
        `Socket playerId mismatch. Registered: ${registeredPlayerId}, Event: ${event.playerId}`,
      );
    }
    if (registeredRoomId !== event.gameId) {
      throw new EngineError(
        'UNAUTHORIZED_ACTION',
        `Socket roomId mismatch. Registered: ${registeredRoomId}, Event: ${event.gameId}`,
      );
    }
  }

  public applyAction(
    state: GameState,
    event: SocketEvent,
    store: IdempotencyStore,
  ): GameState {
    return routePlayerEvent(state, event, store);
  }
}
