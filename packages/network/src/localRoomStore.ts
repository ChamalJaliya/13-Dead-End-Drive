/**
 * localRoomStore.ts
 * In-memory room persistence for browser-local multiplayer (no Supabase required).
 */

import type { GameState } from '@ded/types/game-state.js';
import type { PlayerId } from '@ded/types/enums.js';

export interface RoomRecord {
  readonly roomId: string;
  readonly roomCode: string;
  state: GameState;
}

export interface ConnectionRecord {
  readonly socketId: string;
  readonly roomId: string;
  readonly playerId: PlayerId;
}

export class LocalRoomStore {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly codeIndex = new Map<string, string>();
  private readonly connections = new Map<string, ConnectionRecord>();

  public saveRoom(record: RoomRecord): void {
    this.rooms.set(record.roomId, record);
    this.codeIndex.set(record.roomCode, record.roomId);
  }

  public getRoomById(roomId: string): RoomRecord | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByCode(roomCode: string): RoomRecord | undefined {
    const id = this.codeIndex.get(roomCode.toUpperCase());
    return id ? this.rooms.get(id) : undefined;
  }

  public registerConnection(conn: ConnectionRecord): void {
    this.connections.set(conn.socketId, conn);
  }

  public getConnection(socketId: string): ConnectionRecord | undefined {
    return this.connections.get(socketId);
  }

  public removeConnection(socketId: string): void {
    this.connections.delete(socketId);
  }
}
