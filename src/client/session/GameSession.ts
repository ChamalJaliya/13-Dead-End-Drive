/**
 * GameSession.ts — port for all play modes (RFC 006).
 */

import type { GameState } from '@ded/types/game-state.js';

export type StateListener = (state: GameState) => void;

export interface GameSession {
  submitAction(event: import('@ded/types/socket-events.js').SocketEvent): GameState | null;
  getState(): GameState | null;
  onState(listener: StateListener): () => void;
  dispose(): void;
}
