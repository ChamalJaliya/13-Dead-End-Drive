/**
 * lobby.service.ts — REST lobby lifecycle (create / join / start).
 */

import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { startGameFromLobby } from '../../../src/server/dead-end-drive.room.js';
import { RoomPersistenceService } from '../../../src/server/room-persistence.service.js';
import { getActiveRoom } from '../../../src/server/room-registry.js';
import type { GameState } from '../../../src/types/game-state.js';
import type { PlayerId } from '../../../src/types/enums.js';
import { EngineError } from '../../../src/engine/EngineError.js';

function createHumanPlayerId(): PlayerId {
  return `player-human-${crypto.randomUUID()}` as PlayerId;
}

@Injectable()
export class LobbyService {
  private readonly persistence = new RoomPersistenceService();

  public async createLobby(displayName: string): Promise<{
    roomId: string;
    roomCode: string;
    playerId: PlayerId;
    gameState: GameState;
  }> {
    const playerId = createHumanPlayerId();
    const record = await this.persistence.createRoom(playerId, displayName);
    return {
      roomId:   record.roomId,
      roomCode: record.roomCode,
      playerId,
      gameState: record.state,
    };
  }

  public async joinLobby(
    roomCode: string,
    displayName: string,
  ): Promise<{
    roomId: string;
    roomCode: string;
    playerId: PlayerId;
    gameState: GameState;
  }> {
    const found = await this.persistence.findByRoomCode(roomCode);
    if (!found) {
      throw new EngineError('ROOM_NOT_FOUND', `Room code ${roomCode} not found.`);
    }
    const playerId = createHumanPlayerId();
    const gameState = await this.persistence.joinRoom(found.roomId, playerId, displayName);
    return {
      roomId:   found.roomId,
      roomCode: found.roomCode,
      playerId,
      gameState,
    };
  }

  public async startLobby(
    roomId: string,
    hostPlayerId: PlayerId,
    playerIds: readonly PlayerId[],
    displayNames: Record<PlayerId, string>,
  ): Promise<GameState> {
    const current = await this.persistence.loadState(roomId);
    if (!current) {
      throw new EngineError('ROOM_NOT_FOUND', `Room ${roomId} not found.`);
    }
    if (!current.turnOrder.includes(hostPlayerId)) {
      throw new EngineError('UNAUTHORIZED_ACTION', 'Only lobby members can start.');
    }
    const next = startGameFromLobby(current, playerIds, displayNames);
    await this.persistence.saveState(roomId, next);

    const live = getActiveRoom(roomId);
    if (live) {
      live.setGameState(next);
    }

    return next;
  }
}
