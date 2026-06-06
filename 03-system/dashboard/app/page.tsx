'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string; model?: string }
type ChatSession = { id: number; title: string; created_at: string; updated_at: string }
type Tab = 'chat' | 'hitl' | 'kb' | 'browser' | 'docs' | 'system' | 'sessions' | 'tasks'
type Task = { id: string; type: string; status: string; priority: number; assigned_to: string; next_agent: string; retries: number; max_retries: number; result: string; error: string; run_at: string; created_at: string }
type SessionStep = { time: string; action: string; result: string }
type Session = { date: string; title: string; steps: SessionStep[] }
type Commit = { hash: string; subject: string; time: string }
type KBPillar = { id: string; label: string; fileCount: number }
type KBCategory = { id: string; label: string; labelTh: string; emoji: string; gradient: string; fileCount: number; totalCourses: number }
type KBFile = { id: string; catId: string; filename: string; title: string; source: string; wordCount: number; linkCount: number; modified: string; isCatalog: boolean }
type KBDoc = { content: string; links: { index: number; name: string; url: string }[]; source: string; globalStandard: string | null; sourceUrl: string | null; courseCount: number; filename: string; path: string }
type Lang = 'en' | 'th'

const I18N = {
  en: {
    nav: { chat: 'Chat', hitl: 'Approvals', kb: 'Knowledge', browser: 'Browser', docs: 'Guide', system: 'System', sessions: 'Sessions', tasks: 'Tasks' },
    status: { online: '● Online', issue: '● Issue' },
    chat: { model: 'Model', placeholder: 'Message Jeff… (Enter to send)', send: 'Send', thinking: 'Jeff is thinking...', subtext: 'Your AI Executive Partner' },
    hitl: { title: 'Pending Approvals', pending: (n: number) => `${n} item${n>1?'s':''} awaiting response`, none: 'No pending items', reply: 'Reply', sendReply: 'Send Reply', cancel: 'Cancel', placeholder: 'Type your reply...' },
    kb: { title: 'Knowledge Base', lines: (n: number) => `${n} lines`, select: 'Select a section to read', copy: 'Copy', loading: 'Loading...', kb06: 'KB-06 FutureSkill (584 courses)', coprem: 'COPREM Frameworks', kbLang: 'Content language', viewTH: 'Thai', viewEN: 'English' },
    browser: { title: 'Browser', placeholder: 'Search or enter URL, press Enter to open', open: 'Open ↗', system: 'COPREM System', general: 'General' },
    docs: { title: 'COPREM OS Guide', subtitle: 'Jeff — INTJ AI Executive Partner · v8.3 · 2026-06-02' },
    system: { title: 'System', services: 'Services', refresh: '↻ Refresh', latency: 'Latency by Layer', openServices: 'Open Services', waiting: 'Waiting for traffic from WF01...', online: 'Online', down: 'Down', checking: 'Checking' },
    quickMsgs: ["What's on the agenda today?", 'Recommend a Python course', 'Summarize system status', "Analyze today's market"],
    docs_sections: [
      { title: 'Chat with Jeff', items: ['Type a message and press Enter or click Send', 'Select an AI model above — Auto recommended for most tasks', 'Gemini Flash: fast, free · Groq: no daily limit · Ollama: offline', 'Tap a quick-start message to begin a conversation'] },
      { title: 'Pending Approvals (HITL)', items: ['Jeff pauses and waits when a request exceeds its scope', 'Click Reply → type your answer → sends to the Telegram user', 'Via Telegram: /resolve <id> <message>', 'Yellow badge shows count of pending items'] },
      { title: 'Knowledge Base', items: ['KB-06: FutureSkill — 584 courses across 14 categories', 'COPREM: Frameworks and system rules for COPREM OS', 'Click a section in the left panel to read the full content', 'Toggle TH/EN to switch content language'] },
      { title: 'Browser', items: ['Type a URL and press Enter or click Open', 'Bookmarks: n8n, LiteLLM, Dify, Google, GitHub', 'Use Open ↗ to open in a new tab', 'Use to inspect Workflow state and external dashboards'] },
      { title: 'AI Cost Tiers (auto-selected)', items: ['Tier 0: Gemini Flash (Groq primary + Gemini 6 keys)', 'Tier 1: Gemini Lite (cost >$1/day)', 'Tier 2: Groq 70B (when Gemini is throttled)', 'Tier 3: Ollama local (when all cloud APIs are down)'] },
      { title: 'Starting COPREM OS', items: ['Double-click "COPREM OS.app" on the Desktop', 'Or run: bash scripts/start_coprem.sh', 'Stop Dashboard: bash scripts/stop_coprem.sh', 'Docker continues running when the Dashboard is closed'] },
    ],
  },
  th: {
    nav: { chat: 'คุยกับ Jeff', hitl: 'รออนุมัติ', kb: 'คลังความรู้', browser: 'เบราว์เซอร์', docs: 'คู่มือ', system: 'ระบบ', sessions: 'ประวัติ', tasks: 'งานอัตโนมัติ' },
    status: { online: '● ปกติ', issue: '● มีปัญหา' },
    chat: { model: 'โมเดล', placeholder: 'พิมพ์ข้อความ... (Enter ส่ง)', send: 'ส่ง', thinking: 'Jeff กำลังคิด...', subtext: 'AI Executive Partner ของคุณ' },
    hitl: { title: 'รายการรออนุมัติ', pending: (n: number) => `${n} รายการรอการตอบกลับ`, none: 'ไม่มีรายการรอ', reply: 'ตอบกลับ', sendReply: 'ส่งคำตอบ', cancel: 'ยกเลิก', placeholder: 'พิมพ์คำตอบ...' },
    kb: { title: 'คลังความรู้', lines: (n: number) => `${n} บรรทัด`, select: '← เลือกหมวดหมู่เพื่ออ่านเนื้อหา', copy: 'คัดลอก', loading: 'กำลังโหลด...', kb06: 'KB-06 FutureSkill (584 คอร์ส)', coprem: 'COPREM Frameworks', kbLang: 'ภาษาเนื้อหา', viewTH: 'ไทย', viewEN: 'อังกฤษ' },
    browser: { title: 'เบราว์เซอร์', placeholder: 'ค้นหาหรือพิมพ์ URL แล้วกด Enter', open: 'เปิด ↗', system: 'ระบบ COPREM', general: 'ทั่วไป' },
    docs: { title: 'คู่มือ COPREM OS', subtitle: 'Jeff — AI Executive Partner · v8.3 · 2026-06-02' },
    system: { title: 'ระบบ', services: 'บริการ', refresh: '↻ รีเฟรช', latency: 'ความเร็วแต่ละชั้น', openServices: 'เปิดระบบ', waiting: 'รอ traffic จาก WF01...', online: 'ปกติ', down: 'ล้มเหลว', checking: 'ตรวจสอบ' },
    quickMsgs: ['วันนี้ต้องทำอะไรบ้าง?', 'แนะนำคอร์ส Python', 'สรุปสถานะระบบ', 'วิเคราะห์ตลาดวันนี้'],
    docs_sections: [
      { title: '💬 คุยกับ Jeff', items: ['พิมพ์ข้อความ กด Enter หรือปุ่ม ส่ง', 'เลือกโมเดล AI ด้านบน — Auto แนะนำสำหรับงานทั่วไป', 'Gemini Flash: เร็ว ฟรี | Groq: ไม่มี daily limit | Ollama: ออฟไลน์', 'กดข้อความสำเร็จรูปเพื่อเริ่มบทสนทนาได้เลย'] },
      { title: '⚠️ รออนุมัติ (HITL)', items: ['Jeff หยุดรอ Prem เมื่อคำถามเกินขอบเขต', 'กด ตอบกลับ → พิมพ์คำตอบ → ส่งไปยัง Telegram ผู้ใช้', 'สั่งผ่าน Telegram: /resolve <id> <ข้อความ>', 'Badge สีเหลืองแสดงจำนวนที่รอ'] },
      { title: '📚 คลังความรู้', items: ['KB-06: FutureSkill 584 คอร์ส แบ่ง 14 หมวด', 'COPREM: Framework และกฎระบบ COPREM OS', 'คลิกหมวดหมู่ซ้าย → อ่านเนื้อหาเต็มขวา', 'กด TH/EN เพื่อสลับภาษาเนื้อหา'] },
      { title: '🌐 เว็บเบราว์เซอร์', items: ['พิมพ์ URL แล้ว Enter หรือกดปุ่มเปิด', 'Bookmarks: n8n, LiteLLM, Dify, Google, GitHub', 'กด เปิด ↗ เพื่อเปิด tab ใหม่', 'ใช้สำหรับดูข้อมูล ตรวจสอบ Workflow'] },
      { title: '🤖 AI Tier (Jeff เลือกอัตโนมัติ)', items: ['Tier 0: Gemini Flash (Groq primary + Gemini 6 keys)', 'Tier 1: Gemini Lite (cost >$1/วัน)', 'Tier 2: Groq 70B (เมื่อ Gemini throttle)', 'Tier 3: Ollama local (เมื่อ cloud ล่มทั้งหมด)'] },
      { title: '🚀 เปิดใช้งาน COPREM OS', items: ['ดับเบิลคลิก "COPREM OS.app" บน Desktop', 'หรือรัน: bash scripts/start_coprem.sh', 'หยุด Dashboard: bash scripts/stop_coprem.sh', 'Docker ยังทำงานอยู่เมื่อปิด Dashboard'] },
    ],
  },
}

