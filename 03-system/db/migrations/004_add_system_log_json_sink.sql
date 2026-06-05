-- COPREM OS — Migration 004: system_log JSON sink
-- Closes Twelve-Factor App Factor XI gap (Framework 05) — structured log sink.
-- n8n execution logs route here instead of being scattered in UI.
-- Idempotent: CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS system_log (
  id           BIGSERIAL PRIMARY KEY,
  logged_at    TIMESTAMPTZ DEFAULT NOW(),
  level        TEXT NOT NULL DEFAULT 'INFO', -- DEBUG | INFO | WARN | ERROR
  workflow_id  TEXT,                          -- n8n workflow ID
  execution_id TEXT,                          -- n8n execution ID
  node_name    TEXT,                          -- n8n node that produced the log
  message      TEXT NOT NULL,
  context      JSONB                          -- arbitrary structured data
);
CREATE INDEX IF NOT EXISTS idx_system_log_level ON system_log(level, logged_at);
CREATE INDEX IF NOT EXISTS idx_system_log_workflow ON system_log(workflow_id, logged_at);
