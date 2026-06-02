/**
 * boardDefinition.ts
 * The complete 13 Dead End Drive mansion board — static adjacencies and programmatic 21x15 grid.
 */

import type { GridCell, DetectiveTrack } from '@ded/types/entities.js';
import type { CellId, TrapId }           from '@ded/types/enums.js';
import { DETECTIVE_TRACK_MAX_STEPS }     from '@ded/types/enums.js';

export const TILE_SIZE = 55;

// =============================================================================
// FIXTURE BOARD — small adjacency graph for unit tests (not the mansion grid)
// =============================================================================

function cell(
  cellId: CellId,
  label: string,
  col: number,
  row: number,
  opts: {
    cellType?: GridCell['cellType'];
    adjacentCells?: CellId[];
    trapRef?: TrapId | null;
    isExitAdjacent?: boolean;
    isRedChair?: boolean;
    isSecretPassage?: boolean;
  } = {},
): GridCell {
  return {
    cellId,
    label,
    cellType:        opts.cellType        ?? 'ROOM',
    gridCol:         col,
    gridRow:         row,
    occupants:       [],
    trapRef:         opts.trapRef         ?? null,
    isExitAdjacent:  opts.isExitAdjacent  ?? false,
    isRedChair:      opts.isRedChair      ?? false,
    isSecretPassage: opts.isSecretPassage ?? false,
    adjacentCells:   opts.adjacentCells   ?? [],
  };
}

