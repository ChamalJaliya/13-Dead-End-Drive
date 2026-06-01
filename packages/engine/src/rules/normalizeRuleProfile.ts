/**
 * normalizeRuleProfile.ts — backward-compat for persisted state without RFC 007 fields.
 */

import type { GameState } from '@ded/types/game-state.js';
import {
  DEFAULT_ENABLED_MODULES,
  DEFAULT_RULE_PROFILE,
} from '@ded/types/rule-profile.js';

type LegacyRuleFields = GameState & {
  ruleProfile?: GameState['ruleProfile'];
  enabledModules?: GameState['enabledModules'];
};

export function normalizeRuleProfile(state: GameState): GameState {
  const legacy = state as LegacyRuleFields;
  const profile = legacy.ruleProfile ?? DEFAULT_RULE_PROFILE;
  const enabledModules = legacy.enabledModules ?? DEFAULT_ENABLED_MODULES;
  if (legacy.ruleProfile === profile && legacy.enabledModules === enabledModules) {
    return state;
  }
  return { ...state, ruleProfile: profile, enabledModules };
}