const MODELS = [
  { value: 'auto',                  label: 'Auto',          group: 'Auto' },
  { value: 'gemini-2.0-flash',      label: 'Gemini Flash',  group: 'Cloud' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini Lite',   group: 'Cloud' },
  { value: 'groq/llama-3.3-70b',   label: 'Groq 70B',      group: 'Cloud' },
  { value: 'ollama/llama3.1',       label: 'Llama 3.1',     group: 'Local' },
  { value: 'ollama/qwen',           label: 'Qwen 2.5',      group: 'Local' },
]

export default function Dashboard() {
  const [lang, setLang] = useState<Lang>('en')
  const [kbLang, setKbLang] = useState<Lang>('en')
  // sync kbLang with UI lang automatically
  useEffect(() => { setKbLang(lang) }, [lang])
  const L = I18N[lang]
  const [tab, setTab] = useState<Tab>('chat')
  const [model, setModel] = useState('auto')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; dataUrl: string; text?: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatSessionId, setActiveChatSessionId] = useState<number | null>(null)
  const [hitlItems, setHITLItems] = useState<HITLItem[]>([])
  const [latency, setLatency] = useState<LatencyRow[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [resolveId, setResolveId] = useState<number | null>(null)
  const [resolveMsg, setResolveMsg] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [sessionsView, setSessionsView] = useState<'sessions' | 'commits'>('sessions')
  const [kbPillars, setKbPillars] = useState<KBPillar[]>([])
  const [selectedPillar, setSelectedPillar] = useState('knowledge')
  const [kbCategories, setKbCategories] = useState<KBCategory[]>([])
  const [selectedCatId, setSelectedCatId] = useState('')
  const [kbFiles, setKbFiles] = useState<KBFile[]>([])
  const [selectedFile, setSelectedFile] = useState<KBFile | null>(null)
  const [kbDoc, setKbDoc] = useState<KBDoc | null>(null)
  const [kbLoading, setKbLoading] = useState(false)
  const [kbDocLoading, setKbDocLoading] = useState(false)
  const [kbView, setKbView] = useState<'grid' | 'files' | 'doc' | 'course'>('grid')
  const [courseDoc, setCourseDoc] = useState<{ title: string; content: string; source: string; path: string } | null>(null)
  const [courseDocLoading, setCourseDocLoading] = useState(false)
  const [browserInput, setBrowserInput] = useState('http://localhost:5678')
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskNewPrompt, setTaskNewPrompt] = useState('')
  const [taskNewAgent, setTaskNewAgent] = useState('jeff')
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  function processFile(file: File) {
    const isImage = file.type.startsWith('image/')
    if (isImage) {
      // Compress + resize to max 1024px before base64 to avoid timeout
      const reader = new FileReader()
      reader.onload = ev => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1024
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX }
            else { width = Math.round(width * MAX / height); height = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
          setAttachedFile({ name: file.name, type: 'image/jpeg', dataUrl })
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      const reader = new FileReader()
      reader.onload = ev => {
        const textReader = new FileReader()
        textReader.onload = te => setAttachedFile({ name: file.name, type: file.type, dataUrl: ev.target?.result as string, text: te.target?.result as string })
        textReader.readAsText(file)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation() }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false); dragCounterRef.current = 0
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const fetchAll = useCallback(async () => {
    const [s, h, l] = await Promise.allSettled([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/hitl').then(r => r.json()),
      fetch('/api/latency').then(r => r.json()),
    ])
    if (s.status === 'fulfilled') setStatus(s.value)
    if (h.status === 'fulfilled') setHITLItems(h.value)
    if (l.status === 'fulfilled') setLatency(l.value)
  }, [])

  const loadKbCategories = useCallback(() => {
    setKbLoading(true)
    fetch('/api/kb-docs?action=categories').then(r => r.json())
      .then(d => { setKbCategories(Array.isArray(d) ? d : []); setKbLoading(false) })
      .catch(() => setKbLoading(false))
  }, [])

  const loadKbFiles = useCallback((catId: string, l: Lang) => {
    setKbLoading(true); setKbFiles([])
    fetch(`/api/kb-docs?action=cat-files&cat=${catId}&lang=${l}`).then(r => r.json())
      .then(d => { setKbFiles(Array.isArray(d) ? d : []); setKbLoading(false) })
      .catch(() => setKbLoading(false))
  }, [])

  const openKbDoc = useCallback((file: KBFile | { id: string; catId?: string; filename?: string; title?: string }, l: Lang) => {
    setSelectedFile(file as KBFile); setKbView('doc'); setKbDoc(null); setKbDocLoading(true)
    // Category files use catId+filename; pillar files (work/business) use id directly
    const url = file.catId && file.filename
      ? `/api/kb-docs?action=doc&cat=${file.catId}&file=${file.filename}&lang=${l}`
      : `/api/kb-docs?action=doc&file=${file.id}&lang=${l}`
    fetch(url).then(r => r.json())
      .then(d => { setKbDoc(d); setKbDocLoading(false) })
      .catch(() => setKbDocLoading(false))
  }, [])

  const loadChatSessions = useCallback(() => {
    fetch('/api/chat-sessions').then(r => r.json()).then(d => setChatSessions(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const switchChatSession = useCallback((id: number) => {
    setActiveChatSessionId(id)
    fetch(`/api/chat-sessions/${id}`).then(r => r.json()).then(d => {
      setChatMessages((d.messages || []).map((m: { role: string; text: string; model?: string }) => ({ role: m.role as 'user' | 'assistant', text: m.text, model: m.model })))
    }).catch(() => {})
  }, [])

  const newChatSession = useCallback(async () => {
    const res = await fetch('/api/chat-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) }).then(r => r.json())
    if (res.id) { setChatMessages([]); setActiveChatSessionId(res.id); loadChatSessions() }
  }, [loadChatSessions])

  const deleteChatSession = useCallback(async (id: number) => {
    await fetch('/api/chat-sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadChatSessions()
    if (activeChatSessionId === id) { setChatMessages([]); setActiveChatSessionId(null) }
  }, [activeChatSessionId, loadChatSessions])

  useEffect(() => {
    // Initial load for HITL + latency
    fetchAll()
    const hitlInterval = setInterval(() => {
      fetch('/api/hitl').then(r => r.json()).then(d => setHITLItems(d)).catch(() => {})
    }, 30000)

    // SSE for live status (replaces status polling)
    const es = new EventSource('/api/status-stream')
    es.onmessage = e => {
      try { setStatus(JSON.parse(e.data)) } catch { /* ignore */ }
    }
    es.onerror = () => { es.close() }

    const tasksInterval = setInterval(() => {
      fetch('/api/tasks').then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : [])).catch(() => {})
    }, 5000)

    return () => { clearInterval(hitlInterval); clearInterval(tasksInterval); es.close() }
  }, [fetchAll])

  useEffect(() => {
    if (tab === 'chat') loadChatSessions()
    if (tab === 'sessions') {
      fetch('/api/sessions').then(r => r.json()).then(d => { setSessions(d.sessions || []); setCommits(d.commits || []) }).catch(() => {})
    }
    if (tab === 'tasks') {
      fetch('/api/tasks').then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : [])).catch(() => {})
    }
    if (tab === 'kb') {
      fetch(`/api/kb-docs?action=pillars&lang=${kbLang}`).then(r => r.json()).then(d => setKbPillars(Array.isArray(d) ? d : [])).catch(() => {})
      if (selectedPillar === 'knowledge') loadKbCategories()
      if (selectedCatId && kbView !== 'grid') loadKbFiles(selectedCatId, kbLang)
    }
  }, [tab, kbLang, loadKbCategories, loadKbFiles, loadChatSessions, selectedPillar, selectedCatId, kbView])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  async function sendChat(msgOverride?: string) {
    const msg = (msgOverride || chatInput).trim()
    if ((!msg && !attachedFile) || chatLoading) return
    const currentAttachment = attachedFile
    setChatInput('')
    setAttachedFile(null)
    const displayMsg = msg + (currentAttachment ? ` [📎 ${currentAttachment.name}]` : '')
    setChatMessages(m => [...m, { role: 'user', text: displayMsg }])
    setChatLoading(true)

    // Ensure a session exists
    let sid = activeChatSessionId
    if (!sid) {
      const s = await fetch('/api/chat-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) }).then(r => r.json()).catch(() => null)
      if (s?.id) { sid = s.id; setActiveChatSessionId(s.id); loadChatSessions() }
    }

    // Save user message
    if (sid) fetch(`/api/chat-sessions/${sid}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'user', content: msg, model, updateTitle: true }) }).catch(() => {})

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          model,
          history: chatMessages.slice(-20),
          attachment: currentAttachment ? {
            name: currentAttachment.name,
            type: currentAttachment.type,
            dataUrl: currentAttachment.dataUrl,
            text: currentAttachment.text,
          } : null,
        })
      })
      const data = await res.json()
      let replyText = data.reply || data.error || '(No response)'
      if (replyText.includes('RateLimitError') || replyText.includes('RESOURCE_EXHAUSTED')) {
        replyText = 'Quota exceeded for this model — try another model (Groq 70B is available)'
      } else if (replyText.includes('litellm.') && replyText.length > 200) {
        replyText = replyText.split('\n')[0].replace(/litellm\.\w+:\s*/g, '')
      }
      setChatMessages(m => [...m, { role: 'assistant', text: replyText, model: data.model }])
      // Save assistant reply
      if (sid) fetch(`/api/chat-sessions/${sid}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'assistant', content: replyText, model: data.model || model }) }).catch(() => {})
      // Refresh session list (title may have updated)
      loadChatSessions()
    } catch (e) { setChatMessages(m => [...m, { role: 'assistant', text: `Error: ${e}` }]) }
    setChatLoading(false)
  }

  async function resolveHITL() {
    if (!resolveId || !resolveMsg.trim()) return
    await fetch('/api/hitl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resolveId, resolution: resolveMsg }) })
    setResolveId(null); setResolveMsg(''); fetchAll()
  }

  function inlineMd(text: string, key?: string | number): React.ReactNode {
    const parts: React.ReactNode[] = []
    const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(\*\*([^*]+)\*\*)/g
    let last = 0, m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index))
      if (m[1]) parts.push(<a key={m.index} href={m[2]} target="_blank" rel="noreferrer" style={{ color: '#0066cc' }}>{m[1]}</a>)
      else if (m[4]) parts.push(<strong key={m.index} style={{ color: '#1d1d1f', fontWeight: 600 }}>{m[4]}</strong>)
      last = m.index + m[0].length
    }
    if (last < text.length) parts.push(text.slice(last))
    return <span key={key}>{parts}</span>
  }

  function renderMd(text: string | undefined | null) {
    if (!text) return null
    const lines = text.split('\n')
    const out: React.ReactNode[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (line.startsWith('## ')) { out.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginTop: 20, marginBottom: 8 }}>{line.slice(3)}</h2>); i++; continue }
      if (line.startsWith('# ')) { out.push(<h1 key={i} style={{ fontSize: 21, fontWeight: 700, color: '#1d1d1f', marginTop: 16, marginBottom: 8 }}>{line.slice(2)}</h1>); i++; continue }
      if (line.startsWith('> ')) { out.push(<p key={i} style={{ color: '#6e6e73', fontStyle: 'italic', borderLeft: '2px solid #d2d2d7', paddingLeft: 12, margin: '4px 0', fontSize: 14 }}>{inlineMd(line.slice(2))}</p>); i++; continue }
      if (line.startsWith('- ') || line.startsWith('* ')) { out.push(<p key={i} style={{ fontSize: 14, color: '#424245', marginLeft: 12 }}>• {inlineMd(line.slice(2))}</p>); i++; continue }
      if (line.startsWith('| ')) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].startsWith('| ')) { tableLines.push(lines[i]); i++ }
        const rows = tableLines.filter(l => !l.match(/^\|[\s|-]+\|$/))
        out.push(
          <div key={`t${i}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {rows.map((row, ri) => {
                  const cells = row.split('|').slice(1, -1)
                  const isHeader = ri === 0
                  return (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#f5f5f7' : 'white' }}>
                      {cells.map((cell, ci) => isHeader
                        ? <th key={ci} style={{ padding: '6px 10px', color: '#6e6e73', fontWeight: 600, borderBottom: '1px solid #d2d2d7', whiteSpace: 'nowrap', textAlign: 'left' }}>{cell.trim()}</th>
                        : <td key={ci} style={{ padding: '6px 10px', color: '#424245', borderBottom: '1px solid #e8e8ed' }}>{inlineMd(cell.trim(), ci)}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
        continue
      }
      if (!line.trim()) { out.push(<div key={i} style={{ height: 8 }} />); i++; continue }
      out.push(<p key={i} style={{ fontSize: 14, color: '#424245', lineHeight: 1.6 }}>{inlineMd(line)}</p>); i++
    }
    return out
  }

  const pending = hitlItems.filter(i => !i.resolved_at)
  const allOk = status && status.litellm && status.ollama && status.n8n

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'white', color: '#1d1d1f', fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>

      {/* Top Nav — Apple style */}
      <nav style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #d2d2d7', position: 'sticky', top: 0, zIndex: 100, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 8 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #0066cc, #00c2ff)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>C</div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.3, color: '#1d1d1f' }}>COPREM</span>
          </div>

          {/* Nav tabs */}
          <div style={{ display: 'flex', flex: 1, gap: 0, overflowX: 'auto' }}>
            {(Object.keys(L.nav) as Tab[]).map(id => (
              <button key={id} onClick={() => setTab(id)} style={{
                position: 'relative', padding: '0 16px', height: 52, fontSize: 14, fontWeight: tab === id ? 500 : 400,
                color: tab === id ? '#0066cc' : '#424245', background: 'none', cursor: 'pointer',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: tab === id ? '2px solid #0066cc' : '2px solid transparent', transition: 'color 0.15s', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {L.nav[id]}
                {id === 'hitl' && pending.length > 0 && (
                  <span style={{ background: '#ff3b30', color: 'white', fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, lineHeight: 1.6 }}>{pending.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Status + lang toggle + links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
            {/* Language toggle */}
            <div style={{ display: 'flex', background: '#f5f5f7', borderRadius: 20, padding: 2, gap: 2, border: '1px solid #d2d2d7' }}>
              {(['en', 'th'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 16, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: lang === l ? '#0066cc' : 'transparent',
                  color: lang === l ? 'white' : '#6e6e73',
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: allOk ? '#d1f5e0' : status ? '#ffe5e5' : '#f5f5f7', color: allOk ? '#1a7f3c' : status ? '#cc0000' : '#6e6e73' }}>
              {allOk ? L.status.online : status ? L.status.issue : '...'}
            </span>
            {[['n8n', 'http://localhost:5678'], ['LiteLLM', 'http://localhost:4000/ui'], ['Dify', 'http://localhost']].map(([l, u]) => (
              <a key={l} href={u} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6e6e73', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, border: '1px solid #d2d2d7', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#0066cc'; (e.target as HTMLElement).style.borderColor = '#0066cc' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = '#6e6e73'; (e.target as HTMLElement).style.borderColor = '#d2d2d7' }}>
                {l} ↗
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', height: '100%' }}>

            {/* Session sidebar */}
            <div style={{ width: 220, borderRight: '1px solid #e8e8ed', background: '#f5f5f7', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '12px 10px 8px' }}>
                <button onClick={newChatSession} style={{ width: '100%', background: '#0066cc', color: 'white', border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + {lang === 'th' ? 'แชทใหม่' : 'New Chat'}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chatSessions.length === 0 && (
                  <p style={{ fontSize: 12, color: '#6e6e73', textAlign: 'center', padding: '20px 12px' }}>{lang === 'th' ? 'ยังไม่มีประวัติ' : 'No history yet'}</p>
                )}
                {chatSessions.map(s => (
                  <div key={s.id} onClick={() => switchChatSession(s.id)} style={{
                    padding: '10px 10px 10px 12px', cursor: 'pointer', borderLeft: activeChatSessionId === s.id ? '3px solid #0066cc' : '3px solid transparent',
                    background: activeChatSessionId === s.id ? 'white' : 'transparent',
                    borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #e8e8ed',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: activeChatSessionId === s.id ? 600 : 400, color: activeChatSessionId === s.id ? '#0066cc' : '#1d1d1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                      <p style={{ fontSize: 10, color: '#6e6e73', margin: '2px 0 0' }}>{new Date(s.updated_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteChatSession(s.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e73', fontSize: 14, padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#cc0000')} onMouseLeave={e => (e.currentTarget.style.color = '#6e6e73')}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat main area */}
            <div
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
            {/* Drag-and-drop overlay */}
            {isDragging && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 50,
                background: 'rgba(0, 102, 204, 0.08)',
                border: '2px dashed #0066cc',
                borderRadius: 16, margin: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, pointerEvents: 'none',
                backdropFilter: 'blur(2px)',
              }}>
                <div style={{ fontSize: 48 }}>📎</div>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#0066cc', margin: 0 }}>
                  {lang === 'th' ? 'วางไฟล์ที่นี่' : 'Drop file here'}
                </p>
                <p style={{ fontSize: 13, color: '#6e6e73', margin: 0 }}>
                  {lang === 'th' ? 'รูปภาพ, PDF, TXT, MD, CSV, JSON' : 'Images, PDF, TXT, MD, CSV, JSON'}
                </p>
              </div>
            )}
            {/* Model selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderBottom: '1px solid #e8e8ed', background: '#f5f5f7', overflowX: 'auto', flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#6e6e73', flexShrink: 0, fontWeight: 500 }}>{L.chat.model}</span>
              {MODELS.map(m => (
                <button key={m.value} onClick={() => setModel(m.value)} style={{
                  fontSize: 12, padding: '4px 14px', borderRadius: 20, border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
                  background: model === m.value ? '#0066cc' : 'white',
                  borderColor: model === m.value ? '#0066cc' : '#d2d2d7',
                  color: model === m.value ? 'white' : '#424245',
                  fontWeight: model === m.value ? 500 : 400
                }}>{m.label}</button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>✦</p>
                    <h2 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>Jeff</h2>
                    <p style={{ fontSize: 15, color: '#6e6e73' }}>{L.chat.subtext} · <span style={{ color: '#0066cc' }}>{MODELS.find(m => m.value === model)?.label}</span></p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
                    {L.quickMsgs.map(s => (
                      <button key={s} onClick={() => sendChat(s)} style={{ fontSize: 13, color: '#0066cc', border: '1px solid #0066cc', padding: '7px 16px', borderRadius: 20, background: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = '#0066cc'; (e.target as HTMLElement).style.color = 'white' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; (e.target as HTMLElement).style.color = '#0066cc' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '72%', padding: '12px 16px', fontSize: 14, lineHeight: 1.55, borderRadius: 18,
                    background: m.role === 'user' ? '#0066cc' : '#f5f5f7',
                    color: m.role === 'user' ? 'white' : '#1d1d1f',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
                  }}>
                    {m.role === 'assistant' && <p style={{ fontSize: 11, color: '#6e6e73', marginBottom: 4 }}>Jeff{m.model && m.model !== 'auto (Jeff)' ? ` · ${m.model}` : ''}</p>}
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#f5f5f7', color: '#6e6e73', fontSize: 14, padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4 }}>{L.chat.thinking}</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #e8e8ed', background: 'white' }}>
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                {/* Attachment preview */}
                {attachedFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '8px 12px', background: '#f0f7ff', borderRadius: 12, border: '1px solid #c8e0ff' }}>
                    {attachedFile.type.startsWith('image/') ? (
                      <img src={attachedFile.dataUrl} alt={attachedFile.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <span style={{ fontSize: 24 }}>📄</span>
                    )}
                    <span style={{ fontSize: 12, color: '#0066cc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e73', fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* File attach button */}
                  <input ref={fileInputRef} type="file" accept="image/*,.txt,.md,.pdf,.csv,.json" onChange={handleFileAttach} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={chatLoading} title="Attach file" style={{
                    background: attachedFile ? '#0066cc' : '#f5f5f7', color: attachedFile ? 'white' : '#6e6e73',
                    border: '1px solid', borderColor: attachedFile ? '#0066cc' : '#d2d2d7',
                    borderRadius: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s'
                  }}>📎</button>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} disabled={chatLoading}
                    placeholder={L.chat.placeholder}
                    style={{ flex: 1, background: '#f5f5f7', color: '#1d1d1f', padding: '11px 18px', borderRadius: 24, border: '1px solid #d2d2d7', fontSize: 14, outline: 'none', transition: 'border-color 0.15s' }}
                    onFocus={e => (e.target.style.borderColor = '#0066cc')}
                    onBlur={e => (e.target.style.borderColor = '#d2d2d7')} />
                  <button onClick={() => sendChat()} disabled={chatLoading || (!chatInput.trim() && !attachedFile)} style={{
                    background: chatLoading || (!chatInput.trim() && !attachedFile) ? '#d2d2d7' : '#0066cc', color: 'white',
                    padding: '11px 22px', borderRadius: 24, border: 'none', fontSize: 14, fontWeight: 500,
                    cursor: chatLoading || (!chatInput.trim() && !attachedFile) ? 'not-allowed' : 'pointer', transition: 'background 0.15s', flexShrink: 0
                  }}>{L.chat.send}</button>
                </div>
              </div>
            </div>
            </div>{/* end chat main area + drag zone */}
          </div>
        )}

        {/* ── HITL ── */}
        {tab === 'hitl' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '28px 24px', background: '#f5f5f7' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{L.hitl.title}</h1>
                  <p style={{ fontSize: 13, color: '#6e6e73', marginTop: 4 }}>{pending.length > 0 ? L.hitl.pending(pending.length) : L.hitl.none}</p>
                </div>
                <button onClick={fetchAll} style={{ fontSize: 12, color: '#6e6e73', background: 'white', border: '1px solid #d2d2d7', borderRadius: 20, padding: '6px 14px', cursor: 'pointer' }}>↻</button>
              </div>

              {/* Kanban board */}
              <div className="kanban-board">
                {/* Col: รอตอบกลับ */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9500', display: 'inline-block' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>{lang === 'th' ? 'รอตอบกลับ' : 'Pending'}</p>
                    <span style={{ fontSize: 11, background: '#ff9500', color: 'white', padding: '1px 7px', borderRadius: 10 }}>{pending.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hitlItems.filter(i => !i.resolved_at).map(item => (
                      <div key={item.id} style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #e8e8ed' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 11, background: '#fff3e0', color: '#cc7700', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>#{item.id}</span>
                          <span style={{ fontSize: 11, color: '#6e6e73' }}>{new Date(item.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#1d1d1f', lineHeight: 1.5, marginBottom: 14 }}>{item.message}</p>
                        {resolveId === item.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <textarea value={resolveMsg} onChange={e => setResolveMsg(e.target.value)} rows={2} autoFocus placeholder={L.hitl.placeholder}
                              style={{ width: '100%', background: '#f5f5f7', color: '#1d1d1f', fontSize: 13, padding: '8px 12px', borderRadius: 10, border: '1px solid #d2d2d7', outline: 'none', resize: 'none' }} />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={resolveHITL} disabled={!resolveMsg.trim()} style={{ flex: 1, background: '#0066cc', color: 'white', fontSize: 12, padding: '7px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>{L.hitl.sendReply}</button>
                              <button onClick={() => setResolveId(null)} style={{ color: '#6e6e73', fontSize: 12, padding: '7px 12px', borderRadius: 10, border: '1px solid #d2d2d7', background: 'none', cursor: 'pointer' }}>{L.hitl.cancel}</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setResolveId(item.id); setResolveMsg('') }} style={{ width: '100%', background: '#0066cc', color: 'white', fontSize: 12, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>{L.hitl.reply}</button>
                        )}
                      </div>
                    ))}
                    {pending.length === 0 && (
                      <div style={{ background: 'white', borderRadius: 16, padding: 24, textAlign: 'center', border: '2px dashed #e8e8ed' }}>
                        <p style={{ fontSize: 24, margin: '0 0 6px' }}>✓</p>
                        <p style={{ fontSize: 13, color: '#6e6e73' }}>{L.hitl.none}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col: เสร็จแล้ว */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a7f3c', display: 'inline-block' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>{lang === 'th' ? 'เสร็จแล้ว' : 'Resolved'}</p>
                    <span style={{ fontSize: 11, background: '#1a7f3c', color: 'white', padding: '1px 7px', borderRadius: 10 }}>{hitlItems.filter(i => i.resolved_at).length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hitlItems.filter(i => i.resolved_at).map(item => (
                      <div key={item.id} style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #e8e8ed', opacity: 0.75 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, background: '#e6f9f0', color: '#1a7f3c', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>#{item.id}</span>
                          <span style={{ fontSize: 11, color: '#6e6e73' }}>{new Date(item.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#424245', lineHeight: 1.5, marginBottom: 8 }}>{item.message}</p>
                        {item.resolution && <p style={{ fontSize: 12, color: '#1a7f3c', background: '#e6f9f0', padding: '6px 10px', borderRadius: 8 }}>✓ {item.resolution}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── KB ── */}
        {tab === 'kb' && (
          <div style={{ display: 'flex', height: '100%' }}>

            {/* ── Left sidebar: Pillars ── */}
            <div style={{ width: 150, borderRight: '1px solid #e8e8ed', background: '#f5f5f7', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '14px 12px 8px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{L.kb.title}</p>
              </div>
              <div style={{ flex: 1 }}>
                {kbPillars.map(p => (
                  <button key={p.id} onClick={() => {
                    setSelectedPillar(p.id)
                    setKbView('grid')
                    setSelectedCatId('')
                    setSelectedFile(null)
                    setKbDoc(null)
                    if (p.id === 'knowledge') loadKbCategories()
                    else {
                      setKbLoading(true)
                      fetch(`/api/kb-docs?action=items&pillar=${p.id}`)
                        .then(r => r.json())
                        .then(d => { setKbFiles(Array.isArray(d) ? d : []); setKbLoading(false) })
                        .catch(() => setKbLoading(false))
                    }
                  }} style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #e8e8ed',
                    borderLeft: selectedPillar === p.id ? '3px solid #0066cc' : '3px solid transparent',
                    background: selectedPillar === p.id ? 'white' : 'transparent', cursor: 'pointer',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: selectedPillar === p.id ? 600 : 400, color: selectedPillar === p.id ? '#0066cc' : '#1d1d1f', margin: 0 }}>{p.label}</p>
                    <p style={{ fontSize: 10, color: '#6e6e73', margin: '2px 0 0' }}>{p.fileCount} {lang === 'th' ? 'ไฟล์' : 'files'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Main content area ── */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f7' }}>

              {/* VIEW 1: Bento category grid (knowledge pillar) */}
              {kbView === 'grid' && selectedPillar === 'knowledge' && (
                <div style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{kbPillars.find(p => p.id === selectedPillar)?.label}</h2>
                    <span style={{ fontSize: 12, color: '#6e6e73' }}>{kbCategories.length} {lang === 'th' ? 'หมวดหมู่' : 'categories'}</span>
                  </div>
                  {kbLoading
                    ? <p style={{ color: '#6e6e73', textAlign: 'center', padding: 40 }}>{L.kb.loading}</p>
                    : (
                    <div className="bento-grid">
                      {kbCategories.map(cat => (
                        <div key={cat.id} className="bento-card" onClick={() => {
                          setSelectedCatId(cat.id)
                          setKbView('files')
                          loadKbFiles(cat.id, kbLang)
                        }} style={{ background: cat.gradient, borderRadius: 20, padding: '22px 20px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(255,255,255,0.6)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                          </div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px', lineHeight: 1.35 }}>{cat.labelTh}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <span style={{ fontSize: 12, color: '#424245' }}>{cat.fileCount} {lang === 'th' ? 'ไฟล์' : 'files'}</span>
                            {cat.totalCourses > 0 && <span style={{ fontSize: 12, color: '#424245' }}>· {cat.totalCourses} {lang === 'th' ? 'คอร์ส' : 'courses'}</span>}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#0066cc' }}>
                            {lang === 'th' ? 'ดูรายละเอียด' : 'View details'} →
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 1b: File list for non-knowledge pillars */}
              {kbView === 'grid' && selectedPillar !== 'knowledge' && (
                <div style={{ padding: '24px 28px' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', marginBottom: 20 }}>{kbPillars.find(p => p.id === selectedPillar)?.label}</h2>
                  {kbLoading
                    ? <p style={{ color: '#6e6e73', textAlign: 'center', padding: 40 }}>{L.kb.loading}</p>
                    : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {kbFiles.map(file => (
                        <div key={file.id} onClick={() => openKbDoc(file, kbLang)} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', border: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', margin: '0 0 4px' }}>{file.title}</p>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: file.source === 'FutureSkill' ? '#e8f0fe' : file.source === 'Prem' ? '#e6f9f0' : '#f0f0f5', color: file.source === 'FutureSkill' ? '#0066cc' : file.source === 'Prem' ? '#1a7f3c' : '#424245' }}>{file.source}</span>
                          </div>
                          <span style={{ fontSize: 12, color: '#0066cc', fontWeight: 600 }}>{lang === 'th' ? 'เปิดเอกสาร' : 'Open'} →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: File list in category */}
              {kbView === 'files' && (
                <div style={{ padding: '0' }}>
                  <div style={{ padding: '16px 28px', background: 'white', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={() => { setKbView('grid'); setKbFiles([]) }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10 }}>
                      ← {lang === 'th' ? 'กลับ' : 'Back'}
                    </button>
                    <div style={{ width: 1, height: 20, background: '#e8e8ed' }} />
                    {(() => {
                      const cat = kbCategories.find(c => c.id === selectedCatId)
                      return cat ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{cat.labelTh}</h2>
                        </div>
                      ) : null
                    })()}
                  </div>
                  <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {kbLoading
                      ? <p style={{ color: '#6e6e73', textAlign: 'center', padding: 40 }}>{L.kb.loading}</p>
                      : kbFiles.map(file => (
                        <div key={file.id} onClick={() => openKbDoc(file, kbLang)} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', border: '1px solid #e8e8ed', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', margin: '0 0 6px' }}>{file.title}</p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: file.source === 'FutureSkill' ? '#e8f0fe' : file.source === 'Prem' ? '#e6f9f0' : '#f0f0f5', color: file.source === 'FutureSkill' ? '#0066cc' : file.source === 'Prem' ? '#1a7f3c' : '#424245' }}>{file.source}</span>
                              <span style={{ fontSize: 12, color: '#6e6e73' }}>
                                {file.isCatalog ? `${file.linkCount} ${lang === 'th' ? 'คอร์ส' : 'courses'}` : `${file.wordCount} ${lang === 'th' ? 'คำ' : 'words'}`}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: '#0066cc', fontWeight: 600, flexShrink: 0 }}>{lang === 'th' ? 'เปิดเอกสาร' : 'Open'} →</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* VIEW 3: Document reader */}
              {kbView === 'doc' && (
                <div style={{ padding: '0' }}>
                  {/* Doc header */}
                  <div style={{ padding: '16px 28px', background: 'white', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={() => { setKbView(selectedPillar === 'knowledge' ? 'files' : 'grid'); setKbDoc(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10 }}>
                      ← {lang === 'th' ? 'กลับ' : 'Back'}
                    </button>
                    <div style={{ width: 1, height: 20, background: '#e8e8ed' }} />
                    {selectedFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{ flex: 1 }}>
                          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{selectedFile.title}</h2>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: selectedFile.source === 'FutureSkill' ? '#e8f0fe' : selectedFile.source === 'Prem' ? '#e6f9f0' : '#f0f0f5', color: selectedFile.source === 'FutureSkill' ? '#0066cc' : selectedFile.source === 'Prem' ? '#1a7f3c' : '#424245' }}>{selectedFile.source}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {kbDoc?.sourceUrl && (
                            <a href={kbDoc.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0066cc', textDecoration: 'none', padding: '5px 12px', borderRadius: 12, border: '1px solid #0066cc' }}>
                              {lang === 'th' ? 'ดูที่มา ↗' : 'Source ↗'}
                            </a>
                          )}
                          <span onClick={() => fetch(`/api/kb-docs?action=open&cat=${selectedFile.catId}&file=${encodeURIComponent(selectedFile.filename)}`)} style={{ fontSize: 12, color: '#6e6e73', padding: '5px 12px', borderRadius: 12, border: '1px solid #d2d2d7', cursor: 'pointer' }}>
                            ✎ .md
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Doc body */}
                  <div style={{ padding: '24px 28px' }}>
                    {kbDocLoading ? (
                      <p style={{ color: '#6e6e73', textAlign: 'center', padding: 40 }}>{L.kb.loading}</p>
                    ) : kbDoc ? (
                      <>
                        {kbDoc.links && kbDoc.links.length > 0 ? (
                          <>
                            <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 16 }}>
                              {kbDoc.courseCount} {lang === 'th' ? 'คอร์สในหมวดนี้' : 'courses in this category'}
                            </p>
                            <div className="course-grid">
                              {kbDoc.links.map((lnk, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #e8e8ed', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <span style={{ fontSize: 11, color: '#6e6e73', flexShrink: 0, marginTop: 2, minWidth: 22 }}>{lnk.index}.</span>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f', margin: '0 0 10px', lineHeight: 1.45 }}>{lnk.name}</p>
                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {/* Read .md content */}
                                        <span onClick={() => {
                                          setCourseDocLoading(true); setKbView('course'); setCourseDoc(null)
                                          fetch(`/api/kb-docs?action=course-doc&name=${encodeURIComponent(lnk.name)}`)
                                            .then(r => r.json()).then(d => { setCourseDoc(d.error ? null : d); setCourseDocLoading(false) })
                                            .catch(() => setCourseDocLoading(false))
                                        }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#1a7f3c', background: '#e6f9f0', padding: '4px 10px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                                          📄 {lang === 'th' ? 'อ่านเนื้อหา' : 'Read .md'}
                                        </span>
                                        {/* External FutureSkill link */}
                                        <a href={lnk.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#0066cc', background: '#e8f0fe', padding: '4px 10px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
                                          {lang === 'th' ? 'ดูคอร์ส ↗' : 'Course ↗'}
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #e8e8ed' }}>
                            {renderMd(kbDoc.content)}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {/* ── COURSE DOC VIEW ── */}
              {kbView === 'course' && (
                <div>
                  <div style={{ padding: '14px 28px', background: 'white', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setKbView('doc')} style={{ fontSize: 13, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10 }}>
                      ← {lang === 'th' ? 'กลับรายการ' : 'Back'}
                    </button>
                    <div style={{ width: 1, height: 20, background: '#e8e8ed' }} />
                    <span style={{ fontSize: 11, background: '#e6f9f0', color: '#1a7f3c', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>📄 .md</span>
                    {courseDoc && <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{courseDoc.title}</span>}
                    {courseDoc && <span onClick={() => { const f = courseDoc.path; fetch(`/api/kb-docs?action=open&cat=DIRECT&file=${encodeURIComponent(f)}`).catch(() => {}); window.open(`file://${f}`) }} style={{ marginLeft: 'auto', fontSize: 11, color: '#6e6e73', padding: '4px 10px', borderRadius: 10, border: '1px solid #d2d2d7', cursor: 'pointer' }}>✎ {lang === 'th' ? 'แก้ไข' : 'Edit'}</span>}
                  </div>
                  <div style={{ padding: '24px 32px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                    {courseDocLoading ? (
                      <p style={{ color: '#6e6e73', textAlign: 'center', padding: 40 }}>{lang === 'th' ? 'กำลังโหลด...' : 'Loading...'}</p>
                    ) : courseDoc ? (
                      <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid #e8e8ed' }}>
                        {renderMd(courseDoc.content)}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 60, color: '#6e6e73' }}>
                        <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
                        <p style={{ fontSize: 14 }}>{lang === 'th' ? 'ไม่พบไฟล์เนื้อหาสำหรับคอร์สนี้' : 'No .md file found for this course'}</p>
                        <p style={{ fontSize: 12, marginTop: 8, color: '#aaa' }}>{lang === 'th' ? 'Jeff จะเพิ่มเนื้อหาเมื่อได้รับไฟล์' : 'Jeff will add content when file is available'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── BROWSER ── */}
        {tab === 'browser' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '32px 24px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f', marginBottom: 20 }}>{L.browser.title}</h1>
              {/* URL bar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
                <input value={browserInput} onChange={e => setBrowserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { const q = browserInput.trim(); window.open(q.startsWith('http') ? q : `https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank') } }}
                  placeholder={L.browser.placeholder}
                  style={{ flex: 1, background: '#f5f5f7', color: '#1d1d1f', padding: '11px 18px', borderRadius: 24, border: '1px solid #d2d2d7', fontSize: 14, outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#0066cc')}
                  onBlur={e => (e.target.style.borderColor = '#d2d2d7')} />
                <button onClick={() => { const q = browserInput.trim(); window.open(q.startsWith('http') ? q : `https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank') }}
                  style={{ background: '#0066cc', color: 'white', padding: '11px 22px', borderRadius: 24, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Open ↗</button>
              </div>

              {/* COPREM links */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 12, color: '#6e6e73', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>{L.browser.system}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'n8n Workflows', url: 'http://localhost:5678/workflows', desc: 'Automation workflows' },
                    { label: 'LiteLLM UI', url: 'http://localhost:4000/ui', desc: 'Models & cost tracking' },
                    { label: 'Dify Datasets', url: 'https://cloud.dify.ai/datasets', desc: 'Dataset management' },
                    { label: 'Dify Apps', url: 'https://cloud.dify.ai/apps', desc: 'AI applications' },
                  ].map(({ label, url, desc }) => (
                    <button key={label} onClick={() => window.open(url, '_blank')} style={{ textAlign: 'left', background: 'white', border: '1px solid #e8e8ed', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0066cc', marginBottom: 4 }}>{label} ↗</div>
                      <div style={{ fontSize: 12, color: '#6e6e73' }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* General links */}
              <div>
                <p style={{ fontSize: 12, color: '#6e6e73', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>General</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Google', url: 'https://www.google.com', desc: 'Search' },
                    { label: 'GitHub', url: 'https://github.com', desc: 'Source code' },
                    { label: 'NotebookLM', url: 'https://notebooklm.google.com', desc: 'AI Knowledge Base' },
                    { label: 'FutureSkill', url: 'https://learn.futureskill.co', desc: 'Online learning' },
                  ].map(({ label, url, desc }) => (
                    <button key={label} onClick={() => window.open(url, '_blank')} style={{ textAlign: 'left', background: 'white', border: '1px solid #e8e8ed', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0066cc', marginBottom: 4 }}>{label} ↗</div>
                      <div style={{ fontSize: 12, color: '#6e6e73' }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCS ── */}
        {tab === 'docs' && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 40, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>{L.docs.title}</h1>
                <p style={{ fontSize: 16, color: '#6e6e73' }}>{L.docs.subtitle}</p>
              </div>
              {L.docs_sections.map(s => (
                <div key={s.title} style={{ background: '#f5f5f7', borderRadius: 16, padding: '20px 24px', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 14 }}>{s.title}</h2>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
                    {s.items.map((text, i) => (
                      <li key={i} style={{ fontSize: 14, color: '#424245', display: 'flex', gap: 10 }}>
                        <span style={{ color: '#0066cc', flexShrink: 0 }}>→</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SYSTEM ── */}
        {tab === 'system' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '32px 24px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f' }}>{L.system.title}</h1>

              {/* Services */}
              <div style={{ background: '#f5f5f7', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f' }}>{L.system.services}</h2>
                  <button onClick={fetchAll} style={{ fontSize: 13, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer' }}>{L.system.refresh}</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'LiteLLM', ok: status?.litellm, url: 'http://localhost:4000/ui' },
                    { label: 'Ollama', ok: status?.ollama, url: 'http://localhost:11434' },
                    { label: 'n8n', ok: status?.n8n, url: 'http://localhost:5678' },
                  ].map((s, idx, arr) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: idx < arr.length - 1 ? '1px solid #e8e8ed' : 'none' }}>
                      <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#0066cc', textDecoration: 'none' }}>{s.label} ↗</a>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, background: s.ok == null ? '#e8e8ed' : s.ok ? '#d1f5e0' : '#ffe5e5', color: s.ok == null ? '#6e6e73' : s.ok ? '#1a7f3c' : '#cc0000' }}>
                        {s.ok == null ? L.system.checking : s.ok ? L.system.online : L.system.down}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latency */}
              <div style={{ background: '#f5f5f7', borderRadius: 16, padding: '20px 24px' }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>{L.system.latency}</h2>
                {latency.length === 0 ? <p style={{ color: '#6e6e73', fontSize: 14 }}>{L.system.waiting}</p> : (
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #d2d2d7' }}>
                        {['Layer', 'Avg', 'Max', 'Requests'].map(h => <th key={h} style={{ textAlign: h === 'Layer' ? 'left' : 'right', padding: '0 0 10px', color: '#6e6e73', fontWeight: 500 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>{latency.map(r => (
                      <tr key={r.event_type} style={{ borderBottom: '1px solid #e8e8ed' }}>
                        <td style={{ padding: '10px 0', color: '#0066cc', fontSize: 12 }}>{r.event_type}</td>
                        <td style={{ textAlign: 'right', color: '#424245' }}>{r.avg_ms}ms</td>
                        <td style={{ textAlign: 'right', color: r.max_ms > 2000 ? '#cc0000' : '#424245' }}>{r.max_ms}ms</td>
                        <td style={{ textAlign: 'right', color: '#6e6e73' }}>{r.requests}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>

              {/* Quick links */}
              <div style={{ background: '#f5f5f7', borderRadius: 16, padding: '20px 24px' }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>{L.system.openServices}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['n8n Workflows', 'http://localhost:5678/workflows'], ['LiteLLM UI', 'http://localhost:4000/ui'], ['Dify Datasets', 'https://cloud.dify.ai/datasets'], ['Dify Apps', 'https://cloud.dify.ai/apps']].map(([l, u]) => (
                    <a key={l} href={u} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#0066cc', background: 'white', padding: '12px 16px', borderRadius: 12, border: '1px solid #e8e8ed', textDecoration: 'none', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>{l} ↗</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SESSIONS ── */}
        {tab === 'sessions' && (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* Left sidebar — session list */}
            <div style={{ width: 280, borderRight: '1px solid #e8e8ed', background: '#f5f5f7', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid #e8e8ed' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>COPREM OS</p>
                <div style={{ display: 'flex', background: '#e8e8ed', borderRadius: 8, padding: 2, gap: 2 }}>
                  {(['sessions', 'commits'] as const).map(v => (
                    <button key={v} onClick={() => setSessionsView(v)} style={{
                      flex: 1, fontSize: 12, fontWeight: 500, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: sessionsView === v ? 'white' : 'transparent',
                      color: sessionsView === v ? '#1d1d1f' : '#6e6e73',
                      boxShadow: sessionsView === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>{v === 'sessions' ? (lang === 'th' ? 'เซสชัน' : 'Sessions') : 'Git Log'}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {sessionsView === 'sessions' && sessions.map((s, i) => (
                  <button key={i} onClick={() => setExpandedSession(expandedSession === `s${i}` ? null : `s${i}`)} style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px', background: expandedSession === `s${i}` ? 'white' : 'transparent',
                    borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #e8e8ed',
                    borderLeft: expandedSession === `s${i}` ? '3px solid #0066cc' : '3px solid transparent', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 12, color: '#1d1d1f', fontWeight: 500, marginBottom: 3, lineHeight: 1.4 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: '#6e6e73' }}>{s.date} · {s.steps.length} steps</div>
                  </button>
                ))}
                {sessionsView === 'commits' && commits.map((c, i) => (
                  <button key={i} onClick={() => setExpandedSession(expandedSession === `c${i}` ? null : `c${i}`)} style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px', background: expandedSession === `c${i}` ? 'white' : 'transparent',
                    borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #e8e8ed',
                    borderLeft: expandedSession === `c${i}` ? '3px solid #0066cc' : '3px solid transparent', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 12, color: '#1d1d1f', fontWeight: 500, marginBottom: 3, lineHeight: 1.4 }}>{c.subject}</div>
                    <div style={{ fontSize: 11, color: '#6e6e73', fontFamily: 'monospace' }}>{c.hash} · {c.time}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — session detail */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
              {!expandedSession ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#6e6e73' }}>
                  <p style={{ fontSize: 32 }}>📋</p>
                  <p style={{ fontSize: 14 }}>{lang === 'th' ? 'เลือก session เพื่อดูรายละเอียด' : 'Select a session to view details'}</p>
                </div>
              ) : expandedSession.startsWith('s') ? (() => {
                const s = sessions[parseInt(expandedSession.slice(1))]
                if (!s) return null
                return (
                  <div>
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 12, color: '#0066cc', fontWeight: 500, marginBottom: 6 }}>{s.date}</p>
                      <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>{s.title}</h2>
                      <p style={{ fontSize: 13, color: '#6e6e73' }}>{s.steps.length} steps recorded</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {s.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #f0f0f5', alignItems: 'flex-start' }}>
                          {/* Timeline dot */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 3 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: step.result?.includes('✅') || step.result?.includes('DONE') ? '#1a7f3c' : step.result?.includes('⚠️') || step.result?.includes('PENDING') ? '#cc7700' : '#0066cc' }} />
                            {i < s.steps.length - 1 && <div style={{ width: 1, height: 20, background: '#e8e8ed', marginTop: 4 }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 500, marginBottom: 3 }}>{step.action}</p>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: '#6e6e73', fontFamily: 'monospace' }}>{step.time}</span>
                              {step.result && <span style={{ fontSize: 11, color: step.result.includes('✅') || step.result.includes('DONE') ? '#1a7f3c' : step.result.includes('⚠️') ? '#cc7700' : '#6e6e73' }}>{step.result}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })() : (() => {
                const c = commits[parseInt(expandedSession.slice(1))]
                if (!c) return null
                const typeColor: Record<string, string> = { feat: '#0066cc', fix: '#cc3300', chore: '#6e6e73', docs: '#6e3399', refactor: '#cc7700' }
                const typeMatch = c.subject.match(/^(\w+)[\(:]/)
                const type = typeMatch?.[1] || 'commit'
                return (
                  <div>
                    <div style={{ marginBottom: 24 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: typeColor[type] || '#6e6e73', background: '#f5f5f7', padding: '3px 10px', borderRadius: 12, marginBottom: 12, display: 'inline-block' }}>{type}</span>
                      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', marginTop: 8, marginBottom: 6 }}>{c.subject}</h2>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'monospace' }}>{c.hash}</span>
                        <span style={{ fontSize: 12, color: '#6e6e73' }}>{c.time}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1d1d1f' }}>
                    {lang === 'th' ? 'งานอัตโนมัติ' : 'Autonomous Tasks'}
                  </h2>
                  <p style={{ fontSize: 13, color: '#6e6e73', margin: '4px 0 0' }}>
                    {lang === 'th' ? 'คิวงานที่ autonomous_loop ดำเนินการ — refresh ทุก 5s' : 'Task queue processed by autonomous_loop — refreshes every 5s'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f5f5f7', padding: 12, borderRadius: 12, border: '1px solid #e5e5ea' }}>
                  <select
                    value={taskNewAgent}
                    onChange={e => setTaskNewAgent(e.target.value)}
                    style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #d2d2d7', background: 'white', color: '#1d1d1f' }}
                  >
                    <option value="jeff">Jeff (JOB)</option>
                    <option value="eilinaire">Eilinaire (PERSONAL)</option>
                  </select>
                  <input
                    value={taskNewPrompt}
                    onChange={e => setTaskNewPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') document.getElementById('task-submit-btn')?.click() }}
                    placeholder={lang === 'th' ? 'พิมพ์ task ใหม่...' : 'New task prompt...'}
                    style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #d2d2d7', background: 'white', width: 280, color: '#1d1d1f' }}
                  />
                  <button
                    id="task-submit-btn"
                    disabled={taskSubmitting || !taskNewPrompt.trim()}
                    onClick={async () => {
                      if (!taskNewPrompt.trim()) return
                      setTaskSubmitting(true)
                      try {
                        await fetch('/api/tasks', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'analysis', payload: { prompt: taskNewPrompt, notify_telegram: false }, assigned_to: taskNewAgent, priority: 5 }),
                        })
                        setTaskNewPrompt('')
                        const d = await fetch('/api/tasks').then(r => r.json())
                        setTasks(Array.isArray(d) ? d : [])
                      } finally { setTaskSubmitting(false) }
                    }}
                    style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#0066cc', color: 'white', fontSize: 13, fontWeight: 600, cursor: taskSubmitting ? 'wait' : 'pointer' }}
                  >
                    {taskSubmitting ? '...' : lang === 'th' ? '+ เพิ่ม' : '+ Add'}
                  </button>
                </div>
              </div>

              {/* Stats row */}
              {(() => {
                const counts = { pending: 0, running: 0, done: 0, failed: 0 }
                tasks.forEach(t => { if (t.status in counts) (counts as Record<string,number>)[t.status]++ })
                return (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {([['pending','#ff9f0a','#fff8ec'],['running','#0066cc','#e5f0ff'],['done','#30d158','#e8f9ed'],['failed','#ff3b30','#ffe5e5']] as const).map(([s,c,bg]) => (
                      <div key={s} style={{ flex: 1, background: bg, border: `1px solid ${c}30`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{(counts as Record<string,number>)[s]}</div>
                        <div style={{ fontSize: 12, color: '#6e6e73', textTransform: 'capitalize', marginTop: 2 }}>{s}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Task table */}
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6e6e73', padding: '48px 0', fontSize: 15 }}>
                  {lang === 'th' ? 'ไม่มีงานในคิว' : 'No tasks in queue'}
                </div>
              ) : (
                <div style={{ background: 'white', border: '1px solid #e5e5ea', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f5f5f7', borderBottom: '1px solid #e5e5ea' }}>
                        {['Type','Status','Agent','Priority','Retries','Run At','Result'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#6e6e73', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, i) => {
                        const statusColor: Record<string,string> = { pending: '#ff9f0a', running: '#0066cc', done: '#30d158', failed: '#ff3b30', hitl_pending: '#af52de' }
                        const statusBg: Record<string,string> = { pending: '#fff8ec', running: '#e5f0ff', done: '#e8f9ed', failed: '#ffe5e5', hitl_pending: '#f5e6ff' }
                        const c = statusColor[t.status] || '#6e6e73'
                        const bg = statusBg[t.status] || '#f5f5f7'
                        return (
                          <tr key={t.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #f0f0f5' : 'none', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1d1d1f' }}>{t.type}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ background: bg, color: c, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#424245' }}>{t.assigned_to || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#424245', textAlign: 'center' }}>{t.priority}</td>
                            <td style={{ padding: '10px 14px', color: t.retries > 0 ? '#ff3b30' : '#424245', textAlign: 'center' }}>{t.retries}/{t.max_retries}</td>
                            <td style={{ padding: '10px 14px', color: '#6e6e73', fontSize: 12 }}>{t.run_at?.slice(0,16) || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#6e6e73', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.error ? <span style={{ color: '#ff3b30' }}>{t.error.slice(0,80)}</span> : (t.result || '—').slice(0,80)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