export const BOARD_CELLS: GridCell[] = [
  // ── UPPER FLOOR — Row 0 ────────────────────────────────────────────────────
  cell('LIBRARY',    'Library',    1, 0, {
    cellType:      'ROOM',
    adjacentCells: ['BOOK_TRAP', 'UP_STAIR'],
  }),
  cell('BOOK_TRAP',  'Bookcase',   2, 0, {
    cellType:      'TRAP_ZONE',
    trapRef:       'BOOKCASE',
    adjacentCells: ['LIBRARY', 'UP_HALL'],
  }),
  cell('UP_HALL',    'Upper Hall', 3, 0, {
    cellType:      'CORRIDOR',
    adjacentCells: ['BOOK_TRAP', 'SP_1', 'ARMOR_CORR'],
  }),
  cell('SP_1',       'Secret Passage', 4, 0, {
    cellType:        'SECRET_PASSAGE',
    isSecretPassage: true,
    adjacentCells:   ['UP_HALL', 'STUDY'],
  }),
  cell('STUDY',      'Study',      5, 0, {
    cellType:      'ROOM',
    adjacentCells: ['SP_1', 'MASTER_BED'],
  }),
  cell('MASTER_BED', 'Master Bedroom', 6, 0, {
    cellType:      'ROOM',
    adjacentCells: ['STUDY', 'SP_2'],
  }),
  cell('SP_2',       'Secret Passage', 7, 0, {
    cellType:        'SECRET_PASSAGE',
    isSecretPassage: true,
    adjacentCells:   ['MASTER_BED', 'BACK_LANDING'],
  }),

  // ── UPPER FLOOR — Row 1 ────────────────────────────────────────────────────
  cell('UP_STAIR',   'Upper Stairs',   1, 1, {
    cellType:      'CORRIDOR',
    adjacentCells: ['LIBRARY', 'MUSIC_RM'],
  }),
  cell('ARMOR_CORR', 'Armor Corridor', 3, 1, {
    cellType:      'CORRIDOR',
    adjacentCells: ['UP_HALL', 'ARMOR_TRAP'],
  }),
  cell('ARMOR_TRAP', 'Suit of Armor',  4, 1, {
    cellType:      'TRAP_ZONE',
    trapRef:       'SUIT_OF_ARMOR',
    adjacentCells: ['ARMOR_CORR', 'CENTER_U'],
  }),
  cell('CENTER_U',   'Upper Centre',   5, 1, {
    cellType:      'CORRIDOR',
    adjacentCells: ['ARMOR_TRAP', 'SP_3', 'CENTER_M'],
  }),
  cell('SP_3',       'Secret Passage', 6, 1, {
    cellType:        'SECRET_PASSAGE',
    isSecretPassage: true,
    adjacentCells:   ['CENTER_U', 'BACK_LANDING'],
  }),
  cell('BACK_LANDING', 'Back Landing', 7, 1, {
    cellType:      'CORRIDOR',
    adjacentCells: ['SP_2', 'SP_3', 'STAIR_L', 'BALCONY'],
  }),

  // ── MAIN FLOOR — Row 2 ─────────────────────────────────────────────────────
  cell('MUSIC_RM',   'Music Room',     1, 2, {
    cellType:      'ROOM',
    adjacentCells: ['UP_STAIR', 'CHAND_TRAP', 'SIT_RM'],
  }),
  cell('CHAND_TRAP', 'Chandelier',     2, 2, {
    cellType:      'TRAP_ZONE',
    trapRef:       'CHANDELIER',
    adjacentCells: ['MUSIC_RM', 'MUSIC_HALL'],
  }),
  cell('MUSIC_HALL', 'Music Hall',     3, 2, {
    cellType:      'CORRIDOR',
    adjacentCells: ['CHAND_TRAP', 'CENTER_M', 'HALL_1'],
  }),
  cell('CENTER_M',   'Centre Hall',    4, 2, {
    cellType:      'CORRIDOR',
    adjacentCells: ['MUSIC_HALL', 'CENTER_U', 'STAIR_L'],
  }),
  cell('STAIR_L',    'Stair Landing',  5, 2, {
    cellType:      'CORRIDOR',
    adjacentCells: ['CENTER_M', 'STAIR_TRAP', 'BACK_LANDING'],
  }),
  cell('BALCONY',    'Balcony',        7, 2, {
    cellType:      'ROOM',
    adjacentCells: ['BACK_LANDING', 'DINING_HALL'],
  }),
  cell('DINING_HALL','Dining Hall',    8, 2, {
    cellType:      'CORRIDOR',
    adjacentCells: ['BALCONY', 'DINING_RM'],
  }),

  // ── MAIN FLOOR — Row 3 ─────────────────────────────────────────────────────
  cell('SIT_RM',     'Sitting Room',   1, 3, {
    cellType:      'ROOM',
    adjacentCells: ['MUSIC_RM', 'FIRE_TRAP', 'KITCHEN'],
  }),
  cell('FIRE_TRAP',  'Fireplace',      2, 3, {
    cellType:      'TRAP_ZONE',
    trapRef:       'FIREPLACE',
    adjacentCells: ['SIT_RM', 'HALL_1'],
  }),
  cell('HALL_1',     'Main Hall',      3, 3, {
    cellType:      'CORRIDOR',
    adjacentCells: ['FIRE_TRAP', 'MUSIC_HALL', 'STAIR_TRAP', 'RC_1'],
  }),
  cell('STAIR_TRAP', 'Stairs',         4, 3, {
    cellType:      'TRAP_ZONE',
    trapRef:       'STAIRS',
    adjacentCells: ['HALL_1', 'STAIR_L', 'STAIR_BOT'],
  }),
  cell('STAIR_BOT',  'Stair Bottom',   5, 3, {
    cellType:      'CORRIDOR',
    adjacentCells: ['STAIR_TRAP', 'MAIN_HALL', 'RC_3'],
  }),
  cell('MAIN_HALL',  'Grand Hall',     6, 3, {
    cellType:      'CORRIDOR',
    adjacentCells: ['STAIR_BOT', 'FOYER', 'RC_4'],
  }),
  cell('FOYER',      'Foyer',          7, 3, {
    cellType:      'ROOM',
    adjacentCells: ['MAIN_HALL', 'DINING_RM', 'FRONT_HALL', 'RC_5'],
  }),
  cell('DINING_RM',  'Dining Room',    8, 3, {
    cellType:      'ROOM',
    adjacentCells: ['FOYER', 'DINING_HALL', 'BACK_HALL'],
  }),
  cell('BACK_HALL',  'Back Hall',      9, 3, {
    cellType:      'CORRIDOR',
    adjacentCells: ['DINING_RM', 'SP_5'],
  }),

  // ── CENTER — Row 4 ─────────────────────────────────────────────────────────
  cell('KITCHEN',    'Kitchen',        1, 4, {
    cellType:      'ROOM',
    adjacentCells: ['SIT_RM', 'SP_4'],
  }),
  cell('SP_4',       'Secret Passage', 2, 4, {
    cellType:        'SECRET_PASSAGE',
    isSecretPassage: true,
    adjacentCells:   ['KITCHEN', 'RC_1'],
  }),
  cell('RC_1',       'Red Chair 1',   3, 4, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['HALL_1', 'SP_4', 'RC_2', 'RC_7'],
  }),
  cell('RC_2',       'Red Chair 2',   4, 4, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_1', 'RC_3', 'RC_8'],
  }),
  cell('RC_3',       'Red Chair 3',   5, 4, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_2', 'RC_4', 'STAIR_BOT', 'RC_9'],
  }),
  cell('RC_4',       'Red Chair 4',   6, 4, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_3', 'RC_5', 'MAIN_HALL', 'RC_10'],
  }),
  cell('RC_5',       'Red Chair 5',   7, 4, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_4', 'RC_6', 'FOYER', 'RC_11'],
  }),
  cell('RC_6',       'Red Chair 6',   8, 4, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_5', 'SP_5', 'RC_12'],
  }),
  cell('SP_5',       'Secret Passage', 9, 4, {
    cellType:        'SECRET_PASSAGE',
    isSecretPassage: true,
    adjacentCells:   ['BACK_HALL', 'RC_6'],
  }),

  // ── CENTER — Row 5 ─────────────────────────────────────────────────────────
  cell('RC_7',       'Red Chair 7',   3, 5, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_1', 'RC_8', 'FRONT_HALL'],
  }),
  cell('RC_8',       'Red Chair 8',   4, 5, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_7', 'RC_2', 'RC_9'],
  }),
  cell('RC_9',       'Red Chair 9',   5, 5, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_8', 'RC_3', 'RC_10', 'FRONT_HALL'],
  }),
  cell('RC_10',      'Red Chair 10',  6, 5, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_9', 'RC_4', 'RC_11'],
  }),
  cell('RC_11',      'Red Chair 11',  7, 5, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_10', 'RC_5', 'RC_12'],
  }),
  cell('RC_12',      'Red Chair 12',  8, 5, {
    cellType:      'RED_CHAIR',
    isRedChair:    true,
    adjacentCells: ['RC_11', 'RC_6', 'FRONT_HALL'],
  }),

  // ── GROUND FLOOR — Row 6 ───────────────────────────────────────────────────
  cell('FRONT_HALL', 'Front Hall',    5, 6, {
    cellType:        'CORRIDOR',
    isExitAdjacent:  true,
    adjacentCells:   ['RC_7', 'RC_9', 'RC_12', 'FOYER', 'FRONT_PORCH'],
  }),
  cell('FRONT_PORCH','Front Porch',   6, 6, {
    cellType:        'CORRIDOR',
    isExitAdjacent:  true,
    adjacentCells:   ['FRONT_HALL', 'EXIT_DOOR'],
  }),
  cell('EXIT_DOOR',  'Exit / Front Door', 7, 6, {
    cellType:        'EXIT',
    isExitAdjacent:  true,
    adjacentCells:   ['FRONT_PORCH'],
  }),

  // ── DETECTIVE TRACK — Row 7 ────────────────────────────────────────────────
  cell('DET_1', 'Detective Step 1', 1, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_2'],
  }),
  cell('DET_2', 'Detective Step 2', 2, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_1', 'DET_3'],
  }),
  cell('DET_3', 'Detective Step 3', 3, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_2', 'DET_4'],
  }),
  cell('DET_4', 'Detective Step 4', 4, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_3', 'DET_5'],
  }),
  cell('DET_5', 'Detective Step 5', 5, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_4', 'DET_6'],
  }),
  cell('DET_6', 'Detective Step 6', 6, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_5', 'DET_7'],
  }),
  cell('DET_7', 'Detective Step 7', 7, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_6', 'DET_8'],
  }),
  cell('DET_8', 'Detective Step 8', 8, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_7', 'DET_9'],
  }),
  cell('DET_9', 'Detective Step 9', 9, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_8', 'DET_10'],
  }),
  cell('DET_10', 'Detective At The Door', 10, 7, {
    cellType:      'DETECTIVE_TRACK',
    adjacentCells: ['DET_9'],
  }),
];

