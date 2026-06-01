import { NextRequest, NextResponse } from 'next/server'

const LITELLM_URL = 'http://localhost:4000/v1/chat/completions'
const LITELLM_KEY = process.env.LITELLM_KEY || ''
const N8N_WEBHOOK = 'https://n8n.peabuntid.com/webhook/telegram-coprem'

const SYSTEM_PROMPT = 'You are Jeff, an INTJ AI Executive Partner for Prem. Be direct, analytical, and helpful. Reply in Thai when the user writes in Thai.'

export async function POST(req: NextRequest) {
  const { message, model } = await req.json()
  if (!message) return NextResponse.json({ error: 'no message' }, { status: 400 })

  // Direct LiteLLM call when model is specified
  if (model && model !== 'auto') {
    try {
      // Get LITELLM_KEY from env file
      const { execSync } = await import('child_process')
      const key = execSync(`grep LITELLM_MASTER_KEY /Users/eilinaire/Desktop/Coprem/.env | cut -d= -f2`, { encoding: 'utf8' }).trim()

      const res = await fetch(LITELLM_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          max_tokens: model.startsWith('ollama') ? 512 : 1200,
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(30000)
      })
      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content || data?.error?.message || '(ไม่มีการตอบกลับ)'
      return NextResponse.json({ reply, model, source: 'litellm' })
    } catch (e: unknown) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
    }
  }

  // Auto mode: call LiteLLM directly with auto model selection (Gemini Flash → Groq fallback)
  const autoModels = ['gemini-2.0-flash', 'groq/llama-3.3-70b', 'gemini-2.0-flash-lite']
  try {
    const { execSync } = await import('child_process')
    const key = execSync(`grep LITELLM_MASTER_KEY /Users/eilinaire/Desktop/Coprem/.env | cut -d= -f2`, { encoding: 'utf8' }).trim()
    let lastError = ''
    for (const autoModel of autoModels) {
      try {
        const res = await fetch(LITELLM_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: autoModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: message }
            ],
            max_tokens: 1200,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(30000)
        })
        const data = await res.json()
        const reply = data?.choices?.[0]?.message?.content
        if (reply) return NextResponse.json({ reply, model: autoModel, source: 'litellm-auto' })
        lastError = data?.error?.message || 'no reply'
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    return NextResponse.json({ error: lastError }, { status: 502 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
