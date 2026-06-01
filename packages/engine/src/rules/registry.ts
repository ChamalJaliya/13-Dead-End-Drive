/**
 * registry.ts — rule module registration and orchestrator hooks (RFC 007 Phase 1).
 */

import type { GameState } from '@ded/types/game-state.js';
import type { RuleModuleId } from '@ded/types/rule-profile.js';
import type { PlayerId } from '@ded/types/enums.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { BotActionOption } from '@ded/types/bot-api.js';
import { normalizeRuleProfile } from './normalizeRuleProfile.js';
import type { RuleContext } from './RuleContext.js';
import type { RuleModule } from './RuleModule.js';

const registeredModules: RuleModule[] = [];

export function registerModule(module: RuleModule): void {
  if (registeredModules.some((m) => m.id === module.id)) {
    return;
  }
  registeredModules.push(module);
}

export function getRegisteredModules(): readonly RuleModule[] {
  return registeredModules;
}

export function getModulesFor(state: GameState): readonly RuleModule[] {
  const normalized = normalizeRuleProfile(state);
  if (normalized.ruleProfile === 'STANDARD') {
    return [];
  }
  const enabled = new Set<RuleModuleId>(normalized.enabledModules);
  return registeredModules.filter((m) => enabled.has(m.id));
}

export function buildRuleContext(state: GameState): RuleContext {
  const normalized = normalizeRuleProfile(state);
  return {
    profile:  normalized.ruleProfile,
    modules:  getModulesFor(normalized),
    state:    normalized,
  };
}

export function runModuleGuards(ctx: RuleContext, event: SocketEvent): void {
  for (const mod of ctx.modules) {
    mod.guardMove?.(ctx.state, event);
  }
}

export function runAfterMoveHooks(
  state: GameState,
  ctx: RuleContext,
): GameState {
  let next = state;
  for (const mod of ctx.modules) {
    if (mod.afterMove) {
      next = mod.afterMove(next);
    }
  }
  return next;
}

export function applyModuleLegalActions(
  state: GameState,
  playerId: PlayerId,
  actions: readonly BotActionOption[],
): readonly BotActionOption[] {
  const ctx = buildRuleContext(state);
  let next = actions;
  for (const mod of ctx.modules) {
    if (mod.extendLegalActions) {
      next = mod.extendLegalActions(ctx.state, playerId, next);
    }
  }
  return next;
}

