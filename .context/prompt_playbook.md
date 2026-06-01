# ═══════════════════════════════════════════════════════════════════════════════
# prompt_playbook.md — Successful Prompt History Archive
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Archive prompts and patterns that produced verified, passing results.
#          Read this before writing new prompts to avoid reinventing patterns.
# Format : Milestone → Context → Prompt Anatomy → Key Decisions → Result
# ═══════════════════════════════════════════════════════════════════════════════

---

## Milestone 2.1 — Spatial Engine: moveCharacter()

### Context
- **Phase gate**: 2.1 — Core Pathing & Movement Validation
- **Target file**: `src/engine/moveCharacter.ts`
- **Test file**: `src/__tests__/engine/moveCharacter.spec.ts`
- **Test count**: 18 tests (14 from Phase 1.4 spec + 4 immutability assertions)
- **Final result**: ✅ 18/18 GREEN, 159ms

### Effective Prompt Anatomy
The Phase 2.1 implementation prompt succeeded because it provided:

1. **Role assignment with narrow scope**
   > "Act as a Senior Core Engine Developer. Implement the logic for
   > `moveCharacter(state, event): GameState` inside `src/engine/moveCharacter.ts`."

   The role assignment scoped the agent to ONE function signature and ONE file.
   Broad role assignments ("implement the game engine") produce scope creep.

2. **Explicit exclusion list**
   > "Do not implement trap executions or card plays in this file. Focus
   > exclusively on moving the pawn safely across the grid."

   Listing WHAT NOT TO DO is as important as listing what to do.
   Without this, agents add speculative logic that breaks future phase tests.

3. **Numbered implementation requirements (ordered by pipeline position)**
   > 1. Path Contiguity — adjacency graph validation
   > 2. Dice Roll Enforcement — pipsUsed <= movementDie
   > 3. Obstacle/Wall Collision — board adjacency list scan
   > 4. Immutability — pure spread cloning
   > 5. No Collateral Logic

4. **Explicit verification command**
   > "Run `npm test moveCharacter.spec.ts`. Verify all specs pass and present
   > the terminal results for review."

   Including the terminal output requirement forces the agent to actually
   run the tests rather than claiming they will pass.

### Key Implementation Decisions Made in This Milestone

| Decision | Rationale |
|----------|-----------|
| Adjacency graph on `GridCell.adjacentCells` | No implicit spatial assumptions; board topology is fully data-driven |
| Guard ordering: turn → exists → control → status → dice → path → contiguity → blocker | Earlier guards prevent information leakage; error codes are predictable |
| `expectEngineError(fn, code)` helper in tests | Vitest's `.toThrow(string)` matches the message string, not the typed `.code` field |
| Partial moves allowed: `pipsUsed <= movementDie` | Original board game allows using fewer steps than the die value |
| `EngineError` class with typed `.code` field | Allows WS transport to map directly to `ErrorResponse` without `instanceof` chains |

### Prompt Anti-Patterns Identified (do not repeat)
- Asking the agent to "implement the full movement system" without a file target
- Not specifying that `.toThrow('CODE_STRING')` is unreliable for typed error codes
- Forgetting to include the terminal run command in the prompt
- Allowing the agent to write tests and implementation in a single shot

---

## Milestone 2.2 — Trap Auto-Trigger Engine: trapEvaluator() + advanceDetective()

### Context
- **Phase gate**: 2.2 — Server-Side Trap Auto-Trigger Mechanics
- **Target files**: `src/engine/trapEvaluator.ts`, `src/engine/detectiveTrack.ts`
- **Wiring change**: `src/engine/moveCharacter.ts` updated to call `evaluateTraps()` as Step 5
- **Test file**: `src/__tests__/engine/trapAutoTrigger.spec.ts`
- **Test count**: 13 tests
- **Final result**: ✅ 13/13 GREEN, 213ms total (34/34 including 2.1 — zero regressions)

### Effective Prompt Anatomy
The Phase 2.2 implementation prompt succeeded because it specified:

