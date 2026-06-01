'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string; model?: string }
type Tab = 'chat' | 'hitl' | 'kb' | 'docs' | 'system'
type KBSection = { title: string; preview: string; lines: number }
type KBDoc = { id: string; label: string; pillar: string; sections: string[] }

const MODELS = [
  { value: 'auto',                      label: '🤖 Auto (Jeff เลือกเอง)',    group: 'Auto' },
  { value: 'gemini-2.0-flash',          label: '✦ Gemini 2.0 Flash',         group: 'Cloud' },
  { value: 'gemini-2.0-flash-lite',     label: '✦ Gemini 2.0 Flash-Lite',    group: 'Cloud' },
  { value: 'groq/llama-3.3-70b',        label: '⚡ Groq Llama 3.3 70B',      group: 'Cloud' },
  { value: 'ollama/llama3.1',           label: '🖥 Ollama Llama 3.1 8B',     group: 'Local' },
  { value: 'ollama/qwen',               label: '🖥 Ollama Qwen 2.5 7B',      group: 'Local' },
]

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat',   label: 'คุยกับ Jeff', icon: '💬' },
  { id: 'hitl',   label: 'รออนุมัติ',   icon: '⚠️' },
  { id: 'kb',     label: 'คลังความรู้',  icon: '📚' },
  { id: 'docs',   label: 'คู่มือ',       icon: '📖' },
  { id: 'system', label: 'ระบบ',        icon: '⚙️' },
]

