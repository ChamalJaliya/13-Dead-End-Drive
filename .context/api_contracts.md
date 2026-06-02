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
| 2026-06-01 | Bots | `BotDecisionRequest` / `BotDecisionResponse`, `bot-api.ts` | `src/types/bot-api.ts`, `services/bot-ai/` |
| 2026-06-01 | FX | `ClientFxEvent` union + `detectClientFxEvents` diff pipeline | `src/client/fx/clientFxTypes.ts`, `detectClientFxEvents.ts` |
| 2026-06-01 | FX | `planFxBatchPlayback` + `executeFxBatchPlan` (testable playback planning) | `src/client/fx/planFxBatchPlayback.ts`, `executeFxBatchPlan.ts` |
| 2026-06-01 | Transport | Colyseus + Nest online play, lobby REST, env vars | RFC 005, `apps/game-server/` |
| 2026-06-01 | Arch | Workspace packages `@ded/*`, `GameSession`, `dispatchGameEvent`, `useUiStore` | RFC 006, `packages/` |
| 2026-06-01 | Rules | `ruleProfile`, `enabledModules` on `GameState`; RFC 007 Phase 1 registry | `rule-profile.ts`, `packages/engine/src/rules/` |
| 2026-06-01 | Rules | G01 visible rooting: 2p = 6 cards each, no `secretCharacterIds` deal | `gameInitializer.ts` |
| 2026-06-01 | Rules | RFC 007 Phase 3: `SECRET_PASSAGES` board cells + movement hop validation | `applyBoardModules.ts`, `moveCharacter.ts` |
| 2026-06-01 | Rules | RFC 007 Phase 4: `applyModuleLegalActions` in `enumerateLegalActions` | `legalActions.ts`, `rules/` |
| 2026-06-01 | Rules | RFC 007 Phase 5: `EXTENDED_TRAP_DECK` → `buildExtendedDeck()` | `cardDeck.ts` |
| 2026-06-01 | GDD | `GRID_21X15_OBSTACLE_CATALOG` (71 cells); `gdd_board_nodes.json` sync | `boardDefinition.ts`, `data/` |
| 2026-06-01 | GDD | `GRID_21X15_GUTTER_WALLS` (33 edges), `BoardEdgeId`, `GutterWallSegment` | `boardDefinition.ts`, `data/gdd_board_nodes.json` |
| 2026-06-01 | GDD | `gdd_trap_deck.json` mirrors `buildDeck()` counts | `data/gdd_trap_deck.json` |
| 2026-06-01 | Client | `setLobbyRuleSettings`, `LobbyRulesPanel`, `updateLobbyRules` | `useGameStore.ts`, `localMultiplayerClient.ts` |

---

## 9. Clean architecture packages & client dispatch (RFC 006)

### Workspace packages

| Package | Path | Imports allowed |
|---------|------|-----------------|
| `@ded/types` | `packages/types/src` | — |
| `@ded/engine` | `packages/engine/src` | `@ded/types` |
| `@ded/network` | `packages/network/src` | `@ded/engine`, `@ded/types` |
| `@ded/game-logic` | `packages/game-logic/src` | `@ded/engine`, `@ded/network`, `@ded/types` |

`src/types/*`, `src/engine/*`, etc. re-export from `@ded/*` for backward compatibility.

### `GameSession` port

| Method | Purpose |
|--------|---------|
| `submitAction(event)` | Apply (solo/local) or send (online) |
| `getState()` | Current authoritative view |
| `onState(cb)` | Subscribe to updates |
| `dispose()` | Tear down |

Implementations: `SoloSession`, `LocalSession`, `OnlineSession` in `src/client/session/`.

### `dispatchGameEvent(ctx, event)`

Single client ingress; calls `session.submitAction`. Online returns `null` (state via `STATE_SYNC` only).

### Bot HTTP routing (locked)

| Mode | Path |
|------|------|
| Solo | `VITE_BOT_SERVICE_URL` → Vite `/bot-api` → `bot-ai:8000` |
| Online | `BOT_AI_URL` on game-server (`BotTurnCoordinator`) |

---

## 8. Colyseus + Nest online transport (RFC 005)

### Environment variables

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `COLYSEUS_URL` | Client | `ws://localhost:2567` | Colyseus WebSocket endpoint |
| `VITE_COLYSEUS_URL` | Client | same | Vite-exposed WS URL |
| `VITE_ONLINE_MULTIPLAYER` | Client | `false` | Feature flag for lobby “Play online” |
| `PORT` | game-server | `2567` | HTTP + Colyseus port |
| `SUPABASE_URL` | game-server | — | Postgres API |
| `SUPABASE_SERVICE_ROLE_KEY` | game-server | — | Server writes (never in client) |
| `BOT_AI_URL` | game-server | `http://localhost:8000` | Online bot decisions |
| `VITE_BOT_SERVICE_URL` | Client | `/bot-api` | Solo bot proxy path |
| `CORS_ORIGINS` | game-server | `http://localhost:5173` | Comma-separated allowlist |
| `AUTH_REQUIRED` | game-server | `false` | When `true`, lobby requires Bearer JWT (v2) |
| `NODE_ENV` | game-server | — | `production` enforces Supabase env |

