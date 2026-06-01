-- SLO daily snapshot table
CREATE TABLE IF NOT EXISTS slo_log (
    id          BIGSERIAL PRIMARY KEY,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    period_days INT NOT NULL DEFAULT 7,
    received    INT,
    delivered   INT,
    delivery_rate NUMERIC(5,2),
    avg_latency_sec NUMERIC(8,2),
    hitl_rate   NUMERIC(5,2),
    failed_tasks INT,
    kb_avg_relevance NUMERIC(4,3),
    slo_pass    BOOLEAN,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_slo_log_date ON slo_log(date);
