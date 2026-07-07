// Per-user progress: list, mark complete, unmark. All require auth.
import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import { awardCompletion, revokeCompletion, recordQuizAttempt, getStats } from '../services/awards.js'

const router = Router()
router.use(requireAuth)

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT item_id FROM progress WHERE user_id = ?').all(req.user.id)
  res.json({ items: rows.map((r) => r.item_id) })
})

router.put('/:itemId', (req, res) => {
  const newRow = db
    .prepare('INSERT OR IGNORE INTO progress (user_id, item_id) VALUES (?, ?)')
    .run(req.user.id, req.params.itemId)
  // Optional quiz-attempt signal from the client (for accuracy stats).
  if (typeof req.body?.correct === 'boolean') recordQuizAttempt(req.user.id, req.params.itemId, req.body.correct)
  const award = newRow.changes > 0 ? awardCompletion(req.user.id, req.params.itemId) : { xpAwarded: 0, newBadges: [] }
  res.json({ ok: true, ...award, stats: getStats(req.user.id) })
})

router.delete('/:itemId', (req, res) => {
  db.prepare('DELETE FROM progress WHERE user_id = ? AND item_id = ?').run(req.user.id, req.params.itemId)
  revokeCompletion(req.user.id, req.params.itemId)
  res.json({ ok: true, stats: getStats(req.user.id) })
})

// Record a quiz answer (right or wrong) for accuracy / weak-area stats.
router.post('/attempt', (req, res) => {
  if (typeof req.body?.correct === 'boolean') recordQuizAttempt(req.user.id, String(req.body.itemId), req.body.correct)
  res.json({ ok: true })
})

// Bulk merge — used to sync localStorage progress on first login.
router.post('/merge', (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  const stmt = db.prepare('INSERT OR IGNORE INTO progress (user_id, item_id) VALUES (?, ?)')
  const tx = db.transaction((ids) =>
    ids.forEach((id) => {
      const r = stmt.run(req.user.id, String(id))
      if (r.changes > 0) awardCompletion(req.user.id, String(id))
    })
  )
  tx(items)
  const rows = db.prepare('SELECT item_id FROM progress WHERE user_id = ?').all(req.user.id)
  res.json({ items: rows.map((r) => r.item_id), stats: getStats(req.user.id) })
})

export default router
