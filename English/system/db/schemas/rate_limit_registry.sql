-- L1-C Provider Router — API Rate Limit Registry
-- Tracks remaining capacity per provider; checked before every routing decision
CREATE TABLE rate_limit_registry (
  provider           TEXT PRIMARY KEY,
  remaining_requests INT,
  reset_at           TIMESTAMPTZ,
  is_throttled       BOOLEAN DEFAULT FALSE,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial rows
INSERT INTO rate_limit_registry (provider, remaining_requests, is_throttled) VALUES
  ('claude-sonnet-4-6', 1000, FALSE),
  ('gpt-4o',            500,  FALSE),
  ('gemini-1.5-pro',    1000, FALSE),
  ('gemini-1.5-flash',  1000, FALSE),
  ('ollama/llama3.1',   9999, FALSE);
