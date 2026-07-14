import { Router } from 'express'
import { requireAuth } from '../auth.js'
import {
  deleteCustomTrackForUser,
  generateTrack,
  getCustomTracksForUser,
  saveTrackForUser
} from '../services/trackGeneratorService.js'

const router = Router()

router.use(requireAuth)

router.get('/my', async (req, res) => {
  try {
    const tracks = await getCustomTracksForUser(req.user.id)
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
    const generated = await generateTrack(topic)
    const trackId = await saveTrackForUser(req.user.id, generated)
    const allTracks = await getCustomTracksForUser(req.user.id)
    const track = allTracks.find((t) => t.customId === trackId)
    res.json(track)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  const trackId = req.params.id
  try {
    const changes = await deleteCustomTrackForUser(req.user.id, trackId)
    if (changes === 0) throw new Error('Track not found')
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

export default router
