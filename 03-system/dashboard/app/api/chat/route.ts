import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import http from 'http'
import { execSync } from 'child_process'

// ── Env helpers (must be first — used by ragSearch) ───────────────────────────
const ROOT = join(process.cwd(), '..', '..')
function loadEnvKey(key: string): string {
  try {
    return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim()
  } catch { return '' }
}

// ── RAG: embed query → search pgvector → return top-k context ────────────────
async function translateToEnglish(text: string): Promise<string> {
  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        messages: [{ role: 'user', content: `Translate to English only, no explanation:\n${text.slice(0, 500)}` }],
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    return data?.message?.content?.trim() || text
  } catch { return text }
}

async function ragSearch(query: string, topK = 5): Promise<string> {
  try {
    // Translate query to English first (nomic-embed-text is EN-optimized)
    const enQuery = await translateToEnglish(query)

    // Embed query with Ollama nomic-embed-text (local, no rate limit)
    const embedRes = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: enQuery }),
      signal: AbortSignal.timeout(10000),
    })
    const embedData = await embedRes.json()
    const vec = embedData?.embeddings?.[0] as number[]
    if (!vec?.length) return ''

    // Query pgvector
    const vecStr = '[' + vec.map((x: number) => x.toFixed(6)).join(',') + ']'
    const sql = `SELECT content, pillar, kb_id, 1 - (embedding <=> '${vecStr}'::vector) AS score FROM memory_embeddings WHERE embedding IS NOT NULL ORDER BY embedding <=> '${vecStr}'::vector LIMIT ${topK};`
    const pgCid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
    const result = execSync(
      `docker exec ${pgCid} psql -U coprem -d coprem_os -t -A -F"|||" -c "${sql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()

    if (!result) return ''
    const rows = result.split('\n').filter(Boolean).map(r => r.split('|||'))
    const chunks = rows
      .filter(r => parseFloat(r[3] || '0') > 0.3)
      .map(r => `[${r[2]}/${r[1]}] ${r[0].slice(0, 800)}`)
      .join('\n\n---\n\n')

    return chunks ? `## KB Context (จากฐานความรู้ของเปรม — ใช้ข้อมูลนี้ตอบก่อนเสมอ ห้ามเดาหรือสร้างข้อมูลใหม่ถ้ามี context ให้แล้ว)\n${chunks}` : ''
  } catch { return '' }
}

const LITELLM_URL = 'http://127.0.0.1:4000/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const GEMINI_LITE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'
const KB_ROOT = join(ROOT, '02-knowledge')
const AUTO_MEMORY_DIR = join(KB_ROOT, 'work', 'auto')

