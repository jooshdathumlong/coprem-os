import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { execSync } from 'child_process'

const ROOT = join(process.cwd(), '..')
const KB_ROOT = join(ROOT, '02-knowledge')
const CAT_ROOT = join(KB_ROOT, 'categories')

// ── Category metadata ──────────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; labelTh: string; emoji: string; gradient: string }> = {
  'ai-ml':           { label: 'AI & Machine Learning',           labelTh: 'AI & Machine Learning',         emoji: '🤖', gradient: 'linear-gradient(135deg,#e8f0fe,#d0e4ff)' },
  'data-science':    { label: 'Data Science & Analytics',        labelTh: 'วิทยาศาสตร์ข้อมูล',              emoji: '📊', gradient: 'linear-gradient(135deg,#f3e8ff,#e4d0ff)' },
  'software-dev':    { label: 'Software Development',            labelTh: 'พัฒนาซอฟต์แวร์',                 emoji: '💻', gradient: 'linear-gradient(135deg,#e0f7fa,#b2ebf2)' },
  'cloud-devops':    { label: 'IT Infrastructure, Cloud & DevOps', labelTh: 'Cloud & DevOps',              emoji: '☁️', gradient: 'linear-gradient(135deg,#e1f5fe,#b3e5fc)' },
  'cybersecurity':   { label: 'Cybersecurity',                   labelTh: 'ความมั่นคงไซเบอร์',              emoji: '🔒', gradient: 'linear-gradient(135deg,#fce4ec,#f8bbd0)' },
  'digital-marketing':{ label: 'Digital Marketing & E-Commerce', labelTh: 'การตลาดดิจิทัล',                emoji: '📱', gradient: 'linear-gradient(135deg,#fce8e6,#fad2cf)' },
  'business':        { label: 'Business & Entrepreneurship',     labelTh: 'ธุรกิจ & ผู้ประกอบการ',           emoji: '🏢', gradient: 'linear-gradient(135deg,#fff8e1,#ffecb3)' },
  'management':      { label: 'Management, HR & Leadership',     labelTh: 'จัดการ & ภาวะผู้นำ',             emoji: '👥', gradient: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)' },
  'productivity':    { label: 'Productivity & Office Tools',     labelTh: 'เครื่องมือเพิ่มประสิทธิภาพ',     emoji: '⚡', gradient: 'linear-gradient(135deg,#fffde7,#fff9c4)' },
  'content-creative':{ label: 'Content Creation & Creative',     labelTh: 'สร้างคอนเทนต์ & ครีเอทีฟ',       emoji: '🎨', gradient: 'linear-gradient(135deg,#f3e5f5,#e1bee7)' },
  'communication':   { label: 'Communication & Soft Skills',     labelTh: 'การสื่อสาร & Soft Skills',        emoji: '💬', gradient: 'linear-gradient(135deg,#e3f2fd,#bbdefb)' },
  'language':        { label: 'Language Learning',               labelTh: 'เรียนภาษา',                      emoji: '🌏', gradient: 'linear-gradient(135deg,#e8f5e9,#dcedc8)' },
  'career':          { label: 'Career Development',              labelTh: 'พัฒนาอาชีพ',                     emoji: '🎯', gradient: 'linear-gradient(135deg,#fff3e0,#ffe0b2)' },
  'health':          { label: 'Health, Wellbeing & Lifestyle',   labelTh: 'สุขภาพ & ไลฟ์สไตล์',             emoji: '🌿', gradient: 'linear-gradient(135deg,#f1f8e9,#dcedc8)' },
  'misc':            { label: 'Miscellaneous',                   labelTh: 'อื่นๆ',                          emoji: '📦', gradient: 'linear-gradient(135deg,#f5f5f5,#eeeeee)' },
}

