/**
 * boardCoordinates.ts — pixel/grid projection for board versions
 */

import type { GameState } from '../types/game-state.js';
import type { CellId } from '../types/enums.js';
import type { GridCell } from '../types/entities.js';
import {
  BOARD_CELLS,
  CELL_COORDINATES,
  SECRET_PASSAGE_CELLS,
  TILE_SIZE as DEFAULT_TILE_SIZE,
} from '../engine/boardDefinition.js';
import { GRID_COLUMNS, GRID_ROWS } from '../types/enums.js';
import { listSecretPassageCells } from '../engine/boardResolver.js';

export { DEFAULT_TILE_SIZE as TILE_SIZE };

export function tileSizeForState(state: GameState): number {
  return state.boardVersion === 'GRID_21X15' ? DEFAULT_TILE_SIZE : 55;
}

export interface GridCoord {
  readonly x: number;
  readonly y: number;
}

export function cellGridCoord(state: GameState, cellId: CellId): GridCoord | null {
  if (state.boardVersion === 'GRID_21X15') {
    const cell = state.board[cellId];
    if (!cell) return null;
    return { x: cell.gridCol, y: cell.gridRow };
  }
  return CELL_COORDINATES[cellId] ?? null;
}

export function cellPixelCenter(state: GameState, cellId: CellId): { x: number; y: number } | null {
  const coord = cellGridCoord(state, cellId);
  if (!coord) return null;
  const ts = tileSizeForState(state);
  return { x: coord.x * ts + ts / 2, y: coord.y * ts + ts / 2 };
}

export function findCellAtWorld(
  state: GameState,
  worldX: number,
  worldY: number,
): CellId | null {
  const ts = tileSizeForState(state);
  const col = Math.floor(worldX / ts);
  const row = Math.floor(worldY / ts);
  for (const cell of Object.values(state.board)) {
    if (cell.gridCol === col && cell.gridRow === row) return cell.cellId;
  }
  return null;
}

export function cellsForRender(state: GameState): readonly GridCell[] {
  if (state.boardVersion === 'GRID_21X15') {
    return Object.values(state.board);
  }
  return BOARD_CELLS;
}

export function secretPassageCellIds(state: GameState): readonly CellId[] {
  if (state.boardVersion === 'GRID_21X15') {
    return listSecretPassageCells(state.board);
  }
  return SECRET_PASSAGE_CELLS;
}

export function boardWorldBounds(state: GameState): { width: number; height: number } {
  const ts = tileSizeForState(state);
  if (state.boardVersion === 'GRID_21X15') {
    return { width: GRID_COLUMNS * ts, height: (GRID_ROWS + 1) * ts };
  }
  return { width: 10 * ts, height: 8 * ts };
}
