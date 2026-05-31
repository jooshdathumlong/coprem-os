-- COPREM OS — Migration 005: L4 Content Library
-- Tables: novels, chapters, character_tracker
-- Idempotent: CREATE TABLE IF NOT EXISTS

-- ── Novels ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novels (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  genre       TEXT,
  status      TEXT DEFAULT 'draft',      -- draft | active | complete | paused
  summary     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO novels (title, genre, status, summary) VALUES (
  'EGO ERA',
  'Comfort Urban Psychological Fantasy',
  'active',
  'A modern metropolis where special powers manifest from psychological states when humans reach their limits. Powers exist to support, not to conquer.'
) ON CONFLICT DO NOTHING;

-- ── Chapters ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id           BIGSERIAL PRIMARY KEY,
  novel_id     BIGINT REFERENCES novels(id),
  chapter_num  INT NOT NULL,
  title        TEXT,
  content      TEXT,
  lore_tags    TEXT[],                   -- characters + locations mentioned
  status       TEXT DEFAULT 'draft',
  word_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, chapter_num)
);
CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id, chapter_num);

-- ── Character Tracker (12 EGO ERA characters) ─────────────────
CREATE TABLE IF NOT EXISTS character_tracker (
  id           BIGSERIAL PRIMARY KEY,
  novel_id     BIGINT REFERENCES novels(id),
  name         TEXT NOT NULL,
  location     TEXT,                     -- current location in story
  arc_state    TEXT,                     -- psychological arc status
  key_event    TEXT,                     -- last significant event
  ego_anchor   TEXT,                     -- real-world object tied to power
  power_desc   TEXT,                     -- power manifestation description
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, name)
);

-- Seed 12 EGO ERA characters
INSERT INTO character_tracker (novel_id, name, arc_state) VALUES
  (1, 'Jin',  'unknown'),
  (1, 'Rin',  'unknown'),
  (1, 'Ray',  'unknown'),
  (1, 'Ken',  'unknown'),
  (1, 'Pie',  'unknown'),
  (1, 'Guy',  'unknown'),
  (1, 'Ann',  'unknown'),
  (1, 'Jean', 'unknown'),
  (1, 'So',   'unknown'),
  (1, 'Bomb', 'unknown'),
  (1, 'Pao',  'unknown'),
  (1, 'Nay',  'unknown')
ON CONFLICT (novel_id, name) DO NOTHING;
