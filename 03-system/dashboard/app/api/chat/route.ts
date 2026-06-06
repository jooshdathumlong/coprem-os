import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const LITELLM_URL = 'http://localhost:4000/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const GEMINI_LITE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'
const ROOT = join(process.cwd(), '..', '..')
const KB_ROOT = join(ROOT, '02-knowledge')
const AUTO_MEMORY_DIR = join(KB_ROOT, 'work', 'auto')

// ── Jeff system prompt ────────────────────────────────────────────────────────
function loadAutoMemories(): string {
  if (!existsSync(AUTO_MEMORY_DIR)) return ''
  try {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000 // last 14 days
    const files = readdirSync(AUTO_MEMORY_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => ({ f, mtime: statSync(join(AUTO_MEMORY_DIR, f)).mtimeMs }))
      .filter(({ mtime }) => mtime > cutoff)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 15)
      .map(({ f }) => f)

    if (!files.length) return ''
    const contents = files.map(f => {
      try { return readFileSync(join(AUTO_MEMORY_DIR, f), 'utf-8').slice(0, 600) } catch { return '' }
    }).filter(Boolean).join('\n\n---\n\n')
    return contents ? `## Jeff Memory (บันทึกจาก session ก่อนหน้า)\n${contents}` : ''
  } catch { return '' }
}

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

  // Day job KB
  const workDir = join(KB_ROOT, 'work')
  if (existsSync(workDir)) {
    const files = readdirSync(workDir).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'auto')
    const workContent = files.map(f => {
      try { return readFileSync(join(workDir, f), 'utf-8').slice(0, 2000) } catch { return '' }
    }).filter(Boolean).join('\n\n---\n\n')
    if (workContent) sections.push(`## งานประจำของเปรม (Day Job)\n${workContent}`)
  }

  // Prem profile
  const profilePath = join(ROOT, '01-projects/prem-profile.md')
  if (existsSync(profilePath)) {
    try { sections.push(`## ข้อมูลเปรม\n${readFileSync(profilePath, 'utf-8').slice(0, 1500)}`) } catch { /* skip */ }
  }

  // Business SSOT
  const bizPath = join(KB_ROOT, 'personal/business_ssot.md')
  if (existsSync(bizPath)) {
    try { sections.push(`## ธุรกิจของเปรม\n${readFileSync(bizPath, 'utf-8').slice(0, 1500)}`) } catch { /* skip */ }
  }

  // Auto-memory: past session outputs
  const memories = loadAutoMemories()
  if (memories) sections.push(memories)

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

// ── Env helpers ───────────────────────────────────────────────────────────────
function loadEnvKey(key: string): string {
  try {
    const { execSync } = require('child_process')
    return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim()
  } catch { return '' }
}

const GEMINI_KEY_NAMES = [
  'EILINAIRE_GOOGLE_API_KEY', 'JOOSHDATHUMLONG_GOOGLE_API_KEY',
  'MAHITTISAK_GOOGLE_API_KEY', 'SUNSETSOL_GOOGLE_API_KEY',
  'RLIE_GOOGLE_API_KEY', 'PEABANTID_GOOGLE_API_KEY',
]

// ── Auto-memory: classify + save + create tasks ───────────────────────────────
interface MemoryResult {
  save: boolean
  type: 'knowledge' | 'decision' | 'plan' | 'research' | 'none'
  title: string
  summary: string
  actions: string[]
}

