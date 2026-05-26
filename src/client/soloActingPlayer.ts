/**
 * Solo hot-seat: one human controls both player seats.
 * Engine events must use whoever currently owns the turn.
 */

import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/enums.js';

export type ClientPlayMode = 'solo' | 'multiplayer';

export function resolveActingPlayerId(
  gameState: GameState,
  localPlayerId: PlayerId,
  playMode: ClientPlayMode,
): PlayerId {
  return playMode === 'solo' ? gameState.activePlayerId : localPlayerId;
}
