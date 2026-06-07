import { NextResponse } from 'next/server'

const LITELLM = 'http://localhost:4000'
const KEY = process.env.LITELLM_MASTER_KEY || ''

let _cache: { data: object; ts: number } | null = null
const CACHE_TTL = 60_000 // 60s

export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json({ ..._cache.data, cached: true })
  }
  const headers = { Authorization: `Bearer ${KEY}` }

  // Try /global/spend (LiteLLM v1.x actual endpoint)
  try {
    const r = await fetch(`${LITELLM}/global/spend`, { headers, signal: AbortSignal.timeout(4000) })
    if (r.ok) {
      const d = await r.json()
      // Also fetch per-model breakdown
      let by_model: Record<string, number> = {}
      try {
        const r2 = await fetch(`${LITELLM}/spend/logs?limit=0`, { headers, signal: AbortSignal.timeout(3000) })
        if (r2.ok) { const d2 = await r2.json(); by_model = d2.spend_per_model ?? {} }
      } catch { /* optional */ }
      const result = { total_spend: d.spend ?? 0, daily_spend: d.spend ?? 0, max_budget: d.max_budget ?? null, by_model }
      _cache = { data: result, ts: Date.now() }
      return NextResponse.json(result)
    }
  } catch { /* fallthrough */ }

  // Try /spend (older versions)
  try {
    const r = await fetch(`${LITELLM}/spend`, { headers, signal: AbortSignal.timeout(4000) })
    if (r.ok) {
      const d = await r.json()
      return NextResponse.json({
        total_spend: d.total_cost ?? d.total_spend ?? 0,
        daily_spend: d.daily_cost ?? d.today_cost ?? 0,
        by_model: d.spend_per_model ?? d.by_model ?? {},
      })
    }
  } catch { /* fallthrough */ }

  // Fallback: /model/info — build pseudo-cost from model list
  try {
    const r = await fetch(`${LITELLM}/model/info`, { headers, signal: AbortSignal.timeout(4000) })
    if (r.ok) {
      const d = await r.json()
      const models = (d.data || []).map((m: { model_name: string }) => m.model_name)
      return NextResponse.json({
        total_spend: 0,
        daily_spend: 0,
        by_model: Object.fromEntries(models.map((m: string) => [m, 0])),
        note: 'LiteLLM /spend not available — showing model list only',
      })
    }
  } catch { /* fallthrough */ }

  // Final fallback
  return NextResponse.json({ total_spend: 0, daily_spend: 0, by_model: {}, note: 'LiteLLM unreachable' })
}
