import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET(req: NextRequest) {
  const pillar = req.nextUrl.searchParams.get('pillar') || ''
  try {
    const where = pillar ? `WHERE pillar = '${pillar.replace(/'/g,"''")}' AND archived = false` : `WHERE archived = false`
    const sql = `SELECT id, content, pillar, kb_id, created_at FROM memory_embeddings ${where} ORDER BY created_at DESC LIMIT 50;`
    const pg = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
    const out = execSync(`docker exec ${pg} psql -U coprem -d coprem_os -t -A -F '|||' -c "${sql}"`, { encoding: 'utf8' })
    const rows = out.trim().split('\n').filter(Boolean).map(line => {
      const [id, content, p, kb_id, created_at] = line.split('|||')
      return { id, content, pillar: p, kb_id, created_at }
    })
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json([])
  }
}
