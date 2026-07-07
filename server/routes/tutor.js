// AI tutor routes. Streams tokens from the local Ollama model.
import { Router } from 'express'
import { tutorStatus, chatStream } from '../services/tutor.js'

const router = Router()

router.get('/status', async (_req, res) => {
  res.json(await tutorStatus())
})

// POST /api/tutor/chat { messages:[{role,content}], context? }
// Streams plain text tokens (text/plain, chunked).
router.post('/chat', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : []
  const context = typeof req.body?.context === 'string' ? req.body.context.slice(0, 300) : null
  if (!messages.length) return res.status(400).json({ error: 'No messages' })

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  const controller = new AbortController()
  // Abort generation only if the client disconnects before we finish.
  res.on('close', () => { if (!res.writableEnded) controller.abort() })

  try {
    await chatStream({ messages, context }, (tok) => res.write(tok), controller.signal)
    res.end()
  } catch (e) {
    if (!res.headersSent) res.status(503)
    res.write(`\n\n[Tutor unavailable: ${e.message}. Make sure Ollama is running.]`)
    res.end()
  }
})

export default router
