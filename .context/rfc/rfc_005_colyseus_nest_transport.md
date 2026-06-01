# RFC 005: Colyseus + NestJS Authoritative Transport

## Status
APPROVED

## Context
Phase 3 scaffolded `SessionManager` and socket event types but no live WebSocket server. Online play requires server-authoritative `processTurn`, masked broadcasts, and Supabase persistence.

## Decisions

1. **Hybrid play modes:** `solo` and `local` keep client-side `processTurn`; `online` never commits moves locally.
2. **Colyseus v1:** Connection + matchmaking only; authoritative `GameState` held privately on the room; wire format uses existing `STATE_SYNC` / `playerAction` messages (no `@colyseus/schema` in v1).
3. **NestJS:** HTTP health, lobby REST, Supabase DI, bot HTTP client to `services/bot-ai`.
4. **Persistence:** Supabase `game_rooms` + `player_connections` (RFC 004); Nest uses service role key server-side only.
5. **Lobby:** REST on Nest (`POST /lobby/create`, `POST /lobby/join`); gameplay over Colyseus `playerAction`.
6. **Bots:** Solo → Vite proxy `/bot-api` → Python; online bot seats → Nest `BotTurnCoordinator` → `BOT_AI_URL`.

## Guest auth (v1)
`playerId` issued at lobby join; stored on Colyseus `client.auth` and validated against `event.playerId`.

## Reconnect (v1)
Re-join with same `playerId` + `roomCode`; room loads state from Supabase and sends masked `STATE_SYNC`.

## Non-goals (v1)
- Colyseus Schema binary state
- Supabase Auth JWT (v2)
- Horizontal multi-node Colyseus without sticky sessions
