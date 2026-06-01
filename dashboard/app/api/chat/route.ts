import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL || 'https://n8n.peabuntid.com/webhook/telegram-coprem'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'no message' }, { status: 400 })

  const payload = {
    body: {
      message: {
        text: message,
        from: { id: 7731591925, first_name: 'Dashboard', username: 'dashboard' },
        chat: { id: 7731591925 }
      }
    }
  }

  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    })
    const text = await res.text()
    return NextResponse.json({ reply: text || '(no reply)' })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
