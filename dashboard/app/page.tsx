'use client'
import { useState, useEffect, useRef } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type EmbeddingRow = { id: number; content: string; pillar: string; kb_id: string; created_at: string }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string }

const PILLARS = ['', 'JOB', 'PERSONAL', 'SKILL', 'COURSE', 'CREATIVE']

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
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { fetchEmbeddings() }, [embPillar])

  async function fetchAll() {
    const [s, h, l] = await Promise.allSettled([
      fetch('/api/status').then(r => r.json()),
      fetch('/api/hitl').then(r => r.json()),
      fetch('/api/latency').then(r => r.json()),
    ])
    if (s.status === 'fulfilled') setStatus(s.value)
    if (h.status === 'fulfilled') setHITLItems(h.value)
    if (l.status === 'fulfilled') setLatency(l.value)
  }

  async function fetchEmbeddings() {
    const res = await fetch(`/api/embeddings?pillar=${embPillar}`)
    setEmbeddings(await res.json())
  }

  async function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) })
      const data = await res.json()
      setChatMessages(m => [...m, { role: 'assistant', text: data.reply || data.error || '(empty)' }])
    } catch (e) {
      setChatMessages(m => [...m, { role: 'assistant', text: `Error: ${e}` }])
    }
    setChatLoading(false)
  }

  async function resolveHITL(id: number) {
    const resolution = prompt(`Resolution message for HITL #${id}:`)
    if (!resolution) return
    await fetch('/api/hitl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, resolution }) })
    fetchAll()
  }

  const dot = (ok: boolean) => (
    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${ok ? 'bg-green-400' : 'bg-red-500'}`} />
  )

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">COPREM OS</h1>
          <p className="text-xs text-gray-500">Jeff — INTJ Executive Partner</p>
        </div>
        <div className="flex items-center gap-4">
          {status && (
            <div className="text-xs text-gray-400 flex gap-3">
              <span>{dot(status.litellm)}LiteLLM</span>
              <span>{dot(status.ollama)}Ollama</span>
              <span>{dot(status.n8n)}n8n</span>
            </div>
          )}
          <button onClick={() => setChill(!chill)}
            className={`text-xs px-3 py-1 rounded border ${chill ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400'}`}>
            {chill ? 'Chill ON' : 'Chill OFF'}
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${chill ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>

        {/* 1. Chat Panel */}
        <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-[480px]">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Chat — Jeff</h2>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {chatMessages.map((m, i) => (
              <div key={i} className={`text-xs p-2 rounded ${m.role === 'user' ? 'bg-gray-800 text-blue-300' : 'bg-gray-800 text-green-300'}`}>
                <span className="text-gray-500">{m.role === 'user' ? 'You' : 'Jeff'}: </span>{m.text}
              </div>
            ))}
            {chatLoading && <div className="text-xs text-gray-500 animate-pulse">Jeff is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Message Jeff..." className="flex-1 bg-gray-800 text-xs text-white px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500" />
            <button onClick={sendChat} disabled={chatLoading}
              className="text-xs bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50">Send</button>
          </div>
        </div>

        {/* 2. Approval Desk */}
        <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-[480px]">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Approval Desk — HITL Queue</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {hitlItems.length === 0 && <p className="text-xs text-gray-600">No pending items</p>}
            {hitlItems.map(item => (
              <div key={item.id} className={`text-xs p-3 rounded border ${item.resolved_at ? 'border-gray-800 opacity-50' : 'border-yellow-700 bg-yellow-950'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-gray-400">#{item.id} · chat:{item.chat_id}</span>
                    <p className="text-white mt-1">{item.message}</p>
                    {item.resolution && <p className="text-green-400 mt-1">✓ {item.resolution}</p>}
                  </div>
                  {!item.resolved_at && (
                    <button onClick={() => resolveHITL(item.id)}
                      className="shrink-0 bg-green-700 text-white text-xs px-2 py-1 rounded">Resolve</button>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Knowledge Vault (hidden in chill) */}
        {!chill && (
          <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">Knowledge Vault</h2>
              <select value={embPillar} onChange={e => setEmbPillar(e.target.value)}
                className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                {PILLARS.map(p => <option key={p} value={p}>{p || 'All'}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {embeddings.map(e => (
                <div key={e.id} className="text-xs p-2 rounded bg-gray-800">
                  <div className="flex gap-2 text-gray-500 mb-1">
                    <span className="text-purple-400">{e.pillar}</span>
                    <span>{e.kb_id}</span>
                  </div>
                  <p className="text-gray-300 line-clamp-2">{e.content}</p>
                </div>
              ))}
              {embeddings.length === 0 && <p className="text-xs text-gray-600">No embeddings yet — run scripts/embed_kb.py</p>}
            </div>
          </div>
        )}

        {/* 4. System Status (hidden in chill) */}
        {!chill && (
          <div className="bg-gray-900 rounded-lg p-4 h-[240px]">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">System Status</h2>
            {status && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">LiteLLM</span><span className={status.litellm ? 'text-green-400' : 'text-red-400'}>{status.litellm ? 'UP' : 'DOWN'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ollama</span><span className={status.ollama ? 'text-green-400' : 'text-red-400'}>{status.ollama ? 'UP' : 'DOWN'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">n8n</span><span className={status.n8n ? 'text-green-400' : 'text-red-400'}>{status.n8n ? 'UP' : 'DOWN'}</span></div>
                <div className="text-gray-600 pt-2">Last check: {new Date(status.timestamp).toLocaleTimeString()}</div>
              </div>
            )}
          </div>
        )}

        {/* 5. Latency Panel (hidden in chill) */}
        {!chill && (
          <div className="bg-gray-900 rounded-lg p-4 h-[240px] md:col-span-2">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Latency by Layer</h2>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead><tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-1">event_type</th>
                  <th className="text-right py-1">avg_ms</th>
                  <th className="text-right py-1">max_ms</th>
                  <th className="text-right py-1">requests</th>
                  <th className="text-right py-1">slow</th>
                </tr></thead>
                <tbody>
                  {latency.map(r => (
                    <tr key={r.event_type} className="border-b border-gray-800">
                      <td className="py-1 text-blue-300">{r.event_type}</td>
                      <td className="text-right">{r.avg_ms ?? '-'}</td>
                      <td className="text-right text-yellow-400">{r.max_ms ?? '-'}</td>
                      <td className="text-right text-gray-400">{r.requests}</td>
                      <td className="text-right text-red-400">{r.slow_count}</td>
                    </tr>
                  ))}
                  {latency.length === 0 && <tr><td colSpan={5} className="text-gray-600 py-2">No data yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
