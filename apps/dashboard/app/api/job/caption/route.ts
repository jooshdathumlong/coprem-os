import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')

function env(key: string): string {
  try { return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim() } catch { return '' }
}

function pgCid(): string {
  const byLabel = execSync('docker ps --filter label=coprem.service=postgres -q', { encoding: 'utf8' }).trim()
  return byLabel ? byLabel.split('\n')[0] : execSync('docker ps --filter name=postgres -q', { encoding: 'utf8' }).trim().split('\n')[0]
}

function dbQuery(sql: string): string {
  return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem_os', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' })
}

// POST /api/job/caption  body: { brief, brand?, chat_id? }
export async function POST(req: NextRequest) {
  const { brief, brand = 'batiste', chat_id } = await req.json()
  if (!brief) return NextResponse.json({ error: 'brief required' }, { status: 400 })

  const brandContext: Record<string, string> = {
    batiste: 'Batiste Dry Shampoo — "ผมสวยไม่ต้องสระ" กลุ่มเป้า: สาวออฟฟิศ 24-32 + นักศึกษา 18-23',
    scrub_daddy: 'Scrub Daddy — viral Shark Tank กลุ่มเป้า: แม่บ้าน + Gen Z',
  }

  const systemPrompt = `คุณคือ Jeff TikTok copywriter ของ Royal Shammi
แบรนด์: ${brandContext[brand] ?? brandContext.batiste}
สร้าง TikTok caption ภาษาไทย ตอบ JSON เท่านั้น:
{"hook":"...","caption":"...","hashtags":["#..."],"cta":"..."}`

  const llmRes = await fetch('http://localhost:4000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env('LITELLM_MASTER_KEY')}` },
    body: JSON.stringify({
      model: 'groq/llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Brief: ${brief}` }],
      temperature: 0.8, response_format: { type: 'json_object' },
    }),
  })
  if (!llmRes.ok) return NextResponse.json({ error: 'LLM failed', detail: await llmRes.text() }, { status: 502 })

  const llmData = await llmRes.json()
  const raw = llmData.choices?.[0]?.message?.content ?? '{}'
  let draft: Record<string, unknown>
  try { draft = JSON.parse(raw) } catch { draft = { caption: raw } }

  const draftJson = JSON.stringify(draft).replace(/'/g, "''")
  const chatVal = chat_id ? String(chat_id) : 'NULL'
  const sql = `INSERT INTO content_drafts (draft_type, brand, brief, draft_content, chat_id) VALUES ('tiktok_caption', '${brand}', '${brief.replace(/'/g, "''")}', '${draftJson}'::jsonb, ${chatVal}) RETURNING id;`
  const row = dbQuery(sql).trim()
  const draft_id = row ? parseInt(row) : null

  return NextResponse.json({ draft_id, draft })
}

// GET /api/job/caption?status=pending
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') ?? 'pending'
  const rows = dbQuery(`SELECT id, draft_type, brand, brief, draft_content, status, created_at FROM content_drafts WHERE draft_type='tiktok_caption' AND status='${status}' ORDER BY created_at DESC LIMIT 20;`)
  const drafts = rows.trim().split('\n').filter(Boolean).map(r => {
    const [id, draft_type, brand, brief, draft_content, st, created_at] = r.split('|||')
    return { id, draft_type, brand, brief, draft_content: JSON.parse(draft_content || '{}'), status: st, created_at }
  })
  return NextResponse.json({ drafts })
}
