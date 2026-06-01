/**
 * Resolves which player seat the local client acts as.
 * Solo vs bots: human only acts on their own turn (not bot seats).
 */

import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/enums.js';

export type ClientPlayMode = 'solo' | 'local' | 'online';

export function resolveActingPlayerId(
  _gameState: GameState,
  localPlayerId: PlayerId,
  _playMode: ClientPlayMode,
): PlayerId {
  return localPlayerId;
}

/** True when the human may submit actions (solo vs bots or multiplayer). */
export function isHumanTurn(
  gameState: GameState,
  localPlayerId: PlayerId,
  playMode: ClientPlayMode,
): boolean {
  return gameState.activePlayerId === localPlayerId;
}
