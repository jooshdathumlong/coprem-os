-- COPREM OS — Migration 003: query_log table
-- Closes Framework 12 (CQRS) gap — tracks L3 retrieval quality.
-- Idempotent: CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS query_log (
  id               BIGSERIAL PRIMARY KEY,
  queried_at       TIMESTAMPTZ DEFAULT NOW(),
  query_text       TEXT NOT NULL,          -- original user query sent to vector search
  kb_id            TEXT,                   -- which KB was searched
  retrieved_chunks JSONB,                  -- top-K chunks returned
  relevance_score  NUMERIC(4,3),           -- avg similarity score (0.000–1.000)
  agent            TEXT,                   -- which agent triggered the retrieval
  session_key      TEXT                    -- links to session_store
);
CREATE INDEX IF NOT EXISTS idx_query_log_agent ON query_log(agent, queried_at);
