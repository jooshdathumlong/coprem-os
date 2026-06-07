import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

function pg(sql: string) {
  const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
  return execSync(`docker exec ${cid} psql -U coprem -d coprem_os -t -A -F '|||' -c "${sql}"`, { encoding: 'utf8' })
}

export async function GET() {
  try {
    const out = pg(`SELECT id, chat_id, message, created_at, resolved_at, resolution FROM hitl_queue ORDER BY created_at DESC LIMIT 20;`)
    const rows = out.trim().split('\n').filter(Boolean).map(line => {
      const [id, chat_id, message, created_at, resolved_at, resolution] = line.split('|||')
      return { id: Number(id), chat_id, message, created_at, resolved_at: resolved_at || null, resolution: resolution || null }
    })
    return NextResponse.json(rows)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  try {
    const { id, resolution } = await req.json()
    const safe = (resolution || 'Resolved via dashboard').replace(/'/g, "''")
    pg(`UPDATE hitl_queue SET resolved_at = NOW(), resolution = '${safe}' WHERE id = ${id};`)
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: false }) }
}
