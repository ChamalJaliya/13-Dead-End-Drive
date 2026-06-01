/**
 * extendedTrapDeck.ts — alternate deck mix placeholder (RFC 007 Phase 5).
 * Currently matches the standard 29-card deck; swap when GDD extended mix is finalized.
 */

import type { RuleModule } from '../RuleModule.js';

export const extendedTrapDeckModule: RuleModule = {
  id:          'EXTENDED_TRAP_DECK',
  displayName: 'Extended trap deck',
  description: 'Alternate trap deck composition (experimental).',
};
