/**
 * cardDeck.ts
 * Builds, shuffles, and draws from the official 29-card trap deck
 * (Milton Bradley rules).
 */

import type { ActionCard } from '@ded/types/entities.js';
import type { TrapId } from '@ded/types/enums.js';


export function shuffleDeck(deck: ActionCard[]): ActionCard[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  return d;
}

/** Official 29-card deck from Milton Bradley / 13 Dead End Drive rules. */
export function buildDeck(): ActionCard[] {
  const cards: ActionCard[] = [];

  // 1. 10 Detective Cards
  for (let i = 0; i < 10; i++) {
    cards.push({
      cardId: `card-detective-${i}`,
      cardType: 'DETECTIVE_CARD',
      label: 'Detective',
      description: 'The detective advances one step closer to the mansion. Draw again.',
      matchesTrapId: null,
      matchesTrapIds: [],
      isWild: false,
      isDetective: true,
    });
  }

  // 2. 4 Wild Cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      cardId: `card-wild-${i}`,
      cardType: 'WILD_CARD',
      label: 'Any Trap (Wild)',
      description: 'Spring ANY trap — can be used on any trap space.',
      matchesTrapId: null,
      matchesTrapIds: [],
      isWild: true,
      isDetective: false,
    });
  }

  // 3. 5 Individual Trap Cards
  const trapLabels: Record<TrapId, string> = {
    CHANDELIER: 'The Chandelier',
    SUIT_OF_ARMOR: 'Suit of Armor',
    BOOKCASE: 'The Bookcase',
    STAIRS: 'The Stairs',
    FIREPLACE: 'Fireplace Chimney',
  };

  const traps: TrapId[] = ['CHANDELIER', 'SUIT_OF_ARMOR', 'BOOKCASE', 'STAIRS', 'FIREPLACE'];

  traps.forEach((trapId, i) => {
    cards.push({
      cardId: `card-trap-single-${trapId.toLowerCase()}-${i}`,
      cardType: 'TRAP_CARD',
      label: trapLabels[trapId],
      description: `Spring the ${trapLabels[trapId]} trap to eliminate the character standing there.`,
      matchesTrapId: trapId,
      matchesTrapIds: [trapId],
      isWild: false,
      isDetective: false,
    });
  });

  // 4. 10 Double Trap Combination Cards
  let combinationIndex = 0;
  for (let i = 0; i < traps.length; i++) {
    for (let j = i + 1; j < traps.length; j++) {
      const trapA = traps[i]!;
      const trapB = traps[j]!;
      const label = `${trapLabels[trapA]} or ${trapLabels[trapB]}`;
      cards.push({
        cardId: `card-trap-double-${combinationIndex++}`,
        cardType: 'TRAP_CARD',
        label,
        description: `Spring EITHER the ${trapLabels[trapA]} or ${trapLabels[trapB]} trap to eliminate the character standing there.`,
        matchesTrapId: null,
        matchesTrapIds: [trapA, trapB],
        isWild: false,
        isDetective: false,
      });
    }
  }

  if (cards.length !== 29) {
    throw new Error(`Real deck build mismatch: expected 29, got ${cards.length}`);
  }

  return shuffleDeck(cards);
}

/** Extended deck variant (RFC 007 `EXTENDED_TRAP_DECK`); composition matches standard until GDD mix ships. */
export function buildExtendedDeck(): ActionCard[] {
  return buildDeck().map((card, i) => ({
    ...card,
    cardId: `ext-${card.cardId}-${i}`,
  }));
}

export function drawCard(
  deck: ActionCard[],
): { card: ActionCard; remainingDeck: ActionCard[] } | null {
  if (deck.length === 0) return null;
  const [card, ...remainingDeck] = deck;
  return { card: card!, remainingDeck };
}

export function cardMatchesTrap(card: ActionCard, trapId: TrapId): boolean {
  if (card.isWild) return true;
  if (card.matchesTrapIds && card.matchesTrapIds.includes(trapId)) return true;
  return card.matchesTrapId === trapId;
}
