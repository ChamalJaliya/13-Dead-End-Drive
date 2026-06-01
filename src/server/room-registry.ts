/**
 * room-registry.ts — in-process map of active Colyseus rooms by gameId.
 */

import type { DeadEndDriveRoom } from './dead-end-drive.room.js';
import type { GameId } from '../types/enums.js';

const byGameId = new Map<GameId, DeadEndDriveRoom>();

export function registerActiveRoom(gameId: GameId, room: DeadEndDriveRoom): void {
  byGameId.set(gameId, room);
}

export function unregisterActiveRoom(gameId: GameId): void {
  byGameId.delete(gameId);
}

export function getActiveRoom(gameId: GameId): DeadEndDriveRoom | undefined {
  return byGameId.get(gameId);
}
