// gddTrapDeckSync.spec.ts — data/gdd_trap_deck.json matches buildDeck()

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDeck } from '../../engine/cardDeck.js';

const gddPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/gdd_trap_deck.json',
);
const gdd = JSON.parse(readFileSync(gddPath, 'utf8')) as {
  total_cards: number;
  composition_summary: {
    DETECTIVE_CARD: number;
    WILD_CARD: number;
    TRAP_CARD_single: number;
    TRAP_CARD_dual: number;
  };
  trap_deck: ReadonlyArray<{ card_id: string; pairs?: ReadonlyArray<readonly string[]> }>;
};

describe('gdd_trap_deck.json sync', () => {
  it('matches buildDeck() card type counts', () => {
    const deck = buildDeck();
    const counts = { TRAP_CARD: 0, WILD_CARD: 0, DETECTIVE_CARD: 0 };
    for (const card of deck) {
      counts[card.cardType] += 1;
    }
    expect(deck).toHaveLength(gdd.total_cards);
    expect(counts.DETECTIVE_CARD).toBe(gdd.composition_summary.DETECTIVE_CARD);
    expect(counts.WILD_CARD).toBe(gdd.composition_summary.WILD_CARD);
    expect(counts.TRAP_CARD).toBe(
      gdd.composition_summary.TRAP_CARD_single + gdd.composition_summary.TRAP_CARD_dual,
    );
  });

  it('lists ten dual-trap pairs in GDD', () => {
    const dual = gdd.trap_deck.find((e) => e.card_id === 'TRAP_DUAL');
    expect(dual?.pairs).toHaveLength(10);
  });
});
