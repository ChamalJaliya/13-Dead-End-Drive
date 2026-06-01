/**
 * state-broadcast.ts — masked STATE_SYNC per connected client.
 */

import { filterStateForPlayer } from '../network/broadcastPipeline.js';
import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/enums.js';
import type { StateSyncResponse } from '../types/socket-events.js';
import type { ActionCard } from '../types/entities.js';

export interface ColyseusClientLike {
  readonly sessionId: string;
  send(type: string, message: unknown): void;
}

export function buildStateSync(
  state: GameState,
  playerId: PlayerId,
  triggeredByEventId: string,
): StateSyncResponse {
  const masked = filterStateForPlayer(state, playerId);
  const privateHand = [...(state.players[playerId]?.hand ?? [])];
  const timestamp = new Date().toISOString();
  return {
    type:               'STATE_SYNC',
    responseId:         crypto.randomUUID(),
    gameId:             state.gameId,
    timestamp,
    triggeredByEventId,
    payload: {
      gameState:   masked,
      privateHand: privateHand as ActionCard[],
    },
  };
}

export function broadcastMaskedState(
  state: GameState,
  clients: Iterable<{ sessionId: string; playerId: PlayerId; send: ColyseusClientLike['send'] }>,
  triggeredByEventId: string,
): void {
  for (const client of clients) {
    const msg = buildStateSync(state, client.playerId, triggeredByEventId);
    client.send('STATE_SYNC', msg);
  }
}
