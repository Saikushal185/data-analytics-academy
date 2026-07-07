// Server-side SQL: run a read-only query against a fresh seeded in-memory DB,
// and grade challenge answers by comparing normalized result sets.
import { Router } from 'express'
import Database from 'better-sqlite3'
import { sqlSeed, sqlChallengeById } from '../content/index.js'

const router = Router()
const ROW_CAP = 500

// Reject anything that could mutate or read outside SELECT/WITH.
const WRITE_RE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|PRAGMA|VACUUM)\b/i

function freshDb() {
  const db = new Database(':memory:')
  db.exec(sqlSeed)
  return db
}

function runReadOnly(sql) {
  const trimmed = String(sql || '').trim().replace(/;\s*$/, '')
  if (!trimmed) throw new Error('Empty query')
  if (trimmed.includes(';')) throw new Error('Run a single statement at a time')
  if (WRITE_RE.test(trimmed)) throw new Error('Only read-only SELECT queries are allowed here')

  const db = freshDb()
  try {
    const stmt = db.prepare(trimmed)
    if (!stmt.reader) throw new Error('Query must return rows (use SELECT)')
    const rows = stmt.raw().all()
    const columns = stmt.columns().map((c) => c.name)
    return { columns, rows: rows.slice(0, ROW_CAP) }
  } finally {
    db.close()
  }
}

function normalize(result, ordered) {
  const rows = result.rows.map((r) => r.map((v) => (v === null ? '∅' : String(v))))
  if (!ordered) rows.sort((a, b) => a.join('|').localeCompare(b.join('|')))
  return JSON.stringify(rows)
}

// Rule-based "smart hints": structured diff between the learner's result and
// the expected one. Free, no AI — points at the specific mismatch.
function smartHints(got, want, ordered) {
  const hints = []
  const gc = got.columns.map((c) => c.toLowerCase())
  const wc = want.columns.map((c) => c.toLowerCase())

  if (got.columns.length !== want.columns.length)
    hints.push(`Expected ${want.columns.length} column(s) but your query returned ${got.columns.length}. Check your SELECT list.`)

  const missing = wc.filter((c) => !gc.includes(c))
  const extra = gc.filter((c) => !wc.includes(c))
  if (missing.length) hints.push(`Missing expected column(s): ${missing.join(', ')}. Watch column names/aliases.`)
  if (extra.length) hints.push(`Unexpected column(s): ${extra.join(', ')}. Remove or rename them.`)

  if (got.rows.length !== want.rows.length) {
    const more = got.rows.length > want.rows.length
    hints.push(
      `Row count differs: expected ${want.rows.length}, got ${got.rows.length}. ` +
        (more ? 'You may be missing a WHERE/HAVING filter or a join is fanning out.' : 'Your filter may be too strict, or a GROUP BY/JOIN is dropping rows.')
    )
  } else if (ordered && normalize(got, false) === normalize(want, false) && normalize(got, true) !== normalize(want, true)) {
    hints.push('Right rows, wrong order — check your ORDER BY (direction and columns).')
  }

  if (!hints.length) hints.push('Same shape but different values — check your aggregation, math, or join keys.')
  return hints.slice(0, 3)
}

// POST /api/sql/run  { sql }
router.post('/run', (req, res) => {
  try {
    res.json(runReadOnly(req.body.sql))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/sql/grade  { challengeId, sql }
router.post('/grade', (req, res) => {
  const ch = sqlChallengeById[req.body.challengeId]
  if (!ch) return res.status(404).json({ error: 'Unknown challenge' })
  try {
    const got = runReadOnly(req.body.sql)
    const want = runReadOnly(ch.expected)
    const correct = normalize(got, ch.ordered) === normalize(want, ch.ordered)
    res.json({ correct, result: got, hints: correct ? [] : smartHints(got, want, ch.ordered) })
  } catch (e) {
    res.status(400).json({ error: e.message, correct: false })
  }
})

export default router
