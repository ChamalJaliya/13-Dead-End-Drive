/**
 * game-state-patch.ts
 * Partial delta shape used in PATCH_UPDATE responses.
 * Extracted into its own file to break the circular dependency between
 * game-state.ts and socket-events.ts.
 */

import type { GameState } from './game-state.js';

export type GameStatePatch = Partial<
  Pick<
    GameState,
    | 'phase'
    | 'turnNumber'
    | 'activePlayerId'
    | 'characters'
    | 'traps'
    | 'detectivePosition'
    | 'activePortrait'
    | 'lastDiceRoll'
    | 'winner'
    | 'winCondition'
    | 'updatedAt'
  >
>;
