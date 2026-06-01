/**
 * supabase-idempotency.store.ts — persisted idempotency keys per game (Phase 3.6).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameId } from '../types/enums.js';
import type { IdempotencyStore } from '../network/eventRouter.js';
import { InMemoryIdempotencyStore } from '../network/eventRouter.js';

export class SupabaseIdempotencyStore implements IdempotencyStore {
  private readonly memory = new InMemoryIdempotencyStore();

  public constructor(private readonly supabase: SupabaseClient | null) {}

  public hasProcessed(gameId: GameId, eventId: string): boolean {
    return this.memory.hasProcessed(gameId, eventId);
  }

  public markProcessed(gameId: GameId, eventId: string): void {
    this.memory.markProcessed(gameId, eventId);
    if (!this.supabase) return;
    void (async () => {
      try {
        await this.supabase!.from('processed_events').upsert({
          game_id: gameId,
          event_id: eventId,
        });
      } catch {
        /* table may not exist in dev */
      }
    })();
  }

  public async hydrate(gameId: GameId): Promise<void> {
    if (!this.supabase) return;
    const { data } = await this.supabase
      .from('processed_events')
      .select('event_id')
      .eq('game_id', gameId);
    if (!data) return;
    for (const row of data) {
      const eventId = (row as { event_id: string }).event_id;
      this.memory.markProcessed(gameId, eventId);
    }
  }
}
