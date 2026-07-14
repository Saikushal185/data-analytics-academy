// Authentication: register/login with bcrypt + JWT, plus requireAuth middleware.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import db from './db.js'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const TOKEN_TTL = '30d'

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: TOKEN_TTL })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

const router = Router()

router.post('/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const exists = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) return res.status(409).json({ error: 'An account with that email already exists' })

  const hash = bcrypt.hashSync(password, 10)
  const info = await db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash)
  const user = { id: info.lastInsertRowid, email }
  res.json({ token: signToken(user), email })
})

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  res.json({ token: signToken(user), email: user.email })
})

// Request a password reset. Without an email provider configured we return the
// reset link directly (keeps the app free); with SMTP it would be emailed.
router.post('/request-reset', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (user) {
    const token = randomUUID()
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await db.prepare('INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expires)
    // In production with SMTP set, email this instead of returning it.
    return res.json({ ok: true, resetLink: `/reset?token=${token}`, emailed: false })
  }
  // Don't reveal whether the email exists.
  res.json({ ok: true, emailed: false })
})

router.post('/reset', async (req, res) => {
  const token = String(req.body.token || '')
  const password = String(req.body.password || '')
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const row = await db.prepare('SELECT * FROM reset_tokens WHERE token = ?').get(token)
  if (!row || row.expires_at < new Date().toISOString())
    return res.status(400).json({ error: 'Invalid or expired reset link' })
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), row.user_id)
  await db.prepare('DELETE FROM reset_tokens WHERE token = ?').run(token)
  res.json({ ok: true })
})

export default router
