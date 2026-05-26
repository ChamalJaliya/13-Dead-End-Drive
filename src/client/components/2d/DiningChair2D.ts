/**
 * DiningChair2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the dining chairs.
 */

export function drawDiningChair2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number
): void {
  const cx = x + ts / 2;
  const cy = y + ts / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'hsla(36, 65%, 52%, 0.35)'; // Subtle brass gold
  ctx.font = '10px sans-serif';
  ctx.fillText('🪑', cx, cy);
}
