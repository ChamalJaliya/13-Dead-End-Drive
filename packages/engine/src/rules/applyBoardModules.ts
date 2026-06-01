/**
 * applyBoardModules.ts — board mutations for enabled rule modules at game start.
 */

import type { GameState } from '@ded/types/game-state.js';
import type { CellId } from '@ded/types/enums.js';
import type { GridCell } from '@ded/types/entities.js';
import { GRID_21X15_SECRET_PASSAGE_CELLS } from '../boardDefinition.js';

export function applySecretPassagesToBoard(
  board: Readonly<Record<CellId, GridCell>>,
): Record<CellId, GridCell> {
  const next = { ...board };
  for (const cellId of GRID_21X15_SECRET_PASSAGE_CELLS) {
    const cell = next[cellId];
    if (cell === undefined) continue;
    next[cellId] = {
      ...cell,
      cellType:        'SECRET_PASSAGE',
      isSecretPassage: true,
      label:           'Secret Passage',
    };
  }
  return next;
}

export function applyBoardModulesForState(state: GameState): GameState {
  if (state.boardVersion !== 'GRID_21X15') {
    return state;
  }
  if (!state.enabledModules.includes('SECRET_PASSAGES')) {
    return state;
  }
  return {
    ...state,
    board: applySecretPassagesToBoard(state.board),
  };
}
