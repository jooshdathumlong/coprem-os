import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const ROOT = join(process.cwd(), '..')
const KB_ROOT = join(ROOT, '02-knowledge')

// ── Source badge metadata ──────────────────────────────────────────────────
type SourceType = 'FutureSkill' | 'Internal' | 'Prem' | 'Team'

function detectSource(fileId: string): SourceType {
  if (fileId === 'kb06') return 'FutureSkill'
  if (fileId === 'coprem') return 'Internal'
  if (fileId.startsWith('biz-') || fileId.startsWith('work-') || fileId === 'learning') return 'Prem'
  return 'Team'
}

// ── Pillar + file registry ─────────────────────────────────────────────────
const FILES: Record<string, { path: string; pathTH?: string; label: string; pillar: string; sourceUrl?: string }> = {
  'kb06':         { path: 'KB-06_FutureSkill_Courses.md',         pathTH: 'KB-06_FutureSkill_Courses_TH_backup.md', label: 'FutureSkill Courses (584)', pillar: 'knowledge', sourceUrl: 'https://learn.futureskill.co' },
  'coprem':       { path: 'COPREM_OS_24_Frameworks_v1_1.md',       label: 'COPREM OS Frameworks', pillar: 'knowledge' },
  'learning':     { path: 'personal/learning_ssot.md',             label: 'Learning Log (SSOT)',   pillar: 'knowledge' },
  'biz-business': { path: 'personal/business_ssot.md',             label: 'Business Projects',     pillar: 'business' },
  'biz-peabuntid':{ path: 'brand/peabuntid_ssot.md',               label: 'Peabuntid Brand',       pillar: 'business' },
  'biz-eilinaire':{ path: 'brand/eilinaire_ssot.md',               label: 'Eilinaire Brand',       pillar: 'business' },
  'biz-profile':  { path: 'personal/prem-profile.md',              label: 'Prem Master Profile',   pillar: 'business' },
  'work-readme':  { path: 'work/README.md',                        label: 'Company Overview',      pillar: 'work' },
}

// ── Parse sections from MD ─────────────────────────────────────────────────
function parseSections(content: string) {
  const lines = content.split('\n')
  const sections: {
    title: string; content: string; lines: number;
    globalStandard: string | null; firstCourseUrl: string | null; courseCount: number
  }[] = []
  let current: { title: string; lines: string[] } = { title: '(intro)', lines: [] }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.lines.length > 1) sections.push(buildSection(current))
      current = { title: line.replace(/^## (SECTION:\s*)?/, '').trim(), lines: [line] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length > 1) sections.push(buildSection(current))
  return sections
}

function buildSection(s: { title: string; lines: string[] }) {
  const content = s.lines.join('\n')
  const gsMatch = content.match(/>\s*Global standard:\s*(.+)/)
  const linkMatch = content.match(/\[link\]\((https?:\/\/[^)]+)\)/)
  const courseCount = (content.match(/\[link\]\(https?:\/\/learn\.futureskill/g) || []).length
  return {
    title: s.title,
    content,
    lines: s.lines.length,
    globalStandard: gsMatch ? gsMatch[1].trim() : null,
    firstCourseUrl: linkMatch ? linkMatch[1] : null,
    courseCount,
  }
}

// Extract all FutureSkill links from a section
function extractLinks(content: string): { name: string; url: string }[] {
  const rows = content.split('\n').filter(l => l.startsWith('| ') && l.includes('[link]('))
  return rows.map(row => {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean)
    const name = cols[1] || ''
    const urlMatch = row.match(/\[link\]\((https?:\/\/[^)]+)\)/)
    return { name, url: urlMatch ? urlMatch[1] : '' }
  }).filter(l => l.url)
}

function readKB(fileId: string, lang: string): string | null {
  const meta = FILES[fileId]
  if (!meta) return null
  const p = lang === 'th' && meta.pathTH ? meta.pathTH : meta.path
  const full = join(KB_ROOT, p)
  return existsSync(full) ? readFileSync(full, 'utf-8') : null
}

