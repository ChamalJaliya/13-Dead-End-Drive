/**
 * dead-end-drive.room.ts — Colyseus authoritative room (thin transport shell).
 */

import { Room, type Client } from '@colyseus/core';
import { initializeGame } from '@ded/engine/gameInitializer.js';
import type { GameState } from '@ded/types/game-state.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { PlayerId } from '@ded/types/enums.js';
import { broadcastMaskedState } from './state-broadcast.js';
import { toErrorResponse } from './engine-error.mapper.js';
import { registerActiveRoom, unregisterActiveRoom } from './room-registry.js';
import { getRoomServices } from './room-services.js';
import { ActionRateLimit } from './action-rate-limit.js';
import { runBotTurnChain } from './bot-turn-runner.js';

export interface JoinOptions {
  readonly roomCode?: string;
  readonly playerId: PlayerId;
  readonly displayName: string;
  readonly roomId?: string;
}

interface ClientAuth {
  readonly playerId: PlayerId;
  readonly roomId: string;
}

type DedClient = Client & { playerId?: PlayerId };

const GAME_OVER_DISPOSE_MS = 60_000;

export class DeadEndDriveRoom extends Room {
  public static filterBy = ['roomCode'] as const;

  private gameState: GameState | null = null;
  private roomCode = '';
  private disposeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly rateLimit = new ActionRateLimit();

  public override async onCreate(options: JoinOptions): Promise<void> {
    const { persistence } = getRoomServices();
    if (options.roomCode) {
      const found = await persistence.findByRoomCode(options.roomCode);
      if (!found) throw new Error('ROOM_NOT_FOUND');
      this.gameState = found.state;
      this.roomCode = found.roomCode;
    } else {
      const created = await persistence.createRoom(options.playerId, options.displayName);
      this.gameState = created.state;
      this.roomCode = created.roomCode;
    }
    this.setMetadata({ roomCode: this.roomCode, gameId: this.gameState.gameId });
    registerActiveRoom(this.gameState.gameId, this);
    this.onMessage('playerAction', (client: DedClient, message: SocketEvent) => {
      void this.handlePlayerAction(client, message);
    });
  }

  public override async onJoin(client: DedClient, options: JoinOptions): Promise<void> {
    if (!this.gameState) return;
    const { persistence } = getRoomServices();
    const playerId = options.playerId;
    client.playerId = playerId;
    (client as Client & { auth?: ClientAuth }).auth = { playerId, roomId: this.gameState.gameId };

    if (!this.gameState.players[playerId]) {
      this.gameState = await persistence.joinRoom(
        this.gameState.gameId,
        playerId,
        options.displayName,
      );
    } else {
      const existing = this.gameState.players[playerId];
      if (existing) {
        const timestamp = new Date().toISOString();
        this.gameState = {
          ...this.gameState,
          players: {
            ...this.gameState.players,
            [playerId]: { ...existing, isConnected: true, lastSeenAt: timestamp },
          },
          isPaused: false,
          updatedAt: timestamp,
        };
        await persistence.saveState(this.gameState.gameId, this.gameState);
      }
    }

    await persistence.registerConnection(client.sessionId, this.gameState.gameId, playerId);
    this.sendMaskedToAll('join');
    await this.scheduleBotTurnIfNeeded();
  }

  public override async onLeave(client: DedClient): Promise<void> {
    const { persistence } = getRoomServices();
    const conn = await persistence.removeConnection(client.sessionId);
    if (!conn || !this.gameState) return;
    const next = await persistence.markPlayerDisconnected(conn.roomId, conn.playerId);
    if (next) {
      this.gameState = next;
      this.sendMaskedToAll('leave');
    }
  }

  public override onDispose(): void {
    if (this.disposeTimer) clearTimeout(this.disposeTimer);
    if (this.gameState) unregisterActiveRoom(this.gameState.gameId);
  }

  private async handlePlayerAction(client: DedClient, event: SocketEvent): Promise<void> {
    if (!this.gameState || !client.playerId) return;
    const { gameAction, persistence, idempotency } = getRoomServices();

    if (this.rateLimit.isLimited(client.sessionId)) {
      client.send('ERROR', toErrorResponse(
        new Error('Rate limit exceeded'),
        event.eventId,
        this.gameState.gameId,
      ));
      return;
    }

    try {
      const auth = (client as Client & { auth?: ClientAuth }).auth;
      const playerId = auth?.playerId ?? client.playerId;
      const roomId = auth?.roomId ?? this.gameState.gameId;

      gameAction.assertAuthorized(playerId, roomId, event);
      this.gameState = gameAction.applyAction(this.gameState, event, idempotency);
      await persistence.saveState(this.gameState.gameId, this.gameState);
      this.sendMaskedToAll(event.eventId);
      this.scheduleGameOverDispose();
      await this.scheduleBotTurnIfNeeded();
    } catch (err: unknown) {
      client.send('ERROR', toErrorResponse(err, event.eventId, this.gameState.gameId));
    }
  }

  public setGameState(next: GameState): void {
    this.gameState = next;
    this.sendMaskedToAll('start');
    void this.scheduleBotTurnIfNeeded();
  }

  public patchGameState(next: GameState): void {
    this.setGameState(next);
  }

  private sendMaskedToAll(triggeredByEventId: string): void {
    if (!this.gameState) return;
    const clients: {
      sessionId: string;
      playerId: PlayerId;
      send: (t: string, m: unknown) => void;
    }[] = [];
    for (const c of this.clients) {
      const dc = c as DedClient;
      if (dc.playerId) {
        clients.push({
          sessionId: dc.sessionId,
          playerId:  dc.playerId,
          send:      (t, m) => dc.send(t, m),
        });
      }
    }
    broadcastMaskedState(this.gameState, clients, triggeredByEventId);
  }

  private scheduleGameOverDispose(): void {
    if (!this.gameState || this.gameState.phase !== 'GAME_OVER') return;
    if (this.disposeTimer) clearTimeout(this.disposeTimer);
    this.disposeTimer = setTimeout(() => {
      void this.disconnect();
    }, GAME_OVER_DISPOSE_MS);
  }

  private async scheduleBotTurnIfNeeded(): Promise<void> {
    if (!this.gameState) return;
    const { gameAction, botCoordinator, idempotency, persistence } = getRoomServices();
    this.gameState = await runBotTurnChain(
      this.gameState,
      gameAction,
      botCoordinator,
      idempotency,
      async (state, eventId) => {
        await persistence.saveState(state.gameId, state);
        this.sendMaskedToAll(eventId);
        this.scheduleGameOverDispose();
      },
    );
  }
}

export function startGameFromLobby(
  state: GameState,
  playerIds: readonly PlayerId[],
  displayNames: Record<PlayerId, string>,
): GameState {
  return initializeGame(state.gameId, [...playerIds], displayNames);
}
