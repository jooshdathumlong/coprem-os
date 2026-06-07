-- Migration 010: Content Automation Tables
-- A1/A2: content_drafts — TikTok captions + Shopee/Lazada descriptions pending approval
-- B2: campaign_plans + campaign_kols — KOL shortlists pending approval
-- C1: weekly_reports — stored report snapshots

-- ── content_drafts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_drafts (
  id            BIGSERIAL PRIMARY KEY,
  draft_type    TEXT NOT NULL CHECK (draft_type IN ('tiktok_caption', 'shopee_desc', 'lazada_desc')),
  brand         TEXT NOT NULL CHECK (brand IN ('batiste', 'scrub_daddy', 'general')),
  brief         TEXT NOT NULL,
  product_name  TEXT,
  draft_content JSONB NOT NULL,  -- { caption, hashtags, hook, cta } or { title, bullets, description }
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revised')),
  feedback      TEXT,
  chat_id       BIGINT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_content_drafts_type ON content_drafts(draft_type);

-- ── campaign_plans ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_plans (
  id            BIGSERIAL PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  brand         TEXT NOT NULL CHECK (brand IN ('batiste', 'scrub_daddy', 'general')),
  brief         TEXT NOT NULL,
  budget_thb    NUMERIC(12,2),
  objective     TEXT,
  timeline      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'active', 'completed')),
  chat_id       BIGINT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_plans_status ON campaign_plans(status);

-- ── campaign_kols ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_kols (
  id              BIGSERIAL PRIMARY KEY,
  campaign_id     BIGINT NOT NULL REFERENCES campaign_plans(id) ON DELETE CASCADE,
  kol_id          INTEGER,  -- references rs_lifestyle.kol_list.id
  kol_name        TEXT NOT NULL,
  content_category TEXT,
  followers_tiktok INTEGER,
  cost_thb        NUMERIC(10,2),
  sow             TEXT,
  tier            TEXT CHECK (tier IN ('mega', 'macro', 'mid', 'micro', 'nano')),
  recommend_reason TEXT,
  status          TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'contracted')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_kols_campaign ON campaign_kols(campaign_id);

-- ── weekly_reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_reports (
  id            BIGSERIAL PRIMARY KEY,
  week_start    DATE NOT NULL,
  week_end      DATE NOT NULL,
  brand         TEXT,
  report_data   JSONB NOT NULL,  -- { total_revenue, by_channel, top_products, vs_last_week, flags }
  summary_text  TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week_start, brand)
);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start DESC);
