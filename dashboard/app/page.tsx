'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string; model?: string }
type Tab = 'chat' | 'hitl' | 'kb' | 'browser' | 'docs' | 'system'
type KBSection = { title: string; preview: string; lines: number }
type KBDoc = { id: string; label: string; pillar: string; sections: string[] }

const MODELS = [
  { value: 'auto',                  label: '🤖 Auto',              group: 'Auto' },
  { value: 'gemini-2.0-flash',      label: '✦ Gemini Flash',       group: 'Cloud' },
  { value: 'gemini-2.0-flash-lite', label: '✦ Gemini Lite',        group: 'Cloud' },
  { value: 'groq/llama-3.3-70b',   label: '⚡ Groq 70B',           group: 'Cloud' },
  { value: 'ollama/llama3.1',       label: '🖥 Llama 3.1',         group: 'Local' },
  { value: 'ollama/qwen',           label: '🖥 Qwen 2.5',          group: 'Local' },
]

const BOOKMARKS = [
  { label: 'n8n', url: 'http://localhost:5678/workflows' },
  { label: 'LiteLLM', url: 'http://localhost:4000/ui' },
  { label: 'Dify', url: 'http://localhost/datasets' },
  { label: 'Google', url: 'https://www.google.com' },
  { label: 'GitHub', url: 'https://github.com' },
]

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat',    label: 'คุยกับ Jeff', icon: '💬' },
  { id: 'hitl',   label: 'รออนุมัติ',   icon: '⚠️' },
  { id: 'kb',     label: 'คลังความรู้',  icon: '📚' },
  { id: 'browser',label: 'เว็บเบราว์เซอร์', icon: '🌐' },
  { id: 'docs',   label: 'คู่มือ',       icon: '📖' },
  { id: 'system', label: 'ระบบ',        icon: '⚙️' },
]

