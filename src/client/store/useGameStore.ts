/**
 * useGameStore.ts
 * Zustand central store — single source of truth for the entire client lifecycle.
 * Decoupled from rendering frames; zero Three.js / React imports.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  initializeGame,
  repairGridChairSpawns,
} from '../../engine/gameInitializer.js';
import { processTurn }         from '../../engine/turnOrchestrator.js';
import {
  findValidPath,
  getProhibitedChairCells,
  getReachableCells,
  type MovementPreviewContext,
} from '../pathfinding.js';
import { LocalMultiplayerClient } from '../multiplayer/localMultiplayerClient.js';
import type { GameState }         from '../../types/game-state.js';
import type { CharacterId, CellId, TrapId } from '../../types/enums.js';
import type { SocketEvent }       from '../../types/socket-events.js';
import { EngineError }            from '../../engine/EngineError.js';
import { resolveActingPlayerId }  from '../soloActingPlayer.js';
import type { PlayerId }          from '../../types/enums.js';

// ── Constants ──────────────────────────────────────────────────────────────

const SOLO_PLAYER_A = 'player-aaaa-0001';
const SOLO_PLAYER_B = 'player-bbbb-0002';
const SOLO_GAME_ID  = 'game-solo-0001';

// ── Types ──────────────────────────────────────────────────────────────────

export type UiOverlay = 'lobby' | 'game' | 'game-over';

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly variant: 'info' | 'warn' | 'success' | 'danger';
}

export interface LogEntry {
  readonly id: string;
  readonly message: string;
  readonly variant: 'info' | 'warn' | 'danger' | 'success';
  readonly timestamp: string;
}

export interface TrapFiredEvent {
  readonly trapId: TrapId;
  readonly characterName: string;
  readonly cellId: CellId;
}

// ── Store State ────────────────────────────────────────────────────────────

export interface GameStoreState {
  // ── Overlay ──
  activeOverlay: UiOverlay;

  // ── Auth / Player ──
  localPlayerId: string;
  localPlayerName: string;

  // ── Game State ──
  gameState: GameState | null;
  prevGameState: GameState | null;

  // ── Selection ──
  selectedCharId: CharacterId | null;
  reachableCells: CellId[];
  highlightCells: CellId[];
  prohibitedCells: CellId[];

  // ── Multiplayer ──
  mpClient: LocalMultiplayerClient | null;
  roomCode: string | null;
  playMode: 'solo' | 'multiplayer';

  // ── UI feedback ──
  toasts: Toast[];
  eventLog: LogEntry[];
  lastTrapFired: TrapFiredEvent | null;

  // ── is3D toggle ──
  is3DMode: boolean;
}

// ── Store Actions ──────────────────────────────────────────────────────────

export interface GameStoreActions {
  // Overlay
  setOverlay(overlay: UiOverlay): void;

  // Player
  setLocalPlayer(id: string, name: string): void;

  // Game state sync (called by local engine or multiplayer client)
  syncServerState(newState: GameState): void;

  // Game flow
  startSoloGame(): void;
  rollDice(): void;
  chooseMovementPlan(plan: 'SPLIT' | 'COMBINED'): void;
  changePortraitOnDoubles(): void;
  selectCharacter(charId: CharacterId): void;
  clearSelection(): void;
  moveCharacter(toCell: CellId): void;
  playTrapCard(cardId: string): void;
  drawTrapCard(): void;
  declineTrap(): void;
  endTurn(): void;
  resetGame(): void;

  // Multiplayer
  hostRoom(playerName: string): void;
  joinRoom(playerName: string, roomCode: string): void;
  startMultiplayerGame(): void;
  leaveRoom(): void;
  submitMpAction(event: SocketEvent): void;
  setPlayMode(mode: 'solo' | 'multiplayer'): void;

  // UI
  showToast(message: string, variant?: Toast['variant']): void;
  dismissToast(id: string): void;
  addLog(message: string, variant?: LogEntry['variant']): void;
  clearTrapFired(): void;
  toggle3D(): void;
}

// ── Helper ─────────────────────────────────────────────────────────────────

function createToast(message: string, variant: Toast['variant'] = 'info'): Toast {
  return { id: crypto.randomUUID(), message, variant };
}

function createLogEntry(message: string, variant: LogEntry['variant'] = 'info'): LogEntry {
  return {
    id: crypto.randomUUID(),
    message,
    variant,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

// ── Create Store ───────────────────────────────────────────────────────────

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial State ──────────────────────────────────────────────────────
    activeOverlay:   'lobby',
    localPlayerId:   SOLO_PLAYER_A,
    localPlayerName: 'Player A',
    gameState:       null,
    prevGameState:   null,
    selectedCharId:  null,
    reachableCells:  [],
    highlightCells:  [],
    prohibitedCells: [],
    mpClient:        null,
    roomCode:        null,
    playMode:        'solo',
    toasts:          [],
    eventLog:        [],
    lastTrapFired:   null,
    is3DMode:        true,

    // ── Overlay ────────────────────────────────────────────────────────────
    setOverlay: (overlay) => set({ activeOverlay: overlay }),

    // ── Player ────────────────────────────────────────────────────────────
    setLocalPlayer: (id, name) => set({ localPlayerId: id, localPlayerName: name }),

    // ── State Sync ─────────────────────────────────────────────────────────
    syncServerState: (newState) => {
      const prev = get().gameState;
      const fixed =
        newState.boardVersion === 'GRID_21X15'
          ? repairGridChairSpawns(newState)
          : newState;
      set({ prevGameState: prev, gameState: fixed });

      if (
        prev &&
        get().playMode === 'solo' &&
        prev.activePlayerId !== fixed.activePlayerId &&
        fixed.subPhase === 'AWAITING_ROLL'
      ) {
        const name = fixed.players[fixed.activePlayerId]?.displayName ?? 'Next player';
        get().addLog(`${name}'s turn — roll dice.`, 'info');
      }

      // Detect trap fires
      if (prev) {
        const trapIds = Object.keys(newState.traps) as TrapId[];
        for (const trapId of trapIds) {
          const was = prev.traps[trapId]?.state;
          const now = newState.traps[trapId]?.state;
          if (was === 'READY' && now === 'SPENT') {
            // Find which character was on the trap cell
            const trapCell = Object.values(newState.board).find(
              (c) => c.trapRef === trapId,
            );
            const charOnCell = trapCell
              ? Object.values(newState.characters).find(
                  (ch) => ch.position === trapCell.cellId && ch.status === 'ELIMINATED',
                )
              : undefined;
            set({
              lastTrapFired: {
                trapId,
                characterName: charOnCell?.displayName ?? 'A guest',
                cellId: trapCell?.cellId ?? '',
              },
            });
          }
        }
      }

      // Auto-transition overlay
      if (newState.phase === 'GAME_OVER' && get().activeOverlay !== 'game-over') {
        set({ activeOverlay: 'game-over' });
      }
      if (newState.phase === 'IN_PROGRESS' && get().activeOverlay === 'lobby') {
        set({ activeOverlay: 'game' });
      }
    },

    // ── Start Solo ─────────────────────────────────────────────────────────
    startSoloGame: () => {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith('ded-room-state-') || key === 'ded-room-active-id') {
            localStorage.removeItem(key);
          }
        }
      } catch {
        /* ignore */
      }
      const gs = repairGridChairSpawns(
        initializeGame(SOLO_GAME_ID, [SOLO_PLAYER_A, SOLO_PLAYER_B], {
          [SOLO_PLAYER_A]: 'Player A',
          [SOLO_PLAYER_B]: 'Player B',
        }),
      );
      set({
        gameState:      gs,
        prevGameState:  null,
        activeOverlay:  'game',
        localPlayerId:  SOLO_PLAYER_A,
        selectedCharId: null,
        reachableCells: [],
        highlightCells: [],
        prohibitedCells: [],
        playMode:       'solo',
        mpClient:       null,
        roomCode:       null,
        eventLog:       [],
      });
      get().addLog('Solo game started — good luck!', 'success');
    },

    chooseMovementPlan: (plan) => {
      const { gameState, localPlayerId, playMode, mpClient } = get();
      if (!gameState) return;
      const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
      const event: SocketEvent = {
        type: 'CHOOSE_MOVEMENT_PLAN',
        eventId: crypto.randomUUID(),
        gameId: gameState.gameId,
        playerId: actingId,
        timestamp: new Date().toISOString(),
        payload: { plan },
      };
      try {
        const next = processTurn(gameState, event);
        get().syncServerState(next);
        get().addLog(
          plan === 'COMBINED'
            ? `Moving one pawn ${gameState.lastDiceRoll!.die1 + gameState.lastDiceRoll!.die2} spaces.`
            : `Split: die1 (${gameState.lastDiceRoll!.die1}) then die2 (${gameState.lastDiceRoll!.die2}).`,
          'info',
        );
        if (mpClient) mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    changePortraitOnDoubles: () => {
      const { gameState, localPlayerId, playMode, mpClient } = get();
      if (!gameState?.lastDiceRoll?.isDoubles) return;
      const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
      const event: SocketEvent = {
        type: 'CHANGE_PORTRAIT',
        eventId: crypto.randomUUID(),
        gameId: gameState.gameId,
        playerId: actingId,
        timestamp: new Date().toISOString(),
      };
      try {
        const next = processTurn(gameState, event);
        get().syncServerState(next);
        const heirId = next.activePortrait.currentHeirId;
        const heirName =
          heirId === 'AUNT_AGATHA' ? 'Aunt Agatha' : next.characters[heirId]!.displayName;
        get().addLog(`Portrait rotated — featured heir is now ${heirName}.`, 'warn');
        if (mpClient) mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    // ── Roll Dice ──────────────────────────────────────────────────────────
    rollDice: () => {
      const { gameState, localPlayerId, playMode } = get();
      if (!gameState) return;
      if (gameState.phase === 'GAME_OVER') return;
      if (gameState.subPhase !== 'AWAITING_ROLL') {
        get().showToast('Wait for your turn to roll.', 'warn');
        return;
      }

      try {
        const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
        const rollEvent: SocketEvent = {
          type:      'ROLL_DICE',
          eventId:   crypto.randomUUID(),
          gameId:    gameState.gameId,
          playerId:  actingId,
          timestamp: new Date().toISOString(),
        };
        const next = processTurn(gameState, rollEvent);
        get().syncServerState(next);
        if (next.lastDiceRoll) {
          const { die1, die2, isDoubles } = next.lastDiceRoll;
          get().addLog(
            `Rolled ${die1} + ${die2} = ${die1 + die2}${isDoubles ? ' 🎲 Doubles!' : ''}.`,
            isDoubles ? 'success' : 'info',
          );
        }

        // submit to MP if connected
        const { mpClient } = get();
        if (mpClient) {
          mpClient.submitAction(rollEvent);
        }
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    // ── Select Character ───────────────────────────────────────────────────
    selectCharacter: (charId) => {
      const { gameState } = get();
      if (!gameState) return;
      const ch = gameState.characters[charId];
      if (!ch || ch.status !== 'ALIVE') return;

      const previewCtx: MovementPreviewContext = {
        boardVersion: gameState.boardVersion,
        characters: gameState.characters,
        moverIsOnRedChair: ch.isOnRedChair,
      };
      const inMovePhase =
        gameState.subPhase === 'FIRST_MOVE' || gameState.subPhase === 'SECOND_MOVE';
      const reachable: CellId[] =
        gameState.pipsRemaining !== null && inMovePhase
          ? [
              ...getReachableCells(
                gameState.board,
                ch.position,
                gameState.pipsRemaining,
                charId,
                previewCtx,
              ),
            ]
          : [];
      const prohibited: CellId[] =
        inMovePhase && gameState.pipsRemaining !== null
          ? [...getProhibitedChairCells(gameState.boardVersion)]
          : [];

      set({
        selectedCharId:  charId,
        reachableCells:  reachable,
        highlightCells:  [ch.position, ...reachable],
        prohibitedCells: prohibited,
      });
      get().addLog(`Selected ${ch.displayName}.`, 'info');
    },

    clearSelection: () =>
      set({
        selectedCharId: null,
        reachableCells: [],
        highlightCells: [],
        prohibitedCells: [],
      }),

    // ── Move ───────────────────────────────────────────────────────────────
    moveCharacter: (toCell) => {
      const { gameState, selectedCharId, localPlayerId, playMode, mpClient } = get();
      if (!gameState || !selectedCharId) return;
      if (gameState.subPhase !== 'FIRST_MOVE' && gameState.subPhase !== 'SECOND_MOVE') {
        get().showToast('You cannot move right now.', 'warn');
        return;
      }

      const char = gameState.characters[selectedCharId];
      if (!char) return;

      const pips = gameState.pipsRemaining;
      if (pips === null) {
        get().showToast('Roll dice first.', 'warn');
        return;
      }
      const previewCtx: MovementPreviewContext = {
        boardVersion: gameState.boardVersion,
        characters: gameState.characters,
        moverIsOnRedChair: char.isOnRedChair,
      };
      const path = findValidPath(
        gameState.board,
        char.position,
        toCell,
        pips,
        selectedCharId,
        previewCtx,
      );
      if (!path) {
        get().showToast(`No valid ${pips}-pip path to that tile.`, 'warn');
        return;
      }

      const usingCombinedDice = !!(
        gameState.subPhase === 'FIRST_MOVE' &&
        gameState.movementPlan === 'COMBINED' &&
        gameState.movesUsedThisTurn === 0 &&
        gameState.lastDiceRoll &&
        gameState.pipsRemaining === gameState.lastDiceRoll.die1 + gameState.lastDiceRoll.die2
      );

      const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
      const event: SocketEvent = {
        type:      'MOVE_PAWN',
        eventId:   crypto.randomUUID(),
        gameId:    gameState.gameId,
        playerId:  actingId,
        timestamp: new Date().toISOString(),
        payload: {
          characterId: selectedCharId,
          fromCell:    char.position,
          toCell,
          pipsUsed:    gameState.pipsRemaining!,
          path,
          usingCombinedDice,
        },
      };

      try {
        const next = processTurn(gameState, event);
        get().syncServerState(next);
        get().clearSelection();
        get().addLog(`${char.displayName} → ${toCell}.`, 'info');
        if (mpClient) mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
        else throw err;
      }
    },

    // ── Trap Actions ───────────────────────────────────────────────────────
    playTrapCard: (cardId) => {
      const { gameState, localPlayerId, playMode, mpClient } = get();
      if (!gameState || !gameState.pendingTrapCell) return;
      const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
      const player = gameState.players[actingId];
      const card = player?.hand.find((c) => c.cardId === cardId);
      if (!card) return;
      const event: SocketEvent = {
        type: 'PLAY_TRAP_CARD',
        eventId: crypto.randomUUID(),
        gameId: gameState.gameId,
        playerId: actingId,
        timestamp: new Date().toISOString(),
        payload: {
          cardId,
          cardType: card.cardType,
          targetCell: gameState.pendingTrapCell,
        },
      };
      try {
        const next = processTurn(gameState, event);
        get().syncServerState(next);
        get().addLog('Trap card played! 💥', 'danger');
        if (mpClient) mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    drawTrapCard: () => {
      const { gameState, localPlayerId, playMode, mpClient } = get();
      if (!gameState) return;
      const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
      const event: SocketEvent = {
        type: 'DRAW_TRAP_CARD',
        eventId: crypto.randomUUID(),
        gameId: gameState.gameId,
        playerId: actingId,
        timestamp: new Date().toISOString(),
      };
      try {
        const next = processTurn(gameState, event);
        get().syncServerState(next);
        get().addLog('Drew a trap card.', 'info');
        if (mpClient) mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    declineTrap: () => {
      const { gameState, localPlayerId, playMode, mpClient } = get();
      if (!gameState) return;
      const actingId = resolveActingPlayerId(gameState, localPlayerId as PlayerId, playMode);
      const event: SocketEvent = {
        type: 'DECLINE_TRAP',
        eventId: crypto.randomUUID(),
        gameId: gameState.gameId,
        playerId: actingId,
        timestamp: new Date().toISOString(),
      };
      try {
        const next = processTurn(gameState, event);
        get().syncServerState(next);
        get().addLog('Declined trap.', 'info');
        if (mpClient) mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    endTurn: () => {
      // END_TURN is not a socket event — it's resolved by the engine advancing subPhase.
      // We can trigger it by sending CHANGE_PORTRAIT or by doing nothing (TURN_END auto-advances).
      // In our local engine flow, we use CHANGE_PORTRAIT (no-op if not doubles).
      // For now we just log that the turn is ending — state already advances automatically.
      get().addLog('Turn ended.', 'info');
    },

    resetGame: () => {
      get().startSoloGame();
    },

    // ── Multiplayer ────────────────────────────────────────────────────────
    setPlayMode: (mode) => set({ playMode: mode }),

    hostRoom: (playerName) => {
      const playerId = crypto.randomUUID();
      const client = new LocalMultiplayerClient(playerId, playerName);

      client.onStateSync(({ gameState, roomCode: rc }) => {
        get().syncServerState(gameState);
        set({ roomCode: rc });
      });

      const { roomCode } = client.createRoom();

      set({
        mpClient:       client,
        localPlayerId:  playerId,
        localPlayerName: playerName,
        roomCode,
        playMode:       'multiplayer',
        activeOverlay:  'lobby',
      });
      get().addLog(`Room created — code: ${roomCode}`, 'success');
    },

    joinRoom: (playerName, code) => {
      const playerId = crypto.randomUUID();
      const client = new LocalMultiplayerClient(playerId, playerName);
      try {
        client.onStateSync(({ gameState, roomCode: rc }) => {
          get().syncServerState(gameState);
          set({ roomCode: rc });
        });
        client.joinRoom(code);
        set({
          mpClient:       client,
          localPlayerId:  playerId,
          localPlayerName: playerName,
          roomCode:       code,
          playMode:       'multiplayer',
        });
        get().addLog(`Joined room ${code}.`, 'success');
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    startMultiplayerGame: () => {
      const { mpClient, gameState } = get();
      if (!mpClient || !gameState) return;
      const playerIds = gameState.turnOrder;
      const names: Record<string, string> = {};
      for (const pid of playerIds) {
        names[pid] = gameState.players[pid]?.displayName ?? pid;
      }
      try {
        const next = mpClient.startGame(playerIds, names);
        get().syncServerState(next);
        set({ activeOverlay: 'game' });
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    leaveRoom: () => {
      set({
        mpClient:       null,
        roomCode:       null,
        gameState:      null,
        playMode:       'solo',
        activeOverlay:  'lobby',
      });
    },

    submitMpAction: (event) => {
      const { mpClient } = get();
      if (!mpClient) return;
      try {
        mpClient.submitAction(event);
      } catch (err) {
        if (err instanceof EngineError) get().showToast(err.message, 'warn');
      }
    },

    // ── UI Helpers ─────────────────────────────────────────────────────────
    showToast: (message, variant = 'warn') => {
      const toast = createToast(message, variant);
      set((s) => ({ toasts: [...s.toasts.slice(-4), toast] }));
      setTimeout(() => get().dismissToast(toast.id), 3800);
    },

    dismissToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    addLog: (message, variant = 'info') => {
      const entry = createLogEntry(message, variant);
      set((s) => ({ eventLog: [entry, ...s.eventLog.slice(0, 99)] }));
    },

    clearTrapFired: () => set({ lastTrapFired: null }),

    toggle3D: () => set((s) => ({ is3DMode: !s.is3DMode })),
  })),
);

// ── Typed Selectors ───────────────────────────────────────────────────────

export const selectGameState     = (s: GameStoreState) => s.gameState;
export const selectSelectedChar  = (s: GameStoreState) => s.selectedCharId;
export const selectReachable     = (s: GameStoreState) => s.reachableCells;
export const selectProhibited    = (s: GameStoreState) => s.prohibitedCells;
export const selectLocalPlayerId = (s: GameStoreState) => s.localPlayerId;

/** Seat whose hand/traps/actions apply — active seat in solo, local seat in MP. */
export const selectActingPlayerId = (s: GameStoreState): PlayerId | null => {
  if (!s.gameState) return null;
  return resolveActingPlayerId(
    s.gameState,
    s.localPlayerId as PlayerId,
    s.playMode,
  );
};
export const selectOverlay       = (s: GameStoreState) => s.activeOverlay;
export const selectIs3D          = (s: GameStoreState) => s.is3DMode;
export const selectToasts        = (s: GameStoreState) => s.toasts;
export const selectEventLog      = (s: GameStoreState) => s.eventLog;
export const selectLastTrapFired = (s: GameStoreState) => s.lastTrapFired;

// ── Storage sync for cross-tab local multiplayer ─────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    const s = useGameStore.getState();
    if (s.mpClient) {
      s.mpClient.syncFromStorage();
    }
  });
}
