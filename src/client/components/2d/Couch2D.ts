/**
 * Couch2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the Couches.
 * Handles both the small L-shaped corner sofa (O5/O6/P6) and
 * the big sectional sofa (T9:U13).
 */

const SMALL_COUCH = new Set(['O5', 'O6', 'P6']);
const BIG_COUCH_LABEL_CELL = 'T11'; // center-ish rank of big couch for label

export function drawCouch2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string,
): void {
  const isSmall = SMALL_COUCH.has(cellId);

  // ── Base fill — deep velvet plum ──────────────────────────────────────────
  ctx.fillStyle = isSmall ? 'hsl(280, 28%, 15%)' : 'hsl(260, 22%, 13%)';
  ctx.strokeStyle = isSmall ? 'hsl(280, 45%, 30%)' : 'hsl(260, 35%, 28%)';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // ── Cushion tufts — subtle diagonal quilting lines ────────────────────────
  ctx.strokeStyle = isSmall ? 'hsla(280, 30%, 25%, 0.6)' : 'hsla(260, 25%, 22%, 0.6)';
  ctx.lineWidth = 0.8;
  const pad = ts * 0.18;
  // Horizontal seam lines
  ctx.beginPath();
  for (let i = 1; i <= 2; i++) {
    const sy = y + pad + (i * (ts - pad * 2)) / 3;
    ctx.moveTo(x + pad, sy);
    ctx.lineTo(x + ts - pad, sy);
  }
  ctx.stroke();

  // ── Backrest edge — bright highlight along top edge ───────────────────────
  ctx.strokeStyle = isSmall ? 'hsl(280, 55%, 40%)' : 'hsl(260, 45%, 38%)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 3);
  ctx.lineTo(x + ts - 2, y + 3);
  ctx.stroke();

  // ── Label on center cells ─────────────────────────────────────────────────
  const shouldLabel = isSmall ? cellId === 'O6' : cellId === BIG_COUCH_LABEL_CELL;
  if (shouldLabel) {
    const cx = x + ts / 2;
    const cy = y + ts / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(220, 180, 255, 0.92)';
    ctx.font = `bold ${Math.max(6, ts * 0.22)}px monospace`;
    ctx.fillText(isSmall ? 'SOFA' : 'SOFA', cx, cy);
  }
}