const QUICK_MSGS = ['วันนี้ต้องทำอะไรบ้าง?', 'แนะนำคอร์ส Python', 'สรุปสถานะระบบ', 'วิเคราะห์ตลาดวันนี้']

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
  const [kbDocs, setKbDocs] = useState<KBDoc[]>([])
  const [selectedKb, setSelectedKb] = useState('KB-06')
  const [kbSections, setKbSections] = useState<KBSection[]>([])
  const [selectedSection, setSelectedSection] = useState('')
  const [sectionContent, setSectionContent] = useState('')
  const [kbLoading, setKbLoading] = useState(false)
  const [browserUrl, setBrowserUrl] = useState('http://localhost:5678')
  const [browserInput, setBrowserInput] = useState('http://localhost:5678')
  const [browserKey, setBrowserKey] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  const fetchKB = useCallback(async () => {
    try {
      const res = await fetch(`/api/kb-docs?list=1`)
      const data = await res.json()
      setKbDocs(Array.isArray(data) ? data : [])
    } catch { setKbDocs([]) }
  }, [])

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t) }, [fetchAll])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { if (tab === 'kb') { fetchKB() } }, [tab, fetchKB])

  useEffect(() => {
    if (!selectedKb || tab !== 'kb') return
    setKbLoading(true); setKbSections([]); setSelectedSection(''); setSectionContent('')
    fetch(`/api/kb-docs?kb=${selectedKb}`).then(r => r.json())
      .then(data => { setKbSections(Array.isArray(data) ? data : []); setKbLoading(false) })
      .catch(() => setKbLoading(false))
  }, [selectedKb, tab])

  useEffect(() => {
    if (!selectedSection) return
    setSectionContent('loading...')
    fetch(`/api/kb-docs?kb=${selectedKb}&section=${encodeURIComponent(selectedSection)}`)
      .then(r => r.json()).then(d => setSectionContent(d.content || d.error || ''))
      .catch(() => setSectionContent('โหลดไม่ได้'))
  }, [selectedSection, selectedKb])

  async function sendChat(msgOverride?: string) {
    const msg = (msgOverride || chatInput).trim()
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
      setChatMessages(m => [...m, { role: 'assistant', text: data.reply || data.error || '(ไม่มีการตอบกลับ)', model: data.model }])
    } catch (e) { setChatMessages(m => [...m, { role: 'assistant', text: `⚠️ Error: ${e}` }]) }
    setChatLoading(false)
  }

  async function resolveHITL() {
    if (!resolveId || !resolveMsg.trim()) return
    await fetch('/api/hitl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resolveId, resolution: resolveMsg }) })
    setResolveId(null); setResolveMsg(''); fetchAll()
  }

  function navigate(url?: string) {
    const target = url || browserInput
    const full = target.startsWith('http') ? target : `https://${target}`
    setBrowserUrl(full); setBrowserInput(full); setBrowserKey(k => k + 1)
  }

  function renderMd(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-blue-300 mt-4 mb-2">{line.slice(2)}</h1>
      if (line.startsWith('> ')) return <p key={i} className="text-gray-400 italic border-l-2 border-gray-600 pl-3 my-1 text-sm">{line.slice(2)}</p>
      if (line.startsWith('| ')) return <p key={i} className="text-xs text-gray-300 font-mono leading-relaxed">{line}</p>
      if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="text-sm text-gray-300 ml-3">• {line.slice(2)}</p>
      if (!line.trim()) return <div key={i} className="h-2" />
      return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>
    })
  }

  const pending = hitlItems.filter(i => !i.resolved_at)
  const allOk = status && status.litellm && status.ollama && status.n8n

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0 bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wide">COPREM</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${allOk ? 'bg-green-900 text-green-300' : status ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-500'}`}>
            {allOk ? '● ปกติ' : status ? '● มีปัญหา' : '...'}
          </span>
          {pending.length > 0 && (
            <button onClick={() => setTab('hitl')} className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full animate-pulse">
              ⚠ {pending.length} รอ
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {[['n8n ↗','http://localhost:5678'],['LiteLLM ↗','http://localhost:4000/ui'],['Dify ↗','http://localhost']].map(([l,u])=>(
            <a key={l} href={u} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded border border-gray-800 hover:border-gray-600 transition">{l}</a>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 shrink-0 bg-gray-900 overflow-x-auto">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition ${tab === n.id ? 'border-blue-500 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {n.icon} {n.label}
            {n.id === 'hitl' && pending.length > 0 && <span className="bg-yellow-600 text-white text-xs px-1.5 rounded-full">{pending.length}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900/40 shrink-0 overflow-x-auto">
              <span className="text-xs text-gray-500 shrink-0">โมเดล:</span>
              {MODELS.map(m => (
                <button key={m.value} onClick={() => setModel(m.value)}
                  className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition ${model === m.value ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-3xl">💬</p>
                  <p className="text-gray-500 text-sm">กำลังใช้ <span className="text-blue-400">{MODELS.find(m=>m.value===model)?.label}</span></p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_MSGS.map(s => (
                      <button key={s} onClick={() => sendChat(s)} className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-full hover:border-blue-500 hover:text-blue-300 transition">{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[78%] p-3 text-sm leading-relaxed rounded-2xl ${m.role==='user'?'bg-blue-600 text-white rounded-br-sm':'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                    {m.role==='assistant' && <p className="text-xs text-gray-500 mb-1">Jeff {m.model && m.model!=='auto (Jeff)' ? `· ${m.model}`:''}</p>}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && <div className="flex justify-start"><div className="bg-gray-800 text-gray-400 text-sm p-3 rounded-2xl rounded-bl-sm animate-pulse">Jeff กำลังคิด...</div></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-800 bg-gray-900/40">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat()} disabled={chatLoading}
                  placeholder="พิมพ์ข้อความ... (Enter ส่ง)"
                  className="flex-1 bg-gray-800 text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 placeholder:text-gray-600" />
                <button onClick={() => sendChat()} disabled={chatLoading||!chatInput.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">ส่ง</button>
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
                <div key={item.id} className={`rounded-xl border p-4 ${item.resolved_at?'border-gray-800 opacity-40':'border-yellow-700 bg-yellow-950/30'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">#{item.id} · {new Date(item.created_at).toLocaleString('th-TH')}</span>
                      <p className="text-white mt-1 text-sm">{item.message}</p>
                      {item.resolution && <p className="text-green-400 text-sm mt-2">✓ {item.resolution}</p>}
                    </div>
                    {!item.resolved_at && resolveId !== item.id && (
                      <button onClick={() => { setResolveId(item.id); setResolveMsg('') }} className="shrink-0 bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg transition">ตอบกลับ</button>
                    )}
                  </div>
                  {resolveId === item.id && (
                    <div className="mt-3 space-y-2">
                      <textarea value={resolveMsg} onChange={e=>setResolveMsg(e.target.value)} rows={3} autoFocus placeholder="พิมพ์คำตอบ..."
                        className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={resolveHITL} disabled={!resolveMsg.trim()} className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">ส่งคำตอบ</button>
                        <button onClick={() => setResolveId(null)} className="text-gray-400 text-sm px-4 py-2 rounded-lg border border-gray-700">ยกเลิก</button>
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
            <div className="w-72 border-r border-gray-800 flex flex-col shrink-0">
              <div className="p-3 border-b border-gray-800">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Knowledge Base</p>
                <div className="space-y-1">
                  {['KB-06','COPREM'].map(id => (
                    <button key={id} onClick={() => { setSelectedKb(id); setSelectedSection('') }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedKb===id?'bg-blue-900 text-blue-200 font-medium':'text-gray-400 hover:bg-gray-800'}`}>
                      {id === 'KB-06' ? '📚 KB-06 FutureSkill (584 คอร์ส)' : '⚙️ COPREM Frameworks'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-2 border-b border-gray-800">
                <p className="text-xs text-gray-600 px-1 mb-1">หมวดหมู่</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {kbLoading && <p className="text-gray-600 text-xs p-3 animate-pulse">กำลังโหลด...</p>}
                {kbSections.map(s => (
                  <button key={s.title} onClick={() => setSelectedSection(s.title)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800 transition ${selectedSection===s.title?'bg-gray-800 border-l-2 border-l-blue-500 pl-2.5':''}`}>
                    <p className="text-sm text-gray-200">{s.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{s.lines} บรรทัด</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedSection ? (
                <>
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
                    <div>
                      <span className="text-xs text-gray-500">{selectedKb} /</span>
                      <span className="text-white font-medium ml-1">{selectedSection}</span>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(sectionContent)} className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition">📋 Copy</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {sectionContent === 'loading...' ? <p className="text-gray-500 animate-pulse">กำลังโหลด...</p> : <div className="space-y-0.5">{renderMd(sectionContent)}</div>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-600">
                  <div className="text-center"><p className="text-3xl mb-3">📚</p><p className="text-sm">← เลือกหมวดหมู่เพื่ออ่านเนื้อหา</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BROWSER ── */}
        {tab === 'browser' && (
          <div className="flex flex-col h-full">
            {/* URL bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900 shrink-0">
              <button onClick={() => iframeRef.current && (iframeRef.current.src = iframeRef.current.src)} className="text-gray-400 hover:text-white text-lg px-1">↻</button>
              <div className="flex gap-1.5 shrink-0">
                {BOOKMARKS.map(b => (
                  <button key={b.label} onClick={() => navigate(b.url)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-800 hover:border-gray-600 transition whitespace-nowrap">{b.label}</button>
                ))}
              </div>
              <div className="flex gap-2 flex-1">
                <input value={browserInput} onChange={e => setBrowserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && navigate()}
                  placeholder="พิมพ์ URL... (Enter ไป)"
                  className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 min-w-0" />
                <button onClick={() => navigate()} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition whitespace-nowrap">ไป</button>
              </div>
            </div>
            {/* Iframe */}
            <div className="flex-1 relative bg-white">
              <iframe
                key={browserKey}
                ref={iframeRef}
                src={browserUrl}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
                title="browser"
              />
              {/* Overlay message for blocked sites */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-gray-400 text-xs px-3 py-1.5 rounded-lg pointer-events-none">
                บางเว็บอาจไม่แสดงเนื่องจาก X-Frame-Options
              </div>
            </div>
          </div>
        )}

        {/* ── DOCS ── */}
        {tab === 'docs' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">คู่มือการใช้งาน COPREM OS</h1>
                <p className="text-gray-400 text-sm">Jeff — INTJ AI Executive Partner | v8.3 | 2026-06-01</p>
              </div>
              {[
                { title: '💬 คุยกับ Jeff', items: ['พิมพ์ข้อความ กด Enter หรือปุ่ม ส่ง', 'เลือกโมเดล AI ด้านบน — Auto แนะนำสำหรับงานทั่วไป', 'Gemini Flash: เร็ว ฟรี | Groq: ไม่มี daily limit | Ollama: ออฟไลน์', 'กดข้อความสำเร็จรูปเพื่อเริ่มบทสนทนาได้เลย'] },
                { title: '⚠️ รออนุมัติ (HITL)', items: ['Jeff หยุดรอ Prem เมื่อคำถามเกินขอบเขต', 'กด ตอบกลับ → พิมพ์คำตอบ → ส่งไปยัง Telegram ผู้ใช้', 'สั่งผ่าน Telegram: /resolve <id> <ข้อความ>', 'Badge สีเหลืองแสดงจำนวนที่รอ'] },
                { title: '📚 คลังความรู้', items: ['KB-06: FutureSkill 584 คอร์ส แบ่ง 14 หมวด', 'COPREM: Framework และกฎระบบ COPREM OS', 'คลิกหมวดหมู่ซ้าย → อ่านเนื้อหาเต็มขวา', 'กด Copy เพื่อคัดลอก'] },
                { title: '🌐 เว็บเบราว์เซอร์', items: ['พิมพ์ URL แล้ว Enter หรือกดปุ่มไป', 'Bookmarks: n8n, LiteLLM, Dify, Google, GitHub', 'บางเว็บบล็อก iframe (X-Frame-Options) — เปิด tab ใหม่แทน', 'ใช้สำหรับดูข้อมูล ตรวจสอบ Workflow ได้เลย'] },
                { title: '🤖 Tier ของ AI (Jeff เลือกอัตโนมัติ)', items: ['Tier 0: Gemini Flash (Groq primary + Gemini 6 keys)', 'Tier 1: Gemini Lite (cost >$1/วัน)', 'Tier 2: Groq 70B (เมื่อ Gemini throttle)', 'Tier 3: Ollama local (เมื่อ cloud ล่มทั้งหมด)'] },
                { title: '🚀 เปิดใช้งาน COPREM OS', items: ['ดับเบิลคลิก "COPREM OS.app" บน Desktop', 'หรือรัน: bash scripts/start_coprem.sh', 'หยุด Dashboard: bash scripts/stop_coprem.sh', 'Docker ยังทำงานอยู่เมื่อปิด Dashboard (ต้องการแยกกัน)'] },
              ].map(s => (
                <div key={s.title} className="bg-gray-900 rounded-xl p-4">
                  <h2 className="font-semibold text-white mb-3">{s.title}</h2>
                  <ul className="space-y-1.5">
                    {s.items.map((text, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-gray-600 shrink-0 mt-0.5">→</span><span>{text}</span></li>
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
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.ok==null?'bg-gray-800 text-gray-400':s.ok?'bg-green-900 text-green-300':'bg-red-900 text-red-300'}`}>
                      {s.ok==null?'...':s.ok?'ปกติ':'ล้มเหลว'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-semibold mb-4">ความเร็วแต่ละชั้น</h2>
              {latency.length === 0 ? <p className="text-gray-600 text-sm">รอ traffic จาก WF01...</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-500 text-xs border-b border-gray-800"><th className="text-left pb-2">Layer</th><th className="text-right pb-2">เฉลี่ย</th><th className="text-right pb-2">สูงสุด</th><th className="text-right pb-2">ครั้ง</th></tr></thead>
                  <tbody>{latency.map(r=>(
                    <tr key={r.event_type} className="border-b border-gray-800/50">
                      <td className="py-1.5 text-blue-300 text-xs">{r.event_type}</td>
                      <td className="text-right text-gray-300">{r.avg_ms}ms</td>
                      <td className="text-right text-yellow-400">{r.max_ms}ms</td>
                      <td className="text-right text-gray-500">{r.requests}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-semibold mb-3">เปิดระบบ</h2>
              <div className="grid grid-cols-2 gap-2">
                {[['⚙ n8n Workflows','http://localhost:5678/workflows'],['📊 LiteLLM UI','http://localhost:4000/ui'],['📚 Dify Datasets','http://localhost/datasets'],['🤖 Dify Apps','http://localhost/apps']].map(([l,u])=>(
                  <a key={l} href={u} target="_blank" rel="noreferrer" className="text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-700 transition">{l}</a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
