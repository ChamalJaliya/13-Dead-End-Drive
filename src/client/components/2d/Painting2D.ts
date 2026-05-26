/**
 * Painting2D.ts — 2D canvas drawing for the L-shaped painting board / easel (F6, G6, G5).
 * G6 is the corner cell and carries the main label.
 */

const CORNER_CELL  = 'G6';

export function drawPainting2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string,
): void {
  // Base tile — dark ochre/canvas tone
  ctx.fillStyle = 'hsl(35, 22%, 11%)';
  ctx.strokeStyle = 'hsl(35, 40%, 20%)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  const cx = x + ts / 2;
  const cy = y + ts / 2;
  const pad = ts * 0.14;
  const innerW = ts - pad * 2;
  const innerH = ts - pad * 2;

  if (cellId === 'G5') {
    // ── Top cell: render the framed canvas painting ──────────────────────
    // Gold outer frame
    ctx.fillStyle = 'hsl(42, 65%, 40%)';
    ctx.fillRect(x + pad - 3, y + pad - 3, innerW + 6, innerH + 6);
    // Canvas background (cream)
    ctx.fillStyle = 'hsl(42, 35%, 78%)';
    ctx.fillRect(x + pad, y + pad, innerW, innerH);
    // Abstract paint strokes
    const colors = ['hsl(200, 55%, 45%)', 'hsl(15, 70%, 52%)', 'hsl(100, 40%, 38%)', 'hsl(280, 50%, 52%)'];
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(
        x + pad + innerW * (0.2 + i * 0.18),
        y + pad + innerH * (0.25 + (i % 2) * 0.4),
        innerW * 0.14,
        innerH * 0.20,
        (i * 0.6),
        0, Math.PI * 2,
      );
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  } else if (cellId === CORNER_CELL) {
    // ── Corner/base cell: easel legs crossing ─────────────────────────────
    ctx.strokeStyle = 'hsl(28, 55%, 32%)';
    ctx.lineWidth = 2.5;
    // Left leg
    ctx.beginPath();
    ctx.moveTo(x + pad, y + ts - pad);
    ctx.lineTo(cx - ts * 0.06, y + pad);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(x + ts - pad, y + ts - pad);
    ctx.lineTo(cx + ts * 0.06, y + pad);
    ctx.stroke();
    // Cross bar
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + pad * 1.4, y + ts * 0.55);
    ctx.lineTo(x + ts - pad * 1.4, y + ts * 0.55);
    ctx.stroke();
    // Label
    ctx.fillStyle = 'rgba(200, 160, 80, 0.95)';
    ctx.font = `bold ${Math.max(5, ts * 0.16)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EASEL', cx, y + ts - pad * 0.8);
  } else {
    // F6 — side base / paint table
    ctx.fillStyle = 'hsl(28, 40%, 18%)';
    ctx.fillRect(x + pad, y + pad, innerW, innerH * 0.55);
    // Paint palette circles
    const palColors = ['hsl(0,70%,52%)', 'hsl(200,70%,52%)', 'hsl(60,80%,52%)', 'hsl(280,60%,52%)'];
    palColors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x + pad + innerW * (0.2 + i * 0.22), y + pad + innerH * 0.72, ts * 0.06, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }
}
