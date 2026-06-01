/**
 * room-persistence.service.ts — Supabase + in-memory room persistence (Nest injectable).
 */

import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EngineError } from '../engine/EngineError.js';
import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/enums.js';
import type { Character, TrapState } from '../types/entities.js';
import type { CharacterId, TrapId } from '../types/enums.js';

export interface RoomRecord {
  readonly roomId: string;
  readonly roomCode: string;
  readonly state: GameState;
}

interface MemoryRoom {
  roomCode: string;
  state: GameState;
  connections: Map<string, PlayerId>;
}

export class RoomPersistenceService {
  private readonly supabase: SupabaseClient | null;
  private readonly memory = new Map<string, MemoryRoom>();
  private readonly codeIndex = new Map<string, string>();

  public constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    this.supabase =
      url && key && !url.includes('placeholder')
        ? createClient(url, key)
        : null;
  }

  private mapPhaseToStatus(phase: string): 'LOBBY_WAITING' | 'ACTIVE' | 'GAME_OVER' {
    if (phase === 'LOBBY') return 'LOBBY_WAITING';
    if (phase === 'GAME_OVER') return 'GAME_OVER';
    return 'ACTIVE';
  }

  private makeLobbyState(hostPlayerId: PlayerId, displayName: string, timestamp: string): GameState {
    const roomId = crypto.randomUUID();
    return {
      gameId:         roomId,
      boardVersion:   'GRID_21X15',
      phase:          'LOBBY',
      turnNumber:     1,
      activePlayerId: hostPlayerId,
      turnOrder:      [hostPlayerId],
      players: {
        [hostPlayerId]: {
          playerId:     hostPlayerId,
          displayName,
          avatarUrl:    null,
          characterIds: [],
          secretCharacterIds:  [],
          hasHiddenSecretCard: false,
          hand:         [],
          isEliminated: false,
          isConnected:  true,
          lastSeenAt:   timestamp,
        },
      },
      characters:        {} as Record<CharacterId, Character>,
      board:             {},
      traps:             {} as Record<TrapId, TrapState>,
      detectivePosition: { currentStep: 0, maxSteps: 10, trackCells: [], isAtExit: false },
      activePortrait: {
        currentHeirId:     'AUNT_AGATHA',
        portraitStack:     ['CHARITY'],
        portraitHistory:   [],
        lastChangedOnTurn: 1,
        lastChangedReason: 'OPENING_AGATHA',
      },
      lastDiceRoll: null,
      pipsRemaining: null,
      movementPlan: null,
      firstMoveCharacterId: null,
      movesUsedThisTurn: 0,
      pendingTrapCell: null,
      pendingTrapHandCardIds: null,
      pendingTrapDrawnCardId: null,
      deck: [],
      discardPile: [],
      winner:              null,
      winCondition:        null,
      exposedRooting:      {},
      secretCardsRevealed: false,
      createdAt:    timestamp,
      updatedAt:    timestamp,
      subPhase:     'AWAITING_ROLL',
    };
  }

  public async createRoom(hostPlayerId: PlayerId, displayName: string): Promise<RoomRecord> {
    const timestamp = new Date().toISOString();
    const state = this.makeLobbyState(hostPlayerId, displayName, timestamp);
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = state.gameId;

    if (this.supabase) {
      const { error } = await this.supabase.from('game_rooms').insert({
        id:         roomId,
        room_code:  roomCode,
        status:     'LOBBY_WAITING',
        game_state: state,
      });
      if (error) {
        throw new EngineError('IDEMPOTENCY_CONFLICT', `Failed to create room: ${error.message}`);
      }
    } else {
      this.memory.set(roomId, { roomCode, state, connections: new Map() });
      this.codeIndex.set(roomCode, roomId);
    }

    return { roomId, roomCode, state };
  }

  public async findByRoomCode(roomCode: string): Promise<RoomRecord | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('game_rooms')
        .select('id, room_code, game_state')
        .eq('room_code', roomCode.toUpperCase())
        .single();
      if (error || !data) return null;
      return {
        roomId:   data.id as string,
        roomCode: data.room_code as string,
        state:    data.game_state as GameState,
      };
    }
    const roomId = this.codeIndex.get(roomCode.toUpperCase());
    if (!roomId) return null;
    const room = this.memory.get(roomId);
    if (!room) return null;
    return { roomId, roomCode: room.roomCode, state: room.state };
  }

  public async joinRoom(
    roomId: string,
    playerId: PlayerId,
    displayName: string,
  ): Promise<GameState> {
    const state = await this.loadState(roomId);
    if (!state) {
      throw new EngineError('ROOM_NOT_FOUND', `ROOM_NOT_FOUND: Room ${roomId} not found.`);
    }
    if (state.phase !== 'LOBBY') {
      throw new EngineError(
        'GAME_ALREADY_STARTED',
        `GAME_ALREADY_STARTED: Cannot join room ${roomId}.`,
      );
    }
    if (state.turnOrder.length >= 4) {
      throw new EngineError('ROOM_FULL', `ROOM_FULL: Room ${roomId} is full.`);
    }
    const timestamp = new Date().toISOString();
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          playerId,
          displayName,
          avatarUrl: null,
          characterIds: [],
          secretCharacterIds: [],
          hasHiddenSecretCard: false,
          hand: [],
          isEliminated: false,
          isConnected: true,
          lastSeenAt: timestamp,
        },
      },
      turnOrder: [...state.turnOrder, playerId],
      updatedAt: timestamp,
    };
    await this.saveState(roomId, next);
    return next;
  }

  public async loadState(roomId: string): Promise<GameState | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('game_rooms')
        .select('game_state')
        .eq('id', roomId)
        .single();
      if (error || !data) return null;
      return data.game_state as GameState;
    }
    return this.memory.get(roomId)?.state ?? null;
  }

  public async saveState(roomId: string, state: GameState): Promise<void> {
    if (this.supabase) {
      const { error } = await this.supabase
        .from('game_rooms')
        .update({
          game_state: state,
          status:     this.mapPhaseToStatus(state.phase),
        })
        .eq('id', roomId);
      if (error) {
        throw new EngineError('IDEMPOTENCY_CONFLICT', `Failed to save state: ${error.message}`);
      }
      return;
    }
    const room = this.memory.get(roomId);
    if (room) {
      this.memory.set(roomId, { ...room, state });
    }
  }

  public async registerConnection(
    sessionId: string,
    roomId: string,
    playerId: PlayerId,
  ): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('player_connections').upsert({
        socket_id: sessionId,
        room_id:   roomId,
        player_id: playerId,
      });
      return;
    }
    const room = this.memory.get(roomId);
    if (room) {
      room.connections.set(sessionId, playerId);
    }
  }

  public async removeConnection(sessionId: string): Promise<{
    roomId: string;
    playerId: PlayerId;
  } | null> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('player_connections')
        .select('room_id, player_id')
        .eq('socket_id', sessionId)
        .single();
      if (!data) return null;
      await this.supabase.from('player_connections').delete().eq('socket_id', sessionId);
      return {
        roomId:   data.room_id as string,
        playerId: data.player_id as PlayerId,
      };
    }
    for (const [roomId, room] of this.memory) {
      const playerId = room.connections.get(sessionId);
      if (playerId) {
        room.connections.delete(sessionId);
        return { roomId, playerId };
      }
    }
    return null;
  }

  public async getConnection(
    sessionId: string,
  ): Promise<{ roomId: string; playerId: PlayerId } | null> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('player_connections')
        .select('room_id, player_id')
        .eq('socket_id', sessionId)
        .single();
      if (error || !data) return null;
      return {
        roomId:   data.room_id as string,
        playerId: data.player_id as PlayerId,
      };
    }
    for (const [roomId, room] of this.memory) {
      const playerId = room.connections.get(sessionId);
      if (playerId) return { roomId, playerId };
    }
    return null;
  }

  public async markPlayerDisconnected(
    roomId: string,
    playerId: PlayerId,
  ): Promise<GameState | null> {
    const state = await this.loadState(roomId);
    if (!state) return null;
    const player = state.players[playerId];
    if (!player) return null;
    const timestamp = new Date().toISOString();
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: { ...player, isConnected: false, lastSeenAt: timestamp },
      },
      isPaused:  true,
      updatedAt: timestamp,
    };
    await this.saveState(roomId, next);
    return next;
  }

  /** Remove all connections for a room (housekeeping on room dispose). */
  public async clearRoomConnections(roomId: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('player_connections').delete().eq('room_id', roomId);
      return;
    }
    const room = this.memory.get(roomId);
    if (room) room.connections.clear();
  }
}
