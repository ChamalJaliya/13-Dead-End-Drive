import type { CharacterId } from '../types/enums.js';

/**
 * Registry mapping CharacterId keys to their high-definition Victorian portrait image assets.
 * These illustrations are served dynamically under `/public/portraits/` (built by the AI artist).
 * Due to API rate limits, characters beautifully reuse/fallback to the 4 premium custom generated assets
 * so the visual experience remains seamless and gorgeous.
 */
export const CHARACTER_PORTRAITS: Record<CharacterId, string> = {
  SMOTHERS:   '/portraits/smothers.png',   // Smothers
  DUSTY: '/portraits/dusty.png',      // Dusty
  CHARITY:  '/portraits/charity.png',    // Charity
  LULU: '/portraits/charity.png',    // Lulu (asset fallback)
  PARKER:    '/portraits/smothers.png',   // Parker (asset fallback)
  CLAY:  '/portraits/smothers.png',   // Clay (asset fallback)
  BEAUREGARD_III:   '/portraits/smothers.png',   // Beauregard the III (asset fallback)
  SPRITZY: '/portraits/dusty.png',      // Spritzy (asset fallback)
  MADAME_ASTRA:    '/portraits/charity.png',    // Madame Astra (asset fallback)
  HICKORY:   '/portraits/dusty.png',      // Hickory (asset fallback)
  PIERRE:  '/portraits/smothers.png',   // Pierre (asset fallback)
  POOPSIE: '/portraits/dusty.png',      // Poopsie (asset fallback)
};

export const AUNT_AGATHA_PORTRAIT = '/portraits/agatha.png';
