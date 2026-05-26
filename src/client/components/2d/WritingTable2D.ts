/**
 * WritingTable2D.ts — 2D canvas drawing for the writing desk at Q1:S1.
 * The desk spans 3 cells; each cell is drawn as part of the surface.
 */

const LABEL_CELL = 'R1'; // centre cell carries the label

export function drawWritingTable2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string,
): void {
  // Rich walnut tone
  ctx.fillStyle = 'hsl(25, 28%, 12%)';
  ctx.strokeStyle = 'hsl(25, 40%, 22%)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // Surface grain lines (horizontal)
  ctx.strokeStyle = 'hsla(25, 35%, 20%, 0.6)';
  ctx.lineWidth = 0.7;
  const pad = ts * 0.12;
  for (let i = 1; i <= 3; i++) {
    const sy = y + pad + (i * (ts - pad * 2)) / 4;
    ctx.beginPath();
    ctx.moveTo(x + pad, sy);
    ctx.lineTo(x + ts - pad, sy);
    ctx.stroke();
  }

  // Top edge highlight
  ctx.strokeStyle = 'hsl(25, 50%, 30%)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 3);
  ctx.lineTo(x + ts - 2, y + 3);
  ctx.stroke();

  if (cellId === LABEL_CELL) {
    ctx.fillStyle = 'rgba(210, 175, 110, 0.95)';
    ctx.font = `bold ${Math.max(5, ts * 0.18)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DESK', x + ts / 2, y + ts / 2);
  }
}
