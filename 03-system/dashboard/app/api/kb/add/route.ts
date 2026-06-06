import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')

function loadEnvKey(key: string): string {
  try { return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim() }
  catch { return '' }
}

function getPgCid(): string {
  try {
    const r = execSync('docker ps --filter label=coprem.service=postgres -q 2>/dev/null || docker ps --filter name=postgres -q', { encoding: 'utf8' })
    return r.trim().split('\n')[0]
  } catch { return '' }
}

export async function POST(req: NextRequest) {
  try {
    const { content, pillar = 'JOB', kb_id = 'KB-business' } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

    // 1. Embed with Ollama nomic-embed-text
    const embedRes = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: content }),
      signal: AbortSignal.timeout(15000),
    })
    if (!embedRes.ok) return NextResponse.json({ error: 'embedding failed' }, { status: 500 })
    const embedData = await embedRes.json()
    const vec: number[] = embedData?.embeddings?.[0]
    if (!vec?.length) return NextResponse.json({ error: 'no embedding returned' }, { status: 500 })

    // 2. Upsert into pgvector
    const pgCid = getPgCid()
    if (!pgCid) return NextResponse.json({ error: 'postgres not found' }, { status: 500 })

    const vecStr = '[' + vec.map((x: number) => x.toFixed(6)).join(',') + ']'
    const safe = content.replace(/'/g, "''")
    const safePillar = pillar.replace(/'/g, "''")
    const safeKbId = kb_id.replace(/'/g, "''")
    const sql = `INSERT INTO memory_embeddings (content, memory_type, pillar, kb_id, embedding) VALUES ('${safe}', 'kb_segment', '${safePillar}', '${safeKbId}', '${vecStr}'::vector) ON CONFLICT DO NOTHING RETURNING id;`

    const result = execSync(
      `docker exec ${pgCid} psql -U coprem -d coprem_os -t -A -c "${sql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 10000 }
    ).trim()

    // 3. Also append to business_context.md for persistence across re-embeds
    const bcPath = join(ROOT, '02-knowledge', 'work', 'business_context.md')
    const timestamp = new Date().toISOString().slice(0, 10)
    const appendContent = `\n\n---\n_Added via dashboard ${timestamp}_\n\n${content}`
    execSync(`echo '${appendContent.replace(/'/g, "'\\''")}' >> "${bcPath}"`)

    return NextResponse.json({ ok: true, id: result || 'inserted', pillar, kb_id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
