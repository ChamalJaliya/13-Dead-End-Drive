/**
 * applyPlayerAction.ts — delegates to GameSession via dispatchGameEvent (RFC 006).
 */

import type { GameState } from '@ded/types/game-state.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { GameSession } from '../session/GameSession.js';
import { dispatchGameEvent } from '../session/dispatchGameEvent.js';

export type PlayMode = 'solo' | 'local' | 'online';

export function applyPlayerAction(
  session: GameSession | null,
  gameState: GameState,
  event: SocketEvent,
  onError?: (message: string) => void,
): GameState | null {
  const ctx = onError
    ? { session, gameState, onError }
    : { session, gameState };
  return dispatchGameEvent(ctx, event);
}
