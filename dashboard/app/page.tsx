'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

type HITLItem = { id: number; chat_id: string; message: string; created_at: string; resolved_at: string | null; resolution: string | null }
type LatencyRow = { event_type: string; avg_ms: number; max_ms: number; requests: number; slow_count: number }
type Status = { litellm: boolean; ollama: boolean; n8n: boolean; timestamp: string }
type ChatMsg = { role: 'user' | 'assistant'; text: string; model?: string }
type Tab = 'chat' | 'hitl' | 'kb' | 'browser' | 'docs' | 'system'
type KBSection = { title: string; preview: string; lines: number }
type KBDoc = { id: string; label: string; pillar: string; sections: string[] }

const MODELS = [
  { value: 'auto',                  label: 'Auto',          group: 'Auto' },
  { value: 'gemini-2.0-flash',      label: 'Gemini Flash',  group: 'Cloud' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini Lite',   group: 'Cloud' },
  { value: 'groq/llama-3.3-70b',   label: 'Groq 70B',      group: 'Cloud' },
  { value: 'ollama/llama3.1',       label: 'Llama 3.1',     group: 'Local' },
  { value: 'ollama/qwen',           label: 'Qwen 2.5',      group: 'Local' },
]

const NAV: { id: Tab; label: string }[] = [
  { id: 'chat',    label: 'Chat' },
  { id: 'hitl',   label: 'Approvals' },
  { id: 'kb',     label: 'Knowledge' },
  { id: 'browser',label: 'Browser' },
  { id: 'docs',   label: 'Guide' },
  { id: 'system', label: 'System' },
]

const QUICK_MSGS = ["What's on the agenda today?", 'Recommend a Python course', 'Summarize system status', 'Analyze today\'s market']

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
  const [browserInput, setBrowserInput] = useState('http://localhost:5678')
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
      const res = await fetch(`/api/kb-docs?list=1`)
      const data = await res.json()
      setKbDocs(Array.isArray(data) ? data : [])
    } catch { setKbDocs([]) }
  }, [])

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t) }, [fetchAll])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { if (tab === 'kb') { fetchKB() } }, [tab, fetchKB])

  const loadKbSections = useCallback((kb: string) => {
    setKbLoading(true); setKbSections([]); setSelectedSection(''); setSectionContent('')
    fetch(`/api/kb-docs?kb=${kb}`).then(r => r.json())
      .then(data => { setKbSections(Array.isArray(data) ? data : []); setKbLoading(false) })
      .catch(() => setKbLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedKb || tab !== 'kb') return
    loadKbSections(selectedKb)
  }, [selectedKb, tab, loadKbSections])

  useEffect(() => {
    if (!selectedSection) return
    setSectionContent('loading...')
    fetch(`/api/kb-docs?kb=${selectedKb}&section=${encodeURIComponent(selectedSection)}`)
      .then(r => r.json()).then(d => setSectionContent(d.content || d.error || ''))
      .catch(() => setSectionContent('Failed to load'))
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
      let replyText = data.reply || data.error || '(No response)'
      if (replyText.includes('RateLimitError') || replyText.includes('RESOURCE_EXHAUSTED')) {
        replyText = 'Quota exceeded for this model — try another model (Groq 70B is available)'
      } else if (replyText.includes('litellm.') && replyText.length > 200) {
        replyText = replyText.split('\n')[0].replace(/litellm\.\w+:\s*/g, '')
      }
      setChatMessages(m => [...m, { role: 'assistant', text: replyText, model: data.model }])
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

  function renderMd(text: string) {
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
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                position: 'relative', padding: '0 16px', height: 52, fontSize: 14, fontWeight: tab === n.id ? 500 : 400,
                color: tab === n.id ? '#0066cc' : '#424245', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: tab === n.id ? '2px solid #0066cc' : '2px solid transparent', transition: 'color 0.15s', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {n.label}
                {n.id === 'hitl' && pending.length > 0 && (
                  <span style={{ background: '#ff3b30', color: 'white', fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, lineHeight: 1.6 }}>{pending.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Status + links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: allOk ? '#d1f5e0' : status ? '#ffe5e5' : '#f5f5f7', color: allOk ? '#1a7f3c' : status ? '#cc0000' : '#6e6e73' }}>
              {allOk ? '● Online' : status ? '● Issue' : '...'}
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
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Model selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderBottom: '1px solid #e8e8ed', background: '#f5f5f7', overflowX: 'auto', flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#6e6e73', flexShrink: 0, fontWeight: 500 }}>Model</span>
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
                    <p style={{ fontSize: 15, color: '#6e6e73' }}>Your AI Executive Partner · <span style={{ color: '#0066cc' }}>{MODELS.find(m => m.value === model)?.label}</span></p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
                    {QUICK_MSGS.map(s => (
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
                  <div style={{ background: '#f5f5f7', color: '#6e6e73', fontSize: 14, padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4 }}>Jeff is thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e8e8ed', background: 'white' }}>
              <div style={{ display: 'flex', gap: 10, maxWidth: 760, margin: '0 auto' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} disabled={chatLoading}
                  placeholder="Message Jeff… (Enter to send)"
                  style={{ flex: 1, background: '#f5f5f7', color: '#1d1d1f', padding: '11px 18px', borderRadius: 24, border: '1px solid #d2d2d7', fontSize: 14, outline: 'none', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = '#0066cc')}
                  onBlur={e => (e.target.style.borderColor = '#d2d2d7')} />
                <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()} style={{
                  background: chatLoading || !chatInput.trim() ? '#d2d2d7' : '#0066cc', color: 'white',
                  padding: '11px 22px', borderRadius: 24, border: 'none', fontSize: 14, fontWeight: 500, cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.15s'
                }}>Send</button>
              </div>
            </div>
          </div>
        )}

        {/* ── HITL ── */}
        {tab === 'hitl' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '32px 24px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>Pending Approvals</h1>
              <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 24 }}>{pending.length > 0 ? `${pending.length} item${pending.length > 1 ? 's' : ''} awaiting response` : 'No pending items'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hitlItems.map(item => (
                  <div key={item.id} style={{
                    borderRadius: 16, border: `1px solid ${item.resolved_at ? '#e8e8ed' : '#ffcc00'}`,
                    background: item.resolved_at ? 'white' : '#fffbeb', padding: 20, opacity: item.resolved_at ? 0.5 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, color: '#6e6e73' }}>#{item.id} · {new Date(item.created_at).toLocaleString('en-US')}</span>
                        <p style={{ color: '#1d1d1f', marginTop: 6, fontSize: 14 }}>{item.message}</p>
                        {item.resolution && <p style={{ color: '#1a7f3c', fontSize: 14, marginTop: 8 }}>✓ {item.resolution}</p>}
                      </div>
                      {!item.resolved_at && resolveId !== item.id && (
                        <button onClick={() => { setResolveId(item.id); setResolveMsg('') }} style={{ flexShrink: 0, background: '#0066cc', color: 'white', fontSize: 13, padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>Reply</button>
                      )}
                    </div>
                    {resolveId === item.id && (
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea value={resolveMsg} onChange={e => setResolveMsg(e.target.value)} rows={3} autoFocus placeholder="Type your reply..."
                          style={{ width: '100%', background: 'white', color: '#1d1d1f', fontSize: 14, padding: '10px 14px', borderRadius: 12, border: '1px solid #d2d2d7', outline: 'none', resize: 'none' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={resolveHITL} disabled={!resolveMsg.trim()} style={{ background: '#0066cc', color: 'white', fontSize: 13, padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>Send Reply</button>
                          <button onClick={() => setResolveId(null)} style={{ color: '#6e6e73', fontSize: 13, padding: '8px 18px', borderRadius: 20, border: '1px solid #d2d2d7', background: 'none', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── KB ── */}
        {tab === 'kb' && (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Sidebar */}
            <div style={{ width: 260, borderRight: '1px solid #e8e8ed', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#f5f5f7' }}>
              <div style={{ padding: '16px 12px', borderBottom: '1px solid #e8e8ed' }}>
                <p style={{ fontSize: 11, color: '#6e6e73', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Knowledge Base</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['KB-06', 'COPREM'].map(id => (
                    <button key={id} onClick={() => { setSelectedKb(id); loadKbSections(id) }} style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      background: selectedKb === id ? 'white' : 'transparent',
                      color: selectedKb === id ? '#0066cc' : '#424245',
                      fontWeight: selectedKb === id ? 500 : 400,
                      boxShadow: selectedKb === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                    }}>
                      {id === 'KB-06' ? 'KB-06 FutureSkill (584 courses)' : 'COPREM Frameworks'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {kbLoading && <p style={{ color: '#6e6e73', fontSize: 13, padding: 12 }}>Loading...</p>}
                {kbSections.map(s => (
                  <button key={s.title} onClick={() => setSelectedSection(s.title)} style={{
                    width: '100%', textAlign: 'left', padding: '11px 14px',
                    borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #e8e8ed',
                    borderLeft: selectedSection === s.title ? '3px solid #0066cc' : '3px solid transparent',
                    background: selectedSection === s.title ? 'white' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}>
                    <p style={{ fontSize: 13, color: '#1d1d1f', margin: 0 }}>{s.title}</p>
                    <p style={{ fontSize: 11, color: '#6e6e73', marginTop: 2, margin: 0 }}>{s.lines} lines</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {selectedSection ? (
                <>
                  <div style={{ padding: '14px 24px', borderBottom: '1px solid #e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div>
                      <span style={{ fontSize: 12, color: '#6e6e73' }}>{selectedKb} / </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f' }}>{selectedSection}</span>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(sectionContent)} style={{ fontSize: 12, color: '#6e6e73', padding: '5px 14px', borderRadius: 16, border: '1px solid #d2d2d7', background: 'none', cursor: 'pointer' }}>Copy</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                    {sectionContent === 'loading...' ? <p style={{ color: '#6e6e73' }}>Loading...</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{renderMd(sectionContent)}</div>}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6e73' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 32, marginBottom: 10 }}>📚</p>
                    <p style={{ fontSize: 14 }}>Select a section to read</p>
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
              <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f', marginBottom: 20 }}>Browser</h1>
              {/* URL bar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
                <input value={browserInput} onChange={e => setBrowserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { const q = browserInput.trim(); window.open(q.startsWith('http') ? q : `https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank') } }}
                  placeholder="Search or enter URL, press Enter to open in new tab"
                  style={{ flex: 1, background: '#f5f5f7', color: '#1d1d1f', padding: '11px 18px', borderRadius: 24, border: '1px solid #d2d2d7', fontSize: 14, outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#0066cc')}
                  onBlur={e => (e.target.style.borderColor = '#d2d2d7')} />
                <button onClick={() => { const q = browserInput.trim(); window.open(q.startsWith('http') ? q : `https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank') }}
                  style={{ background: '#0066cc', color: 'white', padding: '11px 22px', borderRadius: 24, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Open ↗</button>
              </div>

              {/* COPREM links */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 12, color: '#6e6e73', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>COPREM System</p>
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
                <h1 style={{ fontSize: 40, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>COPREM OS Guide</h1>
                <p style={{ fontSize: 16, color: '#6e6e73' }}>Jeff — INTJ AI Executive Partner · v8.3 · 2026-06-01</p>
              </div>
              {[
                { title: 'Chat with Jeff', items: ['Type a message and press Enter or click Send', 'Select an AI model above — Auto recommended for most tasks', 'Gemini Flash: fast, free · Groq: no daily limit · Ollama: offline', 'Tap a quick-start message to begin a conversation'] },
                { title: 'Pending Approvals (HITL)', items: ['Jeff pauses and waits when a request exceeds its scope', 'Click Reply → type your answer → sends to the Telegram user', 'Via Telegram: /resolve <id> <message>', 'Yellow badge shows count of pending items'] },
                { title: 'Knowledge Base', items: ['KB-06: FutureSkill — 584 courses across 14 categories', 'COPREM: Frameworks and system rules for COPREM OS', 'Click a section in the left panel to read the full content', 'Click Copy to copy content to clipboard'] },
                { title: 'Browser', items: ['Type a URL and press Enter or click Open', 'Bookmarks: n8n, LiteLLM, Dify, Google, GitHub', 'Some sites block iframes — use Open ↗ to open in a new tab', 'Use to inspect Workflow state and external dashboards'] },
                { title: 'AI Cost Tiers (auto-selected by Jeff)', items: ['Tier 0: Gemini Flash (Groq primary + Gemini 6 keys)', 'Tier 1: Gemini Lite (cost >$1/day)', 'Tier 2: Groq 70B (when Gemini is throttled)', 'Tier 3: Ollama local (when all cloud APIs are down)'] },
                { title: 'Starting COPREM OS', items: ['Double-click "COPREM OS.app" on the Desktop', 'Or run: bash scripts/start_coprem.sh', 'Stop Dashboard: bash scripts/stop_coprem.sh', 'Docker continues running when the Dashboard is closed'] },
              ].map(s => (
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
              <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1d1d1f' }}>System</h1>

              {/* Services */}
              <div style={{ background: '#f5f5f7', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f' }}>Services</h2>
                  <button onClick={fetchAll} style={{ fontSize: 13, color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer' }}>↻ Refresh</button>
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
                        {s.ok == null ? 'Checking' : s.ok ? 'Online' : 'Down'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latency */}
              <div style={{ background: '#f5f5f7', borderRadius: 16, padding: '20px 24px' }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>Latency by Layer</h2>
                {latency.length === 0 ? <p style={{ color: '#6e6e73', fontSize: 14 }}>Waiting for traffic from WF01...</p> : (
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
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>Open Services</h2>
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

      </div>
    </div>
  )
}
