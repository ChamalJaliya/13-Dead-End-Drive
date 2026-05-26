/**
 * localMultiplayerClient.ts
 * Browser-local multiplayer session — create/join rooms, sync via in-memory store + broadcast hooks.
 */

import {
  initializeGame,
  gridChairSpawnNeedsRepair,
  repairGridChairSpawns,
} from '../../engine/gameInitializer.js';
import {
  GRID_21X15_CHAIR_LAYOUT_REVISION,
  GRID_21X15_DINING_CHAIR_CELLS,
} from '../../engine/boardDefinition.js';
import { EngineError } from '../../engine/EngineError.js';
import { routePlayerEvent, InMemoryIdempotencyStore } from '../../network/eventRouter.js';
import { filterStateForPlayer } from '../../network/broadcastPipeline.js';
import { LocalRoomStore } from '../../network/localRoomStore.js';
import type { GameState } from '../../types/game-state.js';
import type { SocketEvent } from '../../types/socket-events.js';
import type { PlayerId } from '../../types/enums.js';

export type StateListener = (payload: {
  readonly gameState: GameState;
  readonly privateHand: readonly import('../../types/entities.js').ActionCard[];
  readonly roomCode: string;
}) => void;

const globalStore = new LocalRoomStore();
const idempotencyByRoom = new Map<string, InMemoryIdempotencyStore>();
const STORAGE_PREFIX = 'ded-room-state-';

function persistRoomState(roomId: string, state: GameState, roomCode: string): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + roomId,
      JSON.stringify({
        state,
        roomCode,
        chairLayoutRevision:
          state.boardVersion === 'GRID_21X15' ? GRID_21X15_CHAIR_LAYOUT_REVISION : undefined,
      }),
    );
    localStorage.setItem('ded-room-active-id', roomId);
  } catch {
    /* quota */
  }
}

function isStaleGridChairLayout(state: GameState): boolean {
  return gridChairSpawnNeedsRepair(state);
}