// ── Load JOS (Jeff Operating Standard) ───────────────────────────────────────
function loadJOS(): string {
  const josPath = join(ROOT, '03-system/jeff_jos.md')
  try { return existsSync(josPath) ? readFileSync(josPath, 'utf-8') : '' } catch { return '' }
}

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

  // JOS core directives — compressed for runtime (full spec in 03-system/jeff_jos.md)
  sections.push(`## Jeff Operating Standard

**BEFORE every reply: Reason → Act → Verify**
1. Read ALL history — find what's already been worked on
2. Identify Prem's REAL intent (not just surface words)
3. Apply correct output standard for task type
4. Check: Does answer address real intent? Used history? Has next action?

**Task Output Standards:**
- Persona: ชื่อ/อายุ/อาชีพ/เพศ/สัญชาติ + Pain/Desire/Trigger/Objection/Channel/Quote
- Strategy: 3 Options+trade-offs → Recommendation → Next 3 actions
- Content: Hook → Body → CTA + platform notes
- Analysis: Key insight → Evidence → So what? → Recommendation

**History Rules (CRITICAL):**
- ถ้ามีงานค้างใน history → ต่อจากนั้นเลย ห้ามเริ่มใหม่
- เปรม paste framework → APPLY กับงานที่คุยอยู่ทันที ไม่ใช่อธิบายซ้ำ
- "ปรับปรุง/อัพเดต" → หา output ล่าสุดใน history แล้วแก้จากมัน

**Forbidden:** สรุปซ้ำสิ่งที่เปรมบอก | ถามโดยไม่จำเป็น | Generic answers | Sycophancy`)

  sections.push(`## CONTEXT — วันนี้คือ ${today}
- Q2 2026 (เม.ย.–มิ.ย.) — Phase "เร่ง Conversion + เปิด Scrub Daddy"
- งานเร่งด่วน: รัน Paid Ads, เปิด Shopee/Lazada Official, Launch Scrub Daddy, A/B test creative`)

  // Prem profile — concise, always included
  const profilePath = join(ROOT, '01-projects/prem-profile.md')
  if (existsSync(profilePath)) {
    try { sections.push(`## ข้อมูลเปรม\n${readFileSync(profilePath, 'utf-8').slice(0, 600)}`) } catch { /* skip */ }
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
  for (const h of history.slice(-30)) {
    const text = h.text.replace(/\s*\[📎[^\]]*\]$/, '').trim()
    contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text }] })
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
  const payload = { model, messages, max_tokens: model.startsWith('ollama') ? 512 : maxTokens, temperature: 0.7 }

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const opts: http.RequestOptions = {
      hostname: '127.0.0.1', port: 4000,
      path: '/v1/chat/completions', method: 'POST',
      headers: {
        'Authorization': `Bearer ${litellmKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 20000,
    }
    const req = http.request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const d = JSON.parse(data)
          if (res.statusCode !== 200) { reject(new Error(`LiteLLM ${res.statusCode}: ${JSON.stringify(d).slice(0, 200)}`)); return }
          resolve(d?.choices?.[0]?.message?.content)
        } catch (e) { reject(e) }
      })
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', e => reject(e))
    req.write(body)
    req.end()
  })
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
  // 30 messages = 15 exchanges — better context continuity across long sessions
  const historyMsgs: Msg[] = safeHistory.slice(-30).map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.text.replace(/\s*\[📎[^\]]*\]$/, '').trim()  // strip file attachment suffix
  }))

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
      for (const m of ['groq/llama-3.3-70b', 'gemini-2.0-flash', 'ollama/qwen2.5:3b']) {
        try {
          const r = await callLiteLLM(m, systemPrompt, historyMsgs, textMsg, litellmKey)
          if (r) { finalReply = r; finalModel = m; finalSource = 'text-fallback'; break }
        } catch { /* next */ }
      }
    }

    if (!finalReply) return NextResponse.json({ error: 'All models unavailable — try again in a minute' }, { status: 502 })

  } else {
    // ── PATH B: Text only → RAG + LiteLLM tier fallback ──
    const TIER_MODELS = model && model !== 'auto'
      ? [model]
      : ['local', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'groq/llama-3.3-70b', 'ollama/qwen2.5:3b']

    // RAG: search KB in parallel with first LLM call
    const ragContext = await ragSearch(message)
    const enrichedPrompt = ragContext
      ? `${systemPrompt}\n\n${ragContext}`
      : systemPrompt

    // Run all tier models in parallel — take first successful reply
    type ModelResult = { reply: string; model: string }
    console.log(`[jeff] calling models: ${TIER_MODELS.join(', ')} rag=${!!ragContext} prompt_len=${enrichedPrompt.length} hist=${historyMsgs.length}`)
    const winner = await new Promise<ModelResult | null>(resolve => {
      let pending = TIER_MODELS.length
      TIER_MODELS.forEach(m => {
        const t = Date.now()
        callLiteLLM(m, enrichedPrompt, historyMsgs, message, litellmKey)
          .then(r => { console.log(`[jeff] ${m} reply in ${Date.now()-t}ms: ${r ? 'OK' : 'NULL'}`); if (r) resolve({ reply: r, model: m }) })
          .catch(e => { console.log(`[jeff] ${m} error in ${Date.now()-t}ms: ${String(e).slice(0,80)}`) })
          .finally(() => { if (--pending === 0) { console.log(`[jeff] all done`); resolve(null) } })
      })
    })
    if (winner) { finalReply = winner.reply; finalModel = winner.model; finalSource = 'litellm' }

    // Direct Ollama fallback (bypass LiteLLM)
    if (!finalReply) {
      try {
        const ollamaRes = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen2.5:3b',
            messages: [{ role: 'user', content: `${enrichedPrompt}\n\n---\n\n${message}` }],
            stream: false,
          }),
          signal: AbortSignal.timeout(120000),
        })
        const od = await ollamaRes.json()
        const r = od?.message?.content
        if (r) { finalReply = r; finalModel = 'ollama/qwen2.5:3b'; finalSource = 'ollama-direct' }
      } catch (e) { console.log('[jeff] ollama-direct error:', String(e).slice(0, 80)) }
    }

    if (!finalReply) return NextResponse.json({ error: 'ทุก model ไม่ตอบสนอง — Gemini quota หมด + Groq rate-limit\nลองใหม่ใน 1 นาที' }, { status: 502 })
  }

  // ── Classify with 8s timeout — if slow, skip suggestion this turn ──
  const userText = message || (attachment ? `[ส่งไฟล์: ${attachment.name}]` : '')
  const memorySuggestionPromise = Promise.race([
    classifyOnly(userText, finalReply).catch(() => null),
    new Promise<null>(res => setTimeout(() => res(null), 8000))
  ])

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
