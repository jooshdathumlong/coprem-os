export const dynamic = 'force-dynamic'

async function checkServices() {
  const checks = await Promise.allSettled([
    fetch('http://localhost:4000/health/liveliness', { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
    fetch('http://localhost:11434/api/tags',          { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
    fetch('http://localhost:5678/healthz',            { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
  ])
  return {
    litellm:   checks[0].status === 'fulfilled' ? checks[0].value : false,
    ollama:    checks[1].status === 'fulfilled' ? checks[1].value : false,
    n8n:       checks[2].status === 'fulfilled' ? checks[2].value : false,
    timestamp: new Date().toISOString(),
  }
}

export async function GET() {
  const encoder = new TextEncoder()
  let interval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const data = await checkServices()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* keep alive */ }
      }
      await send()
      interval = setInterval(send, 10000)
    },
    cancel() {
      if (interval) clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
