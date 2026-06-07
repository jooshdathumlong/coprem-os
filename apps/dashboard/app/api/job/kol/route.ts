import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')
function pgCid() { const b = execSync('docker ps --filter label=coprem.service=postgres -q', { encoding: 'utf8' }).trim(); return b ? b.split('\n')[0] : execSync('docker ps --filter name=postgres -q', { encoding: 'utf8' }).trim().split('\n')[0] }
function rs(sql: string) { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }

function tier(f: number | null) {
  if (!f) return 'unknown'
  if (f >= 1_000_000) return 'mega'
  if (f >= 500_000) return 'macro'
  if (f >= 100_000) return 'mid'
  if (f >= 10_000) return 'micro'
  return 'nano'
}

// GET /api/job/kol?q=name&brand_id=1&max_cost=50000&tier=micro
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const brand_id = req.nextUrl.searchParams.get('brand_id') ?? '2'
  const max_cost = req.nextUrl.searchParams.get('max_cost')
  const filterTier = req.nextUrl.searchParams.get('tier')

  const conditions = [`brand_id = ${parseInt(brand_id) || 1}`]
  if (q) conditions.push(`(kol_name ILIKE '%${q.replace(/'/g, "''")}%' OR content_category ILIKE '%${q.replace(/'/g, "''")}%')`)
  if (max_cost) conditions.push(`(cost_thb IS NULL OR cost_thb <= ${parseFloat(max_cost)})`)

  const sql = `SELECT id, kol_name, content_category, followers_tiktok, cost_thb, sow, tiktok_url FROM rs_lifestyle.kol_list WHERE ${conditions.join(' AND ')} ORDER BY followers_tiktok DESC NULLS LAST LIMIT 50;`
  const raw = rs(sql)
  let kols = raw.trim().split('\n').filter(Boolean).map(r => {
    const [id, kol_name, content_category, followers_tiktok, cost_thb, sow, tiktok_url] = r.split('|||')
    const f = parseInt(followers_tiktok) || null
    const cost = parseFloat(cost_thb) || null
    return {
      id: parseInt(id), kol_name, content_category, followers_tiktok: f, cost_thb: cost, sow, tiktok_url,
      tier: tier(f),
      cost_display: cost ? `฿${cost.toLocaleString()}` : 'ไม่ระบุ',
      cpe: cost && f ? `฿${(cost / f * 1000).toFixed(2)}/1K` : null,
    }
  })

  if (filterTier) kols = kols.filter(k => k.tier === filterTier)

  const summary = {
    total: kols.length,
    with_cost: kols.filter(k => k.cost_thb).length,
    total_cost_thb: kols.reduce((s, k) => s + (k.cost_thb ?? 0), 0),
    by_tier: kols.reduce((a, k) => { a[k.tier] = (a[k.tier] || 0) + 1; return a }, {} as Record<string, number>),
  }

  return NextResponse.json({ kols, summary })
}
