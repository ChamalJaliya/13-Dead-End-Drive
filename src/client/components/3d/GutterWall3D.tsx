/**
 * GutterWall3D.tsx — static wall segments in tile gutters (edge blockers).
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { gridCellCoords, listGutterWallEdgePairs } from '../../../engine/boardDefinition.js';

const GRID_SCALE = 1.8;
const TILE_GAP = 0.10;
const TILE_FACE = GRID_SCALE - TILE_GAP;
const WALL_HEIGHT = 0.42;
const WALL_THICK = 0.11;

interface GutterWalls3DProps {
  readonly centerCol: number;
  readonly centerRow: number;
}

function toWorld(col: number, row: number, centerCol: number, centerRow: number): [number, number] {
  return [(col - centerCol) * GRID_SCALE, (row - centerRow) * GRID_SCALE];
}

export function GutterWalls3D({ centerCol, centerRow }: GutterWalls3DProps) {
  const segments = useMemo(() => {
    const out: {
      key: string;
      position: [number, number, number];
      size: [number, number, number];
    }[] = [];

    for (const [cellA, cellB] of listGutterWallEdgePairs()) {
      const idxA = gridCellCoords(cellA);
      const idxB = gridCellCoords(cellB);
      if (!idxA || !idxB) continue;

      const [ax, az] = toWorld(idxA.col, idxA.row, centerCol, centerRow);
      const [bx, bz] = toWorld(idxB.col, idxB.row, centerCol, centerRow);
      const mx = (ax + bx) / 2;
      const mz = (az + bz) / 2;
      const colDelta = Math.abs(idxA.col - idxB.col);
      const rowDelta = Math.abs(idxA.row - idxB.row);

      if (colDelta === 1 && rowDelta === 0) {
        out.push({
          key: `${cellA}|${cellB}`,
          position: [mx, WALL_HEIGHT / 2, az],
          size: [WALL_THICK, WALL_HEIGHT, TILE_FACE],
        });
      } else if (rowDelta === 1 && colDelta === 0) {
        out.push({
          key: `${cellA}|${cellB}`,
          position: [ax, WALL_HEIGHT / 2, mz],
          size: [TILE_FACE, WALL_HEIGHT, WALL_THICK],
        });
      }
    }

    return out;
  }, [centerCol, centerRow]);

  return (
    <group>
      {segments.map((seg) => (
        <mesh
          key={seg.key}
          position={seg.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={seg.size} />
          <meshStandardMaterial color="#4a4038" metalness={0.35} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}
