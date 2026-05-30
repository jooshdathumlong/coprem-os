-- L1-A Preprocessor — Message Deduplication Cache
-- Prevents duplicate task execution within 60-second window
CREATE TABLE dedup_cache (
  hash       TEXT PRIMARY KEY,  -- MD5(userId + content)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-expire via pg_cron (runs every minute)
SELECT cron.schedule(
  'dedup-cleanup',
  '* * * * *',
  $$DELETE FROM dedup_cache WHERE created_at < NOW() - INTERVAL '60 seconds'$$
);
