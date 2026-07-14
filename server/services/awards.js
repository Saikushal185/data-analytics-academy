import db from '../db.js'
import { itemInfo, itemIdsForTopic, challengeIds } from './items.js'
import { badges as badgeDefs } from '../content/badges.js'

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

async function totalXp(userId) {
  const row = await db.prepare('SELECT COALESCE(SUM(amount),0) AS x FROM xp_events WHERE user_id = ?').get(userId)
  return row ? parseInt(row.x, 10) : 0
}

async function doneSet(userId) {
  const rows = await db.prepare('SELECT item_id FROM progress WHERE user_id = ?').all(userId)
  return new Set(rows.map((r) => r.item_id))
}

export async function recordActivity(userId) {
  await db.prepare(
    `INSERT INTO activity (user_id, day, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET count = activity.count + 1`
  ).run(userId, todayStr())
}

export async function computeStreak(userId) {
  const rows = await db.prepare('SELECT day FROM activity WHERE user_id = ?').all(userId)
  const days = new Set(rows.map((r) => r.day))
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

async function evaluateBadges(userId) {
  const done = await doneSet(userId)
  const xp = await totalXp(userId)
  const streak = await computeStreak(userId)
  const rows = await db.prepare('SELECT badge_id FROM badges WHERE user_id = ?').all(userId)
  const owned = new Set(rows.map((r) => r.badge_id))
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
      await ins.run(userId, b.id)
      earned.push({ id: b.id, name: b.name, desc: b.desc })
    }
  }
  return earned
}

export async function awardCompletion(userId, itemId) {
  const info = itemInfo(itemId)
  let xpAwarded = 0
  if (info) {
    const exists = await db.prepare('SELECT 1 FROM xp_events WHERE user_id = ? AND item_id = ?').get(userId, itemId)
    if (!exists) {
      await db.prepare('INSERT INTO xp_events (user_id, source, item_id, amount) VALUES (?, ?, ?, ?)').run(
        userId, info.kind, itemId, info.xp
      )
      xpAwarded = info.xp
    }
  }
  await recordActivity(userId)
  const newBadges = await evaluateBadges(userId)
  return { xpAwarded, newBadges }
}

export async function revokeCompletion(userId, itemId) {
  await db.prepare('DELETE FROM xp_events WHERE user_id = ? AND item_id = ?').run(userId, itemId)
}

export async function recordQuizAttempt(userId, itemId, correct) {
  const info = itemInfo(itemId)
  await db.prepare('INSERT INTO quiz_attempts (user_id, item_id, topic_id, correct) VALUES (?, ?, ?, ?)').run(
    userId, itemId, info?.topicId || null, correct ? 1 : 0
  )
}

export async function getStats(userId) {
  const done = await doneSet(userId)
  const xp = await totalXp(userId)
  const lvl = levelInfo(xp)
  const streak = await computeStreak(userId)
  const ownedBadges = await db.prepare('SELECT badge_id, earned_at FROM badges WHERE user_id = ?').all(userId)
  const today = await db.prepare('SELECT count FROM activity WHERE user_id = ? AND day = ?').get(userId, todayStr())
  const days = await db.prepare('SELECT day, count FROM activity WHERE user_id = ?').all(userId)
  const prefs = await db.prepare('SELECT daily_goal, theme, display_name FROM user_prefs WHERE user_id = ?').get(userId) || {}
  const attempts = await db.prepare(
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
    quizAccuracy: attempts.map((a) => ({ topic: a.topic_id, correct: parseInt(a.correct || 0, 10), total: parseInt(a.total || 0, 10) })),
  }
}
