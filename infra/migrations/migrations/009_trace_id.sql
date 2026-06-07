-- 009_trace_id.sql: Add trace_id to audit_log and inbox_log for end-to-end request tracing

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS trace_id UUID DEFAULT gen_random_uuid();
ALTER TABLE inbox_log ADD COLUMN IF NOT EXISTS trace_id UUID;

CREATE INDEX IF NOT EXISTS idx_audit_log_trace_id ON audit_log(trace_id);
CREATE INDEX IF NOT EXISTS idx_inbox_log_trace_id ON inbox_log(trace_id);
