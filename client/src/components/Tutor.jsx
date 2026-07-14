import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api, tutorChat } from '../api.js'
import { useContent } from './ContentContext.jsx'

// Derive a short page-context string for the model from the current route.
function useContextLabel() {
  const { pathname } = useLocation()
  const content = useContent()
  if (pathname.startsWith('/topic/')) {
    const id = pathname.split('/topic/')[1]
    const t = content.topics.find((x) => x.id === id)
    return t ? `the "${t.title}" track` : null
  }
  if (pathname === '/reference') return 'the quick-reference / glossary page'
  if (pathname === '/dashboard') return 'their progress dashboard'
  return 'the Data Analytics Academy home'
}

// Custom markdown formatter (supports code blocks, headings, bold, inline code)
function formatMessage(text) {
  if (!text) return null
  const blocks = text.split(/(```[\s\S]*?```)/g)
  return blocks.map((block, bIdx) => {
    if (block.startsWith('```') && block.endsWith('```')) {
      const code = block.slice(3, -3).replace(/^.*?\n/, '') // removes language tag
      return <pre key={bIdx}><code>{code}</code></pre>
    }
    const lines = block.split('\n')
    return <div key={bIdx}>
      {lines.map((line, lIdx) => {
        let isHeading = false, headingLevel = 0, content = line
        const hMatch = line.match(/^(#{1,6})\s+(.*)/)
        if (hMatch) {
          isHeading = true; headingLevel = hMatch[1].length; content = hMatch[2]
        }
        const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g)
        const formattedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={pIdx}>{part.slice(2, -2)}</strong>
          if (part.startsWith('`') && part.endsWith('`')) return <code key={pIdx}>{part.slice(1, -1)}</code>
          return <span key={pIdx}>{part}</span>
        })
        if (isHeading) {
          const Tag = `h${headingLevel}`
          return <Tag key={lIdx} style={{ margin: '0.5em 0' }}>{formattedLine}</Tag>
        }
        return <div key={lIdx} style={{ minHeight: '1em' }}>{formattedLine}</div>
      })}
    </div>
  })
}

export default function Tutor() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null) // null=unknown, true/false
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)
  const context = useContextLabel()

  useEffect(() => {
    if (open && status === null) {
      api.tutorStatus().then((s) => setStatus(s.available && s.installed !== false)).catch(() => setStatus(false))
    }
  }, [open, status])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  async function send(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    const next = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setBusy(true)
    try {
      await tutorChat({ messages: next, context }, (tok) => {
        setMessages((m) => {
          const copy = m.slice()
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + tok }
          return copy
        })
      })
    } catch {
      setMessages((m) => {
        const copy = m.slice()
        copy[copy.length - 1] = { role: 'assistant', content: 'Tutor unavailable — is Ollama running locally?' }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button className="tutor-fab" onClick={() => setOpen(true)} title="Ask the AI tutor">
        Ask AI Tutor
      </button>
    )
  }

  return (
    <div className="tutor-panel">
      <div className="tutor-head">
        <strong>AI Tutor</strong>
        <span className="tutor-status">
          {status === false ? 'offline (start Ollama)' : 'local model'}
        </span>
        <button className="link-btn" onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="tutor-msgs" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="tutor-hint">
            Ask anything about SQL, stats, pandas, or your current lesson. Runs on your local model — answers may take a few seconds.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`tutor-msg ${m.role}`}>
            {m.content ? formatMessage(m.content) : (busy && i === messages.length - 1 ? '…' : '')}
          </div>
        ))}
      </div>
      <form className="tutor-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the tutor…"
          disabled={busy}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()}>
          {busy ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
