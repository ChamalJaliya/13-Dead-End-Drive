/**
 * GameBoard.ts
 * Canvas view engine — GRID_21X15 mansion board (and FIXTURE graph for tests).
 */

import type { GameState } from '../../types/game-state.js';
import type { CellId, CharacterId, TrapId } from '../../types/enums.js';
import type { GridCell } from '../../types/entities.js';
import {
  CELL_COORDINATES,
  GRID_21X15_DINING_CHAIR_CELLS,
  GRID_21X15_GUTTER_WALLS,
} from '../../engine/boardDefinition.js';

const GRID_DINING_CHAIR_SET = new Set<string>(GRID_21X15_DINING_CHAIR_CELLS);
import {
  TILE_SIZE,
  boardWorldBounds,
  cellGridCoord,
  cellPixelCenter,
  cellsForRender,
  findCellAtWorld,
  secretPassageCellIds,
  tileSizeForState,
} from '../boardCoordinates.js';
import { BoardViewport } from '../boardViewport.js';
import { updateAnimation, type AnimationState } from '../physics/kinematicsEngine.js';
import { getTrapCinematic } from '../cinematics/trapCinematics.js';
import { drawDiningTable2D } from './2d/DiningTable2D.js';
import { drawDiningChair2D } from './2d/DiningChair2D.js';
import { drawStatue2D } from './2d/Statue2D.js';
import { drawFireplace2D } from './2d/Fireplace2D.js';
import { drawBookshelf2D } from './2d/Bookshelf2D.js';
import { drawStaircase2D } from './2d/Staircase2D.js';
import { drawCouch2D } from './2d/Couch2D.js';
import { drawVase2D } from './2d/Vase2D.js';
import { drawWritingTable2D } from './2d/WritingTable2D.js';
import { drawPainting2D } from './2d/Painting2D.js';
import { drawPiano2D } from './2d/Piano2D.js';

export { TILE_SIZE, CELL_COORDINATES };

export interface StateSyncPayload {
  readonly gameState: GameState;
  readonly privateHand: unknown[];
}

interface ImpactParticle {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly life: number;
  readonly hue: number;
}

