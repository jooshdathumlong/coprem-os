-- L1.5 Session Context Manager — Persistent Session Storage
-- Ephemeral sessions live in Redis (30-min TTL); archived sessions stored here
CREATE TABLE session_store (
  id           BIGSERIAL PRIMARY KEY,
  session_key  TEXT UNIQUE NOT NULL,  -- format: {channel_type}:{channel_id}:{userId}
  turns        JSONB DEFAULT '[]',    -- compressed turn history
  summary      TEXT,                  -- auto-summary after flush
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);
CREATE INDEX idx_session_key ON session_store(session_key);
CREATE INDEX idx_session_expires ON session_store(expires_at);
