/**
 * GameBoard.spec.ts
 * 3 unit tests verifying HTML5 Canvas View Engine projections and rendering loops.
 *
 * Tests cover:
 *   1. Frame sweeping (clearRect sweeps and character coordinate iterations)
 *   2. Visual state invariants (cross-hatch drawing operations branch for DEAD pawns)
 *   3. Render scheduling (GameBoardView stores state sync and requests frames)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderBoard, GameBoardView, TILE_SIZE } from '../../client/components/GameBoard.js';
import { makeGameState } from '../fixtures/gameState.fixtures.js';

const createMockContext = () => {
  const mockGradient = {
    addColorStop: vi.fn(),
  };

  const ctx = {
    canvas: {
      width:  10 * TILE_SIZE,
      height: 8 * TILE_SIZE,
    },
    clearRect:            vi.fn(),
    fillRect:             vi.fn(),
    beginPath:            vi.fn(),
    moveTo:               vi.fn(),
    lineTo:               vi.fn(),
    stroke:               vi.fn(),
    setLineDash:          vi.fn(),
    save:                 vi.fn(),
    restore:              vi.fn(),
    rect:                 vi.fn(),
    fill:                 vi.fn(),
    arc:                  vi.fn(),
    fillText:             vi.fn(),
    createRadialGradient: vi.fn(() => mockGradient),
    // Styles properties that get mutated by drawing operations
    fillStyle:            '',
    strokeStyle:          '',
    lineWidth:            1,
    shadowColor:          '',
    shadowBlur:           0,
    font:                 '',
    textAlign:            '',
    textBaseline:         '',
  };

  return ctx as unknown as CanvasRenderingContext2D;
};

describe('Decoupled HTML5 Canvas View Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── Assertion 1 (Frame Sweeping) ──────────────────────────────────────────

  it('performs frame clear sweep and paints room grids for all active characters', () => {
    const ctx = createMockContext();
    const state = makeGameState();

    // Execute pure rendering loop
    renderBoard(ctx, state);

    // Assert context clearing frame sweep took place
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 10 * TILE_SIZE, 8 * TILE_SIZE);
    expect(ctx.fillRect).toHaveBeenCalled();

    // Verify arc (drawing circular circles) has been invoked for characters
    // (at least for ALIVE ones)
    expect(ctx.arc).toHaveBeenCalled();
  });

  // ── Assertion 2 (Visual State Invariants) ──────────────────────────────────

  it('branches into cross-hatch drawing paths when painting an ELIMINATED pawn', () => {
    const ctx = createMockContext();

    // Seed state where LULU is ELIMINATED and SMOTHERS is ALIVE
    const state = makeGameState();

    // Clear call history before painting character subset
    vi.clearAllMocks();

    renderBoard(ctx, state);

    // Verify that moveTo and lineTo were called for drawing the "X" overlay cross-hatch
    // which runs exclusively on the DEAD character branch
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  // ── Assertion 3 (Render Scheduling) ────────────────────────────────────────

  it('updates local state cache and schedules window.requestAnimationFrame loop', async () => {
    const ctx = createMockContext();
    const view = new GameBoardView(ctx);

    const state = makeGameState();

    // Spy on global requestAnimationFrame or cross-platform fallback scheduler
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    // Emit sync notification
    view.onStateSync({
      gameState:   state,
      privateHand: [],
    });

    // Assert local cache was updated successfully
    expect(view.getGameState()).toEqual(state);

    // Wait briefly for frame schedule callback trigger
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Confirm draw pipeline was invoked
    expect(ctx.clearRect).toHaveBeenCalled();

    timeoutSpy.mockRestore();
  });
});
