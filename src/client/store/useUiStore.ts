/**
 * useUiStore.ts — presentation state only (RFC 006).
 */

import { create } from 'zustand';
import type { CellId, CharacterId, TrapId } from '@ded/types/enums.js';
import type { ClientFxEvent } from '../fx/clientFxTypes.js';

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

export interface UiStoreState {
  activeOverlay: UiOverlay;
  selectedCharId: CharacterId | null;
  reachableCells: CellId[];
  highlightCells: CellId[];
  prohibitedCells: CellId[];
  toasts: Toast[];
  eventLog: LogEntry[];
  lastTrapFired: TrapFiredEvent | null;
  fxQueue: ClientFxEvent[];
  eliminationFlashNonce: number;
  is3DMode: boolean;
  isBotThinking: boolean;
}

export interface UiStoreActions {
  setOverlay(overlay: UiOverlay): void;
  setSelection(
    charId: CharacterId | null,
    reachable: CellId[],
    prohibited: CellId[],
    highlights?: CellId[],
  ): void;
  clearSelection(): void;
  showToast(message: string, variant?: Toast['variant']): void;
  dismissToast(id: string): void;
  addLog(message: string, variant?: LogEntry['variant']): void;
  clearTrapFired(): void;
  shiftFxQueue(): ClientFxEvent[];
  enqueueFx(events: ClientFxEvent[]): void;
  bumpEliminationFlash(count: number): void;
  setTrapFired(event: TrapFiredEvent): void;
  toggle3D(): void;
  setBotThinking(thinking: boolean): void;
  resetUi(): void;
}

function createToast(message: string, variant: Toast['variant']): Toast {
  return { id: crypto.randomUUID(), message, variant };
}

function createLogEntry(message: string, variant: LogEntry['variant']): LogEntry {
  return {
    id: crypto.randomUUID(),
    message,
    variant,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export const useUiStore = create<UiStoreState & UiStoreActions>()((set, get) => ({
  activeOverlay: 'lobby',
  selectedCharId: null,
  reachableCells: [],
  highlightCells: [],
  prohibitedCells: [],
  toasts: [],
  eventLog: [],
  lastTrapFired: null,
  fxQueue: [],
  eliminationFlashNonce: 0,
  is3DMode: true,
  isBotThinking: false,

  setOverlay: (overlay) => set({ activeOverlay: overlay }),

  setSelection: (charId, reachable, prohibited, highlights = []) =>
    set({
      selectedCharId: charId,
      reachableCells: reachable,
      prohibitedCells: prohibited,
      highlightCells: highlights,
    }),

  clearSelection: () =>
    set({
      selectedCharId: null,
      reachableCells: [],
      highlightCells: [],
      prohibitedCells: [],
    }),

  showToast: (message, variant = 'warn') => {
    const toast = createToast(message, variant);
    set((s) => ({ toasts: [...s.toasts.slice(-4), toast] }));
    setTimeout(() => get().dismissToast(toast.id), 3800);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  addLog: (message, variant = 'info') => {
    const entry = createLogEntry(message, variant);
    set((s) => ({ eventLog: [entry, ...s.eventLog.slice(0, 99)] }));
  },

  clearTrapFired: () => set({ lastTrapFired: null }),

  shiftFxQueue: () => {
    const queue = get().fxQueue;
    set({ fxQueue: [] });
    return queue;
  },

  enqueueFx: (events) => set((s) => ({ fxQueue: [...s.fxQueue, ...events] })),

  bumpEliminationFlash: (count) =>
    set((s) => ({ eliminationFlashNonce: s.eliminationFlashNonce + count })),

  setTrapFired: (event) => set({ lastTrapFired: event }),

  toggle3D: () => set((s) => ({ is3DMode: !s.is3DMode })),

  setBotThinking: (thinking) => set({ isBotThinking: thinking }),

  resetUi: () =>
    set({
      activeOverlay: 'lobby',
      selectedCharId: null,
      reachableCells: [],
      highlightCells: [],
      prohibitedCells: [],
      toasts: [],
      eventLog: [],
      lastTrapFired: null,
      fxQueue: [],
      eliminationFlashNonce: 0,
      isBotThinking: false,
    }),
}));

export const selectOverlay = (s: UiStoreState) => s.activeOverlay;
export const selectIs3D = (s: UiStoreState) => s.is3DMode;
export const selectToasts = (s: UiStoreState) => s.toasts;
export const selectEventLog = (s: UiStoreState) => s.eventLog;
export const selectLastTrapFired = (s: UiStoreState) => s.lastTrapFired;
export const selectSelectedChar = (s: UiStoreState) => s.selectedCharId;
export const selectReachable = (s: UiStoreState) => s.reachableCells;
export const selectProhibited = (s: UiStoreState) => s.prohibitedCells;
export const selectIsBotThinking = (s: UiStoreState) => s.isBotThinking;
