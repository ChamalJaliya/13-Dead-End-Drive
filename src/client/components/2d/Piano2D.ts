/**
 * Piano2D.ts — 2D canvas drawing for the 3x3 Grand Piano & Bench obstacle (C9:E11).
 * D10 is the center cell of the 3x3 and carries the main label.
 */

const CENTER_CELL = 'D10';

export function drawPiano2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string,
): void {
  // Base tile — dark slate gloss/mahogany tone
  ctx.fillStyle = 'hsl(240, 12%, 10%)';
  ctx.strokeStyle = 'hsl(240, 20%, 20%)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  const cx = x + ts / 2;
  const cy = y + ts / 2;
  const pad = ts * 0.12;

  // Let's identify cells in the 3x3 block C9:E11:
  // Columns: C (col 2), D (col 3), E (col 4)
  // Ranks: 11 (row 4), 10 (row 5), 9 (row 6)
  
  if (cellId === 'C11' || cellId === 'D11' || cellId === 'E11') {
    // ── TOP ROW: Curved Back of Grand Piano ──
    ctx.fillStyle = 'hsl(240, 10%, 6%)';
    ctx.strokeStyle = 'hsl(35, 30%, 25%)'; // wood trim
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    if (cellId === 'C11') {
      // Top-left curved corner
      ctx.arc(cx + ts * 0.3, cy + ts * 0.3, ts * 0.5, Math.PI, Math.PI * 1.5);
      ctx.lineTo(x + ts, y);
      ctx.lineTo(x + ts, y + ts);
      ctx.lineTo(x, y + ts);
    } else if (cellId === 'D11') {
      // Top-middle: straight top edge
      ctx.rect(x, y + pad, ts, ts - pad);
    } else {
      // Top-right: piano tail curve
      ctx.moveTo(x, y + pad);
      ctx.quadraticCurveTo(cx, cy, x + ts - pad, y + ts);
      ctx.lineTo(x, y + ts);
    }
    ctx.fill();
    ctx.stroke();

    // Lid prop shadow/accent
    if (cellId === 'D11') {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)'; // gold shine
      ctx.beginPath();
      ctx.moveTo(x, y + ts * 0.4);
      ctx.lineTo(x + ts, y + ts * 0.2);
      ctx.lineTo(x + ts, y + ts * 0.8);
      ctx.lineTo(x, y + ts * 0.9);
      ctx.fill();
    }
  } 
  else if (cellId === 'C10' || cellId === CENTER_CELL || cellId === 'E10') {
    // ── MIDDLE ROW: Keyboard & Action ──
    ctx.fillStyle = 'hsl(240, 10%, 6%)';
    ctx.fillRect(x, y, ts, ts);

    if (cellId === CENTER_CELL) {
      // Render White and Black Keys (Keyboard) in the center cell
      const keyCount = 14;
      const keyW = ts / keyCount;
      const keyH = ts * 0.45;

      // Draw white keys
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < keyCount; i++) {
        ctx.fillRect(x + i * keyW, y + ts * 0.1, keyW, keyH);
        ctx.strokeRect(x + i * keyW, y + ts * 0.1, keyW, keyH);
      }

      // Draw black keys
      ctx.fillStyle = '#000000';
      const blackKeyIndexes = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
      const blackKeyW = keyW * 0.6;
      const blackKeyH = keyH * 0.65;
      blackKeyIndexes.forEach((idx) => {
        ctx.fillRect(x + (idx + 1) * keyW - blackKeyW / 2, y + ts * 0.1, blackKeyW, blackKeyH);
      });

      // Gold sheet music stand
      ctx.fillStyle = 'hsl(42, 60%, 48%)';
      ctx.fillRect(cx - ts * 0.25, y + ts * 0.7, ts * 0.5, ts * 0.08);

      // Sheet music pages
      ctx.fillStyle = '#fbf0d9';
      ctx.fillRect(cx - ts * 0.18, y + ts * 0.62, ts * 0.15, ts * 0.12);
      ctx.fillRect(cx + ts * 0.03, y + ts * 0.62, ts * 0.15, ts * 0.12);

      // Music print lines
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 0.5;
      for (let offset of [-ts * 0.12, ts * 0.09]) {
        ctx.beginPath();
        ctx.moveTo(cx + offset, y + ts * 0.66);
        ctx.lineTo(cx + offset + ts * 0.08, y + ts * 0.66);
        ctx.moveTo(cx + offset, y + ts * 0.70);
        ctx.lineTo(cx + offset + ts * 0.08, y + ts * 0.70);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = 'rgba(200, 170, 90, 0.95)';
      ctx.font = `bold ${Math.max(5, ts * 0.16)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PIANO', cx, y + ts * 0.88);
    } 
    else if (cellId === 'C10') {
      // Left side: curved rim transition
      ctx.fillStyle = 'hsl(240, 10%, 4%)';
      ctx.fillRect(x, y, ts, ts * 0.85);
      
      // Fallboard wooden rim
      ctx.fillStyle = 'hsl(28, 45%, 15%)';
      ctx.fillRect(x, y + ts * 0.85, ts, ts * 0.15);
    } 
    else {
      // E10: Right side: curved rim transition
      ctx.fillStyle = 'hsl(240, 10%, 4%)';
      ctx.fillRect(x, y, ts, ts * 0.85);

      // Fallboard wooden rim
      ctx.fillStyle = 'hsl(28, 45%, 15%)';
      ctx.fillRect(x, y + ts * 0.85, ts, ts * 0.15);
    }
  } 
  else if (cellId === 'C9' || cellId === 'D9' || cellId === 'E9') {
    // ── BOTTOM ROW: The Piano Bench ──
    ctx.fillStyle = 'hsl(240, 12%, 8%)'; // floor area behind keyboard

    if (cellId === 'D9') {
      // Middle cell has the main padded bench body
      // Bench wood legs / frame
      ctx.fillStyle = 'hsl(28, 45%, 15%)';
      ctx.fillRect(x + pad, y + pad, ts - pad * 2, ts * 0.7);

      // Tufted leather seat cushion (crimson or black leather)
      ctx.fillStyle = 'hsl(0, 45%, 16%)'; // dark crimson velvet
      ctx.strokeStyle = 'hsl(0, 50%, 25%)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.roundRect(x + pad + 2, y + pad + 2, ts - pad * 2 - 4, ts * 0.55, 3);
      ctx.fill();
      ctx.stroke();

      // Tufting details (dots)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx - ts * 0.15, y + ts * 0.35, 1.2, 0, Math.PI * 2);
      ctx.arc(cx, y + ts * 0.35, 1.2, 0, Math.PI * 2);
      ctx.arc(cx + ts * 0.15, y + ts * 0.35, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Side wings of the bench area
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'; // subtle highlight
      ctx.fillRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
    }
  }
}
