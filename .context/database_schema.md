# Database Schema Specification

To ensure robust persistence, fault tolerance, and time-travel debugging/state sync capabilities, session states are mapped to the following PostgreSQL relational schema (suitable for Supabase / standard Postgres).

---

## 1. Table: `game_rooms`

This table stores the complete serialized GameState JSON tree alongside its active status.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique room session identifier. |
| `room_code` | `VARCHAR(6)` | `UNIQUE, NOT NULL` | Short human-readable lobby code. |
| `status` | `VARCHAR` | `NOT NULL` | `LOBBY_WAITING`, `ACTIVE`, `GAME_OVER`. |
| `game_state` | `JSONB` | `NOT NULL` | Full `GameState` tree (incl. `boardVersion`, `exposedRooting`, `detectivePosition.maxSteps: 10`, `PortraitHeirId`, `ruleProfile`, `enabledModules`). |
| `updated_at` | `TIMESTAMP`| `DEFAULT now()` | Tracks active session deltas. |

```sql
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('LOBBY_WAITING', 'ACTIVE', 'GAME_OVER')),
  game_state JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- Index on JSONB path to quickly retrieve gameId and query player info
CREATE INDEX idx_game_rooms_state_game_id ON game_rooms ((game_state->>'gameId'));
CREATE INDEX idx_game_rooms_status ON game_rooms (status);
```

---

## 2. Table: `player_connections`

This table registers temporary real-time WebSocket connection handles (sockets) mapping to their authenticated players and rooms.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `socket_id` | `VARCHAR` | `PRIMARY KEY` | Temporary transport connection handle. |
| `room_id` | `UUID` | `REFERENCES game_rooms(id) ON DELETE CASCADE` | Current active session room map. |
| `player_id` | `VARCHAR` | `NOT NULL` | Unique logical player identifier. |

```sql
CREATE TABLE player_connections (
  socket_id VARCHAR PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id VARCHAR NOT NULL
);

-- Index on room_id for fast lookup during disconnects and broadcasts
CREATE INDEX idx_player_connections_room_id ON player_connections (room_id);
CREATE INDEX idx_player_connections_player_id ON player_connections (player_id);
```
