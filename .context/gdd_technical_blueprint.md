# GDD & Technical Blueprint — 13 Dead End Drive

**Status:** Living alignment doc (engine + client). **Gameplay tie-breaker:** [Geeky Hobbies — 13 Dead End Drive](https://www.geekyhobbies.com/13-dead-end-drive-board-game-review-and-rules/) and `.context/board_rules_13_ded.md`.

**Not in scope:** 1313 Dead End Drive sequel.

**Last sync:** 2026-05-27

---

## 1. Game State & Entities (GDD §1)

| Entity | Target | Current engine | Alignment |
|--------|--------|----------------|-----------|
| Movement graph | 21×15 orthogonal | `GRID_21X15` | ✅ |
| Start chairs | 12 cells around table | `GRID_21X15_DINING_CHAIR_CELLS` | ✅ |
| Trap triggers | 5 skull mechanisms | 5 `TrapId` on grid | ✅ |
| Secret passages | 5 teleport nodes | Empty in release | 🔲 Excluded |
| Exit | Front door | `K1` | ✅ |
| Character deal | 12 guests rooted | `initializeGame()`; 2p = 4+2 secret | ✅ |
| Portrait | Aunt Agatha + guest stack | `AUNT_AGATHA` opening; stack on doubles | ✅ |
| Trap deck | 29 cards | `buildDeck()` — 10 det / 4 wild / 15 trap | ✅ |
| Detective track | 10 steps to door | `DETECTIVE_TRACK_MAX_STEPS = 10` | ✅ |
| Pawns | Any player moves any | No ownership guard on move | ✅ |

---

## 2. Core Loop (GDD §2)

| Phase | Table rules | Engine | Notes |
|-------|-------------|--------|-------|
| Init | Shuffle decks; chairs | `initializeGame()` | ✅ |
| Roll 2d6 | `d1`, `d2` | `ROLL_DICE` | ✅ |
| Plan | Split or combined | `CHOOSE_MOVEMENT_PLAN` | ✅ |
| Doubles | Optional portrait | `CHANGE_PORTRAIT` | ✅ No auto-draw |
| Move | Two pawns or combined | `FIRST_MOVE` / `SECOND_MOVE` | ✅ |
| Chair phase | Clear table before free play | `moveCharacter` GRID guards | ✅ |
| Trap landing | Play / draw / decline | `AWAITING_TRAP_*` | ✅ |
| Detective draw | Advance + redraw | `advanceDetective` | ✅ |
| Win | Heir / last rooted / detective | `evaluateWinCondition` | ✅ |

---

## 3. Trap Deck — Implemented composition (29 cards)

| Category | Qty | `buildDeck()` |
|----------|-----|---------------|
| Detective | 10 | `DETECTIVE_CARD` |
| Wild | 4 | `WILD_CARD` |
| Single trap (×5 types) | 5 | one per `TrapId` |
| Dual-trap combos | 10 | C(5,2) pairs |
| **Total** | **29** | validated at build |

Reference: `data/gdd_trap_deck.json` (GDD target mix differs; engine uses Milton Bradley–style 29 above).

**Usecases:**

| UC | Behavior | Engine |
|----|----------|--------|
| Kill on trap | Matching/wild from hand | `resolveTrapCard` | ✅ |
| Detective on draw | Advance + redraw | `resolveDrawCard` | ✅ |
| Portrait change | Doubles optional | `CHANGE_PORTRAIT` | ✅ (not hand card) |
| Secret passage card | N/A this release | — | 🔲 |

---

## 4. JSON Schemas (GDD §4)

- `data/gdd_trap_deck.json` — card catalog (reference)
- `data/gdd_board_nodes.json` — 21×15 metadata (chairs, exit `K1`, traps)

---

## 5. Validation Matrix — Engine mapping

| System | Implementation |
|--------|----------------|
| Dice split/combined | `turnOrchestrator`, `movementPlan.ts` |
| Opening chair phase | `moveCharacter.ts` + `GRID_21X15_DINING_CHAIR_SET` |
| Trap skull landing | `evaluateTraps` → pending trap flow |
| Portrait Aunt Agatha | `gameInitializer`, `portraitStack.ts`, `PortraitHeirId` |
| Rooting reveal on death | `rootingReveal.ts` → `exposedRooting` |
| Detective 10 steps | `detectiveTrack.ts`, `DetectiveWidget.tsx` |
| Win terminals | `winCondition.ts` + `characterOwnership.ts` |
| Client masking | `filterStateForPlayer` |

---

## 6. Client UI architecture

```
App.tsx
├── Scene3D / Scene2D     (board)
└── HUD3D                 (overlays)
    ├── Heir card (top-left)
    ├── Estate console (right, collapsible)
    ├── DetectiveWidget   (bottom-right, 10 dots)
    ├── DeckWidget        (bottom-right)
    └── HandPanel         (bottom center, horizontal)
```

**Z-order:** HUD `z-10`; compass `z-5` (does not block console collapse).

---

## 7. Recommended future work

1. Phase 3.6 reconnect + hand projection.
2. Optional: trap-card hand plays for portrait/secret-passage if GDD cards added.
3. Optional: `TRAP_DRAW` cells on grid (currently skull-only draws).

---

## 8. Development sandbox

```typescript
import { makeThreePlayerSandbox } from './fixtures/threePlayerSandbox.fixtures.js';
const state = makeThreePlayerSandbox();
```

See `src/__tests__/fixtures/threePlayerSandbox.spec.ts`.