// ── GET handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const action = sp.get('action') || ''
  const pillar = sp.get('pillar') || ''
  const fileId = sp.get('file') || ''
  const section = sp.get('section') || ''
  const lang = sp.get('lang') || 'en'

  // ── Pillars list ──────────────────────────────────────────────────────────
  if (action === 'pillars') {
    const PILLAR_LABELS: Record<string, { en: string; th: string }> = {
      work:      { en: 'Day Job',       th: 'งานประจำ'    },
      business:  { en: 'My Business',   th: 'ธุรกิจของฉัน' },
      knowledge: { en: 'Knowledge Base', th: 'คลังความรู้'  },
    }
    return NextResponse.json(['work', 'business', 'knowledge'].map(id => ({
      id,
      label: PILLAR_LABELS[id][lang as 'en' | 'th'] || PILLAR_LABELS[id].en,
      fileCount: Object.values(FILES).filter(f => f.pillar === id && existsSync(join(KB_ROOT, f.path))).length,
    })))
  }

  // ── Items for a pillar ────────────────────────────────────────────────────
  // For 'knowledge' pillar + kb06: return categories (sections) directly
  if (action === 'items' && pillar) {
    if (pillar === 'knowledge') {
      // KB-06 sections as top-level items
      const content = readKB('kb06', lang)
      if (!content) return NextResponse.json([])
      const sections = parseSections(content).filter(s => s.title !== 'KB-06: FutureSkill Course Catalog')
      return NextResponse.json(sections.map(s => ({
        id: `kb06::${s.title}`,
        fileId: 'kb06',
        title: s.title,
        type: 'category',
        lines: s.lines,
        courseCount: s.courseCount,
        globalStandard: s.globalStandard,
        source: 'FutureSkill' as SourceType,
        sourceUrl: s.firstCourseUrl || 'https://learn.futureskill.co',
      })))
    }
    // Other pillars: return files as items
    const items = Object.entries(FILES)
      .filter(([, f]) => f.pillar === pillar)
      .map(([id, f]) => ({
        id, fileId: id, title: f.label, type: 'file',
        lines: 0, courseCount: 0, globalStandard: null,
        source: detectSource(id) as SourceType,
        sourceUrl: f.sourceUrl || null,
        path: f.path, exists: existsSync(join(KB_ROOT, f.path)),
      }))
    return NextResponse.json(items)
  }

  // ── Content for an item ───────────────────────────────────────────────────
  if (action === 'content' && fileId) {
    const content = readKB(fileId, lang)
    if (!content) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const meta = FILES[fileId]

    // If section specified → return that section
    if (section) {
      const sections = parseSections(content)
      const found = sections.find(s => s.title === section)
      if (!found) return NextResponse.json({ error: 'Section not found' }, { status: 404 })
      const links = extractLinks(found.content)
      return NextResponse.json({
        title: found.title,
        content: found.content,
        source: detectSource(fileId),
        sourceUrl: found.firstCourseUrl || meta?.sourceUrl || null,
        globalStandard: found.globalStandard,
        courseCount: found.courseCount,
        links: links.slice(0, 20), // top 20 links for extras panel
      })
    }

    // No section → return whole file summary
    const sections = parseSections(content)
    return NextResponse.json({
      title: meta?.label || fileId,
      content: sections.slice(0, 3).map(s => s.content).join('\n\n'),
      source: detectSource(fileId),
      sourceUrl: meta?.sourceUrl || null,
      sectionCount: sections.length,
      links: [],
    })
  }

  // ── Sections list (for files in business/work pillars) ────────────────────
  if (action === 'sections' && fileId) {
    const content = readKB(fileId, lang)
    if (!content) return NextResponse.json([])
    const sections = parseSections(content)
    return NextResponse.json(sections.map(s => ({
      title: s.title, lines: s.lines, courseCount: s.courseCount, sourceUrl: s.firstCourseUrl
    })))
  }

  // ── Open file in editor ───────────────────────────────────────────────────
  if (action === 'open' && fileId) {
    const meta = FILES[fileId]
    if (!meta) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const full = join(KB_ROOT, meta.path)
    if (!existsSync(full)) return NextResponse.json({ error: 'missing' }, { status: 404 })
    try { execSync(`open "${full}"`); return NextResponse.json({ ok: true }) }
    catch { return NextResponse.json({ ok: false }) }
  }

  // ── Legacy compat ─────────────────────────────────────────────────────────
  if (sp.get('list') === '1') {
    return NextResponse.json(Object.entries(FILES).map(([id, f]) => ({ id, label: f.label })))
  }
  const kb = sp.get('kb')
  if (kb) {
    const legacyMap: Record<string, string> = { 'KB-06': 'kb06', 'COPREM': 'coprem' }
    const fid = legacyMap[kb] || kb
    const content = readKB(fid, lang)
    if (!content) return NextResponse.json([])
    const sections = parseSections(content)
    if (section) {
      const found = sections.find(s => s.title === section)
      return NextResponse.json(found ? { content: found.content } : { error: 'not found' })
    }
    return NextResponse.json(sections.map(s => ({ title: s.title, preview: '', lines: s.lines })))
  }

  return NextResponse.json({ error: 'invalid params' }, { status: 400 })
}
