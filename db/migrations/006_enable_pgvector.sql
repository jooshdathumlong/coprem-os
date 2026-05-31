-- COPREM OS — Migration 006: PGVector for L3 Semantic Memory
-- Requires: pgvector extension on Postgres (included in pgvector/pgvector Docker image)
-- Idempotent: safe to re-run

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Memory Embeddings (L3 Hybrid Memory) ──────────────────────
CREATE TABLE IF NOT EXISTS memory_embeddings (
  id           BIGSERIAL PRIMARY KEY,
  content      TEXT NOT NULL,
  memory_type  TEXT NOT NULL,              -- story, system, log, idea, decision
  pillar       TEXT,                       -- JOB, PERSONAL, CREATIVE
  kb_id        TEXT,                       -- KB-01 to KB-05
  tags         TEXT[],
  embedding    vector(3072),               -- text-embedding-3-large = 3072 dims
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  archived     BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_embeddings(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_pillar ON memory_embeddings(pillar);
CREATE INDEX IF NOT EXISTS idx_memory_kb ON memory_embeddings(kb_id);

-- HNSW index for fast cosine similarity search
-- Uncomment after first data insert (some PG versions error on empty HNSW index):
-- CREATE INDEX IF NOT EXISTS idx_memory_hnsw ON memory_embeddings
--   USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

COMMIT;