const QUICK_MSGS = ['วันนี้ต้องทำอะไรบ้าง?', 'แนะนำคอร์สเรียน Python', 'สรุปสถานะระบบให้หน่อย', 'วิเคราะห์ตลาดหุ้นวันนี้']

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('chat')
  const [model, setModel] = useState('auto')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hitlItems, setHITLItems] = useState<HITLItem[]>([])
  const [latency, setLatency] = useState<LatencyRow[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [resolveId, setResolveId] = useState<number | null>(null)
  const [resolveMsg, setResolveMsg] = useState('')
  // KB state
  const [kbDocs, setKbDocs] = useState<KBDoc[]>([])
  const [selectedKb, setSelectedKb] = useState('KB-06')
  const [kbSections, setKbSections] = useState<KBSection[]>([])
  const [selectedSection, setSelectedSection] = useState('')
  const [sectionContent, setSectionContent] = useState('')
  const [kbLoading, setKbLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t) }, [fetchAll])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  // KB: load doc list
  useEffect(() => {
    if (tab !== 'kb') return
    fetch('/api/kb-docs?list=1').then(r => r.json()).then(setKbDocs).catch(() => {})
  }, [tab])

  // KB: load sections when KB selected
  useEffect(() => {
    if (!selectedKb || tab !== 'kb') return
    setKbLoading(true); setKbSections([]); setSelectedSection(''); setSectionContent('')
    fetch(`/api/kb-docs?kb=${selectedKb}`).then(r => r.json())
      .then(data => { setKbSections(Array.isArray(data) ? data : []); setKbLoading(false) })
      .catch(() => setKbLoading(false))
  }, [selectedKb, tab])

  // KB: load section content
  useEffect(() => {
    if (!selectedSection) return
    setSectionContent('loading...')
    const sec = encodeURIComponent(selectedSection)
    fetch(`/api/kb-docs?kb=${selectedKb}&section=${sec}`).then(r => r.json())
      .then(d => setSectionContent(d.content || d.error || ''))
      .catch(() => setSectionContent('โหลดไม่ได้'))
  }, [selectedSection, selectedKb])

  async function sendChat(msgOverride?: string) {
    const msg = msgOverride || chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, model })
      })
      const data = await res.json()
      setChatMessages(m => [...m, {
        role: 'assistant',
        text: data.reply || data.error || '(ไม่มีการตอบกลับ)',
        model: data.model
      }])
    } catch (e) {
      setChatMessages(m => [...m, { role: 'assistant', text: `⚠️ Error: ${e}` }])
    }
    setChatLoading(false)
  }

  async function resolveHITL() {
    if (!resolveId || !resolveMsg.trim()) return
    await fetch('/api/hitl', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resolveId, resolution: resolveMsg })
    })
    setResolveId(null); setResolveMsg(''); fetchAll()
  }

  const pending = hitlItems.filter(i => !i.resolved_at)
  const allOk = status && status.litellm && status.ollama && status.n8n
  const selectedModelLabel = MODELS.find(m => m.value === model)?.label || model

  // Simple markdown renderer
  function renderMd(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-blue-300 mt-4 mb-2">{line.slice(2)}</h1>
      if (line.startsWith('> ')) return <p key={i} className="text-gray-400 italic border-l-2 border-gray-600 pl-3 my-1">{line.slice(2)}</p>
      if (line.startsWith('| ')) return <p key={i} className="text-sm text-gray-300 font-mono">{line}</p>
      if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="text-sm text-gray-300 ml-3">• {line.slice(2)}</p>
      if (!line.trim()) return <br key={i} />
      return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0 bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">COPREM OS</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allOk ? 'bg-green-900 text-green-300' : status ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'}`}>
            {allOk ? '● ระบบปกติ' : status ? '● มีปัญหา' : '...'}
          </span>
          {pending.length > 0 && (
            <button onClick={() => setTab('hitl')}
              className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
              ⚠ {pending.length} รอ
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[['n8n', 'http://localhost:5678/workflows'], ['LiteLLM', 'http://localhost:4000/ui'], ['Dify', 'http://localhost']].map(([l, u]) => (
            <a key={l} href={u} target="_blank" rel="noreferrer"
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-800 hover:border-gray-600 transition">{l} ↗</a>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-gray-800 shrink-0 bg-gray-900">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm border-b-2 transition ${tab === n.id ? 'border-blue-500 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {n.icon} {n.label}
            {n.id === 'hitl' && pending.length > 0 && (
              <span className="bg-yellow-600 text-white text-xs px-1.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Model selector bar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900/50 shrink-0">
              <span className="text-xs text-gray-500">โมเดล:</span>
              <div className="flex gap-1.5 flex-wrap">
                {MODELS.map(m => (
                  <button key={m.value} onClick={() => setModel(m.value)}
                    className={`text-xs px-3 py-1 rounded-full border transition ${model === m.value ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <p className="text-3xl">💬</p>
                  <p className="text-gray-400 text-sm">ใช้ <span className="text-blue-400">{selectedModelLabel}</span></p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_MSGS.map(s => (
                      <button key={s} onClick={() => sendChat(s)}
                        className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-full hover:border-blue-500 hover:text-blue-300 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm'} p-3 text-sm leading-relaxed`}>
                    {m.role === 'assistant' && (
                      <p className="text-xs text-gray-500 mb-1">Jeff {m.model && m.model !== 'auto (Jeff)' ? `· ${m.model}` : ''}</p>
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-400 text-sm p-3 rounded-2xl rounded-bl-sm">
                    <span className="animate-pulse">Jeff กำลังคิด...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/50">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder={`พิมพ์ข้อความ... (Enter ส่ง)`} disabled={chatLoading}
                  className="flex-1 bg-gray-800 text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 placeholder:text-gray-600" />
                <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition">
                  ส่ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HITL ── */}
        {tab === 'hitl' && (
          <div className="h-full overflow-y-auto p-4 max-w-2xl mx-auto">
            <p className="text-gray-500 text-sm mb-4">{pending.length > 0 ? `${pending.length} รายการรอการตอบกลับ` : '✓ ไม่มีรายการรอ'}</p>
            <div className="space-y-3">
              {hitlItems.map(item => (
                <div key={item.id} className={`rounded-xl border p-4 ${item.resolved_at ? 'border-gray-800 opacity-40' : 'border-yellow-700 bg-yellow-950/30'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">#{item.id} · {new Date(item.created_at).toLocaleString('th-TH')}</span>
                      <p className="text-white mt-1 text-sm">{item.message}</p>
                      {item.resolution && <p className="text-green-400 text-sm mt-2">✓ {item.resolution}</p>}
                    </div>
                    {!item.resolved_at && resolveId !== item.id && (
                      <button onClick={() => { setResolveId(item.id); setResolveMsg('') }}
                        className="shrink-0 bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition">
                        ตอบกลับ
                      </button>
                    )}
                  </div>
                  {resolveId === item.id && (
                    <div className="mt-3 space-y-2">
                      <textarea value={resolveMsg} onChange={e => setResolveMsg(e.target.value)} rows={3} autoFocus
                        placeholder="พิมพ์ข้อความที่จะส่งให้ผู้ใช้..."
                        className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={resolveHITL} disabled={!resolveMsg.trim()}
                          className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">ส่งคำตอบ</button>
                        <button onClick={() => setResolveId(null)}
                          className="text-gray-400 text-sm px-4 py-2 rounded-lg border border-gray-700">ยกเลิก</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KB ── */}
        {tab === 'kb' && (
          <div className="flex h-full">
            {/* Sidebar: KB list + sections */}
            <div className="w-72 border-r border-gray-800 flex flex-col shrink-0">
              {/* KB selector */}
              <div className="p-3 border-b border-gray-800">
                <p className="text-xs text-gray-500 mb-2">เลือก Knowledge Base</p>
                <div className="space-y-1">
                  {kbDocs.length === 0 && ['KB-06', 'COPREM'].map(id => (
                    <button key={id} onClick={() => setSelectedKb(id)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg ${selectedKb === id ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>
                      {id}
                    </button>
                  ))}
                  {kbDocs.map(doc => (
                    <button key={doc.id} onClick={() => { setSelectedKb(doc.id); setSelectedSection('') }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedKb === doc.id ? 'bg-blue-900 text-blue-200' : 'text-gray-400 hover:bg-gray-800'}`}>
                      <p className="text-sm font-medium">{doc.id}</p>
                      <p className="text-xs text-gray-500 truncate">{doc.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Sections */}
              <div className="flex-1 overflow-y-auto">
                {kbLoading && <p className="text-gray-600 text-xs p-3 animate-pulse">กำลังโหลด...</p>}
                {kbSections.map(s => (
                  <button key={s.title} onClick={() => setSelectedSection(s.title)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800 transition ${selectedSection === s.title ? 'bg-gray-800 border-l-2 border-l-blue-500 pl-2.5' : ''}`}>
                    <p className="text-sm text-gray-200 font-medium">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.preview}</p>
                    <p className="text-xs text-gray-700 mt-0.5">{s.lines} บรรทัด</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedSection ? (
                <>
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
                    <div>
                      <span className="text-xs text-gray-500">{selectedKb}</span>
                      <h2 className="text-white font-semibold">{selectedSection}</h2>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(sectionContent)}
                      className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition">
                      Copy
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {sectionContent === 'loading...'
                      ? <p className="text-gray-500 animate-pulse">กำลังโหลด...</p>
                      : <div className="space-y-0.5">{renderMd(sectionContent)}</div>
                    }
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-600">
                  <div className="text-center">
                    <p className="text-3xl mb-3">📚</p>
                    <p className="text-sm">← เลือกหมวดหมู่เพื่ออ่านเนื้อหา</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DOCS ── */}
        {tab === 'docs' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">คู่มือการใช้งาน COPREM OS</h1>
                <p className="text-gray-400 text-sm">Jeff — INTJ AI Executive Partner | v8.3</p>
              </div>

              {[
                {
                  title: '💬 คุยกับ Jeff',
                  items: [
                    ['พิมพ์ข้อความ แล้วกด Enter หรือปุ่ม "ส่ง"', ''],
                    ['เลือกโมเดล AI ที่ต้องการด้านบน', ''],
                    ['Auto = Jeff เลือกโมเดลเองตามงาน (แนะนำ)', ''],
                    ['Gemini Flash = เร็ว ฟรี เหมาะงานทั่วไป', ''],
                    ['Groq = เร็วมาก ไม่มี daily limit', ''],
                    ['Ollama = ออฟไลน์ ไม่ส่งข้อมูลออกนอก', ''],
                  ]
                },
                {
                  title: '⚠️ รออนุมัติ (HITL)',
                  items: [
                    ['เมื่อ Jeff ตัดสินใจไม่ได้เอง จะหยุดรอ Prem', ''],
                    ['กด "ตอบกลับ" → พิมพ์คำตอบ → กด "ส่งคำตอบ"', ''],
                    ['ข้อความจะถูกส่งไปยัง Telegram ของผู้ใช้ทันที', ''],
                    ['สั่งผ่าน Telegram: /resolve <id> <ข้อความ>', ''],
                  ]
                },
                {
                  title: '📚 คลังความรู้',
                  items: [
                    ['KB-06 = FutureSkill 584 คอร์ส แบ่ง 14 หมวด', ''],
                    ['COPREM = Framework และกฎระบบ', ''],
                    ['คลิกหมวดหมู่ซ้าย → อ่านเนื้อหาขวา', ''],
                    ['กด Copy เพื่อคัดลอกเนื้อหา', ''],
                  ]
                },
                {
                  title: '🤖 Workflow ที่ทำงานอยู่',
                  items: [
                    ['WF01 — รับข้อความ Telegram → Jeff ตอบกลับ', ''],
                    ['WF L1-C — เลือก AI โมเดลตาม Tier/งาน', ''],
                    ['WF L1.5 — จดจำบทสนทนา (session memory)', ''],
                    ['WF-HITL-Resolver — รับคำสั่ง /resolve จาก Admin', ''],
                  ]
                },
                {
                  title: '⚙️ ระบบ & บริการ',
                  items: [
                    ['n8n UI → localhost:5678 → จัดการ Workflow', ''],
                    ['LiteLLM → localhost:4000 → จัดการ AI keys', ''],
                    ['Dify → localhost → จัดการ Knowledge Base', ''],
                    ['Dashboard refresh ทุก 30 วินาทีอัตโนมัติ', ''],
                  ]
                },
                {
                  title: '🚨 Tier ของ AI (Jeff เลือกเอง)',
                  items: [
                    ['Tier 0 = Gemini Flash (Groq primary + Gemini 6 keys)', ''],
                    ['Tier 1 = Gemini Flash-Lite (ประหยัดเมื่อ cost >$1/วัน)', ''],
                    ['Tier 2 = Groq Llama 3.3 70B (เมื่อ Gemini throttle)', ''],
                    ['Tier 3 = Ollama local (เมื่อ cloud ทั้งหมดล่ม)', ''],
                  ]
                },
              ].map(section => (
                <div key={section.title} className="bg-gray-900 rounded-xl p-5">
                  <h2 className="font-semibold text-white mb-3">{section.title}</h2>
                  <ul className="space-y-2">
                    {section.items.map(([text], i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-gray-600 shrink-0">→</span>
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
          <div className="h-full overflow-y-auto p-5 max-w-2xl mx-auto space-y-4">
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">บริการ</h2>
                <button onClick={fetchAll} className="text-sm text-gray-400 hover:text-white">↻ Refresh</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'LiteLLM', ok: status?.litellm, url: 'http://localhost:4000/ui' },
                  { label: 'Ollama', ok: status?.ollama, url: 'http://localhost:11434' },
                  { label: 'n8n', ok: status?.n8n, url: 'http://localhost:5678' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-800">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-gray-300 hover:text-white hover:underline">{s.label} ↗</a>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.ok == null ? 'bg-gray-800 text-gray-400' : s.ok ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {s.ok == null ? '...' : s.ok ? 'ปกติ' : 'ล้มเหลว'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-semibold mb-4">ความเร็วแต่ละชั้น</h2>
              {latency.length === 0
                ? <p className="text-gray-600 text-sm">รอ traffic จาก WF01...</p>
                : <table className="w-full text-sm">
                    <thead><tr className="text-gray-500 text-xs border-b border-gray-800">
                      <th className="text-left pb-2">Layer</th><th className="text-right pb-2">เฉลี่ย</th><th className="text-right pb-2">สูงสุด</th><th className="text-right pb-2">ครั้ง</th>
                    </tr></thead>
                    <tbody>{latency.map(r => (
                      <tr key={r.event_type} className="border-b border-gray-800/50">
                        <td className="py-2 text-blue-300 text-xs">{r.event_type}</td>
                        <td className="text-right text-gray-300">{r.avg_ms}ms</td>
                        <td className="text-right text-yellow-400">{r.max_ms}ms</td>
                        <td className="text-right text-gray-500">{r.requests}</td>
                      </tr>
                    ))}</tbody>
                  </table>
              }
            </div>

            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-semibold mb-3">เปิดระบบ</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['⚙ n8n Workflows', 'http://localhost:5678/workflows'],
                  ['📊 LiteLLM UI', 'http://localhost:4000/ui'],
                  ['📚 Dify Datasets', 'http://localhost/datasets'],
                  ['🤖 Dify Apps', 'http://localhost/apps'],
                ].map(([l, u]) => (
                  <a key={l} href={u} target="_blank" rel="noreferrer"
                    className="text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-700 transition">
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
