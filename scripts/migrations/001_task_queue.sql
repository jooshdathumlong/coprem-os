-- COPREM OS — Task Queue Migration
-- Phase 4: Autonomous Agent Loop
-- Run: psql $DATABASE_URL -f scripts/migrations/001_task_queue.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS task_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,                        -- chat | analysis | agent_handoff | report | kb_embed
  payload     JSONB,                                -- task-specific data
  status      TEXT DEFAULT 'pending',               -- pending | running | done | failed | hitl_pending
  priority    INT DEFAULT 5,                        -- 1=highest, 10=lowest
  assigned_to TEXT,                                 -- jeff | eilinaire | router
  next_agent  TEXT,                                 -- for agent_handoff: who picks up next
  result      TEXT,                                 -- execution output
  error       TEXT,                                 -- last error message
  retries     INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  run_at      TIMESTAMP DEFAULT NOW(),              -- scheduled execution time
  started_at  TIMESTAMP,
  completed_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_status  ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_run_at  ON task_queue(run_at);
CREATE INDEX IF NOT EXISTS idx_task_agent   ON task_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_priority ON task_queue(priority, run_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_task_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_queue_updated ON task_queue;
CREATE TRIGGER trg_task_queue_updated
  BEFORE UPDATE ON task_queue
  FOR EACH ROW EXECUTE FUNCTION update_task_queue_timestamp();

-- Seed: morning brief auto-trigger (runs daily at 07:00 via autonomous_loop)
INSERT INTO task_queue (type, payload, assigned_to, priority, run_at)
VALUES (
  'analysis',
  '{"prompt": "สรุป morning brief วันนี้: สถานะระบบ + งานที่ค้างอยู่ + OKR progress", "notify_telegram": true}',
  'jeff',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

SELECT 'task_queue migration complete' AS result;
