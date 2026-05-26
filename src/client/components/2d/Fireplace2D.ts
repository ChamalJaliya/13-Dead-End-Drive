/**
 * Fireplace2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the Gothic Fireplace.
 */

export function drawFireplace2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string
): void {
  // Gothic stone gray base
  ctx.fillStyle = 'hsl(220, 12%, 11%)';
  ctx.strokeStyle = 'hsl(220, 10%, 20%)';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // Mortar brick line patterns to provide outstanding detail
  ctx.strokeStyle = 'hsla(220, 10%, 15%, 0.45)';
  ctx.beginPath();
  // Horizontal joints
  ctx.moveTo(x + 1, y + ts / 3);
  ctx.lineTo(x + ts - 1, y + ts / 3);
  ctx.moveTo(x + 1, y + (2 * ts) / 3);
  ctx.lineTo(x + ts - 1, y + (2 * ts) / 3);
  
  // Vertical offsets
  ctx.moveTo(x + ts / 4, y + 1);
  ctx.lineTo(x + ts / 4, y + ts / 3);
  ctx.moveTo(x + (3 * ts) / 4, y + 1);
  ctx.lineTo(x + (3 * ts) / 4, y + ts / 3);

  ctx.moveTo(x + ts / 2, y + ts / 3);
  ctx.lineTo(x + ts / 2, y + (2 * ts) / 3);

  ctx.moveTo(x + ts / 4, y + (2 * ts) / 3);
  ctx.lineTo(x + ts / 4, y + ts - 1);
  ctx.moveTo(x + (3 * ts) / 4, y + (2 * ts) / 3);
  ctx.lineTo(x + (3 * ts) / 4, y + ts - 1);
  ctx.stroke();

  // Center cell K14 (Col index 10, Row index 1, Rank 14) displays fireplace name and glow
  if (cellId === 'K14') {
    const cx = x + ts / 2;
    const cy = y + ts / 2;

    // Rich heat/flame radial glow
    const flameGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, ts * 0.4);
    flameGrad.addColorStop(0, 'rgba(255, 105, 0, 0.7)');
    flameGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
    flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Bold glowing title text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'hsl(24, 95%, 65%)';
    ctx.font = 'bold 8px monospace';
    ctx.shadowColor = 'hsl(24, 95%, 50%)';
    ctx.shadowBlur = 4;
    ctx.fillText('FIREPLACE', cx, cy);
    ctx.shadowBlur = 0;
  }
}
