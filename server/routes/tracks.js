import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { generateTrack, getCustomTracksForUser } from '../services/trackGeneratorService.js'
import db from '../db.js'

const router = Router()

router.use(requireAuth)

router.get('/my', (req, res) => {
  try {
    const tracks = getCustomTracksForUser(req.user.id)
    res.json(tracks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/generate', async (req, res) => {
  const { topic } = req.body
  if (!topic) return res.status(400).json({ error: 'Topic is required' })
  
  // Set longer timeout for generating complex JSON payload
  req.setTimeout(300000)
  res.setTimeout(300000)

  try {
    const track = await generateTrack(req.user.id, topic)
    res.json(track)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res) => {
  const trackId = req.params.id
  try {
    db.transaction(() => {
      // Delete quiz attempts associated with this track
      db.prepare(`DELETE FROM quiz_attempts WHERE user_id = ? AND topic_id = ?`).run(req.user.id, `custom-${trackId}`)
      
      // Delete reviews for this track
      db.prepare(`DELETE FROM reviews WHERE user_id = ? AND card_id LIKE ?`).run(req.user.id, `custom-card-${trackId}-%`)
      
      // Delete the track itself (CASCADE handles custom_modules)
      const r = db.prepare(`DELETE FROM custom_tracks WHERE id = ? AND user_id = ?`).run(trackId, req.user.id)
      if (r.changes === 0) throw new Error('Track not found')
    })()
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

export default router
