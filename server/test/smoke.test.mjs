// Dependency-free smoke test: boots the server with a throwaway DB on a random
// port and exercises the core API. Run with: npm test
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = 3999
const BASE = `http://127.0.0.1:${PORT}`
let proc
let dataDir

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'daa-test-'))
  proc = spawn('node', ['server/index.js'], {
    cwd: join(__dirname, '..', '..'),
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, JWT_SECRET: 'test-secret' },
    stdio: 'ignore',
  })
  // Wait for health.
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`)
      if (r.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('server did not start')
})

after(() => {
  proc?.kill('SIGKILL')
  if (dataDir) rmSync(dataDir, { recursive: true, force: true })
})

test('content payload has 8 topics', async () => {
  const { json } = await api('/api/content')
  assert.equal(json.topics.length, 8)
  assert.equal(json.sql.challenges.length, 16)
})

test('register → complete item awards XP and a badge', async () => {
  const reg = await api('/api/auth/register', { method: 'POST', body: { email: 'a@b.com', password: 'secret1' } })
  assert.ok(reg.json.token)
  const token = reg.json.token
  const put = await api('/api/progress/sql-joins', { method: 'PUT', token, body: {} })
  assert.equal(put.json.xpAwarded, 10)
  assert.ok(put.json.newBadges.some((b) => b.id === 'first-step'))
  const stats = await api('/api/me/stats', { token })
  assert.equal(stats.json.xp, 10)
  assert.equal(stats.json.streak, 1)
})

test('SQL grade: correct passes, wrong returns hints, writes rejected', async () => {
  const ok = await api('/api/sql/grade', { method: 'POST', body: { challengeId: 'sc-1', sql: "SELECT name, region FROM customers WHERE region='West'" } })
  assert.equal(ok.json.correct, true)
  const wrong = await api('/api/sql/grade', { method: 'POST', body: { challengeId: 'sc-1', sql: 'SELECT name, region FROM customers' } })
  assert.equal(wrong.json.correct, false)
  assert.ok(wrong.json.hints.length > 0)
  const bad = await api('/api/sql/run', { method: 'POST', body: { sql: 'DROP TABLE customers' } })
  assert.equal(bad.status, 400)
})

test('reviews: due cards exist and grading schedules them out', async () => {
  const reg = await api('/api/auth/register', { method: 'POST', body: { email: 'c@d.com', password: 'secret1' } })
  const token = reg.json.token
  const due = await api('/api/reviews/due', { token })
  assert.ok(due.json.cards.length > 0)
  const card = due.json.cards[0]
  const graded = await api('/api/reviews/grade', { method: 'POST', token, body: { cardId: card.id, quality: 4 } })
  assert.equal(graded.json.ok, true)
  assert.ok(graded.json.nextDays >= 1)
})

test('account: change password works and updates login', async () => {
  const reg = await api('/api/auth/register', { method: 'POST', body: { email: 'e@f.com', password: 'secret1' } })
  const token = reg.json.token
  const ch = await api('/api/account/change-password', { method: 'POST', token, body: { currentPassword: 'secret1', newPassword: 'newpass1' } })
  assert.equal(ch.json.ok, true)
  const login = await api('/api/auth/login', { method: 'POST', body: { email: 'e@f.com', password: 'newpass1' } })
  assert.ok(login.json.token)
})
