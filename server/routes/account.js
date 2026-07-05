// Account management: change password, delete account. All require auth.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

router.post('/change-password', (req, res) => {
  const current = String(req.body.currentPassword || '')
  const next = String(req.body.newPassword || '')
  if (next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' })
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user || !bcrypt.compareSync(current, user.password_hash))
    return res.status(401).json({ error: 'Current password is incorrect' })
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), req.user.id)
  res.json({ ok: true })
})

router.delete('/', (req, res) => {
  // Cascades to progress/xp/badges/etc via ON DELETE CASCADE.
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id)
  res.json({ ok: true })
})

export default router
