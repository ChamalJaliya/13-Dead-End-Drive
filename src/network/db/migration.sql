-- migration.sql
-- DDL Ledger for 13 Dead End Drive Session & Room Persistence Layer
-- Target: Supabase / PostgreSQL database

CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('LOBBY_WAITING', 'ACTIVE', 'GAME_OVER')),
  game_state JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code ON game_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms (status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_state_game_id ON game_rooms ((game_state->>'gameId'));

CREATE TABLE IF NOT EXISTS player_connections (
  socket_id VARCHAR PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id VARCHAR NOT NULL
);

-- Context indices for socket lookup and events
CREATE INDEX IF NOT EXISTS idx_player_connections_room_id ON player_connections (room_id);
CREATE INDEX IF NOT EXISTS idx_player_connections_player_id ON player_connections (player_id);
