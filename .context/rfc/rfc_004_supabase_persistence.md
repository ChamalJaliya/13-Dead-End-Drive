# RFC 004: Relational Real-Time Storage Refactor

## Status
APPROVED

## Context & Problem Statement
In Phase 3.1's initial prototyping, the server registry tracks rooms and temporary player socket mappings inside volatile in-memory JavaScript `Map` collections. While fast, this architecture suffers from several problems:
1. **No Fault Tolerance:** If the server restarts, crashes, or scales, all active game sessions and player lobby connections are immediately lost.
2. **Horizontal Scaling Blocked:** Multi-instance architectures cannot share or synchronize in-memory variables.
3. **No Auditing:** State histories cannot be logged for game replays or cheat audits.

## Proposed Design
We specify a transition away from volatile memory mapping toward a transaction-safe relational database layer utilizing PostgreSQL (fully compatible with Supabase).

### Database DDL Schema

To ensure structured integrity, we define two primary tables with relational checks, cascading deletions, and dedicated indices:

```sql
-- 1. Table: game_rooms
-- Stores the complete serialized GameState JSON tree and active room codes.
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('LOBBY_WAITING', 'ACTIVE', 'GAME_OVER')),
  game_state JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- Indices for rapid querying of room sessions and states
CREATE INDEX idx_game_rooms_room_code ON game_rooms (room_code);
CREATE INDEX idx_game_rooms_status ON game_rooms (status);
CREATE INDEX idx_game_rooms_state_game_id ON game_rooms ((game_state->>'gameId'));

-- 2. Table: player_connections
-- Tracks temporary WebSocket socket identifiers mapped to current authenticated rooms and players.
CREATE TABLE player_connections (
  socket_id VARCHAR PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id VARCHAR NOT NULL
);

-- Indices for rapid socket-to-player session mapping
CREATE INDEX idx_player_connections_room_id ON player_connections (room_id);
CREATE INDEX idx_player_connections_player_id ON player_connections (player_id);
```

### Type-Safe Network Error Additions
To bridge our stateless engine errors with room session and transport issues, we expand the strict `SocketErrorCode` type in `src/types/enums.ts` to include:

- `'ROOM_FULL'`: Returned when `joinRoom` is attempted on a session that has reached the strict 4-player boundary constraint.
- `'ROOM_NOT_FOUND'`: Returned when trying to access or join a room identifier that does not exist in the database.
- `'GAME_ALREADY_STARTED'`: Returned when trying to join a room whose game phase is no longer `'LOBBY'`.
- `'UNAUTHORIZED_ACTION'`: Returned if a socket ID attempts to send player turns but is not registered to the room/player context, or if its registered `playerId` does not match the action's sender.

These error codes guarantee that the WebSocket broker can catch transport-layer errors and serialize them using our standard `ErrorResponse` schema without resorting to untyped `as any` exceptions.
