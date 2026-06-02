// gutterWalls.spec.ts — GRID_21X15 gutter wall edge catalog and adjacency

import { describe, it, expect } from 'vitest';
import {
  GRID_21X15_GUTTER_WALLS,
  GRID_21X15_GUTTER_WALL_SEGMENTS,
  GRID_21X15_INITIAL_BOARD,
  compileGutterWallEdges,
  toBoardEdgeId,
  isGutterWallEdge,
} from '../../engine/boardDefinition.js';
import { initializeGame } from '../../engine/gameInitializer.js';
import { moveCharacter } from '../../engine/moveCharacter.js';
import { EngineError } from '../../engine/EngineError.js';
import type { GameState } from '../../types/game-state.js';
import { CHARACTER_IDS, type CellId, type SocketErrorCode } from '../../types/enums.js';

function expectEngineError(fn: () => unknown, code: SocketErrorCode): void {
  try {
    fn();
    expect.unreachable('expected EngineError');
  } catch (err: unknown) {
    expect(err).toBeInstanceOf(EngineError);
    expect((err as EngineError).code).toBe(code);
  }
}

function gridGame(): GameState {
  return initializeGame('gutter-walls', ['p1', 'p2'], { p1: 'A', p2: 'B' });
}

describe('gutter wall edge catalog', () => {
  it('compiles 9 segments into exactly 33 unique edges', () => {
    expect(GRID_21X15_GUTTER_WALL_SEGMENTS).toHaveLength(9);
    const compiled = compileGutterWallEdges(GRID_21X15_GUTTER_WALL_SEGMENTS);
    expect(compiled.size).toBe(33);
    expect(GRID_21X15_GUTTER_WALLS.size).toBe(33);
  });

  it('toBoardEdgeId is symmetric', () => {
    expect(toBoardEdgeId('H2', 'H3')).toBe('H2|H3');
    expect(toBoardEdgeId('H3', 'H2')).toBe('H2|H3');
    expect(toBoardEdgeId('G7', 'H7')).toBe('G7|H7');
  });

  it('isGutterWallEdge detects catalog edges', () => {
    expect(isGutterWallEdge('H2', 'H3')).toBe(true);
    expect(isGutterWallEdge('G7', 'H7')).toBe(true);
    expect(isGutterWallEdge('N8', 'O8')).toBe(true);
    expect(isGutterWallEdge('H7', 'H8')).toBe(false);
  });
});

describe('gutter walls in GRID_21X15 adjacency', () => {
  const board = GRID_21X15_INITIAL_BOARD;

  it('run #1 removes H2↔H3 adjacency both directions', () => {
    expect(board.H2!.adjacentCells).not.toContain('H3');
    expect(board.H3!.adjacentCells).not.toContain('H2');
  });

  it('run #2 removes G7↔H7 adjacency both directions', () => {
    expect(board.G7!.adjacentCells).not.toContain('H7');
    expect(board.H7!.adjacentCells).not.toContain('G7');
  });

  it('run #6 removes N8↔O8 adjacency both directions', () => {
    expect(board.N8!.adjacentCells).not.toContain('O8');
    expect(board.O8!.adjacentCells).not.toContain('N8');
  });

  it('walled cells remain CORRIDOR not furniture', () => {
    expect(board.G7!.cellType).toBe('CORRIDOR');
    expect(board.H7!.cellType).toBe('CORRIDOR');
    expect(board.H2!.cellType).toBe('CORRIDOR');
  });
});

describe('gutter walls in moveCharacter', () => {
  it('rejects direct move across a vertical gutter wall', () => {
    let state = gridGame();
    state = {
      ...state,
      subPhase: 'FIRST_MOVE',
      lastDiceRoll: {
        die1: 1,
        die2: 2,
        isDoubles: false,
        rolledBy: 'p1',
        rolledAt: '2026-06-01T00:00:00Z',
      },
      movementPlan: 'SPLIT',
      pipsRemaining: 1,
      movesUsedThisTurn: 0,
      characters: {
        ...state.characters,
        SMOTHERS: {
          ...state.characters.SMOTHERS!,
          position: 'G7' as CellId,
          isOnRedChair: false,
        },
      },
      board: {
        ...state.board,
        G7: { ...state.board.G7!, occupants: ['SMOTHERS'] },
      },
    };

    expectEngineError(
      () =>
        moveCharacter(state, {
          type: 'MOVE_PAWN',
          eventId: 'evt-g7-h7-wall',
          gameId: 'gutter-walls',
          playerId: 'p1',
          timestamp: '2026-06-01T00:00:01Z',
          payload: {
            characterId: 'SMOTHERS',
            fromCell: 'G7',
            toCell: 'H7',
            pipsUsed: 1,
            path: ['G7', 'H7'],
          },
        }),
      'INVALID_MOVE',
    );
  });

  it('allows detour when direct edge is walled but alternate path exists', () => {
    let state = gridGame();
    const moverId = 'SMOTHERS' as const;
    const chars = { ...state.characters };
    for (const id of CHARACTER_IDS) {
      chars[id] = { ...chars[id]!, isOnRedChair: false };
    }
    chars[moverId] = {
      ...chars[moverId]!,
      position: 'H2' as CellId,
      isOnRedChair: false,
    };
    state = {
      ...state,
      subPhase: 'FIRST_MOVE',
      lastDiceRoll: {
        die1: 3,
        die2: 4,
        isDoubles: false,
        rolledBy: 'p1',
        rolledAt: '2026-06-01T00:00:00Z',
      },
      movementPlan: 'SPLIT',
      pipsRemaining: 3,
      movesUsedThisTurn: 0,
      characters: chars,
      board: {
        ...state.board,
        H2: { ...state.board.H2!, occupants: [moverId] },
      },
    };

    const next = moveCharacter(state, {
      type: 'MOVE_PAWN',
      eventId: 'evt-h2-h3-detour',
      gameId: 'gutter-walls',
      playerId: 'p1',
      timestamp: '2026-06-01T00:00:01Z',
      payload: {
        characterId: 'SMOTHERS',
        fromCell: 'H2',
        toCell: 'H3',
        pipsUsed: 3,
        path: ['H2', 'G2', 'G3', 'H3'],
      },
    });

    expect(next.characters.SMOTHERS!.position).toBe('H3');
  });
});