// Non-category pillars (business/work) file registry
const PILLAR_FILES: Record<string, { id: string; path: string; label: string }[]> = {
  work: [
    { id: 'work-readme', path: 'work/README.md', label: 'Company Overview' },
  ],
  business: [
    { id: 'biz-business', path: 'personal/business_ssot.md', label: 'Business Projects (SSOT)' },
    { id: 'biz-peabuntid', path: 'brand/peabuntid_ssot.md', label: 'Peabuntid Brand' },
    { id: 'biz-eilinaire', path: 'brand/eilinaire_ssot.md', label: 'Eilinaire Brand' },
    { id: 'biz-profile', path: 'personal/prem-profile.md', label: 'Prem Master Profile' },
  ],
}

// ── Helper: scan .md files in a category folder ───────────────────────────
function scanCategory(catId: string) {
  const dir = join(CAT_ROOT, catId)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_index'))
    .map(f => {
      const fullPath = join(dir, f)
      const content = readFileSync(fullPath, 'utf-8')
      const firstLine = content.split('\n').find(l => l.startsWith('# ')) || ''
      const title = firstLine.replace('# ', '').trim() || f.replace('.md', '')
      const sourceMatch = content.match(/>\s*ที่มา:\s*(.+)/m) || content.match(/>\s*Source:\s*(.+)/m)
      const source = sourceMatch ? sourceMatch[1].split('|')[0].trim() : 'Prem'
      const wordCount = content.split(/\s+/).length
      const linkCount = (content.match(/\[link\]\(https?:\/\/[^)]+\)/g) || []).length
      return { filename: f, fullPath, title, source, wordCount, linkCount, modified: statSync(fullPath).mtime.toISOString() }
    })
    .sort((a, b) => {
      // futureskill-catalog first, then alphabetical
      if (a.filename === 'futureskill-catalog.md') return -1
      if (b.filename === 'futureskill-catalog.md') return 1
      return a.filename.localeCompare(b.filename)
    })
}

// ── Helper: read & parse a single .md file ───────────────────────────────
function readMd(fullPath: string) {
  if (!existsSync(fullPath)) return null
  const content = readFileSync(fullPath, 'utf-8')
  const links = [...content.matchAll(/\| (\d+) \| (.+?) \| \[link\]\((https?:\/\/[^)]+)\)/g)]
    .map(m => ({ index: parseInt(m[1]), name: m[2].trim(), url: m[3] }))
  const sourceMatch = content.match(/>\s*ที่มา:\s*(.+)/m) || content.match(/>\s*Source:\s*(.+)/m)
  const stdMatch = content.match(/>\s*Global standard:\s*(.+)/m)
  return {
    content,
    links,
    source: sourceMatch ? sourceMatch[1].split('|')[0].trim() : 'Prem',
    globalStandard: stdMatch ? stdMatch[1].trim() : null,
    sourceUrl: links.length > 0 ? links[0].url : null,
    courseCount: links.length,
  }
}

