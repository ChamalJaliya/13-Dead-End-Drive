/**
 * createGameSession.ts — factory for play-mode sessions.
 */

import type { PlayMode } from '../store/applyPlayerAction.js';
import type { GameState } from '@ded/types/game-state.js';
import type { LocalMultiplayerClient } from '../multiplayer/localMultiplayerClient.js';
import type { ColyseusRemoteClient } from '../multiplayer/colyseusRemoteClient.js';
import type { GameSession } from './GameSession.js';
import { SoloSession } from './SoloSession.js';
import { LocalSession } from './LocalSession.js';
import { OnlineSession } from './OnlineSession.js';

export function createGameSession(
  playMode: PlayMode,
  gameState: GameState,
  localClient: LocalMultiplayerClient | null,
  onlineClient: ColyseusRemoteClient | null,
): GameSession {
  if (playMode === 'online' && onlineClient) {
    const session = new OnlineSession(onlineClient);
    session.applyServerState(gameState);
    return session;
  }
  if (playMode === 'local' && localClient) {
    return new LocalSession(localClient, gameState);
  }
  return new SoloSession(gameState);
}
