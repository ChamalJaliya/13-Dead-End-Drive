// ruleContext.spec.ts — buildRuleContext and module registry (RFC 007 Phase 1)

import { describe, it, expect } from 'vitest';
import {
  buildRuleContext,
  getModulesFor,
  registerModule,
} from '../../../engine/rules/registry.js';
import type { RuleModule } from '@ded/engine/rules/RuleModule.js';
import { initializeGame } from '../../../engine/gameInitializer.js';
import { makeGameState } from '../../fixtures/gameState.fixtures.js';

describe('ruleContext registry', () => {
  it('defaults STANDARD profile with no active modules', () => {
    const state = initializeGame('rules-std', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    const ctx = buildRuleContext(state);
    expect(ctx.profile).toBe('STANDARD');
    expect(ctx.modules).toHaveLength(0);
    expect(getModulesFor(state)).toHaveLength(0);
  });

  it('ignores enabledModules when profile is STANDARD', () => {
    const state = makeGameState({
      ruleProfile:    'STANDARD',
      enabledModules: ['SECRET_PASSAGES'],
    });
    expect(getModulesFor(state)).toHaveLength(0);
  });

  it('resolves registered modules for ADVANCED profile', () => {
    const stub: RuleModule = {
      id:          'SECRET_PASSAGES',
      displayName: 'Secret passages',
      description: 'Test stub',
    };
    registerModule(stub);

    const state = makeGameState({
      ruleProfile:    'ADVANCED',
      enabledModules: ['SECRET_PASSAGES'],
    });
    const ctx = buildRuleContext(state);
    expect(ctx.profile).toBe('ADVANCED');
    expect(ctx.modules.map((m) => m.id)).toEqual(['SECRET_PASSAGES']);
  });
});
