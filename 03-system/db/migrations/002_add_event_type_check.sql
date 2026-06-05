-- COPREM OS — Migration 002: audit_log event_type CHECK constraint
-- Closes Framework 13 (Event Sourcing) gap.
-- Idempotent: constraint added only if not exists.
-- Taxonomy source: 02-knowledge/COPREM_OS_24_Frameworks_v1_1.md §13

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'audit_log_event_type_check'
      AND conrelid = 'audit_log'::regclass
  ) THEN
    ALTER TABLE audit_log ADD CONSTRAINT audit_log_event_type_check
      CHECK (event_type IN (
        'WEBHOOK_RECEIVED',
        'WEBHOOK_REJECTED',
        'INTENT_CLASSIFIED',
        'AGENT_CALLED',
        'AGENT_OUTPUT',
        'HITL_REQUIRED',
        'HITL_APPROVED',
        'FEEDBACK_RECEIVED',
        'PROMPT_PROMOTED',
        'KB_SYNC_TRIGGERED',
        'TASK_FAILED',
        'CRON_TICK',
        'COST_ALERT'
      ));
  END IF;
END $$;
