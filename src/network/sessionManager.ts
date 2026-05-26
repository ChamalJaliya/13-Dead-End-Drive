/**
 * sessionManager.ts
 * WebSocket session manager broker — Phase 3.2 Supabase PostgreSQL implementation.
 *
 * Decouples transport socket mappings from the deterministic, pure functional game engine.
 * Connects directly to Supabase to persist rooms and connection contexts.
 */

import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { GameState } from '../types/game-state.js';
import type { SocketEvent } from '../types/socket-events.js';
import type { PlayerId, CharacterId, TrapId } from '../types/enums.js';
import type { Character, TrapState } from '../types/entities.js';
import { EngineError } from '../engine/EngineError.js';
import { routePlayerEvent, InMemoryIdempotencyStore } from './eventRouter.js';

// Retrieve credentials from environmental scope (fully mocked during testing)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

export type BroadcastHook = (roomId: string, state: GameState) => Promise<void>;

export class SessionManager {
  private readonly supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
  private broadcastHook: BroadcastHook | undefined;
  private readonly idempotencyByRoom = new Map<string, InMemoryIdempotencyStore>();

  constructor(broadcastHook?: BroadcastHook) {
    this.broadcastHook = broadcastHook;
  }

  /**
   * Registers a broadcast callback to trigger as a post-commit action side-effect.
   */
  public registerBroadcastHook(broadcastHook: BroadcastHook): void {
    this.broadcastHook = broadcastHook;
  }

  /**
   * Helper to map GamePhase state to relational table status column literals.
   */
  private mapPhaseToStatus(phase: string): 'LOBBY_WAITING' | 'ACTIVE' | 'GAME_OVER' {
    if (phase === 'LOBBY') return 'LOBBY_WAITING';
    if (phase === 'GAME_OVER') return 'GAME_OVER';
    return 'ACTIVE';
  }

  /**
   * Initializes a new room session, generating a cryptographically sound roomId,
   * seeding an empty waiting LOBBY state, and persisting it to game_rooms.
   */
  public async createRoom(eventId: string, hostPlayerId: PlayerId, timestamp: string): Promise<GameState> {
    const roomId = crypto.randomUUID();
    const room_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const state: GameState = {
      gameId:         roomId,
      boardVersion:   'GRID_21X15',
      phase:          'LOBBY',
      turnNumber:     1,
      activePlayerId: hostPlayerId,
      turnOrder:      [hostPlayerId],
      players: {
        [hostPlayerId]: {
          playerId:     hostPlayerId,
          displayName:  'Host',
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
      detectivePosition: {
        currentStep: 0,
      maxSteps:    10,
        trackCells:  [],
        isAtExit:    false,
      },
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

    const { error } = await this.supabase
      .from('game_rooms')
      .insert({
        id:         roomId,
        room_code,
        status:     'LOBBY_WAITING',
        game_state: state,
      });

    if (error) {
      throw new EngineError('IDEMPOTENCY_CONFLICT', `Failed to create room row: ${error.message}`);
    }

    return state;
  }

  /**
   * Adds a player to an active waiting LOBBY room in Supabase.
   *
   * @throws {EngineError} 'ROOM_NOT_FOUND' if roomId does not exist
   * @throws {EngineError} 'GAME_ALREADY_STARTED' if game is not in LOBBY phase
   * @throws {EngineError} 'ROOM_FULL' if lobby has already reached 4 players
   */
  public async joinRoom(
    eventId: string,
    roomId: string,
    playerId: PlayerId,
    displayName: string,
    avatarUrl: string | null,
    timestamp: string,
  ): Promise<GameState> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (error || !data) {
      throw new EngineError('ROOM_NOT_FOUND', `ROOM_NOT_FOUND: Room ${roomId} not found.`);
    }

    const state = data.game_state as GameState;

    if (state.phase !== 'LOBBY') {
      throw new EngineError(
        'GAME_ALREADY_STARTED',
        `GAME_ALREADY_STARTED: Cannot join room ${roomId} as the game has already started.`,
      );
    }

    if (state.turnOrder.length >= 4) {
      throw new EngineError('ROOM_FULL', `ROOM_FULL: Room ${roomId} is full (max 4 players).`);
    }

    const nextState: GameState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          playerId,
          displayName,
          avatarUrl,
          characterIds: [],
          secretCharacterIds:  [],
          hasHiddenSecretCard: false,
          hand:         [],
          isEliminated: false,
          isConnected:  true,
          lastSeenAt:   timestamp,
        },
      },
      turnOrder: [...state.turnOrder, playerId],
      updatedAt: timestamp,
    };

    const { error: updateError } = await this.supabase
      .from('game_rooms')
      .update({ game_state: nextState })
      .eq('id', roomId);

    if (updateError) {
      throw new EngineError('IDEMPOTENCY_CONFLICT', `Failed to update room join: ${updateError.message}`);
    }

