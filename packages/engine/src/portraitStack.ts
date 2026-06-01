/**
 * portraitStack.ts
 * Fireplace portrait stack — 13 shuffled cards (12 guests + Aunt Agatha).
 *
 * Opening: portrait shows Aunt Agatha; Agatha remains in the stack until first doubles.
 * Doubles (optional, once per turn): rotate — dead current heir removed from stack;
 * alive current heir moved to bottom; reveal top card, skipping dead guests.
 */

import type { Character } from '@ded/types/entities.js';
import type { FireplacePortrait } from '@ded/types/entities.js';
import { CHARACTER_IDS, type CharacterId, type PortraitHeirId } from '@ded/types/enums.js';

export function buildPortraitStack(): readonly PortraitHeirId[] {
  const stack: PortraitHeirId[] = [...CHARACTER_IDS, 'AUNT_AGATHA'];
  for (let i = stack.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stack[i], stack[j]] = [stack[j]!, stack[i]!];
  }
  return stack;
}

function withoutFirst(
  stack: readonly PortraitHeirId[],
  id: PortraitHeirId,
): PortraitHeirId[] {
  const idx = stack.indexOf(id);
  if (idx === -1) {
    return [...stack];
  }
  return [...stack.slice(0, idx), ...stack.slice(idx + 1)];
}

function moveToBottom(
  stack: readonly PortraitHeirId[],
  id: PortraitHeirId,
): PortraitHeirId[] {
  return [...withoutFirst(stack, id), id];
}

function isDeadGuest(
  id: PortraitHeirId,
  characters: Record<CharacterId, Character>,
): boolean {
  if (id === 'AUNT_AGATHA') {
    return false;
  }
  const char = characters[id];
  return char === undefined || char.status !== 'ALIVE';
}

/** Drop dead guests from the top; return the first alive heir (or Agatha if stack empty). */
export function peelAliveHeirFromStackTop(
  stack: readonly PortraitHeirId[],
  characters: Record<CharacterId, Character>,
): { readonly heir: PortraitHeirId; readonly stack: readonly PortraitHeirId[] } {
  let remaining = [...stack];
  while (remaining.length > 0) {
    const top = remaining[0]!;
    if (top === 'AUNT_AGATHA') {
      return { heir: 'AUNT_AGATHA', stack: remaining };
    }
    if (!isDeadGuest(top, characters)) {
      return { heir: top, stack: remaining };
    }
    remaining = remaining.slice(1);
  }
  return { heir: 'AUNT_AGATHA', stack: [] };
}

export function applyPortraitStackRotation(
  portrait: FireplacePortrait,
  characters: Record<CharacterId, Character>,
  turnNumber: number,
  reason: FireplacePortrait['lastChangedReason'],
): FireplacePortrait {
  const previousHeir = portrait.currentHeirId;
  let stack = [...portrait.portraitStack];

  if (portrait.currentHeirId === 'AUNT_AGATHA') {
    stack = withoutFirst(stack, 'AUNT_AGATHA');
    const peeled = peelAliveHeirFromStackTop(stack, characters);
    return {
      currentHeirId:     peeled.heir,
      portraitStack:     peeled.stack,
      portraitHistory:   [...portrait.portraitHistory, previousHeir],
      lastChangedOnTurn: turnNumber,
      lastChangedReason: reason,
    };
  }

  const current = portrait.currentHeirId;
  if (isDeadGuest(current, characters)) {
    stack = withoutFirst(stack, current);
  } else {
    stack = moveToBottom(stack, current);
  }

  const peeled = peelAliveHeirFromStackTop(stack, characters);
  return {
    currentHeirId:     peeled.heir,
    portraitStack:     peeled.stack,
    portraitHistory:   [...portrait.portraitHistory, previousHeir],
    lastChangedOnTurn: turnNumber,
    lastChangedReason: reason,
  };
}

/** Forced rotation when the featured guest is eliminated (trap cascade). */
export function applyPortraitAfterHeirEliminated(
  portrait: FireplacePortrait,
  characters: Record<CharacterId, Character>,
  eliminatedHeirId: CharacterId,
  turnNumber: number,
): FireplacePortrait {
  const stack = portrait.portraitStack.filter((id) => id !== eliminatedHeirId);
  const peeled = peelAliveHeirFromStackTop(stack, characters);
  return {
    currentHeirId:     peeled.heir,
    portraitStack:     peeled.stack,
    portraitHistory:   [...portrait.portraitHistory, eliminatedHeirId],
    lastChangedOnTurn: turnNumber,
    lastChangedReason: 'HEIR_ELIMINATED',
  };
}

/** @deprecated Use peelAliveHeirFromStackTop — kept for tests that referenced rotate. */
export function rotatePortraitStack(
  stack: readonly CharacterId[],
): readonly CharacterId[] {
  if (stack.length <= 1) {
    return stack;
  }
  return [...stack.slice(1), stack[0]!];
}
