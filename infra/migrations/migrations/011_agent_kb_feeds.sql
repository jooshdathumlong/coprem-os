-- Migration 011: Agent KB Feeds + Finance Tracking
-- Created: 2026-06-07
-- Purpose: Scout research feeds in pgvector, Rex cost tracking, agent activity log

-- Scout: research feed entries with vector embeddings
CREATE TABLE IF NOT EXISTS research_feeds (
    id          SERIAL PRIMARY KEY,
    feed_type   VARCHAR(50) NOT NULL,  -- market_intel | tech_updates | competitor_watch | opportunities | regulatory
    entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    source      TEXT,
    relevance   VARCHAR(10) CHECK (relevance IN ('HIGH', 'MED', 'LOW')),
    topic       TEXT NOT NULL,
    summary     TEXT NOT NULL,
    impact      TEXT,
    action_required BOOLEAN DEFAULT false,
    action_routed_to VARCHAR(20),      -- agent name if routed
    embedding   vector(1536),          -- for semantic search
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_feeds_date ON research_feeds(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_feeds_relevance ON research_feeds(relevance);
CREATE INDEX IF NOT EXISTS idx_research_feeds_type ON research_feeds(feed_type);

-- Rex: daily API cost tracking
CREATE TABLE IF NOT EXISTS finance_daily_costs (
    id          SERIAL PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    total_spend NUMERIC(10,6) DEFAULT 0,
    threshold_status VARCHAR(20),      -- NORMAL | WARNING | HIGH | CRITICAL
    action_taken TEXT,
    log_count   INTEGER DEFAULT 0,
    raw_data    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_costs_date ON finance_daily_costs(report_date DESC);

-- Vera: agent workload snapshots
CREATE TABLE IF NOT EXISTS agent_workload_log (
    id          SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    agent_name  VARCHAR(20) NOT NULL,
    pillar      VARCHAR(20) NOT NULL,
    task_count  INTEGER DEFAULT 0,
    status      VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE | IDLE | OVERLOADED
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_workload_date ON agent_workload_log(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_workload_agent ON agent_workload_log(agent_name);

-- Quinn: QA audit log
CREATE TABLE IF NOT EXISTS qa_audit_log (
    id          SERIAL PRIMARY KEY,
    audit_date  TIMESTAMPTZ DEFAULT NOW(),
    agent_reviewed VARCHAR(20),
    review_type VARCHAR(30),           -- code | content | workflow | agent_output
    verdict     VARCHAR(10) CHECK (verdict IN ('PASS', 'BLOCK', 'HOLD')),
    severity    VARCHAR(5),            -- P0 | P1 | P2 | P3 | N/A
    findings    TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_qa_audit_date ON qa_audit_log(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_qa_audit_verdict ON qa_audit_log(verdict);