export const INITIAL_BOARD: Record<CellId, GridCell> = Object.fromEntries(
  BOARD_CELLS.map((c) => [c.cellId, c]),
);

export const SECRET_PASSAGE_CELLS: readonly CellId[] = [
  'SP_1', 'SP_2', 'SP_3', 'SP_4', 'SP_5',
];

export const RED_CHAIR_CELLS: readonly CellId[] = [
  'RC_1',  'RC_2',  'RC_3',  'RC_4',  'RC_5',  'RC_6',
  'RC_7',  'RC_8',  'RC_9',  'RC_10', 'RC_11', 'RC_12',
];

export const INITIAL_DETECTIVE_TRACK: DetectiveTrack = {
  currentStep: 0,
  maxSteps:    DETECTIVE_TRACK_MAX_STEPS,
  trackCells:  [
    'DET_1', 'DET_2', 'DET_3', 'DET_4', 'DET_5',
    'DET_6', 'DET_7', 'DET_8', 'DET_9', 'DET_10',
  ],
  isAtExit:    false,
};

export const CELL_COORDINATES: Record<CellId, { x: number; y: number }> = Object.fromEntries(
  BOARD_CELLS.map((c) => [c.cellId, { x: c.gridCol, y: c.gridRow }]),
);


// =============================================================================
// GRID 21x15 PROGRAMMATIC BOARD DEFINITION (Placed below static definitions)
// =============================================================================

