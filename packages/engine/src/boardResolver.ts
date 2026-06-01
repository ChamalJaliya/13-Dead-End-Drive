/**
 * boardResolver.ts — board-version helpers (mansion grid vs fixture graph)
 */

import type { GameState } from '@ded/types/game-state.js';
import type { BoardVersion, CellId } from '@ded/types/enums.js';
import type { GridCell } from '@ded/types/entities.js';

export function getBoardVersion(state: GameState): BoardVersion {
  return state.boardVersion;
}

export function getExitCellId(state: GameState): CellId {
  return state.boardVersion === 'GRID_21X15' ? 'K1' : 'EXIT_DOOR'; // FIXTURE graph
}

export function isTrapZoneCell(cell: GridCell): boolean {
  return cell.cellType === 'TRAP_ZONE';
}

export function isTrapDrawCell(cell: GridCell): boolean {
  return cell.cellType === 'TRAP_DRAW';
}

export function listSecretPassageCells(
  board: Readonly<Record<CellId, GridCell>>,
): readonly CellId[] {
  return Object.values(board)
    .filter((c) => c.isSecretPassage)
    .map((c) => c.cellId);
}
