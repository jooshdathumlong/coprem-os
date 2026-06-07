-- COPREM OS — Database Init Script
-- Runs on fresh Postgres instance
-- coprem    = n8n internal (created by POSTGRES_DB env)
-- coprem_os = COPREM application tables

CREATE DATABASE coprem_os OWNER coprem;

\c coprem_os

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  chat_id     BIGINT UNIQUE NOT NULL,
  first_name  TEXT,
  username    TEXT,
  status      TEXT DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dedup_cache (
  hash       TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_store (
  id          BIGSERIAL PRIMARY KEY,
  session_key TEXT UNIQUE NOT NULL,
  turns       JSONB DEFAULT '[]',
  summary     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_session_key ON session_store(session_key);

CREATE TABLE IF NOT EXISTS rate_limit_registry (
  provider           TEXT PRIMARY KEY,
  remaining_requests INT DEFAULT 1000,
  reset_at           TIMESTAMPTZ,
  is_throttled       BOOLEAN DEFAULT FALSE,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO rate_limit_registry (provider, remaining_requests) VALUES
  ('claude-sonnet-4-6', 1000),
  ('gpt-4o',            500),
  ('gemini-1.5-pro',    1000),
  ('gemini-1.5-flash',  1000),
  ('ollama/llama3.1',   9999)
ON CONFLICT (provider) DO NOTHING;

CREATE TABLE IF NOT EXISTS inbox_log (
  id            BIGSERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ DEFAULT NOW(),
  source        TEXT DEFAULT 'telegram',
  user_id       BIGINT,
  content_raw   TEXT,
  content_clean TEXT,
  lang_detected TEXT,
  msg_hash      TEXT,
  pillar        TEXT,
  domain        TEXT,
  agent         TEXT,
  model         TEXT,
  status        TEXT DEFAULT 'ok',
  latency_ms    INT,
  cost_usd      NUMERIC(10,6)
);

CREATE TABLE IF NOT EXISTS task_board (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  pillar         TEXT,
  task_desc      TEXT,
  assigned_agent TEXT,
  status         TEXT DEFAULT 'pending',
  priority       INT DEFAULT 3,
  due_date       DATE,
  completed_at   TIMESTAMPTZ,
  feedback_score INT
);

CREATE TABLE IF NOT EXISTS okr_scoreboard (
  id           BIGSERIAL PRIMARY KEY,
  period       TEXT,
  pillar       TEXT,
  objective    TEXT,
  key_result   TEXT,
  target       NUMERIC,
  current      NUMERIC DEFAULT 0,
  pct_complete NUMERIC GENERATED ALWAYS AS
               (CASE WHEN target > 0 THEN (current/target)*100 ELSE 0 END) STORED,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_signal_log (
  id          BIGSERIAL PRIMARY KEY,
  timestamp   TIMESTAMPTZ DEFAULT NOW(),
  keyword     TEXT,
  trend_score INT,
  source      TEXT DEFAULT 'google_trends',
  signal_type TEXT,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS decision_memory_log (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decision   TEXT,
  context    TEXT,
  outcome    TEXT,
  pillar     TEXT,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days',
  archived   BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  source_ip  TEXT,
  source     TEXT,
  payload    JSONB,
  timestamp  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_log(source_ip, timestamp);

CREATE TABLE IF NOT EXISTS blocked_ips (
  ip         TEXT PRIMARY KEY,
  fail_count INT DEFAULT 1,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE TABLE IF NOT EXISTS failed_tasks_db (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  task_id       TEXT,
  error_message TEXT,
  retry_count   INT DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  status        TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS quarantine_db (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  task_id        TEXT,
  agent          TEXT,
  raw_output     TEXT,
  failure_reason TEXT,
  reviewed       BOOLEAN DEFAULT FALSE,
  resolved       BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS prompt_library (
  id           BIGSERIAL PRIMARY KEY,
  agent        TEXT NOT NULL,
  version      TEXT NOT NULL,
  prompt_text  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active    BOOLEAN DEFAULT FALSE,
  feedback_avg NUMERIC(3,2),
  shadow_score NUMERIC(3,2),
  UNIQUE(agent, version)
);

CREATE TABLE IF NOT EXISTS kb_sync_log (
  id           BIGSERIAL PRIMARY KEY,
  kb_id        TEXT NOT NULL,
  source_file  TEXT,
  status       TEXT,
  diff_summary TEXT,
  synced_at    TIMESTAMPTZ DEFAULT NOW()
);
