'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type EmbeddingRow = { id: number; content: string; pillar: string; kb_id: string; created_at: string }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string }
type Tab = 'chat' | 'hitl' | 'kb' | 'system'

const PILLARS = ['', 'JOB', 'PERSONAL', 'SKILL', 'CREATIVE']

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat',   label: 'คุยกับ Jeff', icon: '💬' },
  { id: 'hitl',   label: 'รออนุมัติ',   icon: '⚠️' },
  { id: 'kb',     label: 'คลังความรู้',  icon: '📚' },
  { id: 'system', label: 'ระบบ',        icon: '⚙️' },
]

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hitlItems, setHITLItems] = useState<HITLItem[]>([])
  const [latency, setLatency] = useState<LatencyRow[]>([])
  const [embeddings, setEmbeddings] = useState<EmbeddingRow[]>([])
  const [embPillar, setEmbPillar] = useState('')
  const [status, setStatus] = useState<Status | null>(null)
  const [selectedEmb, setSelectedEmb] = useState<EmbeddingRow | null>(null)
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

  const fetchKB = useCallback(async () => {
    try {
      const res = await fetch(`/api/embeddings?pillar=${embPillar}`)
      const data = await res.json()
      setEmbeddings(Array.isArray(data) ? data : [])
    } catch { setEmbeddings([]) }
  }, [embPillar])

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t) }, [fetchAll])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { if (tab === 'kb') fetchKB() }, [tab, fetchKB])

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
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

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">COPREM</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${allOk ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {allOk ? '● ระบบปกติ' : '● มีปัญหา'}
          </span>
          {pending.length > 0 && (
            <button onClick={() => setTab('hitl')}
              className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full animate-pulse">
              ⚠ {pending.length} รอ
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <a href="http://localhost:5678" target="_blank" rel="noreferrer"
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition">n8n ↗</a>
          <a href="http://localhost:4000" target="_blank" rel="noreferrer"
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition">LiteLLM ↗</a>
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="flex border-b border-gray-800 shrink-0">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === n.id
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            <span>{n.icon}</span>
            <span>{n.label}</span>
            {n.id === 'hitl' && pending.length > 0 && (
              <span className="bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* Chat */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <p className="text-4xl">💬</p>
                  <p className="text-gray-400">พิมพ์ข้อความด้านล่างเพื่อคุยกับ Jeff</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {['วันนี้ต้องทำอะไรบ้าง?', 'แนะนำคอร์สเรียน Python', 'วิเคราะห์ตลาดหุ้นวันนี้'].map(s => (
                      <button key={s} onClick={() => { setChatInput(s); }}
                        className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-full hover:border-blue-500 hover:text-blue-300 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] text-sm p-3 rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}>
                    {m.role === 'assistant' && <p className="text-xs text-gray-500 mb-1">Jeff</p>}
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
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-3 max-w-3xl mx-auto">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder="พิมพ์ข้อความ... (Enter ส่ง)" disabled={chatLoading}
                  className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 placeholder:text-gray-600" />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-medium text-sm transition">
                  ส่ง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HITL */}
        {tab === 'hitl' && (
          <div className="h-full overflow-y-auto p-4 max-w-2xl mx-auto">
            <p className="text-gray-500 text-sm mb-4">
              {pending.length > 0 ? `${pending.length} รายการรอการตอบกลับ` : 'ไม่มีรายการรอ ✓'}
            </p>
            <div className="space-y-3">
              {hitlItems.map(item => (
                <div key={item.id}
                  className={`rounded-xl border p-4 ${item.resolved_at ? 'border-gray-800 bg-gray-900/50 opacity-50' : 'border-yellow-700 bg-yellow-950/40'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs text-gray-500">#{item.id} · {new Date(item.created_at).toLocaleString('th-TH')}</span>
                      <p className="text-white mt-1">{item.message}</p>
                      {item.resolution && <p className="text-green-400 text-sm mt-2">✓ {item.resolution}</p>}
                    </div>
                    {!item.resolved_at && resolveId !== item.id && (
                      <button onClick={() => { setResolveId(item.id); setResolveMsg('') }}
                        className="shrink-0 bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
                        ตอบกลับ
                      </button>
                    )}
                  </div>
                  {resolveId === item.id && (
                    <div className="mt-3 space-y-2">
                      <textarea value={resolveMsg} onChange={e => setResolveMsg(e.target.value)}
                        rows={3} autoFocus placeholder="พิมพ์คำตอบที่จะส่งให้ผู้ใช้..."
                        className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={resolveHITL} disabled={!resolveMsg.trim()}
                          className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg font-medium transition">
                          ส่งคำตอบ
                        </button>
                        <button onClick={() => setResolveId(null)}
                          className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-gray-700 transition">
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KB */}
        {tab === 'kb' && (
          <div className="flex h-full">
            <div className="flex flex-col w-80 border-r border-gray-800 shrink-0">
              <div className="p-3 border-b border-gray-800 flex gap-2">
                <select value={embPillar} onChange={e => setEmbPillar(e.target.value)}
                  className="flex-1 bg-gray-800 text-sm text-gray-300 px-3 py-2 rounded-lg border border-gray-700">
                  {PILLARS.map(p => <option key={p} value={p}>{p || 'ทั้งหมด'}</option>)}
                </select>
                <button onClick={fetchKB} className="text-gray-400 hover:text-white px-2 text-lg transition">↻</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {embeddings.length === 0 && (
                  <p className="text-gray-600 text-sm p-4 text-center">ไม่มีข้อมูล</p>
                )}
                {embeddings.map(e => (
                  <button key={e.id} onClick={() => setSelectedEmb(e)}
                    className={`w-full text-left p-3 border-b border-gray-800/50 hover:bg-gray-800 transition ${selectedEmb?.id === e.id ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''}`}>
                    <div className="flex gap-2 mb-1">
                      <span className="text-xs text-purple-400 font-medium">{e.pillar}</span>
                      <span className="text-xs text-gray-500">{e.kb_id}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{e.content}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              {selectedEmb ? (
                <>
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-purple-400 font-medium">{selectedEmb.pillar}</span>
                      <span className="text-gray-500 text-sm ml-2">{selectedEmb.kb_id}</span>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(selectedEmb.content)}
                      className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-700 transition">
                      Copy
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedEmb.content}</p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                  ← เลือก entry เพื่อดูเนื้อหา
                </div>
              )}
            </div>
          </div>
        )}

        {/* System */}
        {tab === 'system' && (
          <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6">
            {/* Service status */}
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">บริการ</h2>
                <button onClick={fetchAll} className="text-sm text-gray-400 hover:text-white transition">↻ Refresh</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'LiteLLM', ok: status?.litellm, url: 'http://localhost:4000' },
                  { label: 'Ollama', ok: status?.ollama, url: 'http://localhost:11434' },
                  { label: 'n8n', ok: status?.n8n, url: 'http://localhost:5678' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-800">
                    <a href={s.url} target="_blank" rel="noreferrer"
                      className="text-sm text-gray-300 hover:text-white hover:underline">
                      {s.label} ↗
                    </a>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      s.ok == null ? 'bg-gray-800 text-gray-400' :
                      s.ok ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {s.ok == null ? '...' : s.ok ? 'ปกติ' : 'ล้มเหลว'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-4">ความเร็วแต่ละชั้น</h2>
              {latency.length === 0 ? (
                <p className="text-gray-600 text-sm">ยังไม่มีข้อมูล — รอ traffic จาก WF01</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left pb-2">Layer</th>
                    <th className="text-right pb-2">เฉลี่ย</th>
                    <th className="text-right pb-2">สูงสุด</th>
                    <th className="text-right pb-2">ครั้ง</th>
                  </tr></thead>
                  <tbody>
                    {latency.map(r => (
                      <tr key={r.event_type} className="border-b border-gray-800/50">
                        <td className="py-2 text-blue-300 text-xs">{r.event_type}</td>
                        <td className="text-right text-gray-300">{r.avg_ms}ms</td>
                        <td className="text-right text-yellow-400">{r.max_ms}ms</td>
                        <td className="text-right text-gray-500">{r.requests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-4">เปิดระบบภายนอก</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '⚙ n8n Workflows', url: 'http://localhost:5678/workflows' },
                  { label: '📊 LiteLLM Dashboard', url: 'http://localhost:4000/ui' },
                  { label: '📚 Dify Knowledge', url: 'http://localhost/datasets' },
                  { label: '🤖 Dify Studio', url: 'http://localhost/apps' },
                ].map(a => (
                  <a key={a.label} href={a.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm px-4 py-3 rounded-lg transition border border-gray-700 hover:border-gray-500">
                    {a.label}
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
