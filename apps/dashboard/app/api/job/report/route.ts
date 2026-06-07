import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')
function env(key: string) { try { return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim() } catch { return '' } }
function pgCid() { const b = execSync('docker ps --filter label=coprem.service=postgres -q', { encoding: 'utf8' }).trim(); return b ? b.split('\n')[0] : execSync('docker ps --filter name=postgres -q', { encoding: 'utf8' }).trim().split('\n')[0] }
function app(sql: string) { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem_os', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }
function rs(sql: string)  { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem',    '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }

function fmt(d: Date) { return d.toISOString().slice(0,10) }

// POST /api/job/report — generate weekly report and send to Telegram
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const chatId = body.chat_id ?? env('TELEGRAM_CHAT_ID')

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const day = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - day + 1); weekStart.setHours(0,0,0,0)
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const prevStart = new Date(weekStart); prevStart.setDate(weekStart.getDate() - 7)
  const prevEnd   = new Date(weekStart); prevEnd.setDate(weekStart.getDate() - 1)

  // Revenue this week
  const [revRow] = rs(`SELECT COALESCE(SUM(sold_price * qty),0), COUNT(*) FROM rs_lifestyle.sales_transactions WHERE sale_date BETWEEN '${fmt(weekStart)}' AND '${fmt(weekEnd)}';`).trim().split('\n')
  const [revenue, txn_count] = (revRow || '0|||0').split('|||')

  const [prevRow] = rs(`SELECT COALESCE(SUM(sold_price * qty),0) FROM rs_lifestyle.sales_transactions WHERE sale_date BETWEEN '${fmt(prevStart)}' AND '${fmt(prevEnd)}';`).trim().split('\n')
  const prevRev = parseFloat((prevRow||'0').split('|||')[0])

  // By channel
  const channelRaw = rs(`SELECT c.name, SUM(s.sold_price*s.qty), COUNT(*) FROM rs_lifestyle.sales_transactions s LEFT JOIN rs_lifestyle.channels c ON c.id=s.channel_id WHERE s.sale_date BETWEEN '${fmt(weekStart)}' AND '${fmt(weekEnd)}' GROUP BY c.name ORDER BY 2 DESC NULLS LAST LIMIT 5;`)
  const by_channel = channelRaw.trim().split('\n').filter(Boolean).map(r => { const [n,rev,cnt]=r.split('|||'); return { channel: n, revenue: parseFloat(rev)||0, txn: parseInt(cnt)||0 } })

  // Top products
  const prodRaw = rs(`SELECT item_name, SUM(qty), SUM(sold_price*qty) FROM rs_lifestyle.sales_transactions WHERE sale_date BETWEEN '${fmt(weekStart)}' AND '${fmt(weekEnd)}' GROUP BY item_name ORDER BY 3 DESC NULLS LAST LIMIT 5;`)
  const top_products = prodRaw.trim().split('\n').filter(Boolean).map(r => { const [n,qty,rev]=r.split('|||'); return { item: n, qty_sold: parseInt(qty)||0, revenue: parseFloat(rev)||0 } })

  const thisRev = parseFloat(revenue) || 0
  const wow = prevRev > 0 ? ((thisRev - prevRev) / prevRev * 100).toFixed(1) : null
  const flags = [
    ...(wow !== null && parseFloat(wow) < -10 ? [`⚠️ ยอดขายลด ${wow}% จากสัปดาห์ที่แล้ว`] : []),
    ...(thisRev === 0 ? ['⚠️ ไม่มีข้อมูลยอดขายสัปดาห์นี้ในระบบ'] : []),
  ]

  const reportData = { week: `${fmt(weekStart)} – ${fmt(weekEnd)}`, total_revenue_thb: thisRev, txn_count: parseInt(txn_count)||0, vs_last_week_pct: wow, by_channel, top_products, flags }

  // LLM summary
  const llmRes = await fetch('http://localhost:4000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env('LITELLM_MASTER_KEY')}` },
    body: JSON.stringify({ model: 'groq/llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'สรุป weekly sales report ภาษาไทย กระชับ มีตัวเลข ไม่เกิน 120 คำ' }, { role: 'user', content: JSON.stringify(reportData) }], temperature: 0.3 }),
  })
  let summaryText = flags.join(' | ') || 'ไม่สามารถสร้างสรุปได้'
  if (llmRes.ok) summaryText = (await llmRes.json()).choices?.[0]?.message?.content ?? summaryText

  // Save
  const escaped = JSON.stringify(reportData).replace(/'/g, "''")
  app(`INSERT INTO weekly_reports (week_start, week_end, brand, report_data, summary_text, sent_at) VALUES ('${fmt(weekStart)}','${fmt(weekEnd)}','all','${escaped}','${summaryText.replace(/'/g,"''")}',NOW()) ON CONFLICT (week_start, brand) DO UPDATE SET report_data='${escaped}', summary_text='${summaryText.replace(/'/g,"''")}', sent_at=NOW();`)

  // Send Telegram
  const tgMsg = `📊 *Weekly Report*\n${fmt(weekStart)} – ${fmt(weekEnd)}\n\n${summaryText}\n\n💰 ฿${thisRev.toLocaleString()} | ${txn_count} รายการ${wow ? ` | WoW: ${parseFloat(wow)>0?'+':''}${wow}%` : ''}`
  await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: tgMsg, parse_mode: 'Markdown' }),
  })

  return NextResponse.json({ ok: true, report: reportData, summary: summaryText })
}

export async function GET() {
  const rows = app(`SELECT id, week_start, week_end, summary_text, created_at FROM weekly_reports ORDER BY week_start DESC LIMIT 12;`)
  const reports = rows.trim().split('\n').filter(Boolean).map(r => { const [id,ws,we,sum,ca]=r.split('|||'); return {id,week_start:ws,week_end:we,summary_text:sum,created_at:ca} })
  return NextResponse.json({ reports })
}
