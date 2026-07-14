// Local AI tutor backed by Ollama, with cloud fallbacks (Grok & Gemini).
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL || 'qwen3-coder:latest'

const SYSTEM = `You are a friendly, concise tutor inside a data-analytics learning app.
The learner is studying SQL, statistics, pandas, data modeling, BI/DAX, visualization, and analytics engineering.
Explain clearly and briefly. Prefer short concrete examples (SQL or pandas). When the learner shares code or an error, point out the specific issue and how to fix it. Do not be verbose. Use markdown with short code blocks where helpful.`

export async function tutorStatus() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) throw new Error('not ok')
    const data = await res.json()
    const models = (data.models || []).map((m) => m.name)
    return { available: true, model: MODEL, installed: models.includes(MODEL), models, cloudFallback: !!(process.env.GROK_API_KEY || process.env.GEMINI_API_KEY) }
  } catch {
    // If Ollama is down but we have fallbacks, report available via cloud.
    const hasCloud = !!(process.env.GROK_API_KEY || process.env.GEMINI_API_KEY)
    return { available: hasCloud, model: hasCloud ? 'cloud-fallback' : MODEL, installed: false, models: [], cloudFallback: hasCloud }
  }
}

function buildMessages(messages, context) {
  const sys = context
    ? `${SYSTEM}\n\nContext — the learner is currently on: ${context}.`
    : SYSTEM
  return [{ role: 'system', content: sys }, ...messages]
}

async function chatStreamOllama({ messages, context }, onToken, signal) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages: buildMessages(messages, context), stream: true }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) // Quick timeout for connection
  }).catch(e => { throw new Error('Ollama unreachable'); })
  
  if (!res.ok || !res.body) throw new Error(`Ollama error ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const json = JSON.parse(trimmed)
        if (json.message?.content) onToken(json.message.content)
      } catch {}
    }
  }
}

async function chatStreamGrok({ messages, context }, onToken, signal) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROK_API_KEY}` },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: buildMessages(messages, context),
      stream: true
    }),
    signal
  })
  
  if (!res.ok) throw new Error(`Grok error ${res.status}`)
  
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim()
        if (dataStr === '[DONE]') continue
        try {
          const json = JSON.parse(dataStr)
          const text = json.choices?.[0]?.delta?.content
          if (text) onToken(text)
        } catch {}
      }
    }
  }
}

async function chatStreamGemini({ messages, context }, onToken, signal) {
  const sys = context ? `${SYSTEM}\n\nContext — the learner is currently on: ${context}.` : SYSTEM
  const body = {
    systemInstruction: { parts: [{ text: sys }] },
    contents: messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  }
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  })
  
  if (!res.ok) throw new Error(`Gemini error ${res.status}`)
  
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim()
        if (dataStr === '[DONE]') continue
        try {
          const json = JSON.parse(dataStr)
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) onToken(text)
        } catch {}
      }
    }
  }
}

export async function chatStream(args, onToken, signal) {
  try {
    return await chatStreamOllama(args, onToken, signal)
  } catch (err) {
    if (process.env.GROK_API_KEY) {
      try { return await chatStreamGrok(args, onToken, signal) } 
      catch (e2) { console.error('Grok fallback failed:', e2) }
    }
    if (process.env.GEMINI_API_KEY) {
      return await chatStreamGemini(args, onToken, signal)
    }
    throw err
  }
}
