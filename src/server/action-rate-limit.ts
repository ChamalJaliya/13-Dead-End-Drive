/**
 * action-rate-limit.ts — per-session Colyseus message rate limit.
 */

const RATE_WINDOW_MS = 1_000;
const RATE_MAX = 20;

export class ActionRateLimit {
  private readonly timestamps = new Map<string, number[]>();

  public isLimited(sessionId: string): boolean {
    const now = Date.now();
    const hits = this.timestamps.get(sessionId) ?? [];
    const recent = hits.filter((t) => now - t < RATE_WINDOW_MS);
    recent.push(now);
    this.timestamps.set(sessionId, recent);
    return recent.length > RATE_MAX;
  }
}
