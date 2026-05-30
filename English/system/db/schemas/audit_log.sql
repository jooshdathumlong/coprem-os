-- L7 Security — Audit Log
-- Tracks all security events: invalid signatures, blocked IPs, HITL decisions
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,  -- e.g. INVALID_DISCORD_SIG, HITL_APPROVED, RATE_BLOCKED
  source_ip   TEXT,
  source      TEXT,           -- user-agent or channel
  payload     JSONB,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_ip ON audit_log(source_ip, timestamp);
CREATE INDEX idx_audit_event ON audit_log(event_type, timestamp);