1. **Mandatory pre-read requirement**
   > "Read `/.cursorrules`, `/src/engine/engine-rules.mdc`, and your updated
   > local data schemas."

   This prevented the agent from reinventing already-resolved constraints
   (the "matching TrapCard in hand" ambiguity was resolved in engine-rules.mdc).

2. **Post-condition framing (not an independent function)**
   > "This logic must run as a post-condition sequence right after a player
   > executes a valid movement."

   Framing as a post-condition correctly placed the evaluateTraps() call
   INSIDE moveCharacter.ts rather than as a standalone client-triggered endpoint.

3. **Explicit cascade order**
   > 1. Set character status to DEAD
   > 2. Update trap state from READY to SPENT
   > 3. Check FireplacePortrait — cycle if heir was eliminated

   Cascade order prevents the agent from inverting steps (e.g., spending the trap
   AFTER eliminating characters, which could cause double-elimination bugs).

4. **Explicit no-client-triggering rule**
   > "Ensure this entire pipeline runs entirely server-side as a side effect
   > of the movement action."

   This maps directly to engine-rules.mdc Rule 4 and prevented creation of a
   TRIGGER_TRAP socket event handler.

### Key Implementation Decisions Made in This Milestone

| Decision | Rationale |
|----------|-----------|
| Position-only triggering (no card match) | Phase 1.4 TDD tests are authoritative spec; engine-rules.mdc documents the deviation |
| Two separate modules (trapEvaluator + detectiveTrack) | Detective advances on event die, not on movement; merging violates module boundary Rule 3 |
| CHARACTER_IDS scan order for portrait rotation | Deterministic, reproducible; random selection would break state replay on reconnect |
| `computePlayerElimination()` as a cascade step | Player elimination is a derived fact; computing it inline keeps GameState always consistent |
| `resolveWinner`: first non-eliminated player in `turnOrder` | Simple, predictable, testable; spec asserts `winner !== null` |

### Spec Design Patterns Established in This Milestone

**Pattern: State-per-test construction (no shared mutable state between tests)**
```typescript
beforeEach(() => {
  state = makeGameState({
    lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
    characters: { ...makeGameState().characters, RUSTY: makeCharacter(...) },
    board: { ...makeGameState().board, B3: makeCell(...) },
  });
});
```

**Pattern: Single-hop move helper scoped to trap tests**
```typescript
function makeOnHopMove(characterId, fromCell, toCell, playerId): MovePawnEvent
// Encapsulates pipsUsed: 1, path: [fromCell, toCell] — every trap test uses exactly 1 pip
```

**Pattern: Suite organization by trap state, not by narrative scenario**
```
Suite 1: READY trap — lethal      (4 cases)
Suite 2: READY trap — non-lethal  (2 cases)
Suite 3: SPENT trap               (2 cases)
Suite 4: Multi-character zone     (1 case)
Suite 5: Portrait rotation        (3 cases)
Suite 6: Detective mass elim.     (3 cases)
```
Organizing by trap state makes boundary conditions self-evident and prevents overlap.

### Prompt Anti-Patterns Identified (do not repeat)
- Framing the trap trigger as a client-emitted socket event
- Asking for "the trap system" without specifying the cascade order
- Forgetting to require a regression check against Phase 2.1 tests
- Conflating "trap fires on card match" with "trap fires on position" (the digital spec removed card matching)

---

## Prompt Templates for Upcoming Milestones

### Template A — Phase 2.3: playCard() Implementation
```
# Phase 2.3: Implement Card Play Validation Engine

Context locks (read before starting):
  - /.cursorrules (Rule 2: zero loose types, discriminated unions)
  - /src/engine/engine-rules.mdc (Section 6: Card Play Rules)
  - /.context/system_state.md (confirm active phase and module registry)

Role: Senior Gameplay Systems Developer.

Task: Implement `playCard(state, event): GameState` in `src/engine/playCard.ts`.

Requirements:
  1. Use switch/exhaustive-check on payload.cardType — no if-else chains
  2. Each case handles ONLY the fields in its discriminated union variant
  3. Missing required fields → throw EngineError('MALFORMED_PAYLOAD')
  4. Guard order: CARD_NOT_IN_HAND → CHARACTER_NOT_YOURS → INVALID_MOVE → TRAP_ALREADY_SPENT
  5. Remove played card from player.hand immutably after success
  6. Do NOT implement win condition or trap evaluation in this file

Scope exclusions (FORBIDDEN in this file):
  - Trap firing logic (belongs in trapEvaluator.ts)
  - Portrait rotation logic (handled by trapEvaluator.ts cascade)
  - Win condition checks (belongs in winCondition.ts)

Verification:
  Run: npx vitest run --reporter=verbose
  Present full terminal output.
  Confirm: 18/18 cardValidation.spec.ts GREEN AND 34/34 total still GREEN.
```

