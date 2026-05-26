/**
 * boardViewport.ts — pan/zoom transform for GRID_21X15 board canvas
 */

export class BoardViewport {
  scale = 1;
  offsetX = 0;
  offsetY = 0;

  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private onChange: (() => void) | null = null;

  fitToBounds(
    worldWidth: number,
    worldHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    padding = 28,
  ): void {
    const innerW = Math.max(1, canvasWidth - padding * 2);
    const innerH = Math.max(1, canvasHeight - padding * 2);
    const sx = innerW / worldWidth;
    const sy = innerH / worldHeight;
    this.scale = Math.min(sx, sy, 2);
    this.offsetX = (canvasWidth - worldWidth * this.scale) / 2;
    this.offsetY = (canvasHeight - worldHeight * this.scale) / 2;
    this.notify();
  }

  screenToWorld(screenX: number, screenY: number): { wx: number; wy: number } {
    return {
      wx: (screenX - this.offsetX) / this.scale,
      wy: (screenY - this.offsetY) / this.scale,
    };
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }

  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  zoomAt(factor: number, screenX: number, screenY: number): void {
    const { wx, wy } = this.screenToWorld(screenX, screenY);
    this.scale = Math.min(3.5, Math.max(0.2, this.scale * factor));
    this.offsetX = screenX - wx * this.scale;
    this.offsetY = screenY - wy * this.scale;
    this.notify();
  }

  panBy(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
    this.notify();
  }

  focusWorldRect(
    worldX: number,
    worldY: number,
    worldWidth: number,
    worldHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    padding = 40,
  ): void {
    const innerW = Math.max(1, canvasWidth - padding * 2);
    const innerH = Math.max(1, canvasHeight - padding * 2);
    const sx = innerW / Math.max(1, worldWidth);
    const sy = innerH / Math.max(1, worldHeight);
    this.scale = Math.min(Math.max(sx, sy), 2.8);
    this.offsetX = (canvasWidth - worldWidth * this.scale) / 2 - worldX * this.scale;
    this.offsetY = (canvasHeight - worldHeight * this.scale) / 2 - worldY * this.scale;
    this.notify();
  }

  attach(
    canvas: HTMLCanvasElement,
    onChange: () => void,
  ): void {
    this.onChange = onChange;

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoomAt(factor, sx, sy);
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.dragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    const endDrag = (): void => {
      this.dragging = false;
      canvas.style.cursor = 'grab';
    };

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const dx = (e.clientX - this.lastPointerX) * scaleX;
      const dy = (e.clientY - this.lastPointerY) * scaleY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.panBy(dx, dy);
    });
  }

  private notify(): void {
    this.onChange?.();
  }
}
