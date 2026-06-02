# GDD & Technical Blueprint — 13 Dead End Drive

**Status:** Living alignment doc (engine + client).  
**Product SRS:** [G01_digital_multiplayer_srs.md](../docs/requirements/G01_digital_multiplayer_srs.md)  
**Gameplay tie-breaker:** [board_rules_13_ded.md](board_rules_13_ded.md), [HOW_TO_PLAY.md](../docs/HOW_TO_PLAY.md)

**Not in scope:** 2002 *1313 Dead End Drive* sequel.

**Last sync:** 2026-06-01

---

## 1. Game State & Entities

| Entity | Target | Current engine | Alignment |
|--------|--------|----------------|-----------|
| Movement graph | 21×15 orthogonal | `GRID_21X15` | ✅ |
| Start chairs | 12 cells around table | `GRID_21X15_DINING_CHAIR_CELLS` | ✅ |
| Furniture obstacles | Block cell adjacency | 71 cells — `GRID_21X15_OBSTACLE_CATALOG` | ✅ |
| Gutter walls | Block edge crossing only | 33 edges — `GRID_21X15_GUTTER_WALLS` | ✅ |
| Trap triggers | 5 skull mechanisms | 5 `TrapId` on grid | ✅ |
| Secret passages | 5 teleport nodes | `A15` `U15` `E10` `Q10` `K14` when **ADVANCED** + `SECRET_PASSAGES` | ✅ |
| Exit | Front door | `K1` | ✅ |
| Character deal | 12 guests rooted | **2p = 6**, **3p = 4**, **4p = 3** visible rooting (G01) | ✅ |
| Portrait | Aunt Agatha + guest stack | `AUNT_AGATHA` opening; optional rotate on doubles | ✅ |
| Trap deck | 29 cards | `buildDeck()` — 10 det / 4 wild / 5 single / 10 dual | ✅ |
| Detective track | 10 steps to door | `DETECTIVE_TRACK_MAX_STEPS = 10` | ✅ |
| Pawns | Any player moves any | No ownership guard on move | ✅ |
| Rule profile | Standard vs advanced | `ruleProfile`, `enabledModules` on `GameState` | ✅ |

---

## 2. Core Loop

| Phase | Table rules | Engine | Notes |
|-------|-------------|--------|-------|
| Init | Shuffle decks; chairs | `initializeGame(options?)` | ✅ |
| Lobby rules | Host picks STANDARD / ADVANCED | `LobbyRulesPanel`, `setLobbyRuleSettings` | ✅ |
| Roll 2d6 | `d1`, `d2` | `ROLL_DICE` | ✅ |
| Plan | Split or combined | `CHOOSE_MOVEMENT_PLAN` | ✅ Combined blocked until all chairs clear |
| Doubles | Optional portrait | `CHANGE_PORTRAIT` | ✅ Not a deck card |
| Move | Two pawns or combined | `FIRST_MOVE` / `SECOND_MOVE` | ✅ |
| Chair phase | Clear table before combined | `chairPhase`, `moveCharacter` | ✅ |
| Trap landing | Play / draw / decline | `AWAITING_TRAP_*` | ✅ |
| Detective draw | Advance + redraw | `advanceDetective` | ✅ |
| Win | Heir / last rooted / detective | `evaluateWinCondition` | ✅ Portrait + rooting card for heir escape |

---

## 3. Trap Deck (29 cards)

| Category | Qty | `buildDeck()` |
|----------|-----|---------------|
| Detective | 10 | `DETECTIVE_CARD` |
| Wild | 4 | `WILD_CARD` |
| Single trap (×5 types) | 5 | one per `TrapId` |
| Dual-trap combos | 10 | C(5,2) pairs |
| **Total** | **29** | validated at build |

**Reference:** `data/gdd_trap_deck.json` (synced; `gddTrapDeckSync.spec.ts`).

**Not in deck:** Change Portrait, Secret Passage (board module / doubles only).

---

## 4. JSON data files

| File | Contents |
|------|----------|
| `data/gdd_trap_deck.json` | Full deck catalog + `not_in_deck` notes |
| `data/gdd_board_nodes.json` | Chairs, exit, traps, furniture obstacles (71), gutter walls (33), secret passage cells |

**Engine catalogs:** `GRID_21X15_OBSTACLE_CATALOG`, `buildDeck()`, `registerBuiltinRuleModules()`.

---

## 5. Validation Matrix

| System | Implementation |
|--------|----------------|
| Dice split/combined | `turnOrchestrator`, `movementPlan.ts` |
| Opening chair phase | `chairPhase.ts`, `moveCharacter.ts` |
| Trap skull landing | `trapEvaluator` → pending trap flow |
| Portrait Aunt Agatha | `gameInitializer`, `portraitStack.ts` |
| Rooting on death | `rootingReveal.ts` → `exposedRooting` |
| Detective 10 steps | `detectiveTrack.ts` |
| Win terminals | `winCondition.ts`, `characterOwnership.ts` |
| Client masking | `filterStateForPlayer` |
| Rule modules | `packages/engine/src/rules/`, `buildRuleContext` |
| Bot legality | `legalActions.ts` → `applyModuleLegalActions` |

---

## 6. Client UI

```
App.tsx
├── Scene3D / Scene2D
└── HUD3D
    ├── Heir card, PlayerTurnStrip
    ├── Estate console (dice, rooting, logs)
    ├── DetectiveWidget, DeckWidget, HandPanel
LobbyScreen
    ├── Mode picker (solo / local / online)
    └── LobbyRulesPanel (STANDARD / ADVANCED modules)
```

---

## 7. Future work

1. Supabase Auth JWT (`AUTH_REQUIRED=true`).
2. Custom house-rule modules (neutral `RuleModuleId`s; rules TBD from product).
3. Real alternate mix for `EXTENDED_TRAP_DECK` (currently same counts as standard).
4. Optional `TRAP_DRAW` board squares (skull-only draws today).

---

## 8. Sandbox

```typescript
import { makeThreePlayerSandbox } from './fixtures/threePlayerSandbox.fixtures.js';
```

See `src/__tests__/fixtures/threePlayerSandbox.spec.ts`.
