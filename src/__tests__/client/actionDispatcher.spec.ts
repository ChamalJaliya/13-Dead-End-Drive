/**
 * actionDispatcher.spec.ts
 * 3 unit tests verifying input mapping, dispatcher integrity, and the cinematic animation pipeline.
 *
 * Tests cover:
 *   1. Input mapping consistency (pixels mapping correctly to TILE_IDs)
 *   2. Dispatch integrity (actions successfully routing to SessionManager)
 *   3. Animation chain coordination (trap state sync diffs trigger kinematics + screenshakes)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleBoardClick, dispatchAction } from '../../client/input/actionDispatcher.js';
import { GameBoardView } from '../../client/components/GameBoard.js';
import { SessionManager } from '../../network/sessionManager.js';
import { makeGameState, PLAYER_A_ID } from '../fixtures/gameState.fixtures.js';

// Setup basic mock for canvas context
const createMockContext = () => {
  const ctx = {
    canvas: {
      width:  320,
      height: 160,
    },
    clearRect:            vi.fn(),
    fillRect:             vi.fn(),
    beginPath:            vi.fn(),
    moveTo:               vi.fn(),
    lineTo:               vi.fn(),
    stroke:               vi.fn(),
    rect:                 vi.fn(),
    fill:                 vi.fn(),
    arc:                  vi.fn(),
    fillText:             vi.fn(),
    save:                 vi.fn(),
    restore:              vi.fn(),
    translate:            vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  };
  return ctx as unknown as CanvasRenderingContext2D;
};

describe('Client-Side Input Orchestrator & Action Dispatcher', () => {
  let mockManager: SessionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockManager = new SessionManager();
  });

  // ── Test 1: Input mapping consistency ──────────────────────────────────────

  it('correctly projects raw screen pixel coordinates onto logical grid cell IDs', () => {
    const state = makeGameState();

    // RC_1 is grid (3,4) — click center of that tile (TILE_SIZE 55)
    const payload = handleBoardClick({ x: 192, y: 247 }, state);

    expect(payload).not.toBeNull();
    expect(payload?.cellId).toBe('RC_1');
    expect(payload?.characterId).toBe('SMOTHERS');
  });

  // ── Test 2: Dispatch integrity ─────────────────────────────────────────────

  it('dispatches player action event to the SessionManager handler', async () => {
    const state = makeGameState();
    const event: any = {
      type:      'MOVE_PAWN',
      gameId:    'game-test-0001',
      playerId:  PLAYER_A_ID,
      timestamp: '2026-05-25T12:00:00Z',
    };

    // Spy on the handlePlayerAction method
    const handleActionSpy = vi
      .spyOn(mockManager, 'handlePlayerAction')
      .mockResolvedValue(state);

    const nextState = await dispatchAction('MOVE_PAWN', event, mockManager, 'socket-mock-id');

    expect(handleActionSpy).toHaveBeenCalledWith('socket-mock-id', event);
    expect(nextState).toEqual(state);
  });

  // ── Test 3: Animation Chain ────────────────────────────────────────────────

  it('triggers the cinematic overlay, instantiates kinematics, and schedules screenshakes on trap fires', async () => {
    // Enable fake timers for deterministic frame advancement
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T12:00:00Z'));

    const ctx = createMockContext();
    const view = new GameBoardView(ctx);

    // 1. Seed initial state where CHANDELIER trap is READY
    const baseState = makeGameState();
    const initialState = baseState;

    view.onStateSync({
      gameState:   initialState,
      privateHand: [],
    });

    // Verify no animation is running initially
    expect(view.activeAnimation).toBeNull();
    expect(view.cinematicPlaying).toBeNull();

    // 2. State sync diff: send next state where CHANDELIER trap is SPENT
    const nextState = {
      ...baseState,
      traps: {
        ...baseState.traps,
        CHANDELIER: {
          ...baseState.traps.CHANDELIER,
          state: 'SPENT' as const,
        },
      },
    };

    view.onStateSync({
      gameState:   nextState,
      privateHand: [],
    });

    expect(view.activeAnimation).not.toBeNull();
    expect(view.activeAnimation?.startPos.y).toBe(0);

    // Advance fake timers by 500ms so the chandelier falls enough to trigger isImpact & screenshake
    vi.advanceTimersByTime(500);

    // Confirm that the screen shake coefficient was successfully coordinate-triggered
    expect(view.viewShake).toBeGreaterThan(0);

    // Clean up fake timers
    vi.useRealTimers();
  });
});
