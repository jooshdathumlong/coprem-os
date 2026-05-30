-- Module 2 Memory — KB Sync Log (GAP-03 v8.2)
-- Records every KB re-embedding event for auditability and debugging
CREATE TABLE kb_sync_log (
  id           BIGSERIAL PRIMARY KEY,
  kb_id        TEXT NOT NULL,        -- KB-01 through KB-05
  source_file  TEXT NOT NULL,        -- e.g. eilinaire_constitution.md
  status       TEXT NOT NULL,        -- SUCCESS | FAILED | PENDING
  diff_summary TEXT,                 -- what changed in the source file
  synced_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kb_sync_kb_id ON kb_sync_log(kb_id, synced_at);
