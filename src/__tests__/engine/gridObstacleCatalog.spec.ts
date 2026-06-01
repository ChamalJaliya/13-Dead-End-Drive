// gridObstacleCatalog.spec.ts — GRID_21X15 furniture obstacle inventory

import { describe, it, expect } from 'vitest';
import { GRID_21X15_OBSTACLE_CATALOG } from '../../engine/boardDefinition.js';

describe('GRID_21X15 obstacle catalog', () => {
  it('matches programmed furniture obstacles (GDD sync)', () => {
    expect(GRID_21X15_OBSTACLE_CATALOG).toEqual({
      STAIRCASE:     ['C14', 'C15', 'D14', 'D15', 'E14', 'E15', 'F14', 'F15', 'G14', 'G15'],
      FIREPLACE:     [
        'H13', 'H14', 'H15', 'I13', 'I14', 'I15', 'J13', 'J14', 'J15', 'K13', 'K14', 'K15',
        'L13', 'L14', 'L15', 'M13', 'M14', 'M15', 'N13', 'N14', 'N15',
      ],
      COUCH:         ['O5', 'O6', 'P6', 'T10', 'T11', 'T12', 'T13', 'T9', 'U10', 'U11', 'U12', 'U13', 'U9'],
      PIANO:         ['C10', 'C11', 'C9', 'D10', 'D11', 'D9', 'E10', 'E11', 'E9'],
      TABLE:         ['K6', 'K7', 'K8'],
      PAINTING:      ['F6', 'G5', 'G6'],
      BOOKSHELF:     ['U3', 'U4', 'U5', 'U6'],
      STATUE:        ['A2', 'A3', 'B2', 'B3'],
      VASE:          ['E1'],
      WRITING_TABLE: ['Q1', 'R1', 'S1'],
    });
  });

  it('lists far more than the dining table (71 furniture cells)', () => {
    const total = Object.values(GRID_21X15_OBSTACLE_CATALOG).reduce(
      (n, ids) => n + ids.length,
      0,
    );
    expect(total).toBe(71);
  });
});
