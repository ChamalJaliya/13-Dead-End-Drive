/**
 * trapDefinition.ts
 * Canonical initial state for all 5 traps in 13 Dead End Drive.
 * Real game traps: Chandelier, Suit of Armor, Bookcase, Stairs, Fireplace.
 */

import type { TrapState }   from '@ded/types/entities.js';
import type { TrapId, BoardVersion }       from '@ded/types/enums.js';

export const INITIAL_TRAPS: Record<TrapId, TrapState> = {
  CHANDELIER: {
    trapId:            'CHANDELIER',
    label:             'Chandelier',
    state:             'READY',
    targetCells:       ['CHAND_TRAP'],
    eliminatesOnCells: ['CHAND_TRAP'],
  },
  SUIT_OF_ARMOR: {
    trapId:            'SUIT_OF_ARMOR',
    label:             'Suit of Armor',
    state:             'READY',
    targetCells:       ['ARMOR_TRAP'],
    eliminatesOnCells: ['ARMOR_TRAP'],
  },
  BOOKCASE: {
    trapId:            'BOOKCASE',
    label:             'Bookcase',
    state:             'READY',
    targetCells:       ['BOOK_TRAP'],
    eliminatesOnCells: ['BOOK_TRAP'],
  },
  STAIRS: {
    trapId:            'STAIRS',
    label:             'Stairs',
    state:             'READY',
    targetCells:       ['STAIR_TRAP'],
    eliminatesOnCells: ['STAIR_TRAP'],
  },
  FIREPLACE: {
    trapId:            'FIREPLACE',
    label:             'Fireplace',
    state:             'READY',
    targetCells:       ['FIRE_TRAP'],
    eliminatesOnCells: ['FIRE_TRAP'],
  },
};

export function buildTraps(boardVersion: BoardVersion): Record<TrapId, TrapState> {
  if (boardVersion === 'GRID_21X15') {
    return {
      CHANDELIER: {
        trapId:            'CHANDELIER',
        label:             'Chandelier',
        state:             'READY',
        targetCells:       ['R11'],
        eliminatesOnCells: ['R11'],
      },
      SUIT_OF_ARMOR: {
        trapId:            'SUIT_OF_ARMOR',
        label:             'Suit of Armor',
        state:             'READY',
        targetCells:       ['D3'],
        eliminatesOnCells: ['D3'],
      },
      BOOKCASE: {
        trapId:            'BOOKCASE',
        label:             'Bookcase',
        state:             'READY',
        targetCells:       ['R4'],
        eliminatesOnCells: ['R4'],
      },
      STAIRS: {
        trapId:            'STAIRS',
        label:             'Stairs',
        state:             'READY',
        targetCells:       ['B15'],
        eliminatesOnCells: ['B15'],
      },
      FIREPLACE: {
        trapId:            'FIREPLACE',
        label:             'Fireplace',
        state:             'READY',
        targetCells:       ['K12'],
        eliminatesOnCells: ['K12'],
      },
    };
  }
  return { ...INITIAL_TRAPS };
}
