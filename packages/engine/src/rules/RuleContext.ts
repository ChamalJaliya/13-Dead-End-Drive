/**
 * RuleContext.ts — resolved rule profile + active modules for one pipeline pass.
 */

import type { GameState } from '@ded/types/game-state.js';
import type { RuleProfile } from '@ded/types/rule-profile.js';
import type { RuleModule } from './RuleModule.js';

export interface RuleContext {
  readonly profile: RuleProfile;
  readonly modules: readonly RuleModule[];
  readonly state: GameState;
}
