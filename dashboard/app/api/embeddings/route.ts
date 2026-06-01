import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB || 'coprem_os',
  user: process.env.PG_USER || 'coprem',
  password: process.env.PG_PASSWORD || '',
})

export async function GET(req: NextRequest) {
  const pillar = req.nextUrl.searchParams.get('pillar') || ''
  const query = pillar
    ? `SELECT id, content, pillar, kb_id, created_at FROM memory_embeddings WHERE pillar = $1 AND archived = false ORDER BY created_at DESC LIMIT 50`
    : `SELECT id, content, pillar, kb_id, created_at FROM memory_embeddings WHERE archived = false ORDER BY created_at DESC LIMIT 50`
  const params = pillar ? [pillar] : []
  const { rows } = await pool.query(query, params)
  return NextResponse.json(rows)
}
