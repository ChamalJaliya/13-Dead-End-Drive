/**
 * registerBuiltinModules.ts — one-time registration of shipped rule modules.
 */

import { registerModule, getRegisteredModules } from './registry.js';
import { secretPassagesModule } from './modules/secretPassages.js';
import { extendedTrapDeckModule } from './modules/extendedTrapDeck.js';

let registered = false;

export function registerBuiltinRuleModules(): void {
  if (registered || getRegisteredModules().length > 0) {
    registered = true;
    return;
  }
  registerModule(secretPassagesModule);
  registerModule(extendedTrapDeckModule);
  registered = true;
}

/** Metadata for lobby checkboxes (all registered modules). */
export function listRuleModuleCatalog(): readonly import('./RuleModule.js').RuleModule[] {
  registerBuiltinRuleModules();
  return getRegisteredModules();
}
