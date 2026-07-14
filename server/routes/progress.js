// Per-user progress: list, mark complete, unmark. All require auth.
import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import { awardCompletion, revokeCompletion, recordQuizAttempt, getStats } from '../services/awards.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await db.prepare('SELECT item_id FROM progress WHERE user_id = ?').all(req.user.id)
  res.json({ items: rows.map((r) => r.item_id) })
})

router.put('/:itemId', async (req, res) => {
  const newRow = await db
    .prepare('INSERT OR IGNORE INTO progress (user_id, item_id) VALUES (?, ?)')
    .run(req.user.id, req.params.itemId)
  // Optional quiz-attempt signal from the client (for accuracy stats).
  if (typeof req.body?.correct === 'boolean') await recordQuizAttempt(req.user.id, req.params.itemId, req.body.correct)
  const award = newRow.changes > 0 ? await awardCompletion(req.user.id, req.params.itemId) : { xpAwarded: 0, newBadges: [] }
  res.json({ ok: true, ...award, stats: await getStats(req.user.id) })
})

router.delete('/:itemId', async (req, res) => {
  await db.prepare('DELETE FROM progress WHERE user_id = ? AND item_id = ?').run(req.user.id, req.params.itemId)
  await revokeCompletion(req.user.id, req.params.itemId)
  res.json({ ok: true, stats: await getStats(req.user.id) })
})

// Record a quiz answer (right or wrong) for accuracy / weak-area stats.
router.post('/attempt', async (req, res) => {
  if (typeof req.body?.correct === 'boolean') await recordQuizAttempt(req.user.id, String(req.body.itemId), req.body.correct)
  res.json({ ok: true })
})

// Bulk merge — used to sync localStorage progress on first login.
router.post('/merge', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []
  const tx = db.transaction(async (txDb, ids) => {
    const stmt = txDb.prepare('INSERT OR IGNORE INTO progress (user_id, item_id) VALUES (?, ?)')
    for (const id of ids) {
      const r = await stmt.run(req.user.id, String(id))
      if (r.changes > 0) await awardCompletion(req.user.id, String(id))
    }
  })
  await tx(items)
  const rows = await db.prepare('SELECT item_id FROM progress WHERE user_id = ?').all(req.user.id)
  res.json({ items: rows.map((r) => r.item_id), stats: await getStats(req.user.id) })
})

export default router
