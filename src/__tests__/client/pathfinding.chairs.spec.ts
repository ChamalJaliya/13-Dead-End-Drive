// pathfinding.chairs.spec.ts — dining-chair cells excluded from move previews

import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../engine/gameInitializer.js';
import { GRID_21X15_DINING_CHAIR_CELLS } from '../../engine/boardDefinition.js';
import { findValidPath, getReachableCells } from '../../client/pathfinding.js';
import type { GameState } from '../../types/game-state.js';

function gridGame(): GameState {
  return initializeGame('path-chairs', ['p1', 'p2'], { p1: 'A', p2: 'B' });
}

describe('pathfinding dining-chair prohibition', () => {
  it('never highlights dining chairs as reachable destinations', () => {
    const state = gridGame();
    const moverId = 'SMOTHERS';
    const from = state.characters[moverId]!.position;
    const ctx = {
      boardVersion: state.boardVersion,
      characters: state.characters,
      moverIsOnRedChair: state.characters[moverId]!.isOnRedChair,
    };

    const reachable = getReachableCells(state.board, from, 2, moverId, ctx);
    const chairSet = new Set(GRID_21X15_DINING_CHAIR_CELLS);

    for (const cellId of reachable) {
      expect(chairSet.has(cellId)).toBe(false);
    }
  });

  it('does not route through dining chairs', () => {
    const state = gridGame();
    const moverId = 'SMOTHERS';
    const chair = state.characters[moverId]!.position;
    const off =
      state.board[chair]!.adjacentCells.find((id) => state.board[id]!.cellType !== 'RED_CHAIR')
      ?? state.board[chair]!.adjacentCells[0]!;
    const ctx = {
      boardVersion: state.boardVersion,
      characters: state.characters,
      moverIsOnRedChair: false,
    };

    const path = findValidPath(state.board, off, chair, 1, moverId, ctx);
    expect(path).toBeNull();
  });

  it('returns no reachable cells for off-chair pawns during opening chair phase', () => {
    const state = gridGame();
    const offChair = 'SMOTHERS';
    const chair = state.characters[offChair]!.position;
    const corridor =
      state.board[chair]!.adjacentCells.find((id) => state.board[id]!.cellType !== 'RED_CHAIR')
      ?? state.board[chair]!.adjacentCells[0]!;

    const characters = {
      ...state.characters,
      [offChair]: {
        ...state.characters[offChair]!,
        position: corridor,
        isOnRedChair: false,
      },
    };

    const ctx = {
      boardVersion: state.boardVersion,
      characters,
      moverIsOnRedChair: false,
    };

    const reachable = getReachableCells(
      state.board,
      corridor,
      1,
      'CHARITY',
      ctx,
    );
    expect(reachable).toEqual([]);
  });
});