function paintCellTile(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cell: GridCell,
  x: number,
  y: number,
  ts: number,
  highlightCells: readonly CellId[],
  prohibitedCells: readonly CellId[],
  pulsePhase: number,
  pawnPickCells: readonly CellId[] = [],
): void {
  if (cell.cellType === 'TABLE') {
    drawDiningTable2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'STATUE') {
    drawStatue2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'FIREPLACE') {
    drawFireplace2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'BOOKSHELF') {
    drawBookshelf2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'STAIRCASE') {
    drawStaircase2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'COUCH') {
    drawCouch2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'VASE') {
    drawVase2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'WRITING_TABLE') {
    drawWritingTable2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'PAINTING') {
    drawPainting2D(ctx, x, y, ts, cell.cellId);
    return;
  }
  if (cell.cellType === 'PIANO') {
    drawPiano2D(ctx, x, y, ts, cell.cellId);
    return;
  }

  let tileColor = 'hsl(220, 12%, 14%)';
  let borderColor = 'hsl(220, 15%, 22%)';

  const isGridVersion = state.boardVersion === 'GRID_21X15';

  if (
    cell.cellType === 'CORRIDOR' ||
    (isGridVersion && (cell.cellType === 'RED_CHAIR' || cell.isRedChair))
  ) {
    tileColor = isGridVersion ? 'hsl(220, 22%, 10%)' : 'hsl(220, 8%, 18%)';
    borderColor = isGridVersion ? 'hsl(220, 25%, 16%)' : 'hsl(220, 15%, 22%)';
  } else if (cell.cellType === 'SECRET_PASSAGE') {
    tileColor = 'hsl(280, 50%, 13%)';
    borderColor = 'hsl(280, 75%, 45%)';
  } else if (
    (cell.cellType === 'RED_CHAIR' || cell.isRedChair) &&
    !isGridVersion
  ) {
    tileColor = 'hsl(0, 55%, 13%)';
    borderColor = 'hsl(0, 80%, 45%)';
  } else if (cell.cellType === 'EXIT') {
    tileColor = 'hsl(145, 60%, 10%)';
    borderColor = 'hsl(145, 80%, 40%)';
  } else if (cell.cellType === 'THRESHOLD') {
    tileColor = 'hsl(120, 35%, 10%)';
    borderColor = 'hsl(120, 55%, 30%)';
  } else if (cell.cellType === 'TRAP_DRAW') {
    tileColor = 'hsl(35, 45%, 12%)';
    borderColor = 'hsl(35, 70%, 40%)';
  } else if (cell.cellType === 'DETECTIVE_TRACK') {
    tileColor = 'hsl(220, 15%, 15%)';
    borderColor = 'hsl(220, 20%, 25%)';
  } else if (cell.cellType === 'TRAP_ZONE') {
    const trapId = cell.trapRef;
    const isReady = trapId ? state.traps[trapId]?.state === 'READY' : false;
    tileColor = isReady ? 'hsl(0, 60%, 12%)' : 'hsl(220, 15%, 14%)';
    borderColor = isReady ? 'hsl(0, 85%, 45%)' : 'hsl(220, 20%, 24%)';
  }

  ctx.fillStyle = tileColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isGridVersion ? 1.0 : 1.5;

  const isHighlighted = highlightCells.includes(cell.cellId);
  const isProhibited = prohibitedCells.includes(cell.cellId);
  const isPendingTrap = state.pendingTrapCell === cell.cellId;

  ctx.beginPath();
  if (isGridVersion && cell.cellType === 'CORRIDOR') {
    ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  } else {
    ctx.rect(x + 2, y + 2, ts - 4, ts - 4);
  }
  ctx.fill();
  ctx.stroke();

  const isPawnPick = pawnPickCells.includes(cell.cellId);
  if (isPawnPick) {
    const gold = 0.45 + Math.sin(pulsePhase * 0.9) * 0.2;
    ctx.strokeStyle = `hsla(45, 100%, 58%, ${gold})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'hsla(45, 100%, 50%, 0.7)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(x, y, ts, ts);
    ctx.shadowBlur = 0;
  }

  if (isProhibited) {
    const pulse = 0.5 + Math.sin(pulsePhase * 1.3) * 0.2;
    ctx.strokeStyle = `hsla(0, 90%, 52%, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
    ctx.setLineDash([]);
    ctx.strokeStyle = `hsla(0, 85%, 40%, ${pulse * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + ts - 4, y + ts - 4);
    ctx.moveTo(x + ts - 4, y + 4);
    ctx.lineTo(x + 4, y + ts - 4);
    ctx.stroke();
  }

  if (isHighlighted && !isProhibited) {
    const pulse = 0.35 + Math.sin(pulsePhase) * 0.15;
    ctx.strokeStyle = `hsla(195, 95%, 60%, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'hsla(195, 95%, 55%, 0.8)';
    ctx.shadowBlur = 12;
    ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
    ctx.shadowBlur = 0;
  }

  if (isPendingTrap) {
    const trapPulse = 0.5 + Math.sin(pulsePhase * 1.5) * 0.25;
    ctx.strokeStyle = `hsla(0, 90%, 55%, ${trapPulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, ts, ts);
  }

  const cx = x + ts / 2;
  const cy = y + ts / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (cell.cellType === 'SECRET_PASSAGE') {
    ctx.fillStyle = 'hsl(280, 80%, 75%)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('🌀', cx, cy);
  } else if (
    (cell.cellType === 'RED_CHAIR' || cell.isRedChair) &&
    !isGridVersion
  ) {
    ctx.fillStyle = 'hsl(0, 85%, 65%)';
    ctx.font = '12px sans-serif';
    ctx.fillText('🪑', cx, cy);
  } else if (cell.cellType === 'EXIT') {
    ctx.fillStyle = 'hsl(145, 90%, 65%)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('EXIT', cx, cy);
  } else if (cell.cellType === 'THRESHOLD') {
    ctx.fillStyle = 'hsl(120, 70%, 60%)';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('DOOR', cx, cy);
  } else if (cell.cellType === 'TRAP_DRAW') {
    ctx.fillStyle = 'hsl(35, 90%, 60%)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('🃏', cx, cy);
  } else if (cell.cellType === 'TRAP_ZONE') {
    const trapId = cell.trapRef;
    const isReady = trapId ? state.traps[trapId]?.state === 'READY' : false;
    ctx.fillStyle = isReady ? 'hsl(0, 95%, 65%)' : 'hsl(220, 8%, 50%)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('☠️', cx, cy);
  } else if (cell.cellType === 'DETECTIVE_TRACK') {
    ctx.fillStyle = 'hsl(220, 10%, 80%)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(cell.cellId.replace('DET_', 'S-'), cx, cy);
  }

  if (state.boardVersion === 'GRID_21X15' && GRID_DINING_CHAIR_SET.has(cell.cellId)) {
    drawDiningChair2D(ctx, x, y, ts);
  }
}

function drawGutterWalls2D(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  ts: number,
): void {
  if (state.boardVersion !== 'GRID_21X15') return;

  ctx.save();
  ctx.strokeStyle = 'hsl(30, 18%, 32%)';
  ctx.lineWidth = Math.max(4, ts * 0.14);
  ctx.lineCap = 'square';

  for (const edgeId of GRID_21X15_GUTTER_WALLS) {
    const sep = edgeId.indexOf('|');
    const cellA = edgeId.slice(0, sep) as CellId;
    const cellB = edgeId.slice(sep + 1) as CellId;
    const fromCoord = cellGridCoord(state, cellA);
    const toCoord = cellGridCoord(state, cellB);
    if (!fromCoord || !toCoord) continue;

    const x1 = fromCoord.x * ts + ts / 2;
    const y1 = fromCoord.y * ts + ts / 2;
    const x2 = toCoord.x * ts + ts / 2;
    const y2 = toCoord.y * ts + ts / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  selectedCharId: CharacterId | null = null,
  highlightCells: readonly CellId[] = [],
  prohibitedCells: readonly CellId[] = [],
  particles: readonly ImpactParticle[] = [],
  pulsePhase = 0,
  pawnPickCells: readonly CellId[] = [],
): void {
  const canvasWidth = ctx.canvas?.width ?? 550;
  const canvasHeight = ctx.canvas?.height ?? 440;
  const ts = tileSizeForState(state);
  const isGridVersion = state.boardVersion === 'GRID_21X15';

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Deep premium background gradient
  const bgGrad = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    canvasWidth * 0.1,
    canvasWidth / 2,
    canvasHeight / 2,
    canvasWidth * 0.75,
  );
  bgGrad.addColorStop(0, 'hsl(220, 25%, 8%)');
  bgGrad.addColorStop(1, 'hsl(220, 30%, 3%)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw coordinate headers for the GRID_21X15 chess algebraic notation
  if (isGridVersion) {
    ctx.fillStyle = 'hsla(220, 20%, 65%, 0.6)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Files (Columns A to U)
    for (let c = 0; c < 21; c++) {
      const label = String.fromCharCode(65 + c);
      const cx = c * ts + ts / 2;
      ctx.fillText(label, cx, -14);
      ctx.fillText(label, cx, 15 * ts + 8);
    }

    // Ranks (Rows 1 to 15)
    ctx.textAlign = 'right';
    for (let r = 0; r < 15; r++) {
      const label = (15 - r).toString();
      const cy = r * ts + ts / 2;
      ctx.fillText(label, -14, cy);
      ctx.textAlign = 'left';
      ctx.fillText(label, 21 * ts + 14, cy);
      ctx.textAlign = 'right';
    }
  }

  // Draw legacy non-grid borders/adjacencies
  if (!isGridVersion) {
    ctx.strokeStyle = 'hsl(220, 20%, 15%)';
    ctx.lineWidth = 2;
    for (const cell of Object.values(state.board)) {
      const fromCoord = cellGridCoord(state, cell.cellId);
      if (!fromCoord) continue;
      for (const adjCellId of cell.adjacentCells) {
        const toCoord = cellGridCoord(state, adjCellId);
        if (!toCoord) continue;
        if (cell.isSecretPassage && state.board[adjCellId]?.isSecretPassage) continue;
        ctx.beginPath();
        ctx.moveTo(fromCoord.x * ts + ts / 2, fromCoord.y * ts + ts / 2);
        ctx.lineTo(toCoord.x * ts + ts / 2, toCoord.y * ts + ts / 2);
        ctx.stroke();
      }
    }
    const passages = secretPassageCellIds(state);
    ctx.strokeStyle = 'rgba(150, 50, 220, 0.25)';
    ctx.lineWidth = 1.5;
    if (ctx.setLineDash) ctx.setLineDash([4, 4]);
    for (let i = 0; i < passages.length; i++) {
      const fromCoord = cellGridCoord(state, passages[i]!);
      if (!fromCoord) continue;
      for (let j = i + 1; j < passages.length; j++) {
        const toCoord = cellGridCoord(state, passages[j]!);
        if (!toCoord) continue;
        ctx.beginPath();
        ctx.moveTo(fromCoord.x * ts + ts / 2, fromCoord.y * ts + ts / 2);
        ctx.lineTo(toCoord.x * ts + ts / 2, toCoord.y * ts + ts / 2);
        ctx.stroke();
      }
    }
    if (ctx.setLineDash) ctx.setLineDash([]);
  }

  // Draw all cells
  for (const cell of cellsForRender(state)) {
    const coord = cellGridCoord(state, cell.cellId);
    if (!coord) continue;
    paintCellTile(
      ctx,
      state,
      cell,
      coord.x * ts,
      coord.y * ts,
      ts,
      highlightCells,
      prohibitedCells,
      pulsePhase,
      pawnPickCells,
    );
  }

  drawGutterWalls2D(ctx, state, ts);

  // Draw detective
  const detectiveStep = state.detectivePosition.currentStep;
  const detCellId = state.detectivePosition.trackCells[detectiveStep];
  if (detCellId) {
    const center = cellPixelCenter(state, detCellId);
    if (center) {
      ctx.fillStyle = 'hsl(45, 100%, 55%)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕵️', center.x, center.y);
    }
  }

  // Draw characters (pawns)
  for (const [charId, char] of Object.entries(state.characters)) {
      const center = cellPixelCenter(state, char.position);
      if (!center) continue;

      const { x: cx, y: cy } = center;
      const radius = ts / 3;
      const showName =
        char.status === 'ALIVE' &&
        (selectedCharId === charId ||
          pawnPickCells.includes(char.position) ||
          highlightCells.includes(char.position));

      if (char.status === 'ALIVE') {
        const isSelected = selectedCharId === charId;
        if (isSelected) {
          ctx.shadowColor = 'hsl(180, 100%, 50%)';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = 'hsl(180, 100%, 55%)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        if (char.isPortraitHeir) {
          ctx.fillStyle = 'hsl(45, 100%, 65%)';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('👑', cx, cy - radius - 5);
        }

        ctx.shadowColor = char.pawnColor || 'hsl(0, 100%, 50%)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = char.pawnColor || 'hsl(0, 100%, 50%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, char.pawnColor || 'hsl(0, 100%, 50%)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'hsl(220, 25%, 5%)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(charId.substring(0, 2), cx, cy);

        if (showName) {
          ctx.fillStyle = 'hsla(0, 0%, 100%, 0.9)';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText(char.displayName, cx, cy + radius + 8);
        }
      } else {
        ctx.fillStyle = 'hsl(220, 5%, 22%)';
        ctx.strokeStyle = 'hsl(220, 5%, 35%)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - radius + 5, cy - radius + 5);
        ctx.lineTo(cx + radius - 5, cy + radius - 5);
        ctx.moveTo(cx + radius - 5, cy - radius + 5);
        ctx.lineTo(cx - radius + 5, cy + radius - 5);
        ctx.stroke();
      }
  }

  // Draw impact particles
  for (const p of particles) {
    const alpha = Math.max(0, p.life);
    ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2 + alpha * 3, 0, Math.PI * 2);
    ctx.fill();
  }

}

const requestFrame = (cb: FrameRequestCallback): number => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(cb);
  }
  return setTimeout(cb, 16) as unknown as number;
};

const cancelFrame = (id: number): void => {
  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(id);
    return;
  }
  clearTimeout(id);
};

export class GameBoardView {
  private currentGameState: GameState | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private selectedCharacterId: CharacterId | null = null;
  private highlightCells: CellId[] = [];
  private prohibitedCells: CellId[] = [];
  private pawnPickCells: CellId[] = [];
  private clickCallback: ((cellId: CellId, characterOnCell: CharacterId | null) => void) | null = null;
  private particles: ImpactParticle[] = [];
  private pulsePhase = 0;
  private pulseLoopId: number | null = null;
  private lastImpactHue = 0;
  private readonly viewport = new BoardViewport();
  private viewportAttached = false;

  public viewShake = 0;
  public eliminationFlash = 0;

  public triggerEliminationFlash(): void {
    this.viewShake = Math.max(this.viewShake, 14);
    this.eliminationFlash = 1;
    this.scheduleRedraw();
    window.setTimeout(() => {
      this.eliminationFlash = Math.max(0, this.eliminationFlash - 0.15);
      if (this.eliminationFlash > 0) {
        this.scheduleRedraw();
      }
    }, 300);
  }
  public activeAnimation: (AnimationState & {
    startPos: { x: number; y: number };
    targetPos: { x: number; y: number };
    g: number;
    threshold: number;
  }) | null = null;
  public cinematicPlaying: string | null = null;

  constructor(ctx?: CanvasRenderingContext2D) {
    this.ctx = ctx || null;
  }

  public setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.attachInteraction();
  }

  public fitBoardToCanvas(): void {
    if (!this.ctx?.canvas || !this.currentGameState) return;
    const world = boardWorldBounds(this.currentGameState);
    this.viewport.fitToBounds(
      world.width,
      world.height,
      this.ctx.canvas.width,
      this.ctx.canvas.height,
    );
  }

  public zoomBoard(factor: number): void {
    if (!this.ctx?.canvas) return;
    const c = this.ctx.canvas;
    this.viewport.zoomAt(factor, c.width / 2, c.height / 2);
    this.scheduleRedraw();
  }

  public focusOnCells(cellIds: readonly CellId[]): void {
    if (!this.ctx?.canvas || !this.currentGameState || cellIds.length === 0) return;
    const ts = tileSizeForState(this.currentGameState);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of cellIds) {
      const coord = cellGridCoord(this.currentGameState, id);
      if (!coord) continue;
      const px = coord.x * ts;
      const py = coord.y * ts;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px + ts);
      maxY = Math.max(maxY, py + ts);
    }
    if (!Number.isFinite(minX)) return;
    this.viewport.focusWorldRect(
      minX,
      minY,
      maxX - minX,
      maxY - minY,
      this.ctx.canvas.width,
      this.ctx.canvas.height,
    );
    this.scheduleRedraw();
  }

  public getGameState(): GameState | null {
    return this.currentGameState;
  }

  public setSelectedCharacter(charId: CharacterId | null): void {
    this.selectedCharacterId = charId;
    this.scheduleRedraw();
    this.ensurePulseLoop();
  }

  public setHighlightCells(cells: readonly CellId[]): void {
    this.highlightCells = [...cells];
    this.scheduleRedraw();
    this.ensurePulseLoop();
  }

  public setProhibitedCells(cells: readonly CellId[]): void {
    this.prohibitedCells = [...cells];
    this.scheduleRedraw();
    this.ensurePulseLoop();
  }

  public setPawnPickCells(cells: readonly CellId[]): void {
    this.pawnPickCells = [...cells];
    this.scheduleRedraw();
    this.ensurePulseLoop();
  }

  private ensurePulseLoop(): void {
    if (this.pulseLoopId !== null) return;
    const tick = (): void => {
      this.pulsePhase += 0.12;
      if (
        this.highlightCells.length > 0 ||
        this.prohibitedCells.length > 0 ||
        this.pawnPickCells.length > 0 ||
        this.currentGameState?.pendingTrapCell
      ) {
        this.scheduleRedraw();
        this.pulseLoopId = requestFrame(tick);
      } else {
        this.pulseLoopId = null;
      }
    };
    this.pulseLoopId = requestFrame(tick);
  }

  private spawnImpactParticles(x: number, y: number, hue = 0): void {
    const burst: ImpactParticle[] = [];
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const speed = 2 + Math.random() * 5;
      burst.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        hue: hue + (Math.random() * 20 - 10),
      });
    }
    this.particles = [...this.particles, ...burst];
    this.runParticleLoop();
  }

  private runParticleLoop(): void {
    const loop = (): void => {
      let alive = false;
      this.particles = this.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          life: p.life - 0.04,
        }))
        .filter((p) => {
          if (p.life > 0) alive = true;
          return p.life > 0;
        });

      this.scheduleRedraw();
      if (alive) requestFrame(loop);
    };
    requestFrame(loop);
  }

  public onClick(callback: (cellId: CellId, characterOnCell: CharacterId | null) => void): void {
    this.clickCallback = callback;
  }

  private attachInteraction(): void {
    if (!this.ctx?.canvas) return;
    const canvas = this.ctx.canvas;

    if (!this.viewportAttached) {
      this.viewport.attach(canvas, () => this.scheduleRedraw());
      canvas.style.cursor = 'grab';
      this.viewportAttached = true;
    }

    canvas.addEventListener('click', (e) => {
      if (!this.currentGameState || !this.clickCallback) return;

      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;

      const { wx, wy } = this.currentGameState.boardVersion === 'GRID_21X15'
        ? this.viewport.screenToWorld(sx, sy)
        : { wx: sx, wy: sy };

      const matchedId = findCellAtWorld(this.currentGameState, wx, wy);
      if (!matchedId) return;

      const characterOnCell = Object.entries(this.currentGameState.characters).find(
        ([, char]) => char.position === matchedId && char.status === 'ALIVE',
      )?.[0] as CharacterId | undefined;

      this.clickCallback(matchedId, characterOnCell || null);
    });
  }

  public onStateSync(payload: StateSyncPayload): void {
    const prevState = this.currentGameState;
    this.currentGameState = payload.gameState;

    if (this.currentGameState.boardVersion === 'GRID_21X15') {
      this.fitBoardToCanvas();
    }

    if (prevState && payload.gameState) {
      for (const [trapId, nextTrap] of Object.entries(payload.gameState.traps)) {
        const prevTrap = prevState.traps[trapId as TrapId];
        if (prevTrap && prevTrap.state === 'READY' && nextTrap.state === 'SPENT') {
          const cinematic = getTrapCinematic(trapId as TrapId);
          this.cinematicPlaying = trapId;
          this.lastImpactHue = cinematic.particleHue;
          const targetCell = nextTrap.targetCells[0];
          if (targetCell) {
            const center = cellPixelCenter(payload.gameState, targetCell);
            if (center) {
              const fallG = cinematic.fallStyle === 'burst' ? 800 : cinematic.fallStyle === 'slide' ? 600 : 1200;
              this.activeAnimation = {
                startTime:  Date.now(),
                duration:   cinematic.fallStyle === 'burst' ? 450 : 650,
                startPos:   {
                  x: center.x,
                  y: cinematic.fallStyle === 'burst' ? center.y : 0,
                },
                targetPos:  center,
                g:          fallG,
                threshold:  8,
                currentPos: { x: center.x, y: 0 },
                isImpact:   false,
                isFinished: false,
              };
              this.runPhysicsLoop();
            }
          }
          break;
        }
      }
    }

    this.scheduleRedraw();
  }

  private runPhysicsLoop(): void {
    const loop = (): void => {
      if (!this.activeAnimation) return;

      const elapsed = Date.now() - this.activeAnimation.startTime;
      const nextAnim = updateAnimation(
        elapsed,
        this.activeAnimation,
        this.activeAnimation.startPos,
        this.activeAnimation.targetPos,
        this.activeAnimation.g,
        this.activeAnimation.threshold,
      );

      this.activeAnimation = { ...this.activeAnimation, ...nextAnim };

      if (nextAnim.isImpact) {
        this.viewShake = 14;
        this.spawnImpactParticles(
          this.activeAnimation.currentPos.x,
          this.activeAnimation.currentPos.y,
          this.lastImpactHue,
        );
      }

      this.scheduleRedraw();

      if (nextAnim.isFinished) {
        this.activeAnimation = null;
        this.cinematicPlaying = null;
      } else {
        requestFrame(loop);
      }
    };

    requestFrame(loop);
  }

  public scheduleRedraw(): void {
    if (this.animationFrameId !== null) {
      cancelFrame(this.animationFrameId);
    }

    this.animationFrameId = requestFrame(() => {
      if (this.ctx && this.currentGameState) {
        const useViewport = this.currentGameState.boardVersion === 'GRID_21X15';

        if (this.viewShake > 0) {
          this.ctx.save();
          const dx = (Math.random() - 0.5) * this.viewShake;
          const dy = (Math.random() - 0.5) * this.viewShake;
          this.ctx.translate(dx, dy);
        }

        if (useViewport) {
          this.ctx.save();
          this.viewport.applyTransform(this.ctx);
        }

        renderBoard(
          this.ctx,
          this.currentGameState,
          this.selectedCharacterId,
          this.highlightCells,
          this.prohibitedCells,
          this.particles,
          this.pulsePhase,
          this.pawnPickCells,
        );

        if (this.activeAnimation) {
          const hue = this.lastImpactHue;
          this.ctx.fillStyle = `hsl(${hue}, 95%, 58%)`;
          this.ctx.strokeStyle = `hsl(${hue}, 100%, 85%)`;
          this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          this.ctx.shadowBlur = 14;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(
            this.activeAnimation.currentPos.x,
            this.activeAnimation.currentPos.y,
            9,
            0,
            Math.PI * 2,
          );
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }

        if (this.eliminationFlash > 0 && this.ctx.canvas) {
          this.ctx.save();
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.ctx.fillStyle = `rgba(180, 20, 30, ${this.eliminationFlash * 0.22})`;
          this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
          this.ctx.restore();
          this.eliminationFlash = Math.max(0, this.eliminationFlash - 0.12);
          if (this.eliminationFlash > 0) {
            requestFrame(() => this.scheduleRedraw());
          }
        }

        if (useViewport) {
          this.ctx.restore();
        }

        if (this.viewShake > 0) {
          this.ctx.restore();
          this.viewShake = Math.max(0, this.viewShake - 1);
          if (this.viewShake > 0) this.scheduleRedraw();
        }
      }
      this.animationFrameId = null;
    });
  }
}