export const GRID_21X15_TILE_SIZE = 40;

export function indexToCoord(col: number, row: number): CellId {
  const colLetter = String.fromCharCode(65 + col);
  const rowNumber = 15 - row;
  return `${colLetter}${rowNumber}`;
}

export function coordToIndex(coord: CellId): { col: number; row: number } | null {
  const m = /^([A-U])(\d+)$/.exec(coord);
  if (!m) return null;
  const col = m[1]!.charCodeAt(0) - 65;
  const row = 15 - Number(m[2]);
  return { col, row };
}

/** Twelve dining-chair start cells around the table (canonical order). */
export const GRID_21X15_DINING_CHAIR_CELLS: readonly CellId[] = [
  'J5', 'J6', 'J7', 'J8', 'J9',
  'K5', 'K9',
  'L5', 'L6', 'L7', 'L8', 'L9',
];

const DINING_CHAIR_ROTATION: Record<string, number> = {
  J5: (3 * Math.PI) / 4,
  J6: Math.PI / 2,
  J7: Math.PI / 2,
  J8: Math.PI / 2,
  J9: Math.PI / 4,
  K5: Math.PI,
  K9: 0,
  L5: (-3 * Math.PI) / 4,
  L6: -Math.PI / 2,
  L7: -Math.PI / 2,
  L8: -Math.PI / 2,
  L9: -Math.PI / 4,
};

/** Engine start squares + 3D chair meshes (same cells as `GRID_21X15_DINING_CHAIR_CELLS`). */
export const GRID_21X15_DINING_CHAIR_LAYOUT: readonly {
  readonly cellId: CellId;
  readonly rotation: number;
}[] = GRID_21X15_DINING_CHAIR_CELLS.map((cellId) => ({
  cellId,
  rotation: DINING_CHAIR_ROTATION[cellId] ?? 0,
}));

export const GRID_21X15_RED_CHAIRS: readonly CellId[] = GRID_21X15_DINING_CHAIR_CELLS;

export const GRID_21X15_DINING_CHAIR_SET: ReadonlySet<CellId> = new Set(
  GRID_21X15_DINING_CHAIR_CELLS,
);

