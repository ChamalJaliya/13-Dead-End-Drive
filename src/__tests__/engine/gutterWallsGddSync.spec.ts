// gutterWallsGddSync.spec.ts — GDD JSON gutter_walls matches engine catalog

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  GRID_21X15_GUTTER_WALLS,
  GRID_21X15_GUTTER_WALL_SEGMENTS,
  listGutterWallEdgePairs,
  toBoardEdgeId,
} from '../../engine/boardDefinition.js';
import type { CellId } from '../../types/enums.js';

interface GddBoardNodes {
  readonly gutter_walls?: {
    readonly total_edges?: number;
    readonly segments?: readonly unknown[];
    readonly edges?: readonly (readonly [string, string])[];
  };
  readonly obstacles?: {
    readonly total_obstacle_cells?: number;
  };
}

const GDD_PATH = join(process.cwd(), 'data/gdd_board_nodes.json');

describe('gutter walls GDD sync', () => {
  it('engine catalog has 33 edges from 9 segments', () => {
    expect(GRID_21X15_GUTTER_WALL_SEGMENTS).toHaveLength(9);
    expect(GRID_21X15_GUTTER_WALLS.size).toBe(33);
  });

  it('gdd_board_nodes.json gutter_walls matches engine edge list', () => {
    const gdd = JSON.parse(readFileSync(GDD_PATH, 'utf8')) as GddBoardNodes;
    expect(gdd.gutter_walls?.total_edges).toBe(33);
    expect(gdd.gutter_walls?.segments).toHaveLength(9);

    const gddEdges = new Set(
      (gdd.gutter_walls?.edges ?? []).map(([a, b]) => toBoardEdgeId(a as CellId, b as CellId)),
    );
    expect(gddEdges.size).toBe(33);

    for (const edge of GRID_21X15_GUTTER_WALLS) {
      expect(gddEdges.has(edge)).toBe(true);
    }
    for (const [a, b] of listGutterWallEdgePairs()) {
      expect(GRID_21X15_GUTTER_WALLS.has(toBoardEdgeId(a, b))).toBe(true);
    }
  });

  it('furniture obstacles remain separate from gutter walls in GDD', () => {
    const gdd = JSON.parse(readFileSync(GDD_PATH, 'utf8')) as GddBoardNodes;
    expect(gdd.obstacles?.total_obstacle_cells).toBe(71);
    expect(gdd.gutter_walls?.total_edges).toBe(33);
  });
});
