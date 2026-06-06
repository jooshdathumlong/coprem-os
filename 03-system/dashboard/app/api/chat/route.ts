import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const LITELLM_URL = 'http://localhost:4000/v1/chat/completions'
// dashboard lives at 03-system/dashboard/ — need 2 levels up to reach repo root
const ROOT = join(process.cwd(), '..', '..')
const KB_ROOT = join(ROOT, '02-knowledge')

// ── Build dynamic system prompt with KB context ──────────────────────────
function buildSystemPrompt(): string {
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const sections: string[] = []

  sections.push(`คุณคือ Jeff — AI Executive Partner INTJ ของเปรม วันนี้คือ ${today}

## กฎการตอบ (ห้ามละเมิด)
1. **ตอบสั้น ตรงประเด็น** — ไม่เกิน 3 ย่อหน้าถ้าไม่ได้ถามลงลึก
2. **ไม่ถามกลับว่า "คุณต้องการอะไร"** — Jeff วิเคราะห์เองแล้วตัดสินใจ ถ้าไม่แน่ใจเสนอทางเลือก 2-3 ข้อพร้อม recommendation
3. **เมื่อถาม "วันนี้ต้องทำอะไร"** — ดูวันที่ปัจจุบัน + แผนงานที่มี แล้วสรุป Top 3 priorities ที่ต้องทำวันนี้จริงๆ
4. **เมื่อบอก "ทำให้เลย"** — ลงมือทำทันที ไม่ขอ confirm อีก
5. **เมื่อถาม "ลงรายละเอียด"** — ให้ข้อมูลที่ actionable จริง เช่น caption ตัวอย่าง, ตาราง, ขั้นตอนชัดเจน
6. **ห้ามพูดว่า** "ฉันหวังว่า..." / "กรุณาตอบกลับ" / "คุณสามารถเลือก..." — พูดตรงๆ
7. **ตอบเป็นภาษาไทย** เมื่อเปรมพูดไทย

## สถานะปัจจุบัน (${today})
- ขณะนี้อยู่ใน Q2 2026 (เม.ย.–มิ.ย.) — Phase "เร่ง Conversion + เปิด Scrub Daddy"
- งานเร่งด่วน Q2: รัน Paid Ads, เปิด Shopee/Lazada Official, Launch Scrub Daddy, A/B test creative`)

  // Load work/ KB files (Day Job context)
  const workDir = join(KB_ROOT, 'work')
  if (existsSync(workDir)) {
    const files = readdirSync(workDir).filter(f => f.endsWith('.md') && !f.startsWith('_'))
    const workContent = files.map(f => {
      try { return readFileSync(join(workDir, f), 'utf-8').slice(0, 2000) } catch { return '' }
    }).filter(Boolean).join('\n\n---\n\n')
    if (workContent) sections.push(`## งานประจำของเปรม (Day Job)\n${workContent}`)
  }

  // Load Prem profile
  const profilePath = join(ROOT, '01-projects/prem-profile.md')
  if (existsSync(profilePath)) {
    try {
      const profile = readFileSync(profilePath, 'utf-8').slice(0, 1500)
      sections.push(`## ข้อมูลเปรม\n${profile}`)
    } catch { /* skip */ }
  }

  // Load business SSOT
  const bizPath = join(KB_ROOT, 'personal/business_ssot.md')
  if (existsSync(bizPath)) {
    try {
      const biz = readFileSync(bizPath, 'utf-8').slice(0, 1500)
      sections.push(`## ธุรกิจของเปรม\n${biz}`)
    } catch { /* skip */ }
  }

  return sections.join('\n\n')
}

// Cache prompt for 5 minutes to avoid reading files every request
let _promptCache: { prompt: string; ts: number } | null = null
function getSystemPrompt(): string {
  const now = Date.now()
  if (_promptCache && now - _promptCache.ts < 5 * 60 * 1000) return _promptCache.prompt
  const prompt = buildSystemPrompt()
  _promptCache = { prompt, ts: now }
  return prompt
}