/** Bump when start-chair cells change — stale local saves are discarded. */
export const GRID_21X15_CHAIR_LAYOUT_REVISION = 3;

/** Algebraic grid indices for a cell (preferred over stored gridCol/gridRow). */
export function gridCellCoords(cellId: CellId): { col: number; row: number } | null {
  return coordToIndex(cellId);
}

/** Five teleport nodes when `SECRET_PASSAGES` module is enabled (RFC 007). */
export const GRID_21X15_SECRET_PASSAGE_CELLS: readonly CellId[] = [
  'A15', 'U15', 'E10', 'Q10', 'K14',
] as const;

/** @deprecated Use GRID_21X15_SECRET_PASSAGE_CELLS */
export const GRID_21X15_SECRET_PASSAGES: readonly CellId[] = GRID_21X15_SECRET_PASSAGE_CELLS;

// =============================================================================
// GUTTER WALLS — edge blockers in tile gaps (cells remain playable)
// =============================================================================

/** Canonical undirected edge between two orthogonal neighbors. */
export type BoardEdgeId = `${CellId}|${CellId}`;

export function toBoardEdgeId(a: CellId, b: CellId): BoardEdgeId {
  return (a < b ? `${a}|${b}` : `${b}|${a}`) as BoardEdgeId;
}

export type GutterWallSegment =
  | {
      readonly axis: 'horizontal';
      readonly rowLow: number;
      readonly colStart: string;
      readonly colEnd: string;
    }
  | {
      readonly axis: 'vertical';
      readonly colLeft: string;
      readonly rowStart: number;
      readonly rowEnd: number;
    };

function colLetterRange(start: string, end: string): readonly string[] {
  const from = start.charCodeAt(0);
  const to = end.charCodeAt(0);
  const letters: string[] = [];
  for (let code = from; code <= to; code++) {
    letters.push(String.fromCharCode(code));
  }
  return letters;
}

export function compileGutterWallEdges(
  segments: readonly GutterWallSegment[],
): ReadonlySet<BoardEdgeId> {
  const edges = new Set<BoardEdgeId>();
  for (const seg of segments) {
    if (seg.axis === 'horizontal') {
      const rowA = seg.rowLow;
      const rowB = seg.rowLow + 1;
      for (const col of colLetterRange(seg.colStart, seg.colEnd)) {
        edges.add(toBoardEdgeId(`${col}${rowA}` as CellId, `${col}${rowB}` as CellId));
      }
    } else {
      const colRight = String.fromCharCode(seg.colLeft.charCodeAt(0) + 1);
      for (let row = seg.rowStart; row <= seg.rowEnd; row++) {
        edges.add(
          toBoardEdgeId(`${seg.colLeft}${row}` as CellId, `${colRight}${row}` as CellId),
        );
      }
    }
  }
  return edges;
}

/** Declarative gutter wall runs — compiled to edge pairs at module load. */
export const GRID_21X15_GUTTER_WALL_SEGMENTS: readonly GutterWallSegment[] = [
  { axis: 'horizontal', rowLow: 2, colStart: 'H', colEnd: 'N' },
  { axis: 'vertical', colLeft: 'G', rowStart: 5, rowEnd: 9 },
  { axis: 'horizontal', rowLow: 6, colStart: 'F', colEnd: 'G' },
  { axis: 'vertical', colLeft: 'G', rowStart: 12, rowEnd: 15 },
  { axis: 'horizontal', rowLow: 6, colStart: 'A', colEnd: 'B' },
  { axis: 'vertical', colLeft: 'N', rowStart: 5, rowEnd: 9 },
  { axis: 'vertical', colLeft: 'N', rowStart: 12, rowEnd: 15 },
  { axis: 'horizontal', rowLow: 6, colStart: 'O', colEnd: 'P' },
  { axis: 'horizontal', rowLow: 6, colStart: 'T', colEnd: 'U' },
] as const;

export const GRID_21X15_GUTTER_WALLS: ReadonlySet<BoardEdgeId> = compileGutterWallEdges(
  GRID_21X15_GUTTER_WALL_SEGMENTS,
);