async function classifyOnly(userMsg: string, jeffReply: string): Promise<MemoryResult | null> {
  const classifyPrompt = `วิเคราะห์บทสนทนานี้แล้วตอบ JSON เท่านั้น ไม่มีข้อความอื่น:

User: ${userMsg.slice(0, 500)}
Jeff: ${jeffReply.slice(0, 1000)}

ตอบ JSON format นี้:
{
  "save": true/false,  // true ถ้าเป็น output มีค่าที่ควรจำ (persona, plan, analysis, decision, research, strategy)
  "type": "knowledge|decision|plan|research|none",
  "title": "ชื่อสั้นๆ ภาษาไทย ไม่เกิน 50 ตัวอักษร",
  "summary": "สรุปสาระสำคัญ 2-3 ประโยค",
  "actions": ["action item 1", "action item 2"]  // สิ่งที่ต้องทำต่อ (อาจเป็น [] ถ้าไม่มี)
}

บันทึกเฉพาะ: persona, แผนงาน, กลยุทธ์, การวิเคราะห์, การตัดสินใจสำคัญ
ไม่บันทึก: คำถามทั่วไป, ทักทาย, status check`

  // Try Gemini lite first (cheap + fast), fallback to Groq
  let raw = ''
  for (const keyName of GEMINI_KEY_NAMES.slice(0, 3)) {
    const apiKey = loadEnvKey(keyName)
    if (!apiKey) continue
    try {
      const res = await fetch(`${GEMINI_LITE_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: classifyPrompt }] }], generationConfig: { maxOutputTokens: 300, temperature: 0 } }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.status === 429) continue
      const data = await res.json()
      raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (raw) break
    } catch { continue }
  }

  // Fallback: Groq classify
  if (!raw) {
    try {
      const litellmKey = loadEnvKey('LITELLM_MASTER_KEY')
      const res = await fetch(LITELLM_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${litellmKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'groq/llama-3.3-70b', messages: [{ role: 'user', content: classifyPrompt }], max_tokens: 300, temperature: 0 }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json()
      raw = data?.choices?.[0]?.message?.content || ''
    } catch { /* skip */ }
  }

  if (!raw) return null

  // Parse JSON
  let result: MemoryResult
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { save: false, type: 'none', title: '', summary: '', actions: [] }
  } catch { return null }

  if (!result.save || result.type === 'none' || !result.title) return null
  return result
}

// ── Gemini native API (attachments) ───────────────────────────────────────────
type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } }

async function callGeminiNative(
  systemPrompt: string,
  history: { role: string; text: string }[],
  message: string,
  attachment: { name: string; type: string; dataUrl: string; text?: string }
): Promise<string> {
  const contents: { role: string; parts: GeminiPart[] }[] = []
  for (const h of history.slice(-20)) {
    contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })
  }

  const userParts: GeminiPart[] = []
  if (attachment.type.startsWith('image/') || attachment.type === 'application/pdf') {
    const base64 = attachment.dataUrl.split(',')[1]
    userParts.push({ inline_data: { mime_type: attachment.type, data: base64 } })
  } else if (attachment.text) {
    userParts.push({ text: `[ไฟล์แนบ: ${attachment.name}]\n\`\`\`\n${attachment.text.slice(0, 16000)}\n\`\`\`` })
  }
  if (message) userParts.push({ text: message })
  if (userParts.length === 0) userParts.push({ text: 'โปรดวิเคราะห์ไฟล์ที่แนบมา' })
  contents.push({ role: 'user', parts: userParts })

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
  }

  for (const keyName of GEMINI_KEY_NAMES) {
    const apiKey = loadEnvKey(keyName)
    if (!apiKey) continue
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(90000),
      })
      const data = await res.json()
      if (res.status === 429) continue
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch (e) { if ((e as Error).message?.includes('429')) continue; throw e }
  }
  throw new Error('Gemini: all keys exhausted or quota exceeded')
}

// ── LiteLLM (text, tier fallback) ─────────────────────────────────────────────
type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

