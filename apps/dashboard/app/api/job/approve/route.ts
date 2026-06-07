import { NextRequest, NextResponse } from 'next/server'
import { execSync, execFileSync } from 'child_process'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')
function env(key: string) { try { return execSync(`grep "^${key}=" "${join(ROOT, '.env')}" | cut -d= -f2-`, { encoding: 'utf8' }).trim() } catch { return '' } }
function pgCid() { const b = execSync('docker ps --filter label=coprem.service=postgres -q', { encoding: 'utf8' }).trim(); return b ? b.split('\n')[0] : execSync('docker ps --filter name=postgres -q', { encoding: 'utf8' }).trim().split('\n')[0] }
function db(sql: string) { return execFileSync('docker', ['exec', pgCid(), 'psql', '-U', 'coprem', '-d', 'coprem_os', '-t', '-A', '-F', '|||', '-c', sql], { encoding: 'utf8' }) }

// POST /api/job/approve  body: { type: 'draft'|'campaign', id, action: 'approve'|'reject', feedback? }
export async function POST(req: NextRequest) {
  const { type, id, action, feedback } = await req.json()
  if (!type || !id || !action) return NextResponse.json({ error: 'type, id, action required' }, { status: 400 })

  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  const fb = (feedback ?? '').replace(/'/g, "''")

  if (type === 'draft') {
    const row = db(`UPDATE content_drafts SET status='${newStatus}', feedback='${fb}', updated_at=NOW() WHERE id=${parseInt(id)} RETURNING id, chat_id, draft_type, draft_content;`).trim()
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const [rid, chat_id, draft_type, draft_content] = row.split('|||')

    if (action === 'approve' && chat_id && chat_id !== '') {
      const d = JSON.parse(draft_content || '{}')
      const preview = draft_type === 'tiktok_caption'
        ? `Hook: ${d.hook}\n\n${d.caption}\n\n${(d.hashtags||[]).join(' ')}`
        : `ชื่อ: ${d.title}\n\n${(d.bullet_points||[]).join('\n')}`
      await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: `✅ Draft #${rid} อนุมัติแล้ว\n\n${preview.slice(0,800)}` }),
      })
    }
    return NextResponse.json({ ok: true, id: rid, status: newStatus })
  }

  if (type === 'campaign') {
    const row = db(`UPDATE campaign_plans SET status='${newStatus}', updated_at=NOW() WHERE id=${parseInt(id)} RETURNING id, campaign_name;`).trim()
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, campaign: row.split('|||')[1], status: newStatus })
  }

  return NextResponse.json({ error: 'invalid type' }, { status: 400 })
}
