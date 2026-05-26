/**
 * Bookshelf2D.ts
 * Reusable HTML5 Canvas drawing routine for the 2D Map representation of the Mahogany Bookshelf.
 * Also renders the library rolling ladder on rank 4 (cell U4) extending across T4 to S4.
 */

export function drawBookshelf2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  cellId: string
): void {
  // Rich Mahogany wood color and gold borders
  ctx.fillStyle = 'hsl(24, 25%, 12%)';
  ctx.strokeStyle = 'hsl(24, 40%, 25%)';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.rect(x + 1, y + 1, ts - 2, ts - 2);
  ctx.fill();
  ctx.stroke();

  // Draw colorful book spines inside the shelves for visual density (only on the actual cabinet cells)
  if (cellId !== 'S4' && cellId !== 'T4') {
    ctx.fillStyle = 'hsl(0, 70%, 40%)'; // Crimson book
    ctx.fillRect(x + 4, y + 3, ts * 0.14, ts - 6);
    ctx.fillStyle = 'hsl(205, 75%, 45%)'; // Blue book
    ctx.fillRect(x + 4 + ts * 0.18, y + 3, ts * 0.14, ts - 6);
    ctx.fillStyle = 'hsl(45, 90%, 55%)'; // Gold book
    ctx.fillRect(x + 4 + ts * 0.36, y + 4, ts * 0.11, ts - 8);
    ctx.fillStyle = 'hsl(140, 65%, 40%)'; // Green book
    ctx.fillRect(x + 4 + ts * 0.48, y + 3, ts * 0.16, ts - 6);
    ctx.fillStyle = 'hsl(280, 60%, 45%)'; // Royal Purple book
    ctx.fillRect(x + 4 + ts * 0.66, y + 3, ts * 0.12, ts - 6);
  }

  // Render centered "BOOKS" label on the middle tile U5 (rank 5)
  if (cellId === 'U5') {
    const cx = x + ts / 2;
    const cy = y + ts / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('BOOKS', cx, cy);
  }

  // ── Render library ladder on U4 extending Westward across T4 and S4 ──
  if (cellId === 'U4') {
    // Save context for shadows/transparency
    ctx.save();

    // The ladder starts at the front of the bookshelf inside U4 (which faces West, i.e., left)
    const startX = x + ts * 0.25; 
    const centerY = y + ts / 2;
    
    // Leaning ladder length in 2D extends through T4 and into S4 (about 2.4 tiles wide)
    const ladderLength = ts * 2.2;
    const endX = startX - ladderLength;

    // Ladder rails offset from center
    const halfWidth = ts * 0.18;

    // Draw shadow under the ladder for depth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(startX, centerY - halfWidth + 2);
    ctx.lineTo(endX, centerY - halfWidth + 2);
    ctx.moveTo(startX, centerY + halfWidth + 2);
    ctx.lineTo(endX, centerY + halfWidth + 2);
    ctx.stroke();

    // Draw main mahogany ladder rails
    ctx.strokeStyle = 'hsl(20, 45%, 16%)'; // dark mahogany
    ctx.lineWidth = 2.5;

    // Upper Rail
    ctx.beginPath();
    ctx.moveTo(startX, centerY - halfWidth);
    ctx.lineTo(endX, centerY - halfWidth);
    ctx.stroke();

    // Lower Rail
    ctx.beginPath();
    ctx.moveTo(startX, centerY + halfWidth);
    ctx.lineTo(endX, centerY + halfWidth);
    ctx.stroke();

    // Draw rungs/steps across the ladder
    ctx.strokeStyle = 'hsl(20, 35%, 26%)';
    ctx.lineWidth = 1.2;
    const rungCount = 7;
    for (let i = 0; i <= rungCount; i++) {
      const rx = startX - (ladderLength * (i / rungCount));
      ctx.beginPath();
      ctx.moveTo(rx, centerY - halfWidth);
      ctx.lineTo(rx, centerY + halfWidth);
      ctx.stroke();
    }

    // Draw brass rolling rollers at start point (bookshelf attachment in U4)
    ctx.fillStyle = 'hsl(42, 60%, 48%)'; // brass gold
    ctx.beginPath();
    ctx.arc(startX, centerY - halfWidth, 2.5, 0, Math.PI * 2);
    ctx.arc(startX, centerY + halfWidth, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw rubber feet/wheels at end point (in S4)
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.rect(endX - 2, centerY - halfWidth - 1.5, 4, 3);
    ctx.rect(endX - 2, centerY + halfWidth - 1.5, 4, 3);
    ctx.fill();

    ctx.restore();
  }
}
