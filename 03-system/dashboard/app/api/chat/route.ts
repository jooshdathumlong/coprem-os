import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const LITELLM_URL = 'http://localhost:4000/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
// dashboard lives at 03-system/dashboard/ — need 2 levels up to reach repo root
const ROOT = join(process.cwd(), '..', '..')
const KB_ROOT = join(ROOT, '02-knowledge')

// ── Jeff system prompt ────────────────────────────────────────────────────────
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

  const workDir = join(KB_ROOT, 'work')
  if (existsSync(workDir)) {
    const files = readdirSync(workDir).filter(f => f.endsWith('.md') && !f.startsWith('_'))
    const workContent = files.map(f => {
      try { return readFileSync(join(workDir, f), 'utf-8').slice(0, 2000) } catch { return '' }
    }).filter(Boolean).join('\n\n---\n\n')
    if (workContent) sections.push(`## งานประจำของเปรม (Day Job)\n${workContent}`)
  }

  const profilePath = join(ROOT, '01-projects/prem-profile.md')
  if (existsSync(profilePath)) {
    try { sections.push(`## ข้อมูลเปรม\n${readFileSync(profilePath, 'utf-8').slice(0, 1500)}`) } catch { /* skip */ }
  }

  const bizPath = join(KB_ROOT, 'personal/business_ssot.md')
  if (existsSync(bizPath)) {
    try { sections.push(`## ธุรกิจของเปรม\n${readFileSync(bizPath, 'utf-8').slice(0, 1500)}`) } catch { /* skip */ }
  }

  return sections.join('\n\n')
}

let _promptCache: { prompt: string; ts: number } | null = null
function getSystemPrompt(): string {
  const now = Date.now()
  if (_promptCache && now - _promptCache.ts < 5 * 60 * 1000) return _promptCache.prompt
  const prompt = buildSystemPrompt()
  _promptCache = { prompt, ts: now }
  return prompt
}

// ── Load env keys ─────────────────────────────────────────────────────────────
function loadEnvKey(key: string): string {
  try {
    const { execSync } = require('child_process')
    return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim()
  } catch { return '' }
}

// Gemini key rotation — tries each key until one works
const GEMINI_KEY_NAMES = [
  'EILINAIRE_GOOGLE_API_KEY',
  'JOOSHDATHUMLONG_GOOGLE_API_KEY',
  'MAHITTISAK_GOOGLE_API_KEY',
  'SUNSETSOL_GOOGLE_API_KEY',
  'RLIE_GOOGLE_API_KEY',
  'PEABANTID_GOOGLE_API_KEY',
]

// ── Gemini native API (for attachments) ───────────────────────────────────────
type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }

async function callGeminiNative(
  systemPrompt: string,
  history: { role: string; text: string }[],
  message: string,
  attachment: { name: string; type: string; dataUrl: string; text?: string } | null
): Promise<string> {
  // Build history in Gemini format (role: user/model)
  const contents: { role: string; parts: GeminiPart[] }[] = []
  for (const h of history.slice(-20)) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })
  }

  // Current user turn — assemble parts
  const userParts: GeminiPart[] = []

  if (attachment) {
    if (attachment.type.startsWith('image/') || attachment.type === 'application/pdf') {
      // Strip data URL prefix → raw base64
      const base64 = attachment.dataUrl.split(',')[1]
      userParts.push({ inline_data: { mime_type: attachment.type, data: base64 } })
    } else if (attachment.text) {
      // Plain text files — embed content directly
      userParts.push({ text: `[ไฟล์แนบ: ${attachment.name}]\n\`\`\`\n${attachment.text.slice(0, 16000)}\n\`\`\`` })
    }
  }

  if (message) userParts.push({ text: message })
  if (userParts.length === 0) userParts.push({ text: 'โปรดวิเคราะห์ไฟล์ที่แนบมา' })

  contents.push({ role: 'user', parts: userParts })

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
  }

  // Try each Gemini key
  for (const keyName of GEMINI_KEY_NAMES) {
    const apiKey = loadEnvKey(keyName)
    if (!apiKey) continue
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000),
      })
      const data = await res.json()
      if (res.status === 429) continue  // quota — try next key
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch (e) {
      if ((e as Error).message?.includes('429')) continue
      throw e
    }
  }
  throw new Error('Gemini: all keys exhausted or quota exceeded')
}

// ── LiteLLM (text-only, tier fallback) ────────────────────────────────────────
type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

