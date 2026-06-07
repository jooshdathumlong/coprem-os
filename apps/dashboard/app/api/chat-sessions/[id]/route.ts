import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

function pg(sql: string): string {
  const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
  return execSync(`docker exec ${cid} psql -U coprem -d coprem_os -t -A -c "${sql}"`, { encoding: 'utf8' })
}

function pgSafe(content: string): string {
  // Escape for psql $$ quoting is tricky — use standard quote with doubled single quotes
  return content.replace(/\\/g, '\\\\').replace(/'/g, "''")
}

// GET: messages in a session — use json_agg to handle multi-line content safely
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sid = Number(id)

    // json_agg returns a single JSON line — immune to newlines in content
    const out = pg(
      `SELECT COALESCE(json_agg(json_build_object('id', id, 'role', role, 'content', content, 'model', COALESCE(model,'')) ORDER BY created_at), '[]'::json)::text FROM chat_messages WHERE session_id = ${sid};`
    ).trim()
    const messages: { id: number; role: string; content: string; model: string }[] = JSON.parse(out || '[]')

    const titleOut = pg(`SELECT title FROM chat_sessions WHERE id = ${sid};`).trim()
    return NextResponse.json({
      title: titleOut,
      messages: messages.map(m => ({ id: m.id, role: m.role, text: m.content, model: m.model }))
    })
  } catch (e) {
    console.error('GET session error:', e)
    return NextResponse.json({ title: '', messages: [] })
  }
}

// POST: add message to session
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sid = Number(id)
    const { role, content, model, updateTitle } = await req.json()

    const safeContent = pgSafe(content || '')
    const safeModel = pgSafe(model || '')

    pg(`INSERT INTO chat_messages (session_id, role, content, model) VALUES (${sid}, '${role}', '${safeContent}', '${safeModel}');`)
    pg(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sid};`)

    if (updateTitle && role === 'user') {
      const title = pgSafe(content.slice(0, 60))
      pg(`UPDATE chat_sessions SET title = '${title}' WHERE id = ${sid} AND title = 'New Chat';`)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
