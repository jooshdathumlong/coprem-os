import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')
function env(key: string) { try { return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim() } catch { return '' } }
function pgCid() { const b = execSync('docker ps --filter label=coprem.service=postgres -q', { encoding: 'utf8' }).trim(); return b ? b.split('\n')[0] : execSync('docker ps --filter name=postgres -q', { encoding: 'utf8' }).trim().split('\n')[0] }
function app(sql: string) { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem_os', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }
function rs(sql: string)  { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem',    '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }
function tier(f: number | null) { if (!f) return 'unknown'; if (f>=1e6) return 'mega'; if (f>=5e5) return 'macro'; if (f>=1e5) return 'mid'; if (f>=1e4) return 'micro'; return 'nano' }

// POST /api/job/campaign
export async function POST(req: NextRequest) {
  const { campaign_name, brand = 'batiste', brief, budget_thb, objective, timeline, chat_id } = await req.json()
  if (!brief) return NextResponse.json({ error: 'brief required' }, { status: 400 })

  const brandId = brand === 'scrub_daddy' ? 3 : 2
  const budgetFilter = budget_thb ? `AND (cost_thb IS NULL OR cost_thb <= ${budget_thb * 0.8})` : ''
  const kolRows = rs(`SELECT id, kol_name, content_category, followers_tiktok, cost_thb, sow FROM rs_lifestyle.kol_list WHERE brand_id=${brandId} ${budgetFilter} ORDER BY followers_tiktok DESC NULLS LAST LIMIT 80;`)
  const kols = kolRows.trim().split('\n').filter(Boolean).map(r => {
    const [id, kol_name, content_category, followers_tiktok, cost_thb, sow] = r.split('|||')
    return { id, kol_name, content_category, followers_tiktok: parseInt(followers_tiktok)||null, cost_thb: parseFloat(cost_thb)||null, sow, tier: tier(parseInt(followers_tiktok)||null) }
  })

  const kolSummary = kols.slice(0, 30).map(k => `ID:${k.id} ${k.kol_name} (${k.tier}, ${k.followers_tiktok??'?'}f, ฿${k.cost_thb??'N/A'}, ${k.content_category})`).join('\n')
  const systemPrompt = `คุณคือ Jeff Campaign Planner Royal Shammi
แบรนด์: ${brand==='batiste'?'Batiste Dry Shampoo':'Scrub Daddy'} | Budget: ฿${budget_thb?.toLocaleString()??'ไม่ระบุ'}
เลือก 5-8 KOL shortlist mix tier ให้อยู่ใน budget ตอบ JSON:
{"shortlist":[{"kol_id":N,"kol_name":"...","tier":"...","cost_thb":N,"recommend_reason":"...","suggested_sow":"..."}],"total_budget_used":N,"strategy_summary":"...","expected_reach":"..."}`

  const llmRes = await fetch('http://localhost:4000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env('LITELLM_MASTER_KEY')}` },
    body: JSON.stringify({ model: 'groq/llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Brief: ${brief}\n\nKOL:\n${kolSummary}` }], temperature: 0.5, response_format: { type: 'json_object' } }),
  })
  if (!llmRes.ok) return NextResponse.json({ error: 'LLM failed' }, { status: 502 })

  const raw = (await llmRes.json()).choices?.[0]?.message?.content ?? '{}'
  let plan: Record<string, unknown>
  try { plan = JSON.parse(raw) } catch { plan = { strategy_summary: raw } }

  const campName = (campaign_name ?? `Campaign ${new Date().toISOString().slice(0,10)}`).replace(/'/g, "''")
  const campRow = app(`INSERT INTO campaign_plans (campaign_name, brand, brief, budget_thb, objective, timeline, chat_id) VALUES ('${campName}','${brand}','${brief.replace(/'/g,"''")}',${budget_thb??'NULL'},'${(objective??'').replace(/'/g,"''")}','${(timeline??'').replace(/'/g,"''")}',${chat_id??'NULL'}) RETURNING id;`).trim()
  const campaign_id = parseInt(campRow)

  for (const k of (plan.shortlist as Record<string, unknown>[]) ?? []) {
    const kol = kols.find(x => x.id === String(k.kol_id))
    app(`INSERT INTO campaign_kols (campaign_id, kol_id, kol_name, content_category, followers_tiktok, cost_thb, sow, tier, recommend_reason) VALUES (${campaign_id},${k.kol_id},'${String(k.kol_name).replace(/'/g,"''")}','${(kol?.content_category??'').replace(/'/g,"''")}',${kol?.followers_tiktok??'NULL'},${k.cost_thb??'NULL'},'${String(k.suggested_sow??'').replace(/'/g,"''")}','${k.tier??'unknown'}','${String(k.recommend_reason??'').replace(/'/g,"''")}');`)
  }

  return NextResponse.json({ campaign_id, plan })
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') ?? 'draft'
  const rows = app(`SELECT id, campaign_name, brand, brief, budget_thb, status, created_at FROM campaign_plans WHERE status='${status}' ORDER BY created_at DESC LIMIT 10;`)
  const campaigns = rows.trim().split('\n').filter(Boolean).map(r => {
    const [id, campaign_name, brand, brief, budget_thb, st, created_at] = r.split('|||')
    return { id, campaign_name, brand, brief, budget_thb: parseFloat(budget_thb)||null, status: st, created_at }
  })
  return NextResponse.json({ campaigns })
}
