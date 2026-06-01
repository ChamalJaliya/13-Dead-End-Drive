/**
 * LobbyRulesPanel.tsx — STANDARD vs ADVANCED rule profile (RFC 007 Phase 2).
 */

import { listRuleModuleCatalog } from '../../engine/rules/registerBuiltinModules.js';
import type { RuleModuleId, RuleProfile } from '../../types/rule-profile.js';

const MODULE_CATALOG = listRuleModuleCatalog();

export interface LobbyRulesPanelProps {
  readonly ruleProfile: RuleProfile;
  readonly enabledModules: readonly RuleModuleId[];
  readonly disabled?: boolean;
  readonly onChange: (
    profile: RuleProfile,
    modules: readonly RuleModuleId[],
  ) => void;
}

export function LobbyRulesPanel({
  ruleProfile,
  enabledModules,
  disabled = false,
  onChange,
}: LobbyRulesPanelProps) {
  const toggleModule = (id: RuleModuleId, checked: boolean): void => {
    const next = checked
      ? [...enabledModules, id]
      : enabledModules.filter((m) => m !== id);
    onChange(ruleProfile, next);
  };

  return (
    <div className="lobby-rules" data-testid="lobby-rules-panel">
      <p className="lobby-section-title">Game rules</p>
      <div className="lobby-rules-profile" role="radiogroup" aria-label="Rule profile">
        <label className="lobby-rules-radio">
          <input
            type="radio"
            name="ruleProfile"
            value="STANDARD"
            checked={ruleProfile === 'STANDARD'}
            disabled={disabled}
            onChange={() => onChange('STANDARD', [])}
          />
          <span>Standard (G01)</span>
        </label>
        <label className="lobby-rules-radio">
          <input
            type="radio"
            name="ruleProfile"
            value="ADVANCED"
            checked={ruleProfile === 'ADVANCED'}
            disabled={disabled}
            onChange={() => onChange('ADVANCED', enabledModules)}
          />
          <span>Advanced</span>
        </label>
      </div>
      {ruleProfile === 'ADVANCED' && (
        <ul className="lobby-rules-modules">
          {MODULE_CATALOG.map((mod) => (
            <li key={mod.id}>
              <label className="lobby-rules-check">
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.id)}
                  disabled={disabled}
                  onChange={(e) => toggleModule(mod.id, e.target.checked)}
                />
                <span className="lobby-rules-check-label">{mod.displayName}</span>
                <span className="lobby-room-hint lobby-room-hint--inline">
                  {mod.description}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
