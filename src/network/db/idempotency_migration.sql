-- Optional: persisted idempotency for online games (RFC 005 Phase 3.6)
CREATE TABLE IF NOT EXISTS processed_events (
  game_id UUID NOT NULL,
  event_id VARCHAR NOT NULL,
  processed_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (game_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_processed_events_game_id ON processed_events (game_id);
