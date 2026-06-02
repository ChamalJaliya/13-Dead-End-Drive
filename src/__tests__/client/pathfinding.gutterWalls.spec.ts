// pathfinding.gutterWalls.spec.ts — client pathfinding respects gutter walls

import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../engine/gameInitializer.js';
import { findValidPath, getReachableCells } from '../../client/pathfinding.js';
import type { GameState } from '../../types/game-state.js';
import { CHARACTER_IDS, type CharacterId } from '../../types/enums.js';

function gridGame(): GameState {
  return initializeGame('pf-wall', ['p1', 'p2'], { p1: 'A', p2: 'B' });
}

function previewCtx(state: GameState, moverId: CharacterId) {
  return {
    boardVersion: state.boardVersion,
    characters: state.characters,
    moverIsOnRedChair: state.characters[moverId]!.isOnRedChair,
  };
}

describe('pathfinding with gutter walls', () => {
  it('findValidPath returns null for a direct walled edge', () => {
    const state = gridGame();
    const guest = CHARACTER_IDS[0]!;
    const ctx = previewCtx(state, guest);

    const path = findValidPath(state.board, 'G7', 'H7', 1, guest, ctx);
    expect(path).toBeNull();
  });

  it('getReachableCells excludes cells across a gutter wall in one hop', () => {
    const state = gridGame();
    const guest = CHARACTER_IDS[0]!;
    const ctx = previewCtx(state, guest);

    const reachable = getReachableCells(state.board, 'G7', 1, guest, ctx);
    expect(reachable).not.toContain('H7');
  });

  it('findValidPath finds a detour around a horizontal gutter wall', () => {
    const state = gridGame();
    const guest = CHARACTER_IDS[0]!;
    const ctx = previewCtx(state, guest);

    const path = findValidPath(state.board, 'H2', 'H3', 3, guest, ctx);
    expect(path).not.toBeNull();
    expect(path![0]).toBe('H2');
    expect(path![path!.length - 1]).toBe('H3');
    expect(path).not.toEqual(['H2', 'H3']);
  });
});
