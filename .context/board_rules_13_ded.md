# 13 Dead End Drive — Official Rules Reference (Original 1993 Game)

**Canonical source:** [Geeky Hobbies — 13 Dead End Drive Board Game Review and Rules](https://www.geekyhobbies.com/13-dead-end-drive-board-game-review-and-rules/)

**Not in scope:** [1313 Dead End Drive](https://www.geekyhobbies.com/1313-dead-end-drive-board-game-review-and-rules/) (2002 sequel).

**Engine board:** `GRID_21X15` — 21×15 grid, algebraic `A1`–`U15`, 315 cells. **Secret passages** (`A15`, `U15`, `E10`, `Q10`, `K14`) when `ADVANCED` + `SECRET_PASSAGES` module is enabled.

---

## Setup

| Step | Rule |
|------|------|
| Pawns | 12 guests on **12 dining chairs** (one pawn per chair; deterministic chair assignment in engine) |
| Chair cells | `J5` `J6` `J7` `J8` `J9` `K5` `K9` `L5` `L6` `L7` `L8` `L9` |
| Rooting cards | Dealt to owner only (opponents cannot see): **2p = 6 each**, **3p = 4 each**, **4p = 3 each** — all visible on your HUD (G01; no secret rooting deal) |
| Portrait | **13-card** shuffled stack (12 guests + Aunt Agatha). Game **starts** showing **Aunt Agatha** (card still in stack). **First doubles:** remove Agatha from stack, reveal top **alive** guest. **Later doubles (optional, once/turn):** alive featured guest → bottom of stack; dead featured guest → removed from stack; reveal next top **alive** card (skip dead). Forced advance when featured guest dies (trap). |
| Trap deck | **29 cards** (10 detective, 4 wild, 5 single-trap, 10 dual-trap combos), shuffled |
| Detective | **10 active slots**; **slot 10 = at the front door** |
| Exit | **`K1`** (front door) |

---

## Turn structure (after rolling 2d6)

1. **Roll** two dice.
2. **Movement choice** (same on every turn, including doubles):
   - **Split:** move **pawn A** exactly **die1** pips, then a **different pawn B** exactly **die2** pips; or
   - **Combined:** move **one** pawn exactly **die1 + die2** pips, then turn ends.
   - Cannot split one die (e.g. 4 as 2+2).
3. **Any active player** may move **any** alive pawn (not only their rooting cards).
4. **Doubles only (optional):** before moving, active player **may** rotate the fireplace portrait (not required). No extra roll, no mandatory draw.
5. Turn passes clockwise when both moves are done (or after combined move), after trap resolution if any.

**Engine sub-phases:** `AWAITING_ROLL` → `CHOOSE_MOVEMENT_PLAN` → `FIRST_MOVE` → [`AWAITING_TRAP_1`] → `SECOND_MOVE` → [`AWAITING_TRAP_2`] → `TURN_END`

---

## Opening chair phase (`GRID_21X15` only)

While **any** pawn is still on a dining chair:

- Players may **only** move pawns **off** chairs (cannot move pawns already off-chair).
- **Split dice only** — move one pawn die1 pips, then a different pawn die2 pips. **Combined** (die1 + die2 on one pawn) is **not** allowed until **all** pawns have left the chairs.
- Pawns **cannot move through** chair cells.
- Pawns **cannot land on** chair cells once they have left (no returning to the table ring).

Additionally: cannot land on **trap zones** while any pawn remains on red chairs.

---

## Trap deck (skull / trap zones only)

- Draw **only** when a pawn **lands on a trap zone** this turn (no separate “draw squares” on the 21×15 board).
- **One draw** per trap landing (unless detective chain below).
- On trap landing the mover may:
  - **Play** a matching trap or wild from hand (optional — kills occupant), or
  - **Draw** one card from the deck, or
  - **Decline** (pawn survives, trap stays ready).
- **After draw:**
  - **Detective:** reveal immediately, advance detective **1**, discard, **draw again** until a non-detective card.
  - **Trap / wild:** may **keep in hand** and end trap step, or **optionally play** if it matches the trap (or wild).
  - Wrong / non-matching cards are **kept** in hand.
- Detective cards are **never** kept in hand.

---

## Rooting cards (G01)

- All rooting guests are on **your HUD** (`characterIds`). Opponents cannot see your hand (`filterStateForPlayer`).
- **2p = 6**, **3p = 4**, **4p = 3** guests each (no hidden secret rooting deal).
- When a rooted guest **dies**, reveal **only that guest’s owner** via `exposedRooting` (other cards stay private).
- `secretCharacterIds` / `secretCardsRevealed` are legacy schema fields (unused in new deals).

---

## Win conditions

| # | Condition | Winner |
|---|-----------|--------|
| 1 | **Featured portrait** guest (not Aunt Agatha) reaches **`K1`** alive | Player who holds **that same guest’s** rooting card. Another guest at `K1` does not count. |
| 2 | Only **one player** still has a living rooted guest in the mansion | That player |
| 3 | Detective reaches the door (**10 steps**) | Player holding the **current portrait** guest’s rooting card (not Aunt Agatha) |

---

## Movement constraints

- Orthogonal only on `GRID_21X15`; full die value must be used.
- No passing through or landing on other pawns or **furniture obstacles** (71 cells — see `GRID_21X15_OBSTACLE_CATALOG` / `data/gdd_board_nodes.json`).
- **Red chairs / trap zones:** see Opening chair phase above.
- **Secret passages (STANDARD):** off. **ADVANCED** + `SECRET_PASSAGES`: teleport between `A15`, `U15`, `E10`, `Q10`, `K14` for 1 pip.

---

## Rule profiles (RFC 007)

| Profile | Behavior |
|---------|----------|
| `STANDARD` | G01 rules only; `enabledModules` ignored |
| `ADVANCED` | Host enables modules in lobby (`LobbyRulesPanel`) |

| Module | Effect |
|--------|--------|
| `SECRET_PASSAGES` | Five linked teleport cells on grid |
| `EXTENDED_TRAP_DECK` | `buildExtendedDeck()` (same 29-card counts; experimental IDs) |

---

## Engine mapping

| Rule | Implementation |
|------|----------------|
| Chair cells | `GRID_21X15_DINING_CHAIR_CELLS`, `GRID_21X15_DINING_CHAIR_SET` |
| Chair layout revision | `GRID_21X15_CHAIR_LAYOUT_REVISION` (invalidates stale local saves) |
| Exit | `getExitCellId()` → `K1` on `GRID_21X15` |
| Split / combined | `CHOOSE_MOVEMENT_PLAN`, `movementPlan`, `FIRST_MOVE` / `SECOND_MOVE` |
| Doubles portrait | `CHANGE_PORTRAIT` (optional, doubles only) |
| Opening portrait | `AUNT_AGATHA`, `OPENING_AGATHA`, `PortraitHeirId` |
| Trap pause | `pendingTrapCell`, `PLAY_TRAP_CARD`, `DRAW_TRAP_CARD`, `DECLINE_TRAP` |
| Detective chain | `drawTrapCardFromDeck` + `advanceDetective` (10 steps) |
| Per-death rooting reveal | `exposedRooting` (`rootingReveal.ts`) |
| Hand masking | `filterStateForPlayer` (owner sees own rooting + hand) |
| Stale chair repair | `repairGridChairSpawns`, `gridChairSpawnNeedsRepair` |
| Obstacle catalog | `GRID_21X15_OBSTACLE_CATALOG` |
| Rule context | `buildRuleContext`, `packages/engine/src/rules/` |
| Lobby rules | `setLobbyRuleSettings`, `updateLobbyRules` (local host) |

---

## Client UI overlays (2D + 3D)

| UI | File | Purpose |
|----|------|---------|
| Mansion console | `HUD3D.tsx` | Heir card, dice, rooting, logs, collapse rail |
| Hand panel | `HandPanel.tsx` | Bottom horizontal retained trap cards |
| Deck widget | `DeckWidget.tsx` | Bottom-right deck + discard counts |
| Detective track | `DetectiveWidget.tsx` | 10-slot progress (slot 10 = door) |
| Compass | `Scene3D.tsx` | Camera reset (z-index below HUD) |
