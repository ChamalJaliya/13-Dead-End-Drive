# RFC 003: Type-Safe Card Actions via Discriminated Unions

## Status
APPROVED

## Context & Problem Statement
The 13 Dead End Drive board game utilizes diverse card actions (e.g. rotating the portrait, rearming a spent trap, delaying the detective, moving bonus spaces, or triggering a remote trap). If the socket payloads are loosely typed, there is a risk of payload contamination (e.g. sending a portrait rotation action with a trap rearm ID), leading to runtime exceptions and server vulnerabilities.

## Proposed Design
We use strict, discriminated unions in TypeScript to represent each card play payload, keyed off the `cardType` discriminator. Each card type variant carries *only* the specific fields it requires.

```typescript
export interface RotatePortraitPayload extends BasePlayCardPayload {
  readonly cardType:          'ROTATE_PORTRAIT';
  readonly targetCharacterId: CharacterId;
}

export interface RearmTrapPayload extends BasePlayCardPayload {
  readonly cardType:     'REARM_TRAP';
  readonly targetTrapId: TrapId;
}

export interface BlockDetectivePayload extends BasePlayCardPayload {
  readonly cardType: 'BLOCK_DETECTIVE';
}

export interface BonusMovePayload extends BasePlayCardPayload {
  readonly cardType:          'BONUS_MOVE';
  readonly targetCharacterId: CharacterId;
  readonly targetCellId:      CellId;
}

export interface TriggerTrapRemotePayload extends BasePlayCardPayload {
  readonly cardType:     'TRIGGER_TRAP_REMOTE';
  readonly targetTrapId: TrapId;
}

export type PlayCardPayload =
  | RotatePortraitPayload
  | RearmTrapPayload
  | BlockDetectivePayload
  | BonusMovePayload
  | TriggerTrapRemotePayload;
```

### Pure Validation Rules (`playCard.ts`)
The `playCard()` engine function acts as a pure state-transformation module and implements strict, non-overlapping validation:

1. **Card Ownership Guard:** The active player must physically possess the `cardId` in their hand array. If not, throw `CARD_NOT_IN_HAND`.
2. **Action Dispatch:**
   - `'ROTATE_PORTRAIT'`: Ensures the targeted character is alive and not already the active heir. Rotates portrait and updates history.
   - `'REARM_TRAP'`: Ensures the targeted trap is `'SPENT'`. Sets state back to `'READY'`.
   - `'BLOCK_DETECTIVE'`: Sets `detectiveBlockedThisTurn = true` in the state flags.
   - `'BONUS_MOVE'`: Updates character position directly by validating path and adjacency (or simple jump based on requirements).
   - `'TRIGGER_TRAP_REMOTE'`: Fires a READY trap directly without requiring physical character presence.
3. **Card Consumption:** Removes the played card from the player's hand array.

### Strict Modular Isolation (Hard Walls)
To enforce modular hygiene and prevent circular references:
- **No Turn Advancement:** The active player's turn is *not* rotated inside `playCard.ts`. In the physical game, playing a card is an action done during a player's turn, which remains active for their movement action.
- **No Win Scans:** Win evaluations are kept separate from card execution, managed entirely by the high-level `turnOrchestrator` after the card play completes.
- **No Network Deltas:** `playCard` is 100% synchronous, side-effect-free, and deals only with the state records, decoupled from any network sockets or broadcast code.