export function isGutterWallEdge(a: CellId, b: CellId): boolean {
  return GRID_21X15_GUTTER_WALLS.has(toBoardEdgeId(a, b));
}

/** Sorted [cellA, cellB] pairs for rendering and GDD sync. */
export function listGutterWallEdgePairs(): readonly (readonly [CellId, CellId])[] {
  return [...GRID_21X15_GUTTER_WALLS]
    .sort()
    .map((edgeId) => {
      const sep = edgeId.indexOf('|');
      const a = edgeId.slice(0, sep) as CellId;
      const b = edgeId.slice(sep + 1) as CellId;
      return [a, b] as const;
    });
}

function isGridFurnitureObstacle(cellId: CellId, col: number, row: number): boolean {
  const isTableSquare = cellId === 'K6' || cellId === 'K7' || cellId === 'K8';
  const isStatueSquare = cellId === 'A2' || cellId === 'A3' || cellId === 'B2' || cellId === 'B3';
  const isFireplaceSquare = col >= 7 && col <= 13 && row >= 0 && row <= 2;
  const isBookshelfSquare = cellId === 'U3' || cellId === 'U4' || cellId === 'U5' || cellId === 'U6';
  const isStaircaseSquare = col >= 2 && col <= 6 && row >= 0 && row <= 1;
  const isSmallCouchSquare = cellId === 'O5' || cellId === 'O6' || cellId === 'P6';
  const isBigCouchSquare = col >= 19 && col <= 20 && row >= 2 && row <= 6;
  const isCouchSquare = isSmallCouchSquare || isBigCouchSquare;
  const isVaseSquare = cellId === 'E1';
  const isWritingTableSquare = col >= 16 && col <= 18 && row === 14;
  const isPaintingSquare = cellId === 'F6' || cellId === 'G6' || cellId === 'G5';
  const isPianoSquare = col >= 2 && col <= 4 && row >= 4 && row <= 6;

  return (
    isTableSquare ||
    isStatueSquare ||
    isFireplaceSquare ||
    isBookshelfSquare ||
    isStaircaseSquare ||
    isCouchSquare ||
    isVaseSquare ||
    isWritingTableSquare ||
    isPaintingSquare ||
    isPianoSquare
  );
}

const gridCells: GridCell[] = [];

