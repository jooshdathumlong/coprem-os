'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type EmbeddingRow = { id: number; content: string; pillar: string; kb_id: string; created_at: string }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string }

const PILLARS = ['', 'JOB', 'PERSONAL', 'SKILL', 'COURSE', 'CREATIVE']
const LINKS = [
  { label: 'n8n UI', url: 'http://localhost:5678' },
  { label: 'Dify', url: 'http://localhost' },
  { label: 'LiteLLM', url: 'http://localhost:4000' },
]

export default function Dashboard() {
  const [chill, setChill] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hitlItems, setHITLItems] = useState<HITLItem[]>([])
  const [latency, setLatency] = useState<LatencyRow[]>([])
  const [embeddings, setEmbeddings] = useState<EmbeddingRow[]>([])
  const [embPillar, setEmbPillar] = useState('')
  const [status, setStatus] = useState<Status | null>(null)
  const [selectedEmb, setSelectedEmb] = useState<EmbeddingRow | null>(null)
  const [editContent, setEditContent] = useState('')
  const [resolveId, setResolveId] = useState<number | null>(null)
  const [resolveMsg, setResolveMsg] = useState('')
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

  const fetchEmbeddings = useCallback(async () => {
    try {
      const res = await fetch(`/api/embeddings?pillar=${embPillar}`)
      const data = await res.json()
      setEmbeddings(Array.isArray(data) ? data : [])
    } catch { setEmbeddings([]) }
  }, [embPillar])

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t) }, [fetchAll])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { fetchEmbeddings() }, [fetchEmbeddings])

  async function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      })
      const data = await res.json()
      setChatMessages(m => [...m, { role: 'assistant', text: data.reply || data.error || '(ไม่มีการตอบกลับ)' }])
    } catch (e) { setChatMessages(m => [...m, { role: 'assistant', text: `Error: ${e}` }]) }
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

  const dot = (ok: boolean) => (
    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${ok ? 'bg-green-400' : 'bg-red-500'}`} />
  )

  const pending = hitlItems.filter(i => !i.resolved_at)

  return (
    <div className="max-w-7xl mx-auto p-4 text-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-white">COPREM OS</h1>
          <p className="text-xs text-gray-500">Jeff — INTJ Executive Partner</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick links */}
          {LINKS.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">
              {l.label} ↗
            </a>
          ))}
          {/* Status dots */}
          {status && (
            <div className="text-xs text-gray-400 flex gap-3 pl-2 border-l border-gray-800">
              <span>{dot(status.litellm)}LiteLLM</span>
              <span>{dot(status.ollama)}Ollama</span>
              <span>{dot(status.n8n)}n8n</span>
            </div>
          )}
          <button onClick={() => setChill(!chill)}
            className={`text-xs px-3 py-1 rounded border transition ${chill ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400'}`}>
            {chill ? '☀ Chill ON' : '◉ Chill OFF'}
          </button>
        </div>
      </div>

      {/* ── HITL Alert Banner ── */}
      {pending.length > 0 && (
        <div className="mb-4 bg-yellow-900 border border-yellow-600 rounded p-3 flex items-center justify-between">
          <span className="text-yellow-300 text-xs">⚠ {pending.length} รายการรอการอนุมัติ (HITL)</span>
          <button onClick={() => document.getElementById('hitl-panel')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded">ดู →</button>
        </div>
      )}

      <div className={`grid gap-4 ${chill ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>

        {/* ── 1. Chat Panel ── */}
        <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-[500px]">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Chat — Jeff</h2>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
            {chatMessages.length === 0 && (
              <p className="text-xs text-gray-600 italic">พิมพ์ข้อความแล้วกด Enter หรือ Send</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`text-xs p-2 rounded-lg leading-relaxed ${m.role === 'user'
                ? 'bg-blue-950 text-blue-200 ml-6'
                : 'bg-gray-800 text-gray-200 mr-6'}`}>
                <span className="font-bold text-gray-500 mr-1">{m.role === 'user' ? 'You' : 'Jeff'}:</span>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            ))}
            {chatLoading && (
              <div className="text-xs text-gray-500 animate-pulse bg-gray-800 p-2 rounded-lg mr-6">
                Jeff กำลังคิด...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="ถามอะไรก็ได้..." disabled={chatLoading}
              className="flex-1 bg-gray-800 text-xs text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 disabled:opacity-50" />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-40 transition">
              Send
            </button>
          </div>
        </div>

        {/* ── 2. Approval Desk ── */}
        <div id="hitl-panel" className="bg-gray-900 rounded-lg p-4 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Approval Desk</h2>
            {pending.length > 0 && <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">{pending.length}</span>}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {hitlItems.length === 0 && <p className="text-xs text-gray-600 italic">ไม่มีรายการรอ</p>}
            {hitlItems.map(item => (
              <div key={item.id}
                className={`text-xs p-3 rounded-lg border ${item.resolved_at ? 'border-gray-800 opacity-40' : 'border-yellow-700 bg-yellow-950'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-500">#{item.id} · chat:{item.chat_id} · {new Date(item.created_at).toLocaleTimeString()}</span>
                    <p className="text-white mt-1 break-words">{item.message}</p>
                    {item.resolution && <p className="text-green-400 mt-1">✓ {item.resolution}</p>}
                  </div>
                  {!item.resolved_at && (
                    <button onClick={() => { setResolveId(item.id); setResolveMsg('') }}
                      className="shrink-0 bg-green-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Resolve input */}
          {resolveId && (
            <div className="mt-3 border-t border-gray-800 pt-3 space-y-2">
              <p className="text-xs text-gray-400">ข้อความตอบกลับ HITL #{resolveId}</p>
              <textarea value={resolveMsg} onChange={e => setResolveMsg(e.target.value)} rows={2}
                className="w-full bg-gray-800 text-xs text-white px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-green-500 resize-none"
                placeholder="พิมพ์คำตอบ..." />
              <div className="flex gap-2">
                <button onClick={resolveHITL} disabled={!resolveMsg.trim()}
                  className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded disabled:opacity-40">
                  ส่ง
                </button>
                <button onClick={() => setResolveId(null)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Knowledge Vault ── */}
        {!chill && (
          <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Knowledge Vault</h2>
              <div className="flex gap-2 items-center">
                <button onClick={fetchEmbeddings} className="text-xs text-gray-500 hover:text-white">↻</button>
                <select value={embPillar} onChange={e => setEmbPillar(e.target.value)}
                  className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                  {PILLARS.map(p => <option key={p} value={p}>{p || 'All'}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {embeddings.length === 0 && <p className="text-xs text-gray-600 italic">ไม่มีข้อมูล</p>}
              {embeddings.map(e => (
                <button key={e.id} onClick={() => { setSelectedEmb(e); setEditContent(e.content) }}
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-gray-800 hover:bg-gray-750 border border-transparent hover:border-gray-600 transition">
                  <div className="flex gap-2 text-gray-500 mb-1">
                    <span className="text-purple-400 font-medium">{e.pillar}</span>
                    <span>{e.kb_id}</span>
                  </div>
                  <p className="text-gray-300 line-clamp-2 leading-relaxed">{e.content}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. System Status ── */}
        {!chill && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">System Status</h2>
            <div className="space-y-2.5">
              {[
                { label: 'LiteLLM', ok: status?.litellm, link: 'http://localhost:4000' },
                { label: 'Ollama', ok: status?.ollama, link: 'http://localhost:11434' },
                { label: 'n8n', ok: status?.n8n, link: 'http://localhost:5678' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <a href={s.link} target="_blank" rel="noreferrer"
                    className="text-xs text-gray-400 hover:text-white underline-offset-2 hover:underline">
                    {s.label} ↗
                  </a>
                  <span className={`text-xs font-medium ${s.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {s.ok == null ? '...' : s.ok ? 'UP' : 'DOWN'}
                  </span>
                </div>
              ))}
              {status && <p className="text-xs text-gray-700 pt-1">{new Date(status.timestamp).toLocaleString()}</p>}
              <button onClick={fetchAll} className="mt-2 text-xs text-gray-600 hover:text-gray-300 transition">↻ Refresh</button>
            </div>
          </div>
        )}

        {/* ── 5. Latency Panel ── */}
        {!chill && (
          <div className="bg-gray-900 rounded-lg p-4 md:col-span-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Latency by Layer</h2>
            <table className="text-xs w-full">
              <thead><tr className="text-gray-600 border-b border-gray-800">
                <th className="text-left pb-2">event_type</th>
                <th className="text-right pb-2">avg ms</th>
                <th className="text-right pb-2">max ms</th>
                <th className="text-right pb-2">requests</th>
                <th className="text-right pb-2">slow</th>
              </tr></thead>
              <tbody>
                {latency.map(r => (
                  <tr key={r.event_type} className="border-b border-gray-800/50">
                    <td className="py-1.5 text-blue-300">{r.event_type}</td>
                    <td className="text-right text-gray-300">{r.avg_ms ?? '–'}</td>
                    <td className="text-right text-yellow-400">{r.max_ms ?? '–'}</td>
                    <td className="text-right text-gray-400">{r.requests}</td>
                    <td className="text-right text-red-400">{r.slow_count || '–'}</td>
                  </tr>
                ))}
                {latency.length === 0 && (
                  <tr><td colSpan={5} className="text-gray-600 py-3 text-center italic">ยังไม่มีข้อมูล — รอให้มี traffic ก่อน</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── KB Detail Modal ── */}
      {selectedEmb && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setSelectedEmb(null)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <span className="text-purple-400 font-medium text-sm">{selectedEmb.pillar}</span>
                <span className="text-gray-500 text-xs ml-2">{selectedEmb.kb_id}</span>
                <span className="text-gray-600 text-xs ml-2">ID:{selectedEmb.id}</span>
              </div>
              <button onClick={() => setSelectedEmb(null)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12}
                className="w-full bg-gray-800 text-gray-200 text-xs p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 resize-none font-mono leading-relaxed" />
            </div>
            <div className="p-4 border-t border-gray-800 flex gap-2 items-center">
              <button onClick={() => { navigator.clipboard.writeText(editContent) }}
                className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition">
                Copy
              </button>
              <span className="text-xs text-gray-600">{editContent.length} chars</span>
              <span className="flex-1" />
              <button onClick={() => setSelectedEmb(null)}
                className="text-xs text-gray-400 px-3 py-1 rounded border border-gray-700">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
