import { NextResponse } from 'next/server'

export async function GET() {
  const checks = await Promise.allSettled([
    fetch('http://localhost:4000/health/liveliness', { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
    fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
    fetch('http://localhost:5678/healthz', { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
  ])

  return NextResponse.json({
    litellm: checks[0].status === 'fulfilled' ? checks[0].value : false,
    ollama: checks[1].status === 'fulfilled' ? checks[1].value : false,
    n8n: checks[2].status === 'fulfilled' ? checks[2].value : false,
    timestamp: new Date().toISOString()
  })
}
