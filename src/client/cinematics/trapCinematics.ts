/**
 * trapCinematics.ts
 * Per-trap cinematic presentation config for overlay + canvas FX.
 */

import type { TrapId } from '../../types/enums.js';

export interface TrapCinematicConfig {
  readonly trapId:       TrapId;
  readonly title:        string;
  readonly icon:         string;
  readonly accentColor:  string;
  readonly glowShadow:   string;
  readonly animClass:    string;
  readonly description:  string;
  readonly particleHue:  number;
  readonly fallStyle:    'drop' | 'swing' | 'burst' | 'slide' | 'tip';
}

export const TRAP_CINEMATICS: Record<TrapId, TrapCinematicConfig> = {
  CHANDELIER: {
    trapId:      'CHANDELIER',
    title:       'Chandelier Collapse',
    icon:        '💡',
    accentColor: 'hsl(45, 95%, 55%)',
    glowShadow:  '0 0 30px hsla(45, 95%, 50%, 0.6)',
    animClass:   'cinematic-anim-chandelier',
    description: 'The golden chandelier snaps from its chain and plummets in a shower of crystal.',
    particleHue: 45,
    fallStyle:   'drop',
  },
  SUIT_OF_ARMOR: {
    trapId:      'SUIT_OF_ARMOR',
    title:       'Suit of Armor',
    icon:        '🗡️',
    accentColor: 'hsl(210, 70%, 65%)',
    glowShadow:  '0 0 30px hsla(210, 70%, 50%, 0.5)',
    animClass:   'cinematic-anim-armor',
    description: 'The rusted knight lurches forward — its blade finds flesh before clattering still.',
    particleHue: 210,
    fallStyle:   'swing',
  },
  BOOKCASE: {
    trapId:      'BOOKCASE',
    title:       'Bookcase Topple',
    icon:        '📚',
    accentColor: 'hsl(30, 80%, 55%)',
    glowShadow:  '0 0 30px hsla(30, 80%, 45%, 0.5)',
    animClass:   'cinematic-anim-bookcase',
    description: 'Leather-bound volumes rain down as the shelf tips with a thunderous crack.',
    particleHue: 30,
    fallStyle:   'tip',
  },
  STAIRS: {
    trapId:      'STAIRS',
    title:       'Stairway Collapse',
    icon:        '🪜',
    accentColor: 'hsl(160, 60%, 50%)',
    glowShadow:  '0 0 30px hsla(160, 60%, 40%, 0.5)',
    animClass:   'cinematic-anim-stairs',
    description: 'The steps give way — the victim vanishes into the darkness below.',
    particleHue: 160,
    fallStyle:   'slide',
  },
  FIREPLACE: {
    trapId:      'FIREPLACE',
    title:       'Roaring Fireplace',
    icon:        '🔥',
    accentColor: 'hsl(15, 95%, 55%)',
    glowShadow:  '0 0 35px hsla(15, 95%, 50%, 0.65)',
    animClass:   'cinematic-anim-fireplace',
    description: 'Flames erupt from the hearth, engulfing the trap space in blistering heat.',
    particleHue: 15,
    fallStyle:   'burst',
  },
};

export function getTrapCinematic(trapId: TrapId): TrapCinematicConfig {
  return TRAP_CINEMATICS[trapId];
}
