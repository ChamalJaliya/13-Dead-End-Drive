/**
 * DiningTable2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the Mahogany Dining Table.
 */

export function drawDiningTable2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string
): void {
  // Rich Mahogany wood color and gold-brass borders
  ctx.fillStyle = 'hsl(24, 30%, 10%)';
  ctx.strokeStyle = 'hsl(36, 45%, 32%)';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // Render centered TABLE label on the middle tile (K7)
  if (cellId === 'K7') {
    const cx = x + ts / 2;
    const cy = y + ts / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'hsl(36, 60%, 55%)';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('TABLE', cx, cy);
  }
}
