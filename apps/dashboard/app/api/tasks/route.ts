import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'

function getCid(): string {
  return execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
}

function pg(sql: string) {
  const cid = getCid()
  // execFileSync avoids shell interpretation — safe for Thai/special chars
  return execFileSync('docker', ['exec', cid, 'psql', '-U', 'coprem', '-d', 'coprem_os', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' })
}

export async function GET() {
  try {
    const out = pg(`
      SELECT id, type, status, priority, assigned_to, next_agent,
             retries, max_retries,
             left(replace(coalesce(result,''),chr(10),' '),200) AS result,
             left(replace(coalesce(error,''),chr(10),' '),200) AS error,
             to_char(run_at, 'YYYY-MM-DD HH24:MI:SS') AS run_at,
             to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM task_queue
      ORDER BY created_at DESC
      LIMIT 100;
    `)
    // Use exactly 12 splits on ||| — result/error may contain spaces/newlines but not |||
    const rows = out.trim().split('\n').filter(l => l.includes('|||')).map(line => {
      const parts = line.split('|||')
      const [id, type, status, priority, assigned_to, next_agent,
             retries, max_retries, result, error, run_at, created_at] = parts
      // Skip malformed rows (id must be UUID-ish or non-empty without spaces)
      if (!id || id.includes(' ') || !type) return null
      return { id, type, status, priority: Number(priority), assigned_to,
               next_agent, retries: Number(retries), max_retries: Number(max_retries),
               result: result || '', error: error || '', run_at, created_at }
    }).filter(Boolean)
    return NextResponse.json(rows)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const type = (body.type || 'analysis').replace(/'/g, "''")
    const payload = JSON.stringify(body.payload || {}).replace(/'/g, "''")
    const agent = (body.assigned_to || 'jeff').replace(/'/g, "''")
    const next = (body.next_agent || '').replace(/'/g, "''")
    const prio = Number(body.priority) || 5
    // Idempotency: skip if same key already pending/running
    const ikey = body.idempotency_key ? `'${String(body.idempotency_key).replace(/'/g, "''")}'` : 'NULL'
    pg(`INSERT INTO task_queue (type, payload, assigned_to, next_agent, priority, run_at, idempotency_key)
        VALUES ('${type}', '${payload}', '${agent}', '${next}', ${prio}, NOW(), ${ikey})
        ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL AND status NOT IN ('done','failed')
        DO NOTHING;`)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }) }
}

export async function DELETE(req: NextRequest) {
  // GET full task detail by id (?id=xxx)
  try {
    const id = (req.nextUrl.searchParams.get('id') || '').replace(/'/g, "''")
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const out = pg(`SELECT id, type, status, payload, result, error, created_at, started_at, completed_at FROM task_queue WHERE id='${id}' LIMIT 1;`)
    const line = out.trim().split('\n').find(l => l.includes('|||'))
    if (!line) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const [tid, type, status, payload, result, error, created_at, started_at, completed_at] = line.split('|||')
    return NextResponse.json({ id: tid, type, status, payload, result, error, created_at, started_at, completed_at })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    const safeId = (id || '').replace(/'/g, "''")
    const safeStatus = (status || 'pending').replace(/'/g, "''")
    pg(`UPDATE task_queue SET status='${safeStatus}' WHERE id='${safeId}';`)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }) }
}
