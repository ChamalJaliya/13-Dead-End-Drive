# RFC 001: Spatial Engine Adjacency Graph Path Validation

## Status
APPROVED

## Context & Problem Statement
In digital board game engines, pawn movement tracking usually relies on one of two approaches:
1. Hardcoded 2D coordinate arrays where walls are represented by structural bitmaps.
2. A declarative data-driven graph representation where spatial adjacencies are explicit.

For 13 Dead End Drive, coordinate math is insufficient because of architectural idiosyncrasies like stairs, secret passageways, and non-Euclidean board structures. Furthermore, a 2D wall bitmap is difficult to maintain and lacks the deterministic testability required for client-server state replication.

## Proposed Design
We model the game board as a pure adjacency graph where each tile is a node (`GridCell`) and edges are declared as explicit connections in `GridCell.adjacentCells` arrays.

```typescript
export interface GridCell {
  readonly cellId:         CellId;
  readonly cellType:       CellType;
  readonly occupants:      readonly CharacterId[];
  readonly trapRef:        TrapId | null;
  readonly isExitAdjacent: boolean;
  readonly adjacentCells:  readonly CellId[];
}
```

### Key Design Decoupling
To avoid contamination, the pure board game engine performs instantaneous, atomic state transitions: pawn positions update immediately in `GameState.characters`, and active traps transition directly to `SPENT`. Visual physics loops, coordinate translations, and animations (such as a falling chandelier's acceleration or stairs sliding vectors) are delegated entirely to the client layer using the returned state.

### Security Guard Ordering & Information Leakage Prevention
To prevent client-side information leakage (i.e. players guessing hidden heir identities or card states based on specific validation errors), movement events are routed through a strictly ordered pipeline of guards in `moveCharacter.ts`:

1. **Active Turn Guard:** Check if `event.playerId === state.activePlayerId`. If not, throw `NOT_YOUR_TURN`.
2. **Character Verification:** Ensure character exists and is alive (`status === 'ALIVE'`). If not, throw `INVALID_MOVE`.
3. **Control Ownership:** Assert that the character is either neutral (controlled by `null`) or controlled by the active player. If controlled by another player, throw `CHARACTER_NOT_YOURS`.
4. **Dice Roll Presence:** Verify that a valid dice roll exists in `state.lastDiceRoll`.
5. **Path Validation:**
   - Path length must match the dice roll pips (`path.length === diceRoll`).
   - Path must start at the character's current position.
   - Path cannot contain duplicate nodes (no self-intersecting loops allowed).
6. **Path Contiguity:** Traverse the path node-by-node and verify that for every index $i$, `path[i]` contains `path[i+1]` in its `adjacentCells` list. If not, throw `INVALID_MOVE`.

### Test Architecture: `expectEngineError()`
To guarantee clean assertions under strict type checking, we reject standard Vitest `.toThrow(string)` assertions, which match only error message strings. Instead, we use `expectEngineError()`, a custom test helper that asserts against typed `SocketErrorCode` codes returned inside our custom `EngineError` payload:

```typescript
export function expectEngineError(fn: () => void, code: SocketErrorCode): void {
  try {
    fn();
    throw new Error(`Expected EngineError with code ${code}, but no error was thrown`);
  } catch (err: unknown) {
    if (err instanceof EngineError) {
      expect(err.code).toBe(code);
    } else {
      throw err;
    }
  }
}
```
