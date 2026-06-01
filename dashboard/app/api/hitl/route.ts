import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB || 'coprem_os',
  user: process.env.PG_USER || 'coprem',
  password: process.env.PG_PASSWORD || '',
})

export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, chat_id, message, created_at, resolved_at, resolution
     FROM hitl_queue ORDER BY created_at DESC LIMIT 20`
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { id, resolution } = await req.json()
  await pool.query(
    `UPDATE hitl_queue SET resolved_at = NOW(), resolution = $1 WHERE id = $2`,
    [resolution || 'Resolved via dashboard', id]
  )
  return NextResponse.json({ ok: true })
}