async function callLiteLLM(
  model: string,
  systemPrompt: string,
  historyMsgs: Msg[],
  message: string,
  litellmKey: string,
  maxTokens = 1500
): Promise<string | undefined> {
  const messages: Msg[] = [
    { role: 'system', content: systemPrompt },
    ...historyMsgs,
    { role: 'user', content: message }
  ]
  const res = await fetch(LITELLM_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${litellmKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: model.startsWith('ollama') ? 512 : maxTokens,
      temperature: 0.7
    }),
    signal: AbortSignal.timeout(60000)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`LiteLLM ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
  return data?.choices?.[0]?.message?.content as string | undefined
}

// ── Route handler ─────────────────────────────────────────────────────────────
type Attachment = { name: string; type: string; dataUrl: string; text?: string } | null

export async function POST(req: NextRequest) {
  const { message, model, history, auto_chain, attachment } = await req.json() as {
    message: string
    model: string
    history: { role: string; text: string }[]
    auto_chain?: boolean
    attachment?: Attachment
  }
  if (!message && !attachment) return NextResponse.json({ error: 'no message' }, { status: 400 })

  const systemPrompt = getSystemPrompt()
  const safeHistory = Array.isArray(history) ? history : []

  // ── PATH A: Attachment → Gemini native → LiteLLM gemini → text-only fallback ──
  if (attachment) {
    const litellmKey = loadEnvKey('LITELLM_MASTER_KEY')
    const historyMsgs: Msg[] = safeHistory.slice(-20).map(h => ({
      role: h.role as 'user' | 'assistant', content: h.text
    }))

    // A1: Gemini native (best quality, direct API)
    try {
      const reply = await callGeminiNative(systemPrompt, safeHistory, message || '', attachment)
      return NextResponse.json({ reply, model: 'gemini-2.0-flash', source: 'gemini-native' })
    } catch { /* quota/error — try next path */ }

    // A2: LiteLLM gemini (uses LiteLLM's own key config)
    if (attachment.type.startsWith('image/')) {
      for (const m of ['gemini-2.0-flash', 'gemini-2.0-flash-lite']) {
        try {
          const msgs = [
            { role: 'system' as const, content: systemPrompt },
            ...historyMsgs,
            { role: 'user' as const, content: [
              { type: 'text', text: message || 'โปรดวิเคราะห์รูปภาพนี้' },
              { type: 'image_url', image_url: { url: attachment.dataUrl } }
            ] as unknown as string }
          ]
          const res = await fetch(LITELLM_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${litellmKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: m, messages: msgs, max_tokens: 1500, temperature: 0.7 }),
            signal: AbortSignal.timeout(60000)
          })
          const data = await res.json()
          if (res.ok) {
            const reply = data?.choices?.[0]?.message?.content
            if (reply) return NextResponse.json({ reply, model: m, source: 'litellm-vision' })
          }
        } catch { /* try next */ }
      }
    }

    // A3: Text-only fallback — describe what was attached, ask model to help without image
    const textMsg = attachment.text
      ? `[ไฟล์แนบ: ${attachment.name}]\n\`\`\`\n${attachment.text.slice(0, 12000)}\n\`\`\`\n\n${message || 'โปรดวิเคราะห์ไฟล์นี้'}`
      : `[หมายเหตุ: ผู้ใช้แนบไฟล์ "${attachment.name}" (${attachment.type}) แต่ไม่สามารถประมวลผลภาพได้ขณะนี้ — Gemini quota หมด]\n\n${message || 'โปรดช่วยตอบจากข้อความที่มี'}`

    for (const m of ['groq/llama-3.3-70b', 'gemini-2.0-flash', 'ollama/llama3.1:8b']) {
      try {
        const reply = await callLiteLLM(m, systemPrompt, historyMsgs, textMsg, litellmKey)
        if (reply) return NextResponse.json({ reply, model: m, source: 'text-fallback' })
      } catch { /* next */ }
    }

    return NextResponse.json({ error: 'All models unavailable — please try again in a minute' }, { status: 502 })
  }

  // ── PATH B: Text only → LiteLLM tier fallback ──────────────────────────────
  const litellmKey = loadEnvKey('LITELLM_MASTER_KEY')
  const historyMsgs: Msg[] = safeHistory.slice(-20).map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.text
  }))

  const TIER_MODELS = model && model !== 'auto'
    ? [model]
    : ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'groq/llama-3.3-70b', 'ollama/llama3.1:8b']

  let finalReply: string | null = null
  let finalModel = ''
  let lastError = ''

  for (const m of TIER_MODELS) {
    try {
      const reply = await callLiteLLM(m, systemPrompt, historyMsgs, message, litellmKey)
      if (reply) { finalReply = reply; finalModel = m; break }
      lastError = 'empty reply'
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  if (!finalReply) return NextResponse.json({ error: lastError }, { status: 502 })

  // Optional: queue follow-up analysis task
  if (auto_chain) {
    try {
      const { execSync } = await import('child_process')
      const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
      const followUp = `จาก conversation: "${message.slice(0, 120)}" — ระบุ action item ถัดไป (1 ข้อ)`
      const payload = JSON.stringify({ prompt: followUp, notify_telegram: false }).replace(/'/g, "''")
      execSync(`docker exec ${cid} psql -U coprem -d coprem_os -c "INSERT INTO task_queue (type, payload, assigned_to, priority, run_at) VALUES ('analysis', '${payload}', 'jeff', 8, NOW() + INTERVAL '30 seconds');"`, { encoding: 'utf8', stdio: 'pipe' })
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ reply: finalReply, model: finalModel, source: 'litellm' })
}
