# Software Requirements Specification (SRS): 13 Dead End Drive
# ─────────────────────────────────────────────────────────────────────────────
# Revision history:
#   v1.0  Phase 1.3 — Initial skeleton
#   v1.1  Phase 1.4 — Trap trigger condition resolved to position-only (no card match)
#   v1.2  Phase 2.2 — Sprint 2.2 closed; non-heir exit rule confirmed as silent FOYER reset
#   v1.3  2026-05-27 — Phases 2–4 complete for solo/local; GRID_21X15 + HUD overlays
# ─────────────────────────────────────────────────────────────────────────────

---

## 1. Non-Technical Vision & Agile Roadmap

- **Core Concept:** Digital multiplayer adaptation of the 13 Dead End Drive mystery board game
  emphasizing hidden character identities, strategic bluffing, and server-side automated
  trap mechanics. 2–4 players compete to manoeuvre the portrait heir to the estate exit
  while using action cards to spring traps on rivals.

- **Sprint Roadmap Status:**

  | Phase | Feature | Status |
  |-------|---------|--------|
  | Phase 1 | Design & Verification | ✅ COMPLETE |
  | Phase 2 | Core Engine (2.1–2.5) | ✅ COMPLETE |
  | Phase 3.1–3.5 | Transport + local multiplayer | ✅ COMPLETE |
  | Phase 3.6 | Reconnect & hand projection | 🔲 PENDING |
  | Phase 4 | Client UI (2D/3D, HUD, hand/deck/detective) | ✅ COMPLETE |
  | Tests | Vitest suite | ✅ 82/82 GREEN |

---

## 2. Functional Requirements (FR) with BDD Specifications

### FR-1: Spatial Path Contiguity Validation

- **Given:** A character token is on grid cell `fromCell` with an active dice roll
  value of `N` (integer, 1–6).
- **When:** The active player emits a `MOVE_PAWN` socket event containing an ordered
  array of cell IDs representing the intended movement path.
- **Then:** The backend engine asserts all of the following before mutating state:
  1. `path[0]` equals `fromCell` (path must originate at character's current position)
  2. `path[last]` equals `toCell` (path terminal must match declared destination)
  3. No duplicate cell IDs in the path (no U-turn looping)
  4. `pipsUsed === path.length - 1` (each hop costs exactly 1 pip)
  5. `pipsUsed <= movementDie` (cannot exceed the rolled die value)
  6. Every consecutive pair `[path[i], path[i+1]]` is a declared edge in
     `GridCell.adjacentCells` (board adjacency graph — no coordinate arithmetic)
  7. No intermediate cell (cells except the destination) is occupied by another character
  8. The destination cell exists in the board map

  Any violation throws `EngineError` with the appropriate `SocketErrorCode` and
  returns an `ErrorResponse` to the client. State is not mutated on failure.

> **Implementation note:** Spatial topology is encoded as adjacency lists on each
> `GridCell.adjacentCells: CellId[]`. There is no coordinate grid — all path
> validation is graph traversal, not arithmetic. See `src/engine/moveCharacter.ts`.

---

### FR-2: Server-Side Autonomous Trap Execution

- **Given:** A character pawn completes a valid path and lands on a cell whose
  `trapRef` field is non-null.
- **When:** The referenced trap's `state` is `'READY'`.
- **Then:** The server automatically executes an atomic, immutable state cascade:

  **Step 1 — Spend the trap:**
  Set `trap.state = 'SPENT'`.

  **Step 2 — Eliminate characters on lethal cells:**
  For each character whose position is in `trap.eliminatesOnCells` and whose
  `status` is `'ALIVE'`: set `status = 'ELIMINATED'`, `eliminationCause = 'TRAP'`.
  Remove eliminated characters from board cell occupant lists.
  If `trap.eliminatesOnCells` is empty (non-lethal trap), skip this step.

  **Step 3 — Cycle the FireplacePortrait (conditional):**
  If any eliminated character's ID equals `activePortrait.currentHeirId`:
  select the next ALIVE character (deterministic scan of `CHARACTER_IDS`),
  update `activePortrait.currentHeirId`, append the eliminated heir to
  `activePortrait.portraitHistory`, set `lastChangedReason = 'HEIR_ELIMINATED'`.

  **Step 4 — Compute player elimination:**
  For any player whose entire `characterIds` list is now ELIMINATED,
  set `player.isEliminated = true`.

> **⚠️ Critical design decision (resolved Phase 1.4):**
> Trap execution is **position-only**. There is no "TrapCard in hand" matching
> requirement in this digital adaptation. The trap fires solely based on the
> landing cell's `trapRef` and the trap's current `state`. This decision is
> authoritative and overrides any physical board game rules to the contrary.
> See `src/engine/engine-rules.mdc §4` and `src/__tests__/engine/trapAutoTrigger.spec.ts`.

> **No client event is required to fire a trap.** The entire cascade runs
> server-side as a post-condition of `MOVE_PAWN` validation. A client cannot
> initiate, delay, or prevent trap execution.

---

### FR-3: Non-Heir Escape Restriction

- **Given:** A player moves a pawn to the `EXIT_DOOR` cell.
- **When:** The character's `isPortraitHeir` flag is `false` (character is not the
  current portrait heir).
