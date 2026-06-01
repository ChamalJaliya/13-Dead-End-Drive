/**
 * colyseusRemoteClient.ts — server-authoritative online multiplayer (Colyseus).
 */

import { Client, type Room } from 'colyseus.js';
import type { GameState } from '../../types/game-state.js';
import type { SocketEvent, StateSyncResponse, ErrorResponse } from '../../types/socket-events.js';
import type { PlayerId } from '../../types/enums.js';
import type { ActionCard } from '../../types/entities.js';

export type OnlineStateListener = (payload: {
  readonly gameState: GameState;
  readonly privateHand: readonly ActionCard[];
  readonly roomCode: string;
}) => void;

const LOBBY_API = import.meta.env.VITE_LOBBY_API_URL ?? '/lobby-api';

export class ColyseusRemoteClient {
  private colyseus: Client;
  private room: Room | null = null;
  private listener: OnlineStateListener | null = null;
  private roomCode = '';
  private roomId = '';
  public playerId: PlayerId;
  public readonly displayName: string;

  public constructor(playerId: PlayerId, displayName: string) {
    this.playerId = playerId;
    this.displayName = displayName;
    const wsUrl = import.meta.env.VITE_COLYSEUS_URL ?? 'ws://localhost:2567';
    this.colyseus = new Client(wsUrl);
  }

  public onStateSync(listener: OnlineStateListener): void {
    this.listener = listener;
  }

  private emitFromSync(msg: StateSyncResponse): void {
    if (!this.listener) return;
    this.listener({
      gameState:   msg.payload.gameState,
      privateHand: msg.payload.privateHand,
      roomCode:    this.roomCode,
    });
  }

  private wireRoom(room: Room): void {
    this.room = room;
    room.onMessage('STATE_SYNC', (msg: StateSyncResponse) => {
      this.emitFromSync(msg);
    });
    room.onMessage('ERROR', (msg: ErrorResponse) => {
      console.warn('[ColyseusRemoteClient]', msg.payload.message);
    });
  }

  public async createRoom(): Promise<{ roomCode: string; roomId: string }> {
    const res = await fetch(`${LOBBY_API}/lobby/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ displayName: this.displayName }),
    });
    if (!res.ok) throw new Error('Failed to create online room');
    const data = (await res.json()) as {
      roomId: string;
      roomCode: string;
      playerId: PlayerId;
      gameState: GameState;
    };
    this.playerId = data.playerId;
    this.roomId = data.roomId;
    this.roomCode = data.roomCode;

    const room = await this.colyseus.joinOrCreate('dead_end_drive', {
      roomCode:    this.roomCode,
      playerId:    this.playerId,
      displayName: this.displayName,
    });
    this.wireRoom(room);
    this.emitFromSync({
      type:               'STATE_SYNC',
      responseId:         crypto.randomUUID(),
      gameId:             data.gameState.gameId,
      timestamp:          new Date().toISOString(),
      triggeredByEventId: 'lobby-create',
      payload: {
        gameState:   data.gameState,
        privateHand: [...(data.gameState.players[this.playerId]?.hand ?? [])],
      },
    });
    return { roomCode: this.roomCode, roomId: this.roomId };
  }

  public async joinRoom(code: string): Promise<void> {
    const res = await fetch(`${LOBBY_API}/lobby/join`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ roomCode: code, displayName: this.displayName }),
    });
    if (!res.ok) throw new Error('Failed to join online room');
    const data = (await res.json()) as {
      roomId: string;
      roomCode: string;
      playerId: PlayerId;
      gameState: GameState;
    };
    this.playerId = data.playerId;
    this.roomId = data.roomId;
    this.roomCode = data.roomCode;

    const room = await this.colyseus.joinOrCreate('dead_end_drive', {
      roomCode:    this.roomCode,
      playerId:    this.playerId,
      displayName: this.displayName,
    });
    this.wireRoom(room);
    this.emitFromSync({
      type:               'STATE_SYNC',
      responseId:         crypto.randomUUID(),
      gameId:             data.gameState.gameId,
      timestamp:          new Date().toISOString(),
      triggeredByEventId: 'lobby-join',
      payload: {
        gameState:   data.gameState,
        privateHand: [...(data.gameState.players[this.playerId]?.hand ?? [])],
      },
    });
  }

  public async startGame(
    playerIds: readonly PlayerId[],
    names: Record<PlayerId, string>,
  ): Promise<GameState> {
    const res = await fetch(`${LOBBY_API}/lobby/start`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        roomId:       this.roomId,
        playerId:     this.playerId,
        playerIds,
        displayNames: names,
      }),
    });
    if (!res.ok) throw new Error('Failed to start online game');
    const gameState = (await res.json()) as GameState;
    return gameState;
  }

  public submitAction(event: SocketEvent): void {
    if (!this.room) throw new Error('Not connected to Colyseus room');
    this.room.send('playerAction', event);
  }

  public disconnect(): void {
    void this.room?.leave();
    this.room = null;
  }
}
