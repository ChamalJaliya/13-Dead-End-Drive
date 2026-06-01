// useGameStore.fx.spec.ts — fxQueue integration on syncServerState

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../client/store/useGameStore.js';
import { useUiStore } from '../../client/store/useUiStore.js';
import {
  makeGameState,
  makeTrap,
  makeCharacter,
  PLAYER_A_ID,
} from '../fixtures/gameState.fixtures.js';
import { INITIAL_TRAPS } from '../../engine/trapDefinition.js';

describe('useGameStore FX queue', () => {
  beforeEach(() => {
    useUiStore.getState().resetUi();
    useUiStore.setState({ activeOverlay: 'game' });
    useGameStore.setState({
      gameState:     null,
      prevGameState: null,
      localPlayerId: PLAYER_A_ID,
      playMode:      'solo',
      botPlayerIds:  [],
      gameSession:   null,
    });
  });

  it('does not append fx events on first sync when prev is null', () => {
    const next = makeGameState();
    useGameStore.getState().syncServerState(next);
    expect(useUiStore.getState().fxQueue).toEqual([]);
  });

  it('appends TRAP_FIRED and CHARACTER_ELIMINATED to fxQueue on trap spend', () => {
    const prev = makeGameState({
      traps: { ...INITIAL_TRAPS, CHANDELIER: makeTrap({ trapId: 'CHANDELIER', state: 'READY' }) },
    });
    const next = makeGameState({
      traps: { ...INITIAL_TRAPS, CHANDELIER: makeTrap({ trapId: 'CHANDELIER', state: 'SPENT' }) },
      characters: {
        ...prev.characters,
        SMOTHERS: makeCharacter({
          id: 'SMOTHERS',
          status: 'ELIMINATED',
          eliminationCause: 'TRAP',
          position: 'CHAND_TRAP',
          displayName: 'Smothers',
        }),
      },
    });

    useGameStore.setState({ gameState: prev });
    useGameStore.getState().syncServerState(next);

    const { fxQueue, lastTrapFired, eliminationFlashNonce } = useUiStore.getState();
    expect(fxQueue.some((e) => e.type === 'TRAP_FIRED')).toBe(true);
    expect(fxQueue.some((e) => e.type === 'CHARACTER_ELIMINATED')).toBe(true);
    expect(lastTrapFired?.trapId).toBe('CHANDELIER');
    expect(eliminationFlashNonce).toBe(1);
  });

  it('shiftFxQueue returns queued events and clears the queue', () => {
    useUiStore.setState({
      fxQueue: [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_A_ID,
          winCondition: 'LAST_ALIVE',
          isLocalWinner: true,
        },
      ],
    });

    const batch = useGameStore.getState().shiftFxQueue();
    expect(batch).toHaveLength(1);
    expect(batch[0]?.type).toBe('GAME_WON');
    expect(useUiStore.getState().fxQueue).toEqual([]);
  });

  it('resetGame clears fxQueue, lastTrapFired, and eliminationFlashNonce', () => {
    useUiStore.setState({
      fxQueue: [
        {
          type: 'TRAP_FIRED',
          trapId: 'CHANDELIER',
          cellId: 'CHAND_TRAP',
          victimNames: [],
        },
      ],
      lastTrapFired: {
        trapId: 'CHANDELIER',
        cellId: 'CHAND_TRAP',
        characterName: 'Guest',
      },
      eliminationFlashNonce: 3,
    });
    useGameStore.setState({ gameState: makeGameState() });

    useGameStore.getState().resetGame();

    const ui = useUiStore.getState();
    expect(ui.fxQueue).toEqual([]);
    expect(ui.lastTrapFired).toBeNull();
    expect(ui.eliminationFlashNonce).toBe(0);
  });

  it('accumulates fx events across multiple syncs', () => {
    const base = makeGameState();
    useGameStore.setState({ gameState: base });

    const afterWin = makeGameState({
      phase: 'GAME_OVER',
      winner: PLAYER_A_ID,
      winCondition: 'LAST_ALIVE',
    });
    useGameStore.getState().syncServerState(afterWin);

    expect(useUiStore.getState().fxQueue.some((e) => e.type === 'GAME_WON')).toBe(true);
  });
});
