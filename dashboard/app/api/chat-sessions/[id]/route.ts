import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

function pg(sql: string) {
  const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
  return execSync(`docker exec ${cid} psql -U coprem -d coprem_os -t -A -F '|||' -c "${sql}"`, { encoding: 'utf8' })
}

// GET: messages in a session
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sid = Number(id)
    const out = pg(`SELECT id, role, content, model, created_at FROM chat_messages WHERE session_id = ${sid} ORDER BY created_at ASC;`)
    const messages = out.trim().split('\n').filter(Boolean).map(line => {
      const [mid, role, content, model, created_at] = line.split('|||')
      return { id: Number(mid), role, text: content.replace(/\\n/g, '\n'), model, created_at }
    })
    const titleOut = pg(`SELECT title FROM chat_sessions WHERE id = ${sid};`)
    return NextResponse.json({ title: titleOut.trim(), messages })
  } catch { return NextResponse.json({ title: '', messages: [] }) }
}

// POST: add message + update session title
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sid = Number(id)
    const { role, content, model, updateTitle } = await req.json()
    const safeContent = (content || '').replace(/'/g, "''")
    const safeModel = (model || '').replace(/'/g, "''")
    pg(`INSERT INTO chat_messages (session_id, role, content, model) VALUES (${sid}, '${role}', '${safeContent}', '${safeModel}');`)
    pg(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sid};`)
    // Auto-title from first user message
    if (updateTitle && role === 'user') {
      const title = content.slice(0, 60).replace(/'/g, "''")
      pg(`UPDATE chat_sessions SET title = '${title}' WHERE id = ${sid} AND title = 'New Chat';`)
    }
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }) }
}
