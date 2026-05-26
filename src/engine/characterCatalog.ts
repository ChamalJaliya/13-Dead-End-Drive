/**
 * characterCatalog.ts — canonical guest names for 13 Dead End Drive (1993).
 *
 * `CharacterId` matches guest names (SMOTHERS, DUSTY, …).
 * Aunt Agatha is the deceased hostess (portrait on sofa / will) — not a movable pawn.
 */

import type { CharacterId } from '../types/enums.js';

export const AUNT_AGATHA_DISPLAY_NAME = 'Aunt Agatha' as const;

/** Twelve playable mansion guests (pawn + character cards). */
export const CHARACTER_DATA: Record<CharacterId, { displayName: string; pawnColor: string }> = {
  SMOTHERS:        { displayName: 'Smothers',           pawnColor: 'hsl(210, 15%, 28%)' },
  DUSTY:           { displayName: 'Dusty',              pawnColor: 'hsl(325, 60%, 72%)' },
  CHARITY:         { displayName: 'Charity',            pawnColor: 'hsl(175, 45%, 62%)' },
  LULU:            { displayName: 'Lulu',               pawnColor: 'hsl(35,  75%, 64%)' },
  PARKER:          { displayName: 'Parker',             pawnColor: 'hsl(145, 40%, 32%)' },
  CLAY:            { displayName: 'Clay',               pawnColor: 'hsl(75,  65%, 52%)' },
  BEAUREGARD_III:  { displayName: 'Beauregard the III', pawnColor: 'hsl(210, 65%, 44%)' },
  SPRITZY:         { displayName: 'Spritzy',            pawnColor: 'hsl(330, 80%, 55%)' },
  MADAME_ASTRA:    { displayName: 'Madame Astra',       pawnColor: 'hsl(275, 65%, 45%)' },
  HICKORY:         { displayName: 'Hickory',            pawnColor: 'hsl(120, 45%, 38%)' },
  PIERRE:          { displayName: 'Pierre',             pawnColor: 'hsl(0,   0%,  92%)' },
  POOPSIE:         { displayName: 'Poopsie',            pawnColor: 'hsl(28,  85%, 52%)' },
};

export function getCharacterDisplayName(characterId: CharacterId): string {
  return CHARACTER_DATA[characterId].displayName;
}