### Template B — Phase 2.4: winCondition() Implementation
```
# Phase 2.4: Implement Win Condition Resolution

Context locks (read before starting):
  - /.context/system_state.md (confirm Phase 2.3 complete)
  - /src/engine/engine-rules.mdc (Section 7: Win Condition Rules)

Role: Senior Core Engine Developer.

Task: Implement `evaluateWinCondition(state): GameState` in `src/engine/winCondition.ts`.

Rules:
  1. HEIR_ESCAPED: character at EXIT_DOOR AND isPortraitHeir === true
     → winner = controller of that character, winCondition = 'HEIR_ESCAPED', phase = 'GAME_OVER'
  2. LAST_ALIVE: only one player has at least one ALIVE character
     → winner = that player, winCondition = 'LAST_ALIVE', phase = 'GAME_OVER'
  3. NON_HEIR_EXIT_ATTEMPT: character at EXIT_DOOR AND isPortraitHeir === false
     → reset position to 'FOYER', no elimination, no win

Wire: Call evaluateWinCondition() as Step 6 in moveCharacter.ts pipeline,
      after evaluateTraps() returns.

Verification:
  Run: npx vitest run --reporter=verbose
  Confirm: all winCondition.spec.ts GREEN AND 52/52 total still GREEN.
```

---

## Milestone 4.x — Client HUD Overlays (GRID_21X15)

### Context
- **Phase:** 4.6–4.9 client UX on top of stable engine
- **Components:** `HUD3D`, `HandPanel`, `DeckWidget`, `DetectiveWidget`, `Scene3D` compass
- **Test count:** 82 specs (includes `*.spec.tsx` + `happy-dom`)

### Effective patterns
1. **Single HUD parent** — `HUD3D` mounts all overlays for both 2D and 3D (`App.tsx`).
2. **Bottom horizontal hand** — trap cards in `HandPanel`; rooting stays in right console.
3. **Collapsible console** — `isConsoleCollapsed` local state; compass `z-5` so collapse button is clickable.
4. **Detective = 10 slots** — engine `DETECTIVE_TRACK_MAX_STEPS`; UI dots match `maxSteps`.
5. **Owner secret visibility** — `filterStateForPlayer` must not strip owner's `secretCharacterIds`.

### Anti-patterns
- Putting hand cards only in the tall right console (wastes board space).
- Compass overlay at `z-20` over HUD controls.
- Documenting 13-step detective after 2026-05-27 rule change.

---

## Milestone 4.10 — Solo vs bots + Python `bot-ai`

### Context
- **Flow:** Lobby → `startSoloVsBots(name, 1|2|3, difficulty)` → `BotOrchestrator` on bot turns
- **Legal moves:** `src/bots/legalActions.ts` (must match engine); Python only picks `actionIndex`
- **Fallback:** `heuristicFallback.ts` when `/bot-api/v1/decide` fails
- **Tests:** `botRegistry`, `legalActions`, `botOrchestrator`, `startSoloVsBots`; `services/bot-ai/tests`

### Effective patterns
1. **Masked state** — `filterStateForPlayer(state, botId)` before HTTP payload.
2. **No hot-seat solo** — `resolveActingPlayerId` always returns `localPlayerId`; `isHumanTurn` gates UI.
3. **Wire orchestrator** — end of `syncServerState` when `botPlayerIds.length > 0`.
4. **TDD legal actions** — one `it()` per sub-phase; round-trip `processTurn` on fixtures.
