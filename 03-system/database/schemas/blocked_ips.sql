-- L7 Security — Blocked IP Registry
-- IPs are blocked after 5 invalid webhook signature attempts within 10 minutes
CREATE TABLE blocked_ips (
  ip          TEXT PRIMARY KEY,
  fail_count  INT DEFAULT 1,
  blocked_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
CREATE INDEX idx_blocked_expires ON blocked_ips(expires_at);

-- Auto-cleanup expired blocks via pg_cron
SELECT cron.schedule(
  'blocked-ip-cleanup',
  '0 * * * *',
  $$DELETE FROM blocked_ips WHERE expires_at < NOW()$$
);