// ── Route ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const action = sp.get('action') || ''
  const pillar = sp.get('pillar') || ''
  const catId = sp.get('cat') || ''
  const fileParam = sp.get('file') || ''
  const lang = sp.get('lang') || 'en'

  // ── Pillars ───────────────────────────────────────────────────────────────
  if (action === 'pillars') {
    const labels: Record<string, { en: string; th: string }> = {
      work:      { en: 'Day Job',        th: 'งานประจำ' },
      business:  { en: 'My Business',    th: 'ธุรกิจของฉัน' },
      knowledge: { en: 'Knowledge Base', th: 'คลังความรู้' },
    }
    return NextResponse.json(['work', 'business', 'knowledge'].map(id => ({
      id, label: labels[id][lang as 'en' | 'th'] || labels[id].en,
      fileCount: id === 'knowledge'
        ? Object.keys(CATEGORIES).reduce((n, c) => n + scanCategory(c).length, 0)
        : (PILLAR_FILES[id] || []).filter(f => existsSync(join(KB_ROOT, f.path))).length,
    })))
  }

  // ── Knowledge categories (bento grid) ────────────────────────────────────
  if (action === 'categories') {
    return NextResponse.json(
      Object.entries(CATEGORIES).map(([id, meta]) => {
        const files = scanCategory(id)
        const totalCourses = files.reduce((n, f) => n + f.linkCount, 0)
        return { id, label: meta.label, labelTh: meta.labelTh, emoji: meta.emoji, gradient: meta.gradient, fileCount: files.length, totalCourses }
      })
    )
  }

  // ── Files in a category ───────────────────────────────────────────────────
  if (action === 'cat-files' && catId) {
    const files = scanCategory(catId)
    return NextResponse.json(files.map(f => ({
      id: `${catId}::${f.filename}`,
      catId, filename: f.filename, title: f.title,
      source: f.source, wordCount: f.wordCount,
      linkCount: f.linkCount, modified: f.modified,
      isCatalog: f.filename === 'futureskill-catalog.md',
    })))
  }

  // ── Non-knowledge pillar items ────────────────────────────────────────────
  if (action === 'items' && (pillar === 'work' || pillar === 'business')) {
    const items = (PILLAR_FILES[pillar] || []).map(f => ({
      id: f.id, fileId: f.id, title: f.label, type: 'file',
      lines: 0, courseCount: 0, globalStandard: null, source: 'Prem',
      sourceUrl: null, exists: existsSync(join(KB_ROOT, f.path)),
    }))
    return NextResponse.json(items)
  }

  // ── Full file content ─────────────────────────────────────────────────────
  if (action === 'doc') {
    // catId::filename OR legacy file id
    if (catId && fileParam) {
      const fullPath = join(CAT_ROOT, catId, fileParam)
      const parsed = readMd(fullPath)
      if (!parsed) return NextResponse.json({ error: 'not found' }, { status: 404 })
      return NextResponse.json({ ...parsed, filename: fileParam, path: fullPath })
    }
    // Non-category files (business/work)
    const allFiles = Object.values(PILLAR_FILES).flat()
    const meta = allFiles.find(f => f.id === fileParam)
    if (meta) {
      const fullPath = join(KB_ROOT, meta.path)
      const parsed = readMd(fullPath)
      if (!parsed) return NextResponse.json({ error: 'not found' }, { status: 404 })
      return NextResponse.json({ ...parsed, filename: meta.path, path: fullPath })
    }
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // ── Open file in editor ───────────────────────────────────────────────────
  if (action === 'open') {
    let fullPath = ''
    if (catId && fileParam) fullPath = join(CAT_ROOT, catId, fileParam)
    else {
      const meta = Object.values(PILLAR_FILES).flat().find(f => f.id === fileParam)
      if (meta) fullPath = join(KB_ROOT, meta.path)
    }
    if (!fullPath || !existsSync(fullPath)) return NextResponse.json({ ok: false })
    try { execSync(`open "${fullPath}"`); return NextResponse.json({ ok: true }) }
    catch { return NextResponse.json({ ok: false }) }
  }

  // ── Save new .md file (Jeff ingests PDFs/uploads) ─────────────────────────
  if (action === 'save' && req.method === 'POST') {
    // handled in POST
  }

  // ── Legacy compat ─────────────────────────────────────────────────────────
  const kb = sp.get('kb')
  if (kb || sp.get('list') === '1') {
    // Return flat list of all category files for backward compat
    const all = Object.keys(CATEGORIES).flatMap(c => scanCategory(c).map(f => ({ id: `${c}::${f.filename}`, label: f.title })))
    return NextResponse.json(all)
  }

  return NextResponse.json({ error: 'invalid params' }, { status: 400 })
}

// ── POST: save new knowledge file ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const action = sp.get('action') || ''

  if (action === 'save') {
    const { catId, filename, content, source } = await req.json()
    if (!catId || !filename || !content) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    if (!CATEGORIES[catId]) return NextResponse.json({ error: 'invalid category' }, { status: 400 })
    const safeName = filename.replace(/[^a-zA-Z0-9ก-๙_\-\.]/g, '_').replace(/\.md$/, '') + '.md'
    const dir = join(CAT_ROOT, catId)
    mkdirSync(dir, { recursive: true })
    const fullPath = join(dir, safeName)
    writeFileSync(fullPath, content, 'utf-8')
    return NextResponse.json({ ok: true, path: fullPath, filename: safeName })
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 })
}
