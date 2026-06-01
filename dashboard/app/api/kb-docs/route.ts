import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { execSync } from 'child_process'

const ROOT = join(process.cwd(), '..')
const KB_ROOT = join(ROOT, '02-knowledge')

// ── Pillar definitions ─────────────────────────────────────────────────────
const PILLARS = {
  work: {
    label: { en: 'Day Job', th: 'งานประจำ' },
    files: [
      { id: 'work-readme', path: 'work/README.md', label: 'Company Overview', source: null },
    ],
  },
  business: {
    label: { en: 'My Business', th: 'ธุรกิจของฉัน' },
    files: [
      { id: 'biz-business', path: 'personal/business_ssot.md', label: 'Business Projects (SSOT)', source: null },
      { id: 'biz-peabuntid', path: 'brand/peabuntid_ssot.md', label: 'Peabuntid Brand (SSOT)', source: null },
      { id: 'biz-eilinaire', path: 'brand/eilinaire_ssot.md', label: 'Eilinaire Brand (SSOT)', source: null },
      { id: 'biz-profile', path: 'personal/prem-profile.md', label: 'Prem — Master Profile', source: null },
    ],
  },
  knowledge: {
    label: { en: 'Knowledge Base', th: 'คลังความรู้' },
    files: [
      { id: 'kb06', path: 'KB-06_FutureSkill_Courses.md', label: 'FutureSkill Courses (584)', source: 'https://learn.futureskill.co' },
      { id: 'coprem', path: 'COPREM_OS_24_Frameworks_v1_1.md', label: 'COPREM OS Frameworks', source: null },
      { id: 'learning', path: 'personal/learning_ssot.md', label: 'Learning Log (SSOT)', source: null },
    ],
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function readFile(relPath: string): string | null {
  const full = join(KB_ROOT, relPath)
  return existsSync(full) ? readFileSync(full, 'utf-8') : null
}

function parseSections(content: string) {
  const lines = content.split('\n')
  const sections: { title: string; content: string; lines: number; sourceUrl: string | null }[] = []
  let current: { title: string; lines: string[] } = { title: '(intro)', lines: [] }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.lines.length > 1) {
        const src = extractFirstLink(current.lines.join('\n'))
        sections.push({ title: current.title, content: current.lines.join('\n'), lines: current.lines.length, sourceUrl: src })
      }
      current = { title: line.replace(/^## (SECTION:\s*)?/, '').trim(), lines: [line] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length > 1) {
    const src = extractFirstLink(current.lines.join('\n'))
    sections.push({ title: current.title, content: current.lines.join('\n'), lines: current.lines.length, sourceUrl: src })
  }
  return sections
}

function extractFirstLink(content: string): string | null {
  const m = content.match(/\[link\]\((https?:\/\/[^)]+)\)/)
  return m ? m[1] : null
}

// Count how many FutureSkill links in a section
function countLinks(content: string): number {
  return (content.match(/\[link\]\(https?:\/\/learn\.futureskill/g) || []).length
}

// ── Route handlers ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const action = sp.get('action')
  const pillar = sp.get('pillar')
  const fileId = sp.get('file')
  const section = sp.get('section')
  const lang = (sp.get('lang') || 'en') as 'en' | 'th'

  // ── List pillars ──────────────────────────────────────────────────────────
  if (action === 'pillars') {
    return NextResponse.json(
      Object.entries(PILLARS).map(([id, p]) => ({
        id,
        label: p.label[lang],
        fileCount: p.files.filter(f => existsSync(join(KB_ROOT, f.path))).length,
      }))
    )
  }

  // ── List files in a pillar ────────────────────────────────────────────────
  if (action === 'files' && pillar) {
    const p = PILLARS[pillar as keyof typeof PILLARS]
    if (!p) return NextResponse.json({ error: 'Pillar not found' }, { status: 404 })
    const files = p.files.map(f => {
      const exists = existsSync(join(KB_ROOT, f.path))
      let sectionCount = 0
      let courseCount = 0
      if (exists) {
        const content = readFileSync(join(KB_ROOT, f.path), 'utf-8')
        sectionCount = (content.match(/^## /mg) || []).length
        courseCount = countLinks(content)
      }
      return { ...f, exists, sectionCount, courseCount, fullPath: join(KB_ROOT, f.path) }
    })
    return NextResponse.json(files)
  }

  // ── List sections in a file ───────────────────────────────────────────────
  if (action === 'sections' && fileId) {
    const filesMeta = Object.values(PILLARS).flatMap(p => p.files)
    const meta = filesMeta.find(f => f.id === fileId)
    if (!meta) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    // For KB-06 TH: use backup
    let filePath = meta.path
    if (fileId === 'kb06' && lang === 'th') filePath = 'KB-06_FutureSkill_Courses_TH_backup.md'

    const content = readFile(filePath)
    if (!content) return NextResponse.json({ error: 'File missing' }, { status: 404 })

    const sections = parseSections(content)
    return NextResponse.json(
      sections.map(s => ({
        title: s.title,
        lines: s.lines,
        courseCount: countLinks(s.content),
        sourceUrl: s.sourceUrl || meta.source,
      }))
    )
  }

  // ── Get section content ───────────────────────────────────────────────────
  if (action === 'content' && fileId && section) {
    const filesMeta = Object.values(PILLARS).flatMap(p => p.files)
    const meta = filesMeta.find(f => f.id === fileId)
    if (!meta) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    let filePath = meta.path
    if (fileId === 'kb06' && lang === 'th') filePath = 'KB-06_FutureSkill_Courses_TH_backup.md'

    const content = readFile(filePath)
    if (!content) return NextResponse.json({ error: 'File missing' }, { status: 404 })

    const sections = parseSections(content)
    const found = sections.find(s => s.title === section)
    return NextResponse.json(found ? { content: found.content, sourceUrl: found.sourceUrl || meta.source } : { error: 'Section not found' })
  }

  // ── Open file in editor ───────────────────────────────────────────────────
  if (action === 'open' && fileId) {
    const filesMeta = Object.values(PILLARS).flatMap(p => p.files)
    const meta = filesMeta.find(f => f.id === fileId)
    if (!meta) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    const fullPath = join(KB_ROOT, meta.path)
    if (!existsSync(fullPath)) return NextResponse.json({ error: 'File missing' }, { status: 404 })
    try {
      execSync(`open "${fullPath}"`)
      return NextResponse.json({ ok: true, path: fullPath })
    } catch { return NextResponse.json({ ok: false }) }
  }

  // ── Get full file path (for display) ─────────────────────────────────────
  if (action === 'path' && fileId) {
    const filesMeta = Object.values(PILLARS).flatMap(p => p.files)
    const meta = filesMeta.find(f => f.id === fileId)
    if (!meta) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ path: join(KB_ROOT, meta.path), relativePath: meta.path })
  }

  // Legacy compat: ?list=1 or ?kb=
  if (sp.get('list') === '1') {
    return NextResponse.json(
      Object.values(PILLARS).flatMap(p =>
        p.files.map(f => ({ id: f.id, label: f.label, exists: existsSync(join(KB_ROOT, f.path)) }))
      )
    )
  }
  const kb = sp.get('kb')
  if (kb) {
    const legacyMap: Record<string, string> = { 'KB-06': 'kb06', 'COPREM': 'coprem' }
    const fileId2 = legacyMap[kb]
    const meta = Object.values(PILLARS).flatMap(p => p.files).find(f => f.id === fileId2)
    if (!meta) return NextResponse.json([], { status: 404 })
    const content = readFile(lang === 'th' && fileId2 === 'kb06' ? 'KB-06_FutureSkill_Courses_TH_backup.md' : meta.path)
    if (!content) return NextResponse.json([])
    const sections = parseSections(content)
    if (sp.get('section')) {
      const found = sections.find(s => s.title === sp.get('section'))
      return NextResponse.json(found ? { content: found.content } : { error: 'not found' })
    }
    return NextResponse.json(sections.map(s => ({ title: s.title, preview: '', lines: s.lines })))
  }

  return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
}