function loadRoomState(roomId: string): { state: GameState; roomCode: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + roomId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state: GameState;
      roomCode: string;
      chairLayoutRevision?: number;
    };
    if (parsed.state && parsed.state.boardVersion !== 'GRID_21X15') {
      localStorage.removeItem(STORAGE_PREFIX + roomId);
      localStorage.removeItem('ded-room-active-id');
      return null;
    }
    if (
      parsed.state?.boardVersion === 'GRID_21X15' &&
      (parsed.chairLayoutRevision !== GRID_21X15_CHAIR_LAYOUT_REVISION ||
        isStaleGridChairLayout(parsed.state))
    ) {
      localStorage.removeItem(STORAGE_PREFIX + roomId);
      localStorage.removeItem('ded-room-active-id');
      return null;
    }
    if (parsed.state?.boardVersion === 'GRID_21X15') {
      return {
        ...parsed,
        state: repairGridChairSpawns(parsed.state),
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

function getIdempotencyStore(roomId: string): InMemoryIdempotencyStore {
  let store = idempotencyByRoom.get(roomId);
  if (!store) {
    store = new InMemoryIdempotencyStore();
    idempotencyByRoom.set(roomId, store);
  }
  return store;
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class LocalMultiplayerClient {
  private socketId: string;
  private playerId: PlayerId;
  private roomId: string | null = null;
  private listener: StateListener | null = null;

  constructor(playerId: PlayerId, displayName: string) {
    this.socketId = `local-${playerId}-${crypto.randomUUID().slice(0, 8)}`;
    this.playerId = playerId;
    this.displayName = displayName;
  }

  private readonly displayName: string;

  public onStateSync(listener: StateListener): void {
    this.listener = listener;
  }

  private emit(): void {
    if (!this.listener || !this.roomId) return;
    const record = globalStore.getRoomById(this.roomId);
    if (!record) return;
    const filtered = filterStateForPlayer(record.state, this.playerId);
    this.listener({
      gameState: filtered,
      privateHand: filtered.players[this.playerId]?.hand ?? [],
      roomCode: record.roomCode,
    });
  }

  public createRoom(): { roomId: string; roomCode: string; state: GameState } {
    const roomId = crypto.randomUUID();
    const roomCode = generateRoomCode();
    const now = new Date().toISOString();

    const lobbyState: GameState = {
      gameId:         roomId,
      boardVersion:   'GRID_21X15',
      phase:          'LOBBY',
      subPhase:       'AWAITING_ROLL',
      turnNumber:     1,
      activePlayerId: this.playerId,
      turnOrder:      [this.playerId] as const,
      players: {
        [this.playerId]: {
          playerId:     this.playerId,
          displayName:  this.displayName,
          avatarUrl:    null,
          characterIds: [],
          secretCharacterIds:  [],
          hasHiddenSecretCard: false,
          hand:         [],
          isEliminated: false,
          isConnected:  true,
          lastSeenAt:   now,
        },
      },
      characters:        {} as GameState['characters'],
      board:             {} as GameState['board'],
      traps:             {} as GameState['traps'],
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
      lastDiceRoll:      null,
      pipsRemaining:     null,
      movementPlan:      null,
      firstMoveCharacterId: null,
      movesUsedThisTurn: 0,
      pendingTrapCell:   null,
      pendingTrapHandCardIds: null,
      pendingTrapDrawnCardId: null,
      deck:              [],
      discardPile:       [],
      winner:               null,
      winCondition:         null,
      exposedRooting:      {},
      secretCardsRevealed:  false,
      createdAt:         now,
      updatedAt:         now,
    };

    globalStore.saveRoom({ roomId, roomCode, state: lobbyState });
    persistRoomState(roomId, lobbyState, roomCode);
    globalStore.registerConnection({
      socketId: this.socketId,
      roomId,
      playerId: this.playerId,
    });

    this.roomId = roomId;
    getIdempotencyStore(roomId);
    this.emit();

    return { roomId, roomCode, state: lobbyState };
  }

  public joinRoom(roomCode: string): GameState {
    // Scan localStorage to populate globalStore with any missing rooms in this tab's in-memory store
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as { state: GameState; roomCode: string };
            if (parsed.state && parsed.roomCode) {
              globalStore.saveRoom({
                roomId: parsed.state.gameId,
                roomCode: parsed.roomCode,
                state: parsed.state,
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }

    const record = globalStore.getRoomByCode(roomCode);
    if (!record) {
      throw new EngineError('ROOM_NOT_FOUND', `No room with code ${roomCode}.`);
    }
    if (record.state.phase !== 'LOBBY') {
      throw new EngineError('GAME_ALREADY_STARTED', 'This game has already started.');
    }
    if (record.state.turnOrder.length >= 4) {
      throw new EngineError('ROOM_FULL', 'Room is full (4 players max).');
    }

    const now = new Date().toISOString();
    const nextState: GameState = {
      ...record.state,
      players: {
        ...record.state.players,
        [this.playerId]: {
          playerId:     this.playerId,
          displayName:  this.displayName,
          avatarUrl:    null,
          characterIds: [],
          secretCharacterIds:  [],
          hasHiddenSecretCard: false,
          hand:         [],
          isEliminated: false,
          isConnected:  true,
          lastSeenAt:   now,
        },
      },
      turnOrder: [...record.state.turnOrder, this.playerId],
      updatedAt: now,
    };

    record.state = nextState;
    persistRoomState(record.roomId, nextState, record.roomCode);
    globalStore.registerConnection({
      socketId: this.socketId,
      roomId: record.roomId,
      playerId: this.playerId,
    });
    this.roomId = record.roomId;
    this.emit();
    return nextState;
  }

  public startGame(playerIds: readonly PlayerId[], names: Record<PlayerId, string>): GameState {
    if (!this.roomId) {
      throw new EngineError('ROOM_NOT_FOUND', 'Not in a room.');
    }
    const record = globalStore.getRoomById(this.roomId);
    if (!record) {
      throw new EngineError('ROOM_NOT_FOUND', 'Room missing.');
    }
    if (record.state.players[this.playerId] === undefined) {
      throw new EngineError('UNAUTHORIZED_ACTION', 'Only joined players can start.');
    }

    const gameState = initializeGame(this.roomId, playerIds, names);
    record.state = gameState;
    persistRoomState(this.roomId, gameState, record.roomCode);
    idempotencyByRoom.set(this.roomId, new InMemoryIdempotencyStore());
    this.emit();
    return gameState;
  }

  public submitAction(event: SocketEvent): GameState {
    const conn = globalStore.getConnection(this.socketId);
    if (!conn) {
      throw new EngineError('UNAUTHORIZED_ACTION', 'Not connected.');
    }
    if (event.playerId !== this.playerId) {
      throw new EngineError('UNAUTHORIZED_ACTION', 'Wrong player.');
    }
    if (event.gameId !== conn.roomId) {
      throw new EngineError('UNAUTHORIZED_ACTION', 'Wrong game.');
    }

    const record = globalStore.getRoomById(conn.roomId);
    if (!record) {
      throw new EngineError('ROOM_NOT_FOUND', 'Room missing.');
    }

    const next = routePlayerEvent(
      record.state,
      event,
      getIdempotencyStore(conn.roomId),
    );
    record.state = next;
    persistRoomState(conn.roomId, next, record.roomCode);
    this.emit();
    return next;
  }

  /** Pull latest state from localStorage (other browser tabs). */
  public syncFromStorage(): void {
    if (!this.roomId) return;
    const loaded = loadRoomState(this.roomId);
    const record = globalStore.getRoomById(this.roomId);
    if (loaded && record) {
      record.state = loaded.state;
      this.emit();
    }
  }

  public getPlayerId(): PlayerId {
    return this.playerId;
  }

  public getRoomCode(): string | null {
    if (!this.roomId) return null;
    return globalStore.getRoomById(this.roomId)?.roomCode ?? null;
  }
}

/** Shared store for cross-tab sync via storage events */
export function persistRoomCodeForTab(roomCode: string): void {
  try {
    localStorage.setItem('ded-room-code', roomCode);
  } catch {
    /* ignore quota */
  }
}

export function readRoomCodeFromTab(): string | null {
  try {
    return localStorage.getItem('ded-room-code');
  } catch {
    return null;
  }
}
