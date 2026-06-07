import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
    const out = execSync(`docker exec ${cid} psql -U coprem -d coprem_os -t -A -F '|||' -c "SELECT event_type, avg_ms, max_ms, requests, slow_count FROM v_latency_by_layer LIMIT 10;"`, { encoding: 'utf8' })
    const rows = out.trim().split('\n').filter(Boolean).map(line => {
      const [event_type, avg_ms, max_ms, requests, slow_count] = line.split('|||')
      return { event_type, avg_ms: Number(avg_ms), max_ms: Number(max_ms), requests: Number(requests), slow_count: Number(slow_count) }
    })
    return NextResponse.json(rows)
  } catch { return NextResponse.json([]) }
}
