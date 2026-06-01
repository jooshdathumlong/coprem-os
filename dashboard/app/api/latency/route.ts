import { NextResponse } from 'next/server'
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
    `SELECT event_type, avg_ms, max_ms, requests, slow_count FROM v_latency_by_layer LIMIT 10`
  )
  return NextResponse.json(rows)
}
