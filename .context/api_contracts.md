# API Contracts & Type Definitions Changelog

Living source of truth for public TypeScript interfaces, socket events, and enum values.

---

## 1. Type Definitions & Enums Changelog

| Date | Phase | Change Description | Modified Files |
|------|-------|--------------------|----------------|
| 2026-05-23 | 1.3 | Initial WebSocket and game state contract skeletons | `src/types/*` |
| 2026-05-23 | 2.3 | `INVALID_CARD_PAYLOAD` on `SocketErrorCode` | `enums.ts` |
| 2026-05-23 | 3.1 | Lobby transport error codes | `enums.ts` |
| 2026-05-25 | 2p | `secretCharacterIds[]`, `hasHiddenSecretCard`, `secretCardsRevealed` | `game-state.ts` |
| 2026-05-25 | PDF | 29-card deck, portrait stack, trap draw/play | `cardDeck.ts`, `trapEvaluator.ts` |
| 2026-05-25 | GDD | `data/gdd_*.json`, `makeThreePlayerSandbox()` | fixtures |
| 2026-05-27 | Board | Canonical `GRID_21X15` (315 cells, `A1`–`U15`) | `boardDefinition.ts` |
| 2026-05-27 | Rules | `PortraitHeirId` = `CharacterId \| 'AUNT_AGATHA'`; `OPENING_AGATHA` | `enums.ts`, `entities.ts` |
| 2026-05-27 | Rules | `exposedRooting` partial map on `GameState` | `game-state.ts` |
| 2026-05-27 | Rules | `DETECTIVE_TRACK_MAX_STEPS` **13 → 10** | `enums.ts`, `boardDefinition.ts` |
| 2026-05-27 | Rules | `GRID_21X15_CHAIR_LAYOUT_REVISION`, dining chair set | `boardDefinition.ts` |
| 2026-05-27 | Network | Owner always receives own `secretCharacterIds` in `filterStateForPlayer` | `broadcastPipeline.ts` |
| 2026-05-27 | Turn | `movementPlan`, `firstMoveCharacterId`, `CHOOSE_MOVEMENT_PLAN` | `game-state.ts`, `socket-events.ts` |

---

## 2. Core Types (summary)

### `PortraitHeirId`

```typescript
export type PortraitHeirId = CharacterId | 'AUNT_AGATHA';
```

Used by `FireplacePortrait.currentHeirId`. Aunt Agatha is portrait-only (not a movable pawn).

### `GameState` (selected fields)

| Field | Type | Notes |
|-------|------|-------|
| `boardVersion` | `'GRID_21X15' \| 'FIXTURE'` | Play uses `GRID_21X15` |
| `subPhase` | `GameSubPhase` | Includes `CHOOSE_MOVEMENT_PLAN`, `AWAITING_TRAP_*` |
| `movementPlan` | `'SPLIT' \| 'COMBINED' \| null` | After roll |
| `exposedRooting` | `Partial<Record<CharacterId, PlayerId>>` | Public on elimination |
| `detectivePosition` | `DetectiveTrack` | `maxSteps: 10` |
| `activePortrait.currentHeirId` | `PortraitHeirId` | Starts `AUNT_AGATHA` |

### `DetectiveTrack`

```typescript
export interface DetectiveTrack {
  readonly currentStep:   number;   // 0..maxSteps
  readonly maxSteps:      number;   // 10
  readonly trackCells:    readonly CellId[];  // length 10
  readonly isAtExit:      boolean;  // currentStep >= maxSteps
}
```

---

## 3. Socket Error Codes

```typescript
export type SocketErrorCode =
  | 'INVALID_MOVE'
  | 'NOT_YOUR_TURN'
  | 'CHARACTER_NOT_YOURS'
  | 'TRAP_ALREADY_SPENT'
  | 'CARD_NOT_IN_HAND'
  | 'GAME_ALREADY_OVER'
  | 'MALFORMED_PAYLOAD'
  | 'INVALID_CARD_PAYLOAD'
  | 'IDEMPOTENCY_CONFLICT'
  | 'ROOM_FULL'
  | 'ROOM_NOT_FOUND'
  | 'GAME_ALREADY_STARTED'
  | 'UNAUTHORIZED_ACTION';
```

---

## 4. State masking (`filterStateForPlayer`)

| Viewer | Self | Opponents |
|--------|------|-----------|
| `characterIds` | Full | Hidden (`[]`) |
| `secretCharacterIds` | Full (always) | Hidden until `secretCardsRevealed` |
| `hand` | Full | Hidden (`[]`) |
| `exposedRooting` | Full (global) | Full (global) |

---

## 5. Turn events (high level)

| Event | Purpose |
|-------|---------|
| `ROLL_DICE` | Roll 2d6 |
| `CHOOSE_MOVEMENT_PLAN` | Split vs combined |
| `CHANGE_PORTRAIT` | Optional on doubles |
| `MOVE_PAWN` | Path + pips |
| `PLAY_TRAP_CARD` / `DRAW_TRAP_CARD` / `DECLINE_TRAP` | Trap resolution |
| `END_TURN` | Force end (if applicable) |

Full discriminated unions: `src/types/socket-events.ts`.

---

## 6. Client-only modules (not in GameState contract)

| Component | Reads | Writes via store |
|-----------|-------|------------------|
| `HandPanel` | `players[local].hand` | `playTrapCard` |
| `DeckWidget` | `deck.length`, `discardPile.length` | — |
| `DetectiveWidget` | `detectivePosition` | — |
