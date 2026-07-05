// Current-user stats + preferences. All require auth.
import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'
import { ensurePrefs } from '../db.js'
import { getStats } from '../services/awards.js'

const router = Router()
router.use(requireAuth)

router.get('/stats', (req, res) => {
  ensurePrefs(req.user.id)
  res.json(getStats(req.user.id))
})

router.put('/prefs', (req, res) => {
  ensurePrefs(req.user.id)
  const { display_name, daily_goal, theme } = req.body || {}
  if (display_name !== undefined)
    db.prepare('UPDATE user_prefs SET display_name = ? WHERE user_id = ?').run(String(display_name).slice(0, 60), req.user.id)
  if (daily_goal !== undefined) {
    const g = Math.max(1, Math.min(20, parseInt(daily_goal, 10) || 3))
    db.prepare('UPDATE user_prefs SET daily_goal = ? WHERE user_id = ?').run(g, req.user.id)
  }
  if (theme !== undefined && ['system', 'light', 'dark'].includes(theme))
    db.prepare('UPDATE user_prefs SET theme = ? WHERE user_id = ?').run(theme, req.user.id)
  res.json(getStats(req.user.id))
})

export default router
