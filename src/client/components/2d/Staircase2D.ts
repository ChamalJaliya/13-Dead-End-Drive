/**
 * Staircase2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the Grand Staircase.
 */

export function drawStaircase2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string
): void {
  // Elegant oak wood tones and dark steps
  ctx.fillStyle = 'hsl(30, 20%, 14%)';
  ctx.strokeStyle = 'hsl(30, 30%, 25%)';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // Draw steps/treads (parallel lines representing stairs going up towards the back)
  ctx.strokeStyle = 'hsla(30, 15%, 20%, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 1; i <= 4; i++) {
    const stepY = y + (i * ts) / 5;
    ctx.moveTo(x + 2, stepY);
    ctx.lineTo(x + ts - 2, stepY);
  }
  ctx.stroke();

  // Render centered "STAIRS" label on E14 (center rank)
  if (cellId === 'E14') {
    const cx = x + ts / 2;
    const cy = y + ts / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'hsl(45, 95%, 55%)';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('STAIRS', cx, cy);
  }
}
