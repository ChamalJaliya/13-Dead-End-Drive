/**
 * actionDispatcher.ts
 * Client-Side Orchestrator & Action Dispatcher — Phase 4.3 implementation.
 *
 * Translates raw viewport mouse clicks/taps into logical grid node cell selections,
 * reverse-queries active pawn coordinates, and dispatches actions to the network registry.
 */

import type { GameState } from '../../types/game-state.js';
import type { CellId, CharacterId } from '../../types/enums.js';
import type { SocketEvent } from '../../types/socket-events.js';
import type { SessionManager } from '../../network/sessionManager.js';
import { findCellAtWorld } from '../boardCoordinates.js';

export interface Vector2D {
  readonly x: number;
  readonly y: number;
}

export type ActionType = 'MOVE_PAWN' | 'PLAY_CARD';

export interface ActionPayload {
  readonly cellId:      CellId;
  readonly characterId: CharacterId | null;
}

/**
 * Projects raw screen coordinates onto logical grid coordinates using TILE_SIZE,
 * matching grid cell boundaries and reverse-querying alive characters.
 */
export function handleBoardClick(screenCoord: Vector2D, state: GameState): ActionPayload | null {
  const matchedCellId = findCellAtWorld(state, screenCoord.x, screenCoord.y);
  if (!matchedCellId) {
    return null;
  }

  // Reverse query characters map to locate alive occupants
  let matchedCharacterId: CharacterId | null = null;
  for (const [charId, char] of Object.entries(state.characters)) {
    if (char.position === matchedCellId && char.status === 'ALIVE') {
      matchedCharacterId = charId as CharacterId;
      break;
    }
  }

  return {
    cellId:      matchedCellId,
    characterId: matchedCharacterId,
  };
}

/**
 * Dispatches a player action event to the SessionManager instance.
 */
export async function dispatchAction(
  action: ActionType,
  event: SocketEvent,
  manager: SessionManager,
  socketId: string,
): Promise<GameState> {
  const nextState = await manager.handlePlayerAction(socketId, event);
  return nextState;
}