type Attachment = { name: string; type: string; dataUrl: string; text?: string } | null

export async function POST(req: NextRequest) {
  const { message, model, history, auto_chain, attachment } = await req.json() as {
    message: string; model: string; history: unknown[]; auto_chain?: boolean; attachment?: Attachment
  }
  if (!message && !attachment) return NextResponse.json({ error: 'no message' }, { status: 400 })

  const systemPrompt = getSystemPrompt()
  const { execSync } = await import('child_process')
  const envPath = join(ROOT, '.env')
  const key = execSync(`grep LITELLM_MASTER_KEY "${envPath}" | cut -d= -f2-`, { encoding: 'utf8' }).trim()

  // Build messages array with history (last 20 messages = 10 exchanges)
  type Msg = { role: 'user' | 'assistant' | 'system'; content: string }
  const historyMsgs: Msg[] = (Array.isArray(history) ? history.slice(-20) : [])
    .map((h) => { const hh = h as { role: string; text: string }; return { role: hh.role as 'user' | 'assistant', content: hh.text } })

  const callLiteLLM = async (m: string, maxTokens = 1500) => {
    // Build user content: text + optional attachment
    let userContent: string | Array<{type: string; text?: string; image_url?: {url: string}}> = message || ''
    if (attachment) {
      if (attachment.type.startsWith('image/')) {
        // Vision: send as multimodal content array
        userContent = [
          { type: 'text', text: message || 'โปรดวิเคราะห์รูปภาพนี้' },
          { type: 'image_url', image_url: { url: attachment.dataUrl } }
        ]
      } else if (attachment.text) {
        // Text file: prepend file content to message
        userContent = `[ไฟล์แนบ: ${attachment.name}]\n\`\`\`\n${attachment.text.slice(0, 8000)}\n\`\`\`\n\n${message || 'โปรดวิเคราะห์ไฟล์นี้'}`
      }
    }
    const messages: Msg[] = [
      { role: 'system', content: systemPrompt },
      ...historyMsgs,
      { role: 'user', content: userContent as string }
    ]
    const res = await fetch(LITELLM_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: m,
        messages,
        max_tokens: m.startsWith('ollama') ? 512 : maxTokens,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(90000)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(`LiteLLM ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
    return data?.choices?.[0]?.message?.content as string | undefined
  }

  // Specific model selected
  if (model && model !== 'auto') {
    try {
      const reply = await callLiteLLM(model)
      return NextResponse.json({ reply: reply || '(ไม่มีการตอบกลับ)', model, source: 'litellm' })
    } catch (e: unknown) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
    }
  }

  // Auto mode: Tier 0→1→2→3 (matches L1-C tier map)
  const autoModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'groq/llama-3.3-70b', 'ollama/llama3.1:8b']
  let lastError = ''
  let finalReply: string | null = null
  let finalModel = ''
  for (const autoModel of autoModels) {
    try {
      const reply = await callLiteLLM(autoModel)
      if (reply) { finalReply = reply; finalModel = autoModel; break }
      lastError = 'no reply'
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  if (!finalReply) return NextResponse.json({ error: lastError }, { status: 502 })

  // Chain: if auto_chain flag set, queue a follow-up analysis task (non-blocking)
  if (auto_chain) {
    try {
      const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
      const followUp = `จาก conversation ที่ผ่านมา: "${message.slice(0,120)}" — ระบุ action item ถัดไปที่ควรทำ (1 ข้อ)`
      const payload = JSON.stringify({ prompt: followUp, notify_telegram: false }).replace(/'/g, "''")
      execSync(`docker exec ${cid} psql -U coprem -d coprem_os -c "INSERT INTO task_queue (type, payload, assigned_to, priority, run_at) VALUES ('analysis', '${payload}', 'jeff', 8, NOW() + INTERVAL '30 seconds');"`, { encoding: 'utf8', stdio: 'pipe' })
    } catch { /* non-critical — do not fail the chat response */ }
  }

  return NextResponse.json({ reply: finalReply, model: finalModel, source: 'litellm-auto' })
}
