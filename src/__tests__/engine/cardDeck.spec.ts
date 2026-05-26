// cardDeck.spec.ts — official 29-card trap deck composition

import { describe, it, expect } from 'vitest';
import { buildDeck } from '../../engine/cardDeck.js';

describe('buildDeck', () => {
  it('builds exactly 29 cards per Milton Bradley / GDD deck', () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(29);
  });

  it('contains 15 trap, 4 wild, and 10 detective cards', () => {
    const deck = buildDeck();
    const counts = {
      TRAP_CARD: 0,
      WILD_CARD: 0,
      DETECTIVE_CARD: 0,
    };
    for (const card of deck) {
      counts[card.cardType] += 1;
    }
    expect(counts.TRAP_CARD).toBe(15);
    expect(counts.WILD_CARD).toBe(4);
    expect(counts.DETECTIVE_CARD).toBe(10);
  });
});