async function callLiteLLM(model: string, systemPrompt: string, historyMsgs: Msg[], message: string, litellmKey: string, maxTokens = 1500): Promise<string | undefined> {
  const messages: Msg[] = [{ role: 'system', content: systemPrompt }, ...historyMsgs, { role: 'user', content: message }]
  const res = await fetch(LITELLM_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${litellmKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: model.startsWith('ollama') ? 512 : maxTokens, temperature: 0.7 }),
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
    message: string; model: string; history: { role: string; text: string }[]
    auto_chain?: boolean; attachment?: Attachment
  }
  if (!message && !attachment) return NextResponse.json({ error: 'no message' }, { status: 400 })

  const systemPrompt = getSystemPrompt()
  const safeHistory = Array.isArray(history) ? history : []
  const litellmKey = loadEnvKey('LITELLM_MASTER_KEY')
  const historyMsgs: Msg[] = safeHistory.slice(-20).map(h => ({ role: h.role as 'user' | 'assistant', content: h.text }))

  let finalReply = ''
  let finalModel = ''
  let finalSource = ''

  // ── PATH A: Attachment → Gemini native → LiteLLM vision → text fallback ──
  if (attachment) {
    // A1: Gemini native
    try {
      finalReply = await callGeminiNative(systemPrompt, safeHistory, message || '', attachment)
      finalModel = 'gemini-2.0-flash'; finalSource = 'gemini-native'
    } catch { /* quota — try next */ }

    // A2: LiteLLM gemini vision
    if (!finalReply && attachment.type.startsWith('image/')) {
      for (const m of ['gemini-2.0-flash', 'gemini-2.0-flash-lite']) {
        try {
          const msgs = [
            { role: 'system' as const, content: systemPrompt }, ...historyMsgs,
            { role: 'user' as const, content: [{ type: 'text', text: message || 'วิเคราะห์รูป' }, { type: 'image_url', image_url: { url: attachment.dataUrl } }] as unknown as string }
          ]
          const res = await fetch(LITELLM_URL, {
            method: 'POST', headers: { 'Authorization': `Bearer ${litellmKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: m, messages: msgs, max_tokens: 1500, temperature: 0.7 }), signal: AbortSignal.timeout(60000)
          })
          const data = await res.json()
          if (res.ok) { const r = data?.choices?.[0]?.message?.content; if (r) { finalReply = r; finalModel = m; finalSource = 'litellm-vision'; break } }
        } catch { /* next */ }
      }
    }

    // A3: text-only fallback
    if (!finalReply) {
      const textMsg = attachment.text
        ? `[ไฟล์: ${attachment.name}]\n\`\`\`\n${attachment.text.slice(0, 12000)}\n\`\`\`\n\n${message || 'วิเคราะห์ไฟล์'}`
        : `[ไฟล์: "${attachment.name}" ไม่สามารถดูภาพได้ขณะนี้ — Gemini quota หมด]\n\n${message || ''}`
      for (const m of ['groq/llama-3.3-70b', 'gemini-2.0-flash', 'ollama/llama3.1:8b']) {
        try {
          const r = await callLiteLLM(m, systemPrompt, historyMsgs, textMsg, litellmKey)
          if (r) { finalReply = r; finalModel = m; finalSource = 'text-fallback'; break }
        } catch { /* next */ }
      }
    }

    if (!finalReply) return NextResponse.json({ error: 'All models unavailable — try again in a minute' }, { status: 502 })

  } else {
    // ── PATH B: Text only → LiteLLM tier fallback ──
    const TIER_MODELS = model && model !== 'auto'
      ? [model]
      : ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'groq/llama-3.3-70b', 'ollama/llama3.1:8b']

    for (const m of TIER_MODELS) {
      try {
        const r = await callLiteLLM(m, systemPrompt, historyMsgs, message, litellmKey)
        if (r) { finalReply = r; finalModel = m; finalSource = 'litellm'; break }
      } catch { /* next tier */ }
    }

    if (!finalReply) return NextResponse.json({ error: 'All models unavailable' }, { status: 502 })
  }

  // ── Classify in background — suggestion returned to UI for Prem to approve ──
  const userText = message || (attachment ? `[ส่งไฟล์: ${attachment.name}]` : '')
  const memorySuggestionPromise = classifyOnly(userText, finalReply).catch(() => null)

  // ── Optional auto_chain task ──────────────────────────────────────────────
  if (auto_chain) {
    try {
      const { execSync } = await import('child_process')
      const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
      const followUp = `จาก conversation: "${message?.slice(0, 120)}" — ระบุ action item ถัดไป (1 ข้อ)`
      const payload = JSON.stringify({ prompt: followUp, notify_telegram: false }).replace(/'/g, "''")
      execSync(`docker exec ${cid} psql -U coprem -d coprem_os -c "INSERT INTO task_queue (type, payload, assigned_to, priority, run_at) VALUES ('analysis', '${payload}', 'jeff', 8, NOW() + INTERVAL '30 seconds');"`, { encoding: 'utf8', stdio: 'pipe' })
    } catch { /* non-critical */ }
  }

  // Await classify (runs in parallel while user reads Jeff's reply — usually <3s)
  const memorySuggestion = await memorySuggestionPromise

  return NextResponse.json({
    reply: finalReply,
    model: finalModel,
    source: finalSource,
    memorySuggestion: memorySuggestion ? {
      title: memorySuggestion.title,
      type: memorySuggestion.type,
      summary: memorySuggestion.summary,
      actions: memorySuggestion.actions,
      content: finalReply,
      userMsg: userText,
    } : null,
  })
}
