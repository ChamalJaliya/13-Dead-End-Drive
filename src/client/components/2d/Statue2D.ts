/**
 * Statue2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the Suit of Armor Statue.
 */

export function drawStatue2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string
): void {
  // Polished cold iron/steel metallic background
  ctx.fillStyle = 'hsl(210, 10%, 20%)';
  ctx.strokeStyle = 'hsl(210, 10%, 45%)';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // Highlight border for premium steel look
  ctx.strokeStyle = 'hsl(210, 10%, 30%)';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(x + 3, y + 3, ts - 6, ts - 6);

  // Render centered "STATUE" label and 🛡️ icon on one of the cells (let's use A3 as the label anchor)
  if (cellId === 'A3') {
    // We draw the label centered at the midpoint of A3 (x + ts/2) and A3's right edge
    const cx = x + ts; // This places it exactly at the center of the 2x2 block's column boundary
    const cy = y + ts; // This places it exactly at the center of the 2x2 block's row boundary

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow for depth
    ctx.fillStyle = 'black';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('🛡️ STATUE', cx + 1, cy + 1);

    // Foreground text
    ctx.fillStyle = 'hsl(210, 20%, 75%)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('🛡️ STATUE', cx, cy);
    ctx.restore();
  }
}
