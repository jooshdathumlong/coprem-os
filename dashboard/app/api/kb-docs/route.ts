import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), '..')

const KB_FILES: Record<string, { path: string; pathTH?: string; label: string; pillar: string }> = {
  'KB-06': { path: 'knowledge/KB-06_FutureSkill_Courses.md', pathTH: 'knowledge/KB-06_FutureSkill_Courses_TH_backup.md', label: 'FutureSkill Courses (584)', pillar: 'SKILL' },
  'COPREM': { path: 'knowledge/COPREM_OS_24_Frameworks_v1_1.md', label: 'COPREM OS Frameworks', pillar: 'JOB' },
}

function parseMarkdownSections(content: string) {
  const lines = content.split('\n')
  const sections: { title: string; content: string; lines: number }[] = []
  let current = { title: '(ส่วนนำ)', lines: [] as string[] }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.lines.length > 1) {
        sections.push({ title: current.title, content: current.lines.join('\n'), lines: current.lines.length })
      }
      current = { title: line.replace('## ', '').replace('SECTION: ', ''), lines: [line] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length > 1) {
    sections.push({ title: current.title, content: current.lines.join('\n'), lines: current.lines.length })
  }
  return sections
}

export async function GET(req: NextRequest) {
  const kb = req.nextUrl.searchParams.get('kb') || 'KB-06'
  const section = req.nextUrl.searchParams.get('section') || ''
  const lang = req.nextUrl.searchParams.get('lang') || 'en'

  // List mode
  if (!section && req.nextUrl.searchParams.get('list') === '1') {
    const result = Object.entries(KB_FILES).map(([id, meta]) => {
      const filePath = lang === 'th' && meta.pathTH ? meta.pathTH : meta.path
      const fullPath = join(ROOT, '02-knowledge', filePath.replace('knowledge/', ''))
      const exists = existsSync(fullPath)
      let sections: string[] = []
      if (exists) {
        const content = readFileSync(fullPath, 'utf-8')
        sections = content.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace('## SECTION: ', '').replace('## ', ''))
      }
      return { id, ...meta, exists, sections }
    })
    return NextResponse.json(result)
  }

  // Section content
  const meta = KB_FILES[kb]
  if (!meta) return NextResponse.json({ error: 'KB not found' }, { status: 404 })

  const filePath = lang === 'th' && meta.pathTH ? meta.pathTH : meta.path
  const fullPath = join(ROOT, '02-knowledge', filePath.replace('knowledge/', ''))
  if (!existsSync(fullPath)) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const content = readFileSync(fullPath, 'utf-8')
  const sections = parseMarkdownSections(content)

  if (section) {
    const found = sections.find(s => s.title === section)
    return NextResponse.json(found || { error: 'Section not found' })
  }

  // Return all section titles + first 3 lines preview
  return NextResponse.json(sections.map(s => ({
    title: s.title,
    preview: s.content.split('\n').filter(Boolean).slice(0, 3).join(' '),
    lines: s.lines
  })))
}
