/**
 * Vase2D.ts — 2D canvas drawing for the decorative urn/vase at E1.
 */
export function drawVase2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  _cellId: string,
): void {
  // Base tile — deep forest green
  ctx.fillStyle = 'hsl(150, 20%, 10%)';
  ctx.strokeStyle = 'hsl(150, 35%, 22%)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  const cx = x + ts / 2;
  const cy = y + ts / 2;
  const r  = ts * 0.30;

  // Pedestal (small rect at bottom)
  ctx.fillStyle = 'hsl(40, 20%, 28%)';
  ctx.fillRect(cx - r * 0.7, cy + r * 0.55, r * 1.4, r * 0.28);

  // Vase body (oval)
  ctx.fillStyle = 'hsl(40, 30%, 52%)';
  ctx.strokeStyle = 'hsl(40, 50%, 70%)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.1, r * 0.56, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Neck
  ctx.fillStyle = 'hsl(40, 28%, 46%)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.62, r * 0.22, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rim / lip
  ctx.fillStyle = 'hsl(40, 45%, 62%)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.78, r * 0.32, r * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight shimmer
  ctx.fillStyle = 'rgba(255, 240, 180, 0.28)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.18, cy - r * 0.05, r * 0.14, r * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = 'rgba(200, 170, 100, 0.9)';
  ctx.font = `bold ${Math.max(5, ts * 0.18)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VASE', cx, cy + r * 1.1);
}
