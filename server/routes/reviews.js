// Spaced-repetition review queue (SM-2). All require auth.
import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import { cardById, cardIds } from '../services/cards.js'
import { getCustomCardsForUser } from '../services/trackGeneratorService.js'
import { recordActivity } from '../services/awards.js'

const router = Router()
router.use(requireAuth)

const NEW_PER_SESSION = 8
const MAX_DUE = 30
const now = () => new Date().toISOString()

// GET /api/reviews/due — cards due now + a few new ones.
router.get('/due', async (req, res) => {
  const uid = req.user.id
  const seen = await db.prepare('SELECT card_id, due_at FROM reviews WHERE user_id = ?').all(uid)
  const seenSet = new Set(seen.map((r) => r.card_id))
  const nowTs = now()

  // Build a merged card lookup: built-in + custom
  const customCards = await getCustomCardsForUser(uid)
  const mergedById = { ...cardById }
  const mergedIds = [...cardIds]
  for (const cc of customCards) {
    mergedById[cc.id] = cc
    mergedIds.push(cc.id)
  }

  const due = seen
    .filter((r) => r.due_at <= nowTs && mergedById[r.card_id])
    .map((r) => r.card_id)
  const fresh = mergedIds.filter((id) => !seenSet.has(id)).slice(0, NEW_PER_SESSION)

  const queue = [...due, ...fresh].slice(0, MAX_DUE).map((id) => {
    const c = mergedById[id]
    return { id: c.id, topicId: c.topicId, topicLabel: c.topicLabel, kind: c.kind, front: c.front, back: c.back, isNew: !seenSet.has(id) }
  })

  res.json({
    cards: queue,
    counts: { due: due.length, new: fresh.length, total: mergedIds.length, learned: seenSet.size },
  })
})

// POST /api/reviews/grade { cardId, quality (0-5) } — SM-2 update.
router.post('/grade', async (req, res) => {
  const uid = req.user.id
  const cardId = String(req.body.cardId || '')
  const q = Math.max(0, Math.min(5, parseInt(req.body.quality, 10)))
  // Look up card from built-in pool, or from custom cards if ID matches
  let card = cardById[cardId]
  if (!card && cardId.startsWith('custom-card-')) {
    const customCards = await getCustomCardsForUser(uid)
    card = customCards.find((c) => c.id === cardId)
  }
  if (!card) return res.status(404).json({ error: 'Unknown card' })

  let row = await db.prepare('SELECT * FROM reviews WHERE user_id = ? AND card_id = ?').get(uid, cardId)
  let ease = row?.ease ?? 2.5
  let interval = row?.interval_days ?? 0
  let reps = row?.reps ?? 0

  if (q < 3) {
    reps = 0
    interval = 0 // see it again this session / today
  } else {
    if (reps === 0) interval = 1
    else if (reps === 1) interval = 6
    else interval = Math.round(interval * ease)
    reps += 1
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  }

  const due = new Date(Date.now() + interval * 86400000).toISOString()
  await db.prepare(
    `INSERT INTO reviews (user_id, card_id, ease, interval_days, reps, due_at, last_reviewed)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, card_id) DO UPDATE SET ease=excluded.ease, interval_days=excluded.interval_days,
       reps=excluded.reps, due_at=excluded.due_at, last_reviewed=excluded.last_reviewed`
  ).run(uid, cardId, ease, interval, reps, due, now())

  await recordActivity(uid)
  res.json({ ok: true, nextDays: interval })
})

export default router