### Lobby REST (Nest)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/lobby/create` | `{ displayName: string }` | `{ roomId, roomCode, playerId, gameState }` |
| `POST` | `/lobby/join` | `{ roomCode, displayName }` | `{ roomId, roomCode, playerId, gameState }` |
| `POST` | `/lobby/start` | `{ roomId, playerId, playerIds, displayNames }` | `{ gameState }` |
| `GET` | `/health` | — | `{ status: 'ok' }` |

### Colyseus room: `dead_end_drive`

**Join options (`client join`):**

| Field | Type | Required |
|-------|------|----------|
| `roomCode` | `string` | join existing |
| `playerId` | `PlayerId` | yes |
| `displayName` | `string` | yes |

**Client → server messages (`room.send`):**

| Message | Payload | Notes |
|---------|---------|-------|
| `playerAction` | `SocketEvent` | Authoritative turn intent |

**Server → client messages (`client.send`):**

| Message | Payload | Notes |
|---------|---------|-------|
| `STATE_SYNC` | `{ type: 'STATE_SYNC', payload: { gameState, privateHand? } }` | Masked per player |
| `ERROR` | `ErrorResponse` | `EngineError.code` mapped |

Matchmaking: `client.joinOrCreate('dead_end_drive', { roomCode, playerId, displayName })`.

### `playMode` (client store)

`'solo' | 'local' | 'online'` — only `online` forbids local `processTurn`.

---

## 7. Solo vs bots API (`POST /v1/decide`)

Client sends **masked** `GameState` (via `filterStateForPlayer`) plus precomputed `legalActions`. Python returns an index into `legalActions` only — never invents moves.

### `BotDifficulty`

`'EASY' | 'NORMAL' | 'HARD'`

### `BotStrategy`

`'HEURISTIC' | 'LLM'` (LLM requires `LLM_ENABLED` on service)

### `BotDecisionRequest`

| Field | Type | Notes |
|-------|------|-------|
| `gameId` | `GameId` | |
| `botPlayerId` | `PlayerId` | Active bot seat |
| `difficulty` | `BotDifficulty` | Heuristic weights |
| `strategy` | `BotStrategy` | |
| `maskedState` | `GameState` | Player-filtered |
| `legalActions` | `BotActionOption[]` | Engine-valid choices |

### `BotDecisionResponse`

| Field | Type | Notes |
|-------|------|-------|
| `actionIndex` | `number` | `0 <= index < legalActions.length` |
| `confidence` | `number` | 0–1 |
| `rationale` | `string` | Debug / UI |
| `strategyUsed` | `BotStrategy` | Actual strategy after fallback |

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
| `ruleProfile` | `'STANDARD' \| 'ADVANCED'` | Default `STANDARD`; G01 baseline |
| `enabledModules` | `readonly RuleModuleId[]` | Ignored when `STANDARD` |
| `boardVersion` | `'GRID_21X15' \| 'FIXTURE'` | Play uses `GRID_21X15` |
| `subPhase` | `GameSubPhase` | Includes `CHOOSE_MOVEMENT_PLAN`, `AWAITING_TRAP_*` |
| `movementPlan` | `'SPLIT' \| 'COMBINED' \| null` | After roll |
| `exposedRooting` | `Partial<Record<CharacterId, PlayerId>>` | Public on elimination |
| `detectivePosition` | `DetectiveTrack` | `maxSteps: 10` |
| `activePortrait.currentHeirId` | `PortraitHeirId` | Starts `AUNT_AGATHA` |
| `ruleProfile` | `'STANDARD' \| 'ADVANCED'` | Default `STANDARD`; host sets in lobby |
| `enabledModules` | `readonly RuleModuleId[]` | Used only when `ruleProfile === 'ADVANCED'` |

### `RuleModuleId` (builtin)

| Module | Effect |
|--------|--------|
| `SECRET_PASSAGES` | Five teleport-linked cells on board at init |
| `EXTENDED_TRAP_DECK` | `buildExtendedDeck()` (same 29-card mix; `ext-` card ids) |

Types: `packages/types/src/rule-profile.ts`. Registry: `packages/engine/src/rules/`.

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
| `characterIds` | Full (G01: all rooting guests on HUD) | Hidden (`[]`) |
| `secretCharacterIds` | Legacy field (empty in new deals) | Hidden |
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
