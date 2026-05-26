# RFC 002: Server-Side Automated Trap Post-Conditions

## Status
APPROVED

## Context & Problem Statement
In the physical 13 Dead End Drive board game, traps are manually triggered by players who hold a matching secret `TrapCard` when an opponent's character lands on one of the 5 lethal trap tiles.

In our digital multiplayer adaptation, we must enforce this state cascade server-side to prevent client cheating, hacked socket emissions, or out-of-sync player views.

## Proposed Design
We execute trap triggers strictly server-side as an automatic post-condition sequence right after a character finishes moving. The client does not emit a separate "trigger trap" event; the server evaluates the landing position automatically during the movement pipeline.

### State Transition Cascade
The trap evaluation logic is housed in `trapEvaluator.ts` and processes as a synchronous pipeline:

1. **Automatic Landing Scan:** Upon path completion, the engine inspects the character's final position. If it matches one of the five designated trap tiles (`CHANDELIER`, `STAIRS`, `FIREPLACE`, `SAFE`, `STATUE`), a trap check is initialized.
2. **Condition Matrix Check:**
   - The trap's state must be `READY`.
   - The moving player's hand array (`PlayerState.hand`) must contain at least one secret `ActionCard` of type `TRIGGER_TRAP_REMOTE` or the matching `TrapCard`. Note: In Phase 2.2's implementation, the architectural specification was simplified: traps trigger automatically based on landing position and state, simulating a player pulling the lever.
3. **State Mutation Cascade:**
   - The character's status transitions immutably to `ELIMINATED` and the `eliminationCause` is marked as `'TRAP'`.
   - The trap state value transitions from `'READY'` to `'SPENT'`.
   - The eliminated character is removed from the occupant list of the board cell.
   - If the eliminated character was the current heir (`isPortraitHeir === true` on the `FireplacePortrait`), the portrait sequence immediately cycles.

### Fireplace Portrait Sequence
When the active heir is eliminated, the engine cycles the `activePortrait` to a new heir:
- The previous heir is marked `isPortraitHeir = false` and added to the `portraitHistory` array.
- A new heir is chosen from the remaining alive characters according to a pre-defined order, marking them `isPortraitHeir = true`.
- The `lastChangedReason` is recorded as `'HEIR_ELIMINATED'`.
- If a player controls the new portrait heir, their winning condition is activated.
