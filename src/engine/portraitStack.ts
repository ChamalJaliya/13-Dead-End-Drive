/**
 * portraitStack.ts
 * Fireplace portrait stack rotation (Milton Bradley rules booklet).
 */

import type { CharacterId, PortraitHeirId } from '../types/enums.js';
import type { FireplacePortrait } from '../types/entities.js';
import { CHARACTER_IDS } from '../types/enums.js';

export function buildPortraitStack(): readonly CharacterId[] {
  const stack = [...CHARACTER_IDS];
  for (let i = stack.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stack[i], stack[j]] = [stack[j]!, stack[i]!];
  }
  return stack;
}

/** Move the front portrait card to the back of the stack. */
export function rotatePortraitStack(
  stack: readonly CharacterId[],
): readonly CharacterId[] {
  if (stack.length <= 1) {
    return stack;
  }
  return [...stack.slice(1), stack[0]!];
}

export function applyPortraitStackRotation(
  portrait: FireplacePortrait,
  turnNumber: number,
  reason: FireplacePortrait['lastChangedReason'],
): FireplacePortrait {
  const previousHeir = portrait.currentHeirId;
  // Opening rule: the portrait starts as Aunt Agatha. The first doubles rotation
  // reveals the top guest without consuming the stack.
  let nextStack = portrait.portraitStack;
  let nextHeir: PortraitHeirId = portrait.currentHeirId;
  if (portrait.currentHeirId === 'AUNT_AGATHA') {
    nextHeir = portrait.portraitStack[0] ?? 'AUNT_AGATHA';
  } else {
    nextStack = rotatePortraitStack(portrait.portraitStack);
    nextHeir = nextStack[0] ?? portrait.currentHeirId;
  }

  return {
    currentHeirId:     nextHeir,
    portraitStack:     nextStack,
    portraitHistory:   [...portrait.portraitHistory, previousHeir],
    lastChangedOnTurn: turnNumber,
    lastChangedReason: reason,
  };
}
