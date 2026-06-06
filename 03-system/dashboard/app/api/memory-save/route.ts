import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), '..', '..')
const AUTO_MEMORY_DIR = join(ROOT, '02-knowledge', 'work', 'auto')

export async function POST(req: NextRequest) {
  const { title, type, summary, content, userMsg, actions } = await req.json()
  if (!title || !content) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  try {
    mkdirSync(AUTO_MEMORY_DIR, { recursive: true })
    const dateStr = new Date().toISOString().slice(0, 10)
    const safeTitle = title.replace(/[^ก-๙a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 50)
    const filename = `${dateStr}_${safeTitle}.md`
    const fileContent = `# ${title}
> type: ${type} | บันทึก: ${new Date().toLocaleString('th-TH')}

## สรุป
${summary}

## เนื้อหาเต็ม
${content}

## บริบทคำถาม
${(userMsg || '').slice(0, 300)}
`
    writeFileSync(join(AUTO_MEMORY_DIR, filename), fileContent, 'utf-8')

    if (actions?.length) {
      try {
        const { execSync } = require('child_process')
        const cid = execSync(`docker ps --filter name=postgres -q`, { encoding: 'utf8' }).trim().split('\n')[0]
        for (const action of (actions as string[]).slice(0, 3)) {
          const safe = action.replace(/'/g, "''").slice(0, 200)
          const payload = JSON.stringify({ prompt: safe, notify_telegram: false }).replace(/'/g, "''")
          execSync(`docker exec ${cid} psql -U coprem -d coprem_os -c "INSERT INTO task_queue (type, payload, assigned_to, priority, run_at) VALUES ('analysis', '${payload}', 'jeff', 6, NOW() + INTERVAL '2 minutes');"`, { encoding: 'utf8', stdio: 'pipe' })
        }
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ saved: true, filename })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