- **Then:** The engine silently resets the character's position to `'FOYER'` in the
  returned `GameState`. No elimination occurs. No error is thrown to the client.
  The move is processed as a completed turn with the pawn at `FOYER`.

> **⚠️ Design clarification (resolved Phase 1.4):**
> This rule does **not** throw an `EngineError`. The non-heir exit attempt is a
> *valid* move that is intercepted and redirected — the game state transitions
> cleanly to the next player's turn with the pawn at FOYER. There is no
> `INVALID_ESCAPE_ATTEMPT` error code in this system.
>
> The complementary case — heir reaching EXIT_DOOR — is handled by `winCondition.ts`
> (Phase 2.4): `winner` is set, `winCondition = 'HEIR_ESCAPED'`, `phase = 'GAME_OVER'`.

---

### FR-4: Detective Track Advancement

- **Given:** The active turn's event die resolves to `'DETECTIVE'`.
- **When:** `advanceDetective(state)` is invoked by the turn orchestrator.
- **Then:**
  - `detectivePosition.currentStep` increments by 1.
  - If `currentStep >= maxSteps` (detective reaches the exit):
    ALL `ALIVE` characters are set to `ELIMINATED` (`eliminationCause = 'DETECTIVE'`),
    all players are marked `isEliminated = true`,
    `phase = 'GAME_OVER'`, `winCondition = 'LAST_ALIVE'`,
    `winner` is set to the first non-previously-eliminated player in `turnOrder`.
  - If `phase` is already `'GAME_OVER'` when called: throws
    `EngineError('GAME_ALREADY_OVER')`.

---

### FR-5: Action Card Plays (Phase 2.3 — Active)

- **Given:** A player holds one or more `ActionCard` objects in their `player.hand`.
- **When:** The player emits a `PLAY_CARD` socket event with a `PlayCardPayload`
  discriminated union.
- **Then:** The server dispatches the card effect via an exhaustive `switch` on
  `payload.cardType`. Each variant is strictly typed and carries only its own fields.
  The played card is removed from `player.hand` after successful execution.

  Supported card types:
  | `cardType` | Effect | Required payload fields |
  |-----------|--------|------------------------|
  | `ROTATE_PORTRAIT` | Changes the portrait heir | `targetCharacterId` |
  | `REARM_TRAP` | Sets a SPENT trap back to READY | `targetTrapId` |
  | `BLOCK_DETECTIVE` | Skips detective advance this turn | *(none)* |
  | `BONUS_MOVE` | Moves a character additional pips | `targetCharacterId`, `targetCellId` |
  | `TRIGGER_TRAP_REMOTE` | Fires a READY trap from distance | `targetTrapId` |

  Guard order (strictly enforced):
  1. Card not in player's hand → `CARD_NOT_IN_HAND`
  2. Target character not controlled by player → `CHARACTER_NOT_YOURS`
  3. Target character is ELIMINATED (where applicable) → `INVALID_MOVE`
  4. Target trap is already READY (for REARM_TRAP) → `INVALID_MOVE`
  5. Target trap is SPENT (for TRIGGER_TRAP_REMOTE) → `TRAP_ALREADY_SPENT`

---

## 3. Non-Functional Requirements

### NFR-1: Determinism
Every engine function is a pure function `(GameState, event) => GameState`. Given the
same inputs, the function always produces the same output. No randomness, no I/O, no
side effects inside `src/engine/`.

### NFR-2: Immutability
The input `GameState` is never mutated. All updates use structural spread cloning.
TypeScript's `readonly` modifiers and `noUncheckedIndexedAccess: true` enforce this
at compile time.

### NFR-3: Strict Typing
`any` is forbidden. All multi-variant payloads use discriminated unions. All
`EngineError` codes are validated against the `SocketErrorCode` literal union at
compile time.

### NFR-4: Real-Time Transport
Game events are transmitted over persistent WebSocket connections. Full `GameState`
is broadcast on `STATE_SYNC`; incremental `GameStatePatch` objects are used for
delta updates to minimize bandwidth.

### NFR-5: Test Coverage Gate
No implementation phase is considered complete until all target tests are GREEN and
zero regressions exist in previously passing tests. Terminal output is required as evidence.
