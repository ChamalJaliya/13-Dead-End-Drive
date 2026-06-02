// pawnJumpOver.spec.ts — pawns may pass over other guests; only destination must be empty

import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../engine/gameInitializer.js';
import { moveCharacter } from '../../engine/moveCharacter.js';
import { findValidPath, getReachableCells } from '../../client/pathfinding.js';
import { EngineError } from '../../engine/EngineError.js';
import type { GameState } from '../../types/game-state.js';
import type { CellId, CharacterId } from '../../types/enums.js';

function expectEngineError(fn: () => unknown): void {
  try {
    fn();
    expect.unreachable('expected EngineError');
  } catch (err: unknown) {
    expect(err).toBeInstanceOf(EngineError);
  }
}

function postChairState(moverId: CharacterId, from: CellId): GameState {
  let state = initializeGame('jump-over', ['p1', 'p2'], { p1: 'A', p2: 'B' });
  const chars = { ...state.characters };
  for (const id of Object.keys(chars) as CharacterId[]) {
    chars[id] = { ...chars[id]!, isOnRedChair: false };
  }
  chars[moverId] = { ...chars[moverId]!, position: from, isOnRedChair: false };

  const board = { ...state.board };
  for (const cell of Object.values(board)) {
    board[cell.cellId] = { ...cell, occupants: [] };
  }
  board[from] = { ...board[from]!, occupants: [moverId] };

  return {
    ...state,
    characters: chars,
    board,
    subPhase: 'FIRST_MOVE',
    lastDiceRoll: {
      die1: 2,
      die2: 4,
      isDoubles: false,
      rolledBy: 'p1',
      rolledAt: '2026-06-02T00:00:00Z',
    },
    movementPlan: 'SPLIT',
    pipsRemaining: 2,
    movesUsedThisTurn: 0,
  };
}

describe('pawn jump-over movement', () => {
  it('allows moveCharacter path that passes through a square occupied by another pawn', () => {
    const moverId = 'SMOTHERS' as const;
    const blockerId = 'POOPSIE' as const;
    const from = 'H10' as CellId;
    const over = 'H9' as CellId;
    const to = 'H8' as CellId;

    let state = postChairState(moverId, from);
    state = {
      ...state,
      board: {
        ...state.board,
        [over]: { ...state.board[over]!, occupants: [blockerId] },
      },
    };

    const next = moveCharacter(state, {
      type: 'MOVE_PAWN',
      eventId: 'evt-jump-over',
      gameId: 'jump-over',
      playerId: 'p1',
      timestamp: '2026-06-02T00:00:01Z',
      payload: {
        characterId: moverId,
        fromCell: from,
        toCell: to,
        pipsUsed: 2,
        path: [from, over, to],
      },
    });

    expect(next.characters[moverId]!.position).toBe(to);
    expect(next.board[to]!.occupants).toContain(moverId);
    expect(next.board[over]!.occupants).toContain(blockerId);
  });

  it('rejects landing on a square occupied by another pawn', () => {
    const moverId = 'SMOTHERS' as const;
    const from = 'H10' as CellId;
    const occupied = 'H9' as CellId;

    let state = postChairState(moverId, from);
    state = {
      ...state,
      board: {
        ...state.board,
        [occupied]: { ...state.board[occupied]!, occupants: ['POOPSIE'] },
      },
      lastDiceRoll: {
        die1: 1,
        die2: 2,
        isDoubles: false,
        rolledBy: 'p1',
        rolledAt: '2026-06-02T00:00:00Z',
      },
      pipsRemaining: 1,
    };

    expectEngineError(() =>
      moveCharacter(state, {
        type: 'MOVE_PAWN',
        eventId: 'evt-land-on-pawn',
        gameId: 'jump-over',
        playerId: 'p1',
        timestamp: '2026-06-02T00:00:01Z',
        payload: {
          characterId: moverId,
          fromCell: from,
          toCell: occupied,
          pipsUsed: 1,
          path: [from, occupied],
        },
      }),
    );
  });

  it('pathfinder highlights destination beyond an occupied intermediate cell', () => {
    const moverId = 'SMOTHERS' as const;
    const from = 'H10' as CellId;
    const over = 'H9' as CellId;
    const to = 'H8' as CellId;

    let state = postChairState(moverId, from);
    state = {
      ...state,
      board: {
        ...state.board,
        [over]: { ...state.board[over]!, occupants: ['POOPSIE'] },
      },
    };

    const ctx = {
      boardVersion: state.boardVersion,
      characters: state.characters,
      moverIsOnRedChair: false,
    };

    const reachable = getReachableCells(state.board, from, 2, moverId, ctx);
    expect(reachable).toContain(to);
    expect(reachable).not.toContain(over);

    const path = findValidPath(state.board, from, to, 2, moverId, ctx);
    expect(path).toEqual([from, over, to]);
  });
});
