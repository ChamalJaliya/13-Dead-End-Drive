# RFC 006: Clean Architecture & Package Boundaries

## Status
APPROVED (2026-06-01)

## Context
Colyseus + Nest transport (RFC 005) is live. Shared logic still lives under flat `src/` with `apps/game-server` compiling via tsconfig `include` globs. Production requires compile-time boundaries and a single client dispatch port.

## Decisions

### 1. Workspace packages
| Package | Responsibility |
|---------|----------------|
| `@ded/types` | Domain types, enums, socket events, bot-api |
| `@ded/engine` | Pure `processTurn` pipeline — no I/O |
| `@ded/network` | `routePlayerEvent`, `filterStateForPlayer`, idempotency |
| `@ded/game-logic` | `enumerateLegalActions`, heuristic fallback, `buildSocketEvent` |
| `apps/game-server` | Nest + Colyseus adapters only |
| `src/client` | React, Zustand, FX, pathfinding (until `apps/client` split) |

### 2. Dependency rule
`apps/*` → `packages/*` only. `packages/*` never import `client/` or `server/`. `@ded/engine` never imports `@ded/network`.

### 3. Client dispatch
All player intents: `dispatchGameEvent()` → active `GameSession` (`SoloSession` | `LocalSession` | `OnlineSession`). Online never calls `processTurn` locally.

### 4. Bot HTTP (unchanged from RFC 005)
- Solo: Vite `/bot-api` → `bot-ai`
- Online: `BOT_AI_URL` on game-server via `BotTurnCoordinator`

### 5. Bots choose, never apply
Python returns index only. Server applies via `GameActionService`. Solo bots apply via `SoloSession.submitAction`.

### 6. Persistence
v1: sync Supabase write after each successful action. Debounced flush is v1.1.

### 7. Legacy
`SessionManager` and `actionDispatcher` are deprecated; replaced by `GameSession` + Colyseus room.

## Non-goals (this RFC)
- Colyseus Schema binary state
- `apps/client` Vite extraction (optional follow-up)
- Horizontal multi-node Colyseus without sticky sessions

## Auth v2 (RFC 006 extension)
Supabase JWT on lobby + Colyseus `onAuth`. Guest `playerId` remains dev fallback when `AUTH_REQUIRED=false`.
