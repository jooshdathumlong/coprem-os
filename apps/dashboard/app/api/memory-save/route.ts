import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, normalize } from 'path'

const ROOT = join(process.cwd(), '..', '..')
const KB_WORK_DIR = join(ROOT, '02-knowledge', 'work')
const AUTO_DIR = join(KB_WORK_DIR, 'auto')

// ── List writable KB files ────────────────────────────────────────────────────
function listKBFiles(dir: string, base: string): { path: string; label: string; mtime: number }[] {
  if (!existsSync(dir)) return []
  const results: { path: string; label: string; mtime: number }[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...listKBFiles(full, join(base, entry.name)))
    } else if (entry.name.endsWith('.md')) {
      results.push({ path: join(base, entry.name), label: join(base, entry.name), mtime: statSync(full).mtimeMs })
    }
  }
  return results
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'list') {
    const files = listKBFiles(KB_WORK_DIR, '').sort((a, b) => b.mtime - a.mtime)
    return NextResponse.json(files.map(f => ({ path: f.path, label: f.label })))
  }

  if (action === 'read') {
    const path = req.nextUrl.searchParams.get('path') || ''
    // Security: only allow reads inside 02-knowledge/work/
    const full = normalize(join(KB_WORK_DIR, path))
    if (!full.startsWith(KB_WORK_DIR + '/') && full !== KB_WORK_DIR) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    try {
      const content = readFileSync(full, 'utf-8')
      return NextResponse.json({ content })
    } catch { return NextResponse.json({ error: 'not found' }, { status: 404 }) }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, type, summary, content, userMsg, actions, targetPath, writeMode } = body
  // writeMode: 'new' | 'overwrite' | 'append'

  if (!content) return NextResponse.json({ error: 'missing content' }, { status: 400 })

  let filepath: string
  if (targetPath) {
    // Write to existing file (overwrite or append)
    filepath = normalize(join(KB_WORK_DIR, targetPath))
    if (!filepath.startsWith(KB_WORK_DIR + '/') && filepath !== KB_WORK_DIR) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  } else {
    // Create new file in auto/
    mkdirSync(AUTO_DIR, { recursive: true })
    const dateStr = new Date().toISOString().slice(0, 10)
    const safeTitle = (title || 'note').replace(/[^ก-๙a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 50)
    filepath = join(AUTO_DIR, `${dateStr}_${safeTitle}.md`)
  }

  try {
    mkdirSync(join(filepath, '..'), { recursive: true })

    let fileContent: string
    if (writeMode === 'append' && existsSync(filepath)) {
      const existing = readFileSync(filepath, 'utf-8')
      const timestamp = new Date().toLocaleString('th-TH')
      fileContent = `${existing}\n\n---\n## อัพเดต ${timestamp}\n${content}`
    } else {
      // New file or overwrite
      fileContent = targetPath ? content : `# ${title || 'Note'}
> type: ${type || 'knowledge'} | บันทึก: ${new Date().toLocaleString('th-TH')}

## สรุป
${summary || ''}

## เนื้อหา
${content}

## บริบทคำถาม
${(userMsg || '').slice(0, 300)}
`
    }

    writeFileSync(filepath, fileContent, 'utf-8')

    // Create tasks if actions provided
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

    const relPath = relative(ROOT, filepath)
    return NextResponse.json({ saved: true, path: relPath })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
