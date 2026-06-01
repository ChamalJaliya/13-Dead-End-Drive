/**
 * dispatchGameEvent.ts — single client ingress for player intents (RFC 006).
 */

import { EngineError } from '@ded/engine/EngineError.js';
import type { GameState } from '@ded/types/game-state.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { PlayerId } from '@ded/types/enums.js';
import type { GameSession } from './GameSession.js';

export interface DispatchContext {
  readonly session: GameSession | null;
  readonly gameState: GameState | null;
  readonly onError?: (message: string) => void;
}

export function dispatchGameEvent(
  ctx: DispatchContext,
  event: SocketEvent,
): GameState | null {
  if (!ctx.session || !ctx.gameState) {
    return null;
  }
  try {
    return ctx.session.submitAction(event);
  } catch (err) {
    if (err instanceof EngineError) {
      ctx.onError?.(err.message);
    }
    return null;
  }
}

export function buildPlayerEvent(
  type: SocketEvent['type'],
  gameState: GameState,
  playerId: PlayerId,
  payload?: Extract<SocketEvent, { type: typeof type }> extends { payload: infer P } ? P : never,
): SocketEvent {
  const base = {
    type,
    eventId: crypto.randomUUID(),
    gameId: gameState.gameId,
    playerId,
    timestamp: new Date().toISOString(),
  };
  if (payload !== undefined) {
    return { ...base, payload } as SocketEvent;
  }
  return base as SocketEvent;
}
