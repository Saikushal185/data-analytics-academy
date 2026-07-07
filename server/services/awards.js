// Gamification engine: XP, levels, streaks, and badge evaluation.
// Invoked on completion/quiz events so all the logic stays in one place.
import db from '../db.js'
import { itemInfo, itemIdsForTopic, challengeIds } from './items.js'
import { badges as badgeDefs } from '../content/badges.js'

// Level thresholds: cumulative XP needed. Gap grows by 50 each level.
const LEVELS = (() => {
  const arr = [0]
  let gap = 100
  for (let i = 1; i < 60; i++) {
    arr.push(arr[i - 1] + gap)
    gap += 50
  }
  return arr
})()

export function levelInfo(xp) {
  let level = 1
  while (level < LEVELS.length && xp >= LEVELS[level]) level++
  const floor = LEVELS[level - 1]
  const ceil = LEVELS[level] ?? floor
  return { level, xp, levelFloor: floor, levelCeil: ceil, into: xp - floor, span: Math.max(1, ceil - floor) }
}

const todayStr = () => new Date().toISOString().slice(0, 10)

function totalXp(userId) {
  return db.prepare('SELECT COALESCE(SUM(amount),0) AS x FROM xp_events WHERE user_id = ?').get(userId).x
}

function doneSet(userId) {
  return new Set(db.prepare('SELECT item_id FROM progress WHERE user_id = ?').all(userId).map((r) => r.item_id))
}

export function recordActivity(userId) {
  db.prepare(
    `INSERT INTO activity (user_id, day, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`
  ).run(userId, todayStr())
}

export function computeStreak(userId) {
  const days = new Set(db.prepare('SELECT day FROM activity WHERE user_id = ?').all(userId).map((r) => r.day))
  if (days.size === 0) return 0
  const cur = new Date()
  if (!days.has(cur.toISOString().slice(0, 10))) cur.setDate(cur.getDate() - 1)
  let streak = 0
  while (days.has(cur.toISOString().slice(0, 10))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

function topicProgressFn(done) {
  return (topicId) => {
    const ids = itemIdsForTopic(topicId)
    return { done: ids.filter((id) => done.has(id)).length, total: ids.length }
  }
}

// Evaluate and persist any newly-earned badges. Returns array of new badge ids.
function evaluateBadges(userId) {
  const done = doneSet(userId)
  const xp = totalXp(userId)
  const streak = computeStreak(userId)
  const owned = new Set(db.prepare('SELECT badge_id FROM badges WHERE user_id = ?').all(userId).map((r) => r.badge_id))
  const chIds = challengeIds()
  const ctx = {
    doneSet: done,
    xp,
    streak,
    topicProgress: topicProgressFn(done),
    challengesDone: chIds.length > 0 && chIds.every((id) => done.has(id)),
  }
  const earned = []
  const ins = db.prepare('INSERT OR IGNORE INTO badges (user_id, badge_id) VALUES (?, ?)')
  for (const b of badgeDefs) {
    if (!owned.has(b.id) && b.test(ctx)) {
      ins.run(userId, b.id)
      earned.push({ id: b.id, name: b.name, desc: b.desc })
    }
  }
  return earned
}

// Award XP for completing an item (idempotent per user+item). Returns summary.
export function awardCompletion(userId, itemId) {
  const info = itemInfo(itemId)
  let xpAwarded = 0
  if (info) {
    const exists = db.prepare('SELECT 1 FROM xp_events WHERE user_id = ? AND item_id = ?').get(userId, itemId)
    if (!exists) {
      db.prepare('INSERT INTO xp_events (user_id, source, item_id, amount) VALUES (?, ?, ?, ?)').run(
        userId, info.kind, itemId, info.xp
      )
      xpAwarded = info.xp
    }
  }
  recordActivity(userId)
  const newBadges = evaluateBadges(userId)
  return { xpAwarded, newBadges }
}

// Remove the XP for an item when a user un-completes it (badges are not revoked).
export function revokeCompletion(userId, itemId) {
  db.prepare('DELETE FROM xp_events WHERE user_id = ? AND item_id = ?').run(userId, itemId)
}

export function recordQuizAttempt(userId, itemId, correct) {
  const info = itemInfo(itemId)
  db.prepare('INSERT INTO quiz_attempts (user_id, item_id, topic_id, correct) VALUES (?, ?, ?, ?)').run(
    userId, itemId, info?.topicId || null, correct ? 1 : 0
  )
}

export function getStats(userId) {
  const done = doneSet(userId)
  const xp = totalXp(userId)
  const lvl = levelInfo(xp)
  const streak = computeStreak(userId)
  const ownedBadges = db.prepare('SELECT badge_id, earned_at FROM badges WHERE user_id = ?').all(userId)
  const today = db.prepare('SELECT count FROM activity WHERE user_id = ? AND day = ?').get(userId, todayStr())
  const days = db.prepare('SELECT day, count FROM activity WHERE user_id = ?').all(userId)
  const prefs = db.prepare('SELECT daily_goal, theme, display_name FROM user_prefs WHERE user_id = ?').get(userId) || {}
  const attempts = db.prepare(
    'SELECT topic_id, SUM(correct) AS correct, COUNT(*) AS total FROM quiz_attempts WHERE user_id = ? GROUP BY topic_id'
  ).all(userId)

  return {
    xp,
    level: lvl.level,
    levelInto: lvl.into,
    levelSpan: lvl.span,
    streak,
    todayCount: today?.count || 0,
    dailyGoal: prefs.daily_goal ?? 3,
    theme: prefs.theme || 'system',
    displayName: prefs.display_name || null,
    doneCount: done.size,
    badges: ownedBadges.map((b) => {
      const def = badgeDefs.find((d) => d.id === b.badge_id)
      return { id: b.badge_id, name: def?.name || b.badge_id, desc: def?.desc || '', earned_at: b.earned_at }
    }),
    allBadges: badgeDefs.map((b) => ({ id: b.id, name: b.name, desc: b.desc, owned: ownedBadges.some((o) => o.badge_id === b.id) })),
    activity: days,
    quizAccuracy: attempts.map((a) => ({ topic: a.topic_id, correct: a.correct, total: a.total })),
  }
}
