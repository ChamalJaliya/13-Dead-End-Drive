// portraitStack.spec.ts — buildPortraitStack + doubles rotation rules

import { describe, it, expect } from 'vitest';
import {
  buildPortraitStack,
  applyPortraitStackRotation,
  peelAliveHeirFromStackTop,
} from '../../engine/portraitStack.js';
import { CHARACTER_IDS } from '../../types/enums.js';
import type { CharacterId } from '../../types/enums.js';
import { makeCharacter } from '../fixtures/gameState.fixtures.js';
import type { FireplacePortrait } from '../../types/entities.js';

function makeOpeningPortrait(stack: readonly import('../../types/enums.js').PortraitHeirId[]): FireplacePortrait {
  return {
    currentHeirId:     'AUNT_AGATHA',
    portraitStack:     stack,
    portraitHistory:   [],
    lastChangedOnTurn: 1,
    lastChangedReason: 'OPENING_AGATHA',
  };
}

function charsAlive(
  ids: readonly CharacterId[],
): Record<CharacterId, import('../../types/entities.js').Character> {
  const out = {} as Record<CharacterId, import('../../types/entities.js').Character>;
  for (const id of ids) {
    out[id] = makeCharacter({ id, status: 'ALIVE' });
  }
  return out;
}

describe('buildPortraitStack', () => {
  it('contains 13 cards: 12 guests plus Aunt Agatha, shuffled', () => {
    const stack = buildPortraitStack();
    expect(stack).toHaveLength(13);
    expect(stack.filter((id) => id === 'AUNT_AGATHA')).toHaveLength(1);
    for (const guest of CHARACTER_IDS) {
      expect(stack.filter((id) => id === guest)).toHaveLength(1);
    }
  });
});

describe('applyPortraitStackRotation', () => {
  it('first doubles removes Agatha from stack and reveals top alive guest', () => {
    const stack = ['SMOTHERS', 'AUNT_AGATHA', ...CHARACTER_IDS.filter((id) => id !== 'SMOTHERS')] as const;
    const portrait = makeOpeningPortrait(stack);
    const characters = charsAlive(CHARACTER_IDS);

    const next = applyPortraitStackRotation(portrait, characters, 2, 'DOUBLES_ROLL');

    expect(next.portraitStack).not.toContain('AUNT_AGATHA');
    expect(next.currentHeirId).toBe('SMOTHERS');
    expect(next.portraitHistory).toContain('AUNT_AGATHA');
  });

  it('moves alive current heir to bottom of stack on later doubles', () => {
    const portrait: FireplacePortrait = {
      currentHeirId:     'SMOTHERS',
      portraitStack:     ['DUSTY', 'CHARITY', 'SMOTHERS', 'LULU'],
      portraitHistory:   ['AUNT_AGATHA'],
      lastChangedOnTurn: 2,
      lastChangedReason: 'DOUBLES_ROLL',
    };
    const characters = charsAlive(CHARACTER_IDS);

    const next = applyPortraitStackRotation(portrait, characters, 4, 'DOUBLES_ROLL');

    expect(next.currentHeirId).toBe('DUSTY');
    expect(next.portraitStack[0]).toBe('DUSTY');
    expect(next.portraitStack[next.portraitStack.length - 1]).toBe('SMOTHERS');
  });

  it('permanently removes dead current heir from stack instead of moving to bottom', () => {
    const portrait: FireplacePortrait = {
      currentHeirId:     'SMOTHERS',
      portraitStack:     ['DUSTY', 'SMOTHERS', 'CHARITY'],
      portraitHistory:   [],
      lastChangedOnTurn: 3,
      lastChangedReason: 'DOUBLES_ROLL',
    };
    const characters = charsAlive(CHARACTER_IDS);
    characters.SMOTHERS = makeCharacter({ id: 'SMOTHERS', status: 'ELIMINATED', eliminationCause: 'TRAP' });

    const next = applyPortraitStackRotation(portrait, characters, 5, 'DOUBLES_ROLL');

    expect(next.portraitStack).not.toContain('SMOTHERS');
    expect(next.currentHeirId).toBe('DUSTY');
  });

  it('skips dead cards on top when revealing next heir', () => {
    const portrait: FireplacePortrait = {
      currentHeirId:     'CHARITY',
      portraitStack:     ['SMOTHERS', 'DUSTY', 'CHARITY'],
      portraitHistory:   [],
      lastChangedOnTurn: 4,
      lastChangedReason: 'DOUBLES_ROLL',
    };
    const characters = charsAlive(CHARACTER_IDS);
    characters.SMOTHERS = makeCharacter({ id: 'SMOTHERS', status: 'ELIMINATED', eliminationCause: 'TRAP' });

    const next = applyPortraitStackRotation(portrait, characters, 6, 'DOUBLES_ROLL');

    expect(next.currentHeirId).toBe('DUSTY');
    expect(next.portraitStack).not.toContain('SMOTHERS');
  });
});

describe('peelAliveHeirFromStackTop', () => {
  it('returns first alive guest and drops dead cards from the top', () => {
    const stack = ['SMOTHERS', 'DUSTY', 'CHARITY'] as const;
    const characters = charsAlive(['DUSTY', 'CHARITY']);
    characters.SMOTHERS = makeCharacter({ id: 'SMOTHERS', status: 'ELIMINATED', eliminationCause: 'TRAP' });

    const { heir, stack: remaining } = peelAliveHeirFromStackTop(stack, characters);

    expect(heir).toBe('DUSTY');
    expect(remaining[0]).toBe('DUSTY');
    expect(remaining).not.toContain('SMOTHERS');
  });
});
