import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

function pg(sql: string) {
  const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
  return execSync(`docker exec ${cid} psql -U coprem -d coprem_os -t -A -F '|||' -c "${sql}"`, { encoding: 'utf8' })
}

// GET: list all sessions
export async function GET() {
  try {
    const out = pg(`SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC LIMIT 50;`)
    const rows = out.trim().split('\n').filter(Boolean).map(line => {
      const [id, title, created_at, updated_at] = line.split('|||')
      return { id: Number(id), title, created_at, updated_at }
    })
    return NextResponse.json(rows)
  } catch { return NextResponse.json([]) }
}

// POST: create new session
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json().catch(() => ({ title: 'New Chat' }))
    const safe = (title || 'New Chat').replace(/'/g, "''").slice(0, 200)
    const out = pg(`INSERT INTO chat_sessions (title) VALUES ('${safe}') RETURNING id, title, created_at;`)
    const [id, t, created_at] = out.trim().split('\n').filter(l => l.includes('|||'))[0]?.split('|||') ?? out.trim().split('|||')
    return NextResponse.json({ id: Number(id), title: t, created_at })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

// DELETE: delete session
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    pg(`DELETE FROM chat_sessions WHERE id = ${Number(id)};`)
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: false }) }
}
