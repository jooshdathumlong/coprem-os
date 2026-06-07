import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')
function env(key: string) { try { return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim() } catch { return '' } }
function pgCid() { const b = execSync('docker ps --filter label=coprem.service=postgres -q', { encoding: 'utf8' }).trim(); return b ? b.split('\n')[0] : execSync('docker ps --filter name=postgres -q', { encoding: 'utf8' }).trim().split('\n')[0] }
function db(sql: string) { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem_os', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }

// POST /api/job/description  body: { product_name, key_points?, brand?, platform? }
export async function POST(req: NextRequest) {
  const { product_name, key_points, brand = 'batiste', platform = 'shopee', chat_id } = await req.json()
  if (!product_name) return NextResponse.json({ error: 'product_name required' }, { status: 400 })

  const systemPrompt = `คุณคือ Jeff copywriter Royal Shammi
สร้าง ${platform.toUpperCase()} product listing ภาษาไทย — keyword-rich, emoji-friendly
ตอบ JSON เท่านั้น:
{"title":"...","bullet_points":["..."],"description":"...","search_keywords":["..."]}`

  const userMsg = `สินค้า: ${product_name} | แบรนด์: ${brand} | จุดขาย: ${key_points ?? 'ไม่ระบุ'}`

  const llmRes = await fetch('http://localhost:4000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env('LITELLM_MASTER_KEY')}` },
    body: JSON.stringify({
      model: 'groq/llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      temperature: 0.7, response_format: { type: 'json_object' },
    }),
  })
  if (!llmRes.ok) return NextResponse.json({ error: 'LLM failed', detail: await llmRes.text() }, { status: 502 })

  const raw = (await llmRes.json()).choices?.[0]?.message?.content ?? '{}'
  let draft: Record<string, unknown>
  try { draft = JSON.parse(raw) } catch { draft = { description: raw } }

  const draftType = platform === 'lazada' ? 'lazada_desc' : 'shopee_desc'
  const draftJson = JSON.stringify(draft).replace(/'/g, "''")
  const chatVal = chat_id ? String(chat_id) : 'NULL'
  const row = db(`INSERT INTO content_drafts (draft_type, brand, brief, product_name, draft_content, chat_id) VALUES ('${draftType}', '${brand}', '${userMsg.replace(/'/g, "''")}', '${product_name.replace(/'/g, "''")}', '${draftJson}'::jsonb, ${chatVal}) RETURNING id;`).trim()

  return NextResponse.json({ draft_id: row ? parseInt(row) : null, draft })
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') ?? 'pending'
  const rows = db(`SELECT id, draft_type, brand, product_name, draft_content, status, created_at FROM content_drafts WHERE draft_type IN ('shopee_desc','lazada_desc') AND status='${status}' ORDER BY created_at DESC LIMIT 20;`)
  const drafts = rows.trim().split('\n').filter(Boolean).map(r => {
    const [id, draft_type, brand, product_name, draft_content, st, created_at] = r.split('|||')
    return { id, draft_type, brand, product_name, draft_content: JSON.parse(draft_content || '{}'), status: st, created_at }
  })
  return NextResponse.json({ drafts })
}
