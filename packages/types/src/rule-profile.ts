/**
 * rule-profile.ts
 * Rule profile and optional module toggles (RFC 007).
 */

export const RULE_PROFILES = ['STANDARD', 'ADVANCED'] as const;
export type RuleProfile = (typeof RULE_PROFILES)[number];

/** Optional rule modules (ADVANCED profile only). */
export const RULE_MODULE_IDS = [
  'SECRET_PASSAGES',
  'EXTENDED_TRAP_DECK',
] as const;
export type RuleModuleId = (typeof RULE_MODULE_IDS)[number];

export const DEFAULT_RULE_PROFILE: RuleProfile = 'STANDARD';

export const DEFAULT_ENABLED_MODULES: readonly RuleModuleId[] = [];