// Generate a perfectly clean, uniform 21x15 grid of squares with Mahogany table obstacle at K8-K10
for (let r = 0; r < 15; r++) {
  for (let c = 0; c < 21; c++) {
    const cellId = indexToCoord(c, r);

    const isTableSquare    = cellId === 'K6' || cellId === 'K7' || cellId === 'K8';
    const isStatueSquare   = cellId === 'A2' || cellId === 'A3' || cellId === 'B2' || cellId === 'B3';
    const isFireplaceSquare  = (c >= 7 && c <= 13) && (r >= 0 && r <= 2); // H13-N15
    const isBookshelfSquare  = cellId === 'U3' || cellId === 'U4' || cellId === 'U5' || cellId === 'U6';
    const isStaircaseSquare  = (c >= 2 && c <= 6) && (r >= 0 && r <= 1); // C14-G15
    const isSmallCouchSquare = cellId === 'O5' || cellId === 'O6' || cellId === 'P6';
    const isBigCouchSquare   = (c >= 19 && c <= 20) && (r >= 2 && r <= 6);
    const isCouchSquare      = isSmallCouchSquare || isBigCouchSquare;
    // Vase: E1 (col 4, row 14) — single decorative urn
    const isVaseSquare         = cellId === 'E1';
    // Writing table: Q1:S1 (cols 16-18, row 14) — 3-cell writing desk
    const isWritingTableSquare = (c >= 16 && c <= 18) && r === 14;
    // Painting board: F6(col5,row9), G6(col6,row9), G5(col6,row10) — L-shaped easel
    const isPaintingSquare     = cellId === 'F6' || cellId === 'G6' || cellId === 'G5';
    // Piano & Bench: C9:E11 (cols 2-4, rows 4-6) — 3x3 squares
    const isPianoSquare        = (c >= 2 && c <= 4) && (r >= 4 && r <= 6);

    const trapRef: TrapId | null = 
      cellId === 'R11' ? 'CHANDELIER'
        : cellId === 'D3'  ? 'SUIT_OF_ARMOR'
        : cellId === 'R4'  ? 'BOOKCASE'
        : cellId === 'B15' ? 'STAIRS'
        : cellId === 'K12' ? 'FIREPLACE'
        : null;

    const isRedChair = GRID_21X15_DINING_CHAIR_SET.has(cellId);

    const cellType: GridCell['cellType'] = isRedChair
      ? 'RED_CHAIR'
      : isTableSquare
        ? 'TABLE'
        : isStatueSquare
          ? 'STATUE'
          : isFireplaceSquare
            ? 'FIREPLACE'
            : isBookshelfSquare
              ? 'BOOKSHELF'
              : isStaircaseSquare
                ? 'STAIRCASE'
                : isCouchSquare
                  ? 'COUCH'
                  : isVaseSquare
                    ? 'VASE'
                    : isWritingTableSquare
                      ? 'WRITING_TABLE'
                      : isPaintingSquare
                        ? 'PAINTING'
                        : isPianoSquare
                          ? 'PIANO'
                          : trapRef !== null
                            ? 'TRAP_ZONE'
                            : 'CORRIDOR';
    const isSecretPassage = false;
    const isExitAdjacent = false;

    const adjacentCells: CellId[] = [];
    const neighbors = [
      { c: c - 1, r },
      { c: c + 1, r },
      { c, r: r - 1 },
      { c, r: r + 1 },
    ];
    for (const n of neighbors) {
      if (n.c >= 0 && n.c < 21 && n.r >= 0 && n.r < 15) {
        const neighborId = indexToCoord(n.c, n.r);

        if (
          !isGridFurnitureObstacle(cellId, c, r) &&
          !isGridFurnitureObstacle(neighborId, n.c, n.r) &&
          !isGutterWallEdge(cellId, neighborId)
        ) {
          adjacentCells.push(neighborId);
        }
      }
    }

    gridCells.push({
      cellId,
      cellType,
      label: cellId,
      occupants: [],
      trapRef,
      isExitAdjacent,
      isRedChair,
      isSecretPassage,
      adjacentCells,
      gridCol: c,
      gridRow: r,
    });
  }
}

export const GRID_21X15_BOARD_CELLS: GridCell[] = gridCells;

export const GRID_21X15_INITIAL_BOARD: Record<CellId, GridCell> = Object.fromEntries(
  gridCells.map((c) => [c.cellId, c]),
);

/** Furniture / décor cells that block adjacency (pawns cannot enter or pass through). */
const GRID_21X15_OBSTACLE_CELL_TYPES = new Set<GridCell['cellType']>([
  'TABLE',
  'STATUE',
  'FIREPLACE',
  'BOOKSHELF',
  'STAIRCASE',
  'COUCH',
  'VASE',
  'WRITING_TABLE',
  'PAINTING',
  'PIANO',
]);

function buildGridObstacleCatalog(
  board: Readonly<Record<CellId, GridCell>>,
): Readonly<Record<string, readonly CellId[]>> {
  const catalog: Record<string, CellId[]> = {};
  for (const cell of Object.values(board)) {
    if (!GRID_21X15_OBSTACLE_CELL_TYPES.has(cell.cellType)) continue;
    const key = cell.cellType;
    (catalog[key] ??= []).push(cell.cellId);
  }
  for (const ids of Object.values(catalog)) {
    ids.sort();
  }
  return catalog;
}

/** Movement-blocking furniture on GRID_21X15 (sync with `data/gdd_board_nodes.json`). */
export const GRID_21X15_OBSTACLE_CATALOG: Readonly<Record<string, readonly CellId[]>> =
  buildGridObstacleCatalog(GRID_21X15_INITIAL_BOARD);

export const GRID_21X15_CELL_COORDINATES: Record<CellId, { x: number; y: number }> = Object.fromEntries(
  gridCells.map((c) => [c.cellId, { x: c.gridCol, y: c.gridRow }]),
);
