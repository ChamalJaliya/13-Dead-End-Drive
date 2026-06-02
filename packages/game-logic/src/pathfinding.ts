/**
 * pathfinding.ts
 * Client-side BFS pathfinding for move previews and click-to-move validation.
 * Mirrors GRID_21X15 dining-chair rules from moveCharacter.ts.
 */

import type { GameState } from '@ded/types/game-state.js';
import type { CellId, CharacterId } from '@ded/types/enums.js';
import { GRID_21X15_DINING_CHAIR_SET } from '@ded/engine/boardDefinition.js';
import { isTrapZoneCell, listSecretPassageCells } from '@ded/engine/boardResolver.js';

export interface MovementPreviewContext {
  readonly boardVersion: GameState['boardVersion'];
  readonly characters: GameState['characters'];
  readonly moverIsOnRedChair: boolean;
}

function anyAliveOnRedChair(characters: GameState['characters']): boolean {
  return Object.values(characters).some(
    (c) => c.status === 'ALIVE' && c.isOnRedChair,
  );
}

function isGridDiningChair(
  boardVersion: GameState['boardVersion'],
  cellId: CellId,
): boolean {
  return boardVersion === 'GRID_21X15' && GRID_21X15_DINING_CHAIR_SET.has(cellId);
}

function isChairTraversalBlocked(
  boardVersion: GameState['boardVersion'],
  cellId: CellId,
): boolean {
  return isGridDiningChair(boardVersion, cellId);
}

function isDestinationAllowed(
  board: GameState['board'],
  cellId: CellId,
  ctx: MovementPreviewContext | undefined,
): boolean {
  if (ctx === undefined) return true;
  if (isGridDiningChair(ctx.boardVersion, cellId)) return false;
  if (anyAliveOnRedChair(ctx.characters)) {
    const dest = board[cellId];
    if (dest !== undefined && isTrapZoneCell(dest)) return false;
  }
  return true;
}

function isOccupiedByOther(
  cell: { readonly occupants: readonly CharacterId[] },
  charId: CharacterId,
): boolean {
  return cell.occupants.some((occ) => occ !== charId);
}

function openingChairPhaseBlocksMover(ctx: MovementPreviewContext): boolean {
  return (
    ctx.boardVersion === 'GRID_21X15' &&
    anyAliveOnRedChair(ctx.characters) &&
    !ctx.moverIsOnRedChair
  );
}

/** Dining-chair cells to mark prohibited (not reachable) during move selection. */
export function getProhibitedChairCells(
  boardVersion: GameState['boardVersion'],
): readonly CellId[] {
  if (boardVersion !== 'GRID_21X15') return [];
  return [...GRID_21X15_DINING_CHAIR_SET];
}

export function findValidPath(
  board: GameState['board'],
  fromCell: CellId,
  toCell: CellId,
  pips: number,
  charId: CharacterId,
  ctx?: MovementPreviewContext,
): CellId[] | null {
  if (ctx !== undefined && openingChairPhaseBlocksMover(ctx)) return null;
  if (ctx !== undefined && !isDestinationAllowed(board, toCell, ctx)) return null;

  const queue: CellId[][] = [[fromCell]];
  const matches: CellId[][] = [];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const hops = path.length - 1;

    if (hops === pips) {
      if (path[path.length - 1] === toCell) {
        matches.push(path);
      }
      continue;
    }

    const last = path[path.length - 1]!;
    const cell = board[last];
    if (!cell) continue;

    const expand = (nextId: CellId): void => {
      if (path.includes(nextId)) return;
      const nextCell = board[nextId];
      if (!nextCell) return;

      if (ctx !== undefined && isChairTraversalBlocked(ctx.boardVersion, nextId)) {
        return;
      }

      // May pass through occupied cells; only the landing square must be empty of other pawns.
      if (path.length === pips && isOccupiedByOther(nextCell, charId)) {
        return;
      }
      queue.push([...path, nextId]);
    };

    for (const adj of cell.adjacentCells) {
      expand(adj);
    }

    if (cell.isSecretPassage) {
      for (const spId of listSecretPassageCells(board)) {
        if (spId !== last) expand(spId);
      }
    }
  }

  return matches.length > 0 ? matches[0]! : null;
}

/** All cells reachable in exactly `pips` hops from `fromCell`. */
export function getReachableCells(
  board: GameState['board'],
  fromCell: CellId,
  pips: number,
  charId: CharacterId,
  ctx?: MovementPreviewContext,
): readonly CellId[] {
  if (pips <= 0) return [];
  if (ctx !== undefined && openingChairPhaseBlocksMover(ctx)) return [];

  const reachable = new Set<CellId>();
  const queue: CellId[][] = [[fromCell]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const hops = path.length - 1;

    if (hops === pips) {
      const destId = path[path.length - 1]!;
      if (isDestinationAllowed(board, destId, ctx)) {
        reachable.add(destId);
      }
      continue;
    }

    const last = path[path.length - 1]!;
    const cell = board[last];
    if (!cell) continue;

    const expand = (nextId: CellId): void => {
      if (path.includes(nextId)) return;
      const nextCell = board[nextId];
      if (!nextCell) return;

      if (ctx !== undefined && isChairTraversalBlocked(ctx.boardVersion, nextId)) {
        return;
      }

      if (path.length === pips && isOccupiedByOther(nextCell, charId)) {
        return;
      }
      queue.push([...path, nextId]);
    };

    for (const adj of cell.adjacentCells) {
      expand(adj);
    }

    if (cell.isSecretPassage) {
      for (const spId of listSecretPassageCells(board)) {
        if (spId !== last) expand(spId);
      }
    }
  }

  reachable.delete(fromCell);
  return [...reachable];
}
