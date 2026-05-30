-- COPREM OS — Supabase Database Schemas
-- All 6 tables for production deployment
-- Run in Supabase SQL Editor in this order

-- ============================================================
-- 1. AUDIT LOG (L7 Security)
-- ============================================================
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  source_ip   TEXT,
  source      TEXT,
  payload     JSONB,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_ip ON audit_log(source_ip, timestamp);
CREATE INDEX idx_audit_event ON audit_log(event_type, timestamp);

-- ============================================================
-- 2. DEDUP CACHE (L1-A Preprocessor)
-- ============================================================
CREATE TABLE dedup_cache (
  hash       TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Auto-expire via pg_cron (runs every minute)
SELECT cron.schedule(
  'dedup-cleanup',
  '* * * * *',
  $$DELETE FROM dedup_cache WHERE created_at < NOW() - INTERVAL '60 seconds'$$
);

-- ============================================================
-- 3. RATE LIMIT REGISTRY (L1-C Provider Router)
-- ============================================================
CREATE TABLE rate_limit_registry (
  provider           TEXT PRIMARY KEY,
  remaining_requests INT,
  reset_at           TIMESTAMPTZ,
  is_throttled       BOOLEAN DEFAULT FALSE,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO rate_limit_registry (provider, remaining_requests, is_throttled) VALUES
  ('claude-sonnet-4-6', 1000, FALSE),
  ('gpt-4o',            500,  FALSE),
  ('gemini-1.5-pro',    1000, FALSE),
  ('gemini-1.5-flash',  1000, FALSE),
  ('ollama/llama3.1',   9999, FALSE);

-- ============================================================
-- 4. SESSION STORE (L1.5 Session Context Manager)
-- ============================================================
CREATE TABLE session_store (
  id           BIGSERIAL PRIMARY KEY,
  session_key  TEXT UNIQUE NOT NULL,
  turns        JSONB DEFAULT '[]',
  summary      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);
CREATE INDEX idx_session_key ON session_store(session_key);
CREATE INDEX idx_session_expires ON session_store(expires_at);

-- ============================================================
-- 5. KB SYNC LOG (Module 2 Memory)
-- ============================================================
CREATE TABLE kb_sync_log (
  id           BIGSERIAL PRIMARY KEY,
  kb_id        TEXT NOT NULL,
  source_file  TEXT NOT NULL,
  status       TEXT NOT NULL,
  diff_summary TEXT,
  synced_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kb_sync_kb_id ON kb_sync_log(kb_id, synced_at);

-- ============================================================
-- 6. BLOCKED IPS (L7 Security)
-- ============================================================
CREATE TABLE blocked_ips (
  ip          TEXT PRIMARY KEY,
  fail_count  INT DEFAULT 1,
  blocked_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
CREATE INDEX idx_blocked_expires ON blocked_ips(expires_at);
SELECT cron.schedule(
  'blocked-ip-cleanup',
  '0 * * * *',
  $$DELETE FROM blocked_ips WHERE expires_at < NOW()$$
);
