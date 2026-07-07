// Local AI tutor backed by Ollama (free, runs on the user's machine).
// Configurable via env; defaults to qwen3-coder which is strong at SQL/pandas.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL || 'qwen3-coder:latest'

const SYSTEM = `You are a friendly, concise tutor inside a data-analytics learning app.
The learner is studying SQL, statistics, pandas, data modeling, BI/DAX, visualization, and analytics engineering.
Explain clearly and briefly. Prefer short concrete examples (SQL or pandas). When the learner shares code or an error, point out the specific issue and how to fix it. Do not be verbose. Use markdown with short code blocks where helpful.`

export async function tutorStatus() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return { available: false, model: MODEL }
    const data = await res.json()
    const models = (data.models || []).map((m) => m.name)
    return { available: true, model: MODEL, installed: models.includes(MODEL), models }
  } catch {
    return { available: false, model: MODEL }
  }
}

// Build the message list with an optional page-context preamble.
function buildMessages(messages, context) {
  const sys = context
    ? `${SYSTEM}\n\nContext — the learner is currently on: ${context}.`
    : SYSTEM
  return [{ role: 'system', content: sys }, ...messages]
}

// Streams assistant tokens. Calls onToken(text) for each chunk.
export async function chatStream({ messages, context }, onToken, signal) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages: buildMessages(messages, context), stream: true }),
    signal,
  })
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
      } catch {
        /* ignore partial */
      }
    }
  }
}