    return nextState;
  }

  /**
   * Registers a socket connection handle mapping to its active room and player context.
   */
  public async registerSocket(socketId: string, roomId: string, playerId: PlayerId): Promise<void> {
    await this.supabase
      .from('player_connections')
      .upsert({
        socket_id: socketId,
        room_id:   roomId,
        player_id: playerId,
      });
  }

  /**
   * Processes a socket disconnection, marking the registered player as inactive,
   * pausing the game state clock, and removing the socket connection handle.
   * Returns null if the socket has no registered mapping.
   */
  public async disconnectSocket(
    socketId: string,
    timestamp: string,
  ): Promise<{ roomId: string; playerId: PlayerId; state: GameState } | null> {
    const { data: connData, error: connError } = await this.supabase
      .from('player_connections')
      .select('room_id, player_id')
      .eq('socket_id', socketId)
      .single();

    if (connError || !connData) {
      return null;
    }

    const { room_id: roomId, player_id: playerId } = connData as { room_id: string; player_id: string };

    const { data: roomData, error: roomError } = await this.supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      return null;
    }

    const state = roomData.game_state as GameState;
    const player = state.players[playerId];
    if (!player) {
      return null;
    }

    const nextState: GameState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          isConnected: false,
          lastSeenAt:  timestamp,
        },
      },
      isPaused:  true,
      updatedAt: timestamp,
    };

    await this.supabase
      .from('game_rooms')
      .update({ game_state: nextState })
      .eq('id', roomId);

    await this.supabase
      .from('player_connections')
      .delete()
      .eq('socket_id', socketId);

    return {
      roomId,
      playerId,
      state: nextState,
    };
  }

  /**
   * Intercepts incoming player events, validates socket authorization,
   * retrieves the correct room state, pipes the transformation through processTurn(),
   * persists the next state to Supabase, and returns the result.
   *
   * @throws {EngineError} 'UNAUTHORIZED_ACTION' if socket registration fails verification
   * @throws {EngineError} 'ROOM_NOT_FOUND' if target room is missing
   */
  public async handlePlayerAction(socketId: string, event: SocketEvent): Promise<GameState> {
    const { data: connData, error: connError } = await this.supabase
      .from('player_connections')
      .select('room_id, player_id')
      .eq('socket_id', socketId)
      .single();

    if (connError || !connData) {
      throw new EngineError(
        'UNAUTHORIZED_ACTION',
        `UNAUTHORIZED_ACTION: Socket ${socketId} is not authorized for any room.`,
      );
    }

    const { room_id: roomId, player_id: playerId } = connData as { room_id: string; player_id: string };

    // Strict validation: socket mapping must match the sender's playerId and target gameId
    if (playerId !== event.playerId) {
      throw new EngineError(
        'UNAUTHORIZED_ACTION',
        `UNAUTHORIZED_ACTION: Socket playerId mismatch. Registered: ${playerId}, Event: ${event.playerId}`,
      );
    }

    if (roomId !== event.gameId) {
      throw new EngineError(
        'UNAUTHORIZED_ACTION',
        `UNAUTHORIZED_ACTION: Socket roomId mismatch. Registered: ${roomId}, Event: ${event.gameId}`,
      );
    }

    const { data: roomData, error: roomError } = await this.supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      throw new EngineError('ROOM_NOT_FOUND', `ROOM_NOT_FOUND: Room session ${roomId} was not found.`);
    }

    const state = roomData.game_state as GameState;

    let idemStore = this.idempotencyByRoom.get(roomId);
    if (!idemStore) {
      idemStore = new InMemoryIdempotencyStore();
      this.idempotencyByRoom.set(roomId, idemStore);
    }

    const nextState = routePlayerEvent(state, event, idemStore);

    // Save the committed state in game_rooms
    const { error: updateError } = await this.supabase
      .from('game_rooms')
      .update({
        game_state: nextState,
        status:     this.mapPhaseToStatus(nextState.phase),
      })
      .eq('id', roomId);

    if (updateError) {
      throw new EngineError('IDEMPOTENCY_CONFLICT', `Failed to save game state: ${updateError.message}`);
    }

    if (this.broadcastHook) {
      try {
        await this.broadcastHook(roomId, nextState);
      } catch (err: unknown) {
        console.error(`[SessionManager] Broadcast post-commit hook error:`, err);
      }
    }

    return nextState;
  }

  /**
   * Retrieves the raw GameState reference for a specific room session.
   */
  public async getRoomState(roomId: string): Promise<GameState | undefined> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (error || !data) {
      return undefined;
    }
    return data.game_state as GameState;
  }

  /**
   * Seeds/overwrites the GameState reference for a specific room session (for test setup).
   */
  public async setRoomState(roomId: string, state: GameState): Promise<void> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (error || !data) {
      const room_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await this.supabase
        .from('game_rooms')
        .insert({
          id:         roomId,
          room_code,
          status:     this.mapPhaseToStatus(state.phase),
          game_state: state,
        });
    } else {
      await this.supabase
        .from('game_rooms')
        .update({
          game_state: state,
          status:     this.mapPhaseToStatus(state.phase),
        })
        .eq('id', roomId);
    }
  }
}
