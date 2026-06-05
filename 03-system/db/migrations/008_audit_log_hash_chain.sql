-- Log Integrity Hash Chain for audit_log
-- Each row stores SHA256(prev_hash || id || event_type || source || timestamp)
-- Tamper-proof: any modification breaks the chain

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS row_hash  TEXT;

-- Backfill existing rows with sequential hashes
DO $$
DECLARE
    r RECORD;
    h TEXT := 'genesis';
BEGIN
    FOR r IN SELECT id, event_type, source, timestamp FROM audit_log ORDER BY id ASC LOOP
        h := encode(digest(h || r.id::text || COALESCE(r.event_type,'') || COALESCE(r.source,'') || r.timestamp::text, 'sha256'), 'hex');
        UPDATE audit_log SET prev_hash = h, row_hash = h WHERE id = r.id;
    END LOOP;
END$$;

-- Trigger function: auto-hash on every INSERT
CREATE OR REPLACE FUNCTION audit_log_hash_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    last_hash TEXT;
BEGIN
    SELECT row_hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1;
    IF last_hash IS NULL THEN last_hash := 'genesis'; END IF;
    NEW.prev_hash := last_hash;
    NEW.row_hash  := encode(digest(
        last_hash || NEW.id::text || COALESCE(NEW.event_type,'') ||
        COALESCE(NEW.source,'') || NEW.timestamp::text,
        'sha256'), 'hex');
    RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_audit_log_hash ON audit_log;
CREATE TRIGGER trg_audit_log_hash
    BEFORE INSERT ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_hash_trigger();
