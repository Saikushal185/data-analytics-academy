// Lightweight localStorage activity log: active days (for streak / weekly count)
// and recently-viewed tracks. All client-side, no backend needed.

const DAYS_KEY = 'daa-active-days'
const VIEWED_KEY = 'daa-recent-tracks'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

const today = () => new Date().toISOString().slice(0, 10)

// Record that the user did something graded today.
export function recordActiveDay() {
  const days = read(DAYS_KEY)
  const d = today()
  if (!days.includes(d)) {
    days.push(d)
    localStorage.setItem(DAYS_KEY, JSON.stringify(days))
  }
}

// Record a visited track id (most recent first, de-duplicated, capped).
export function recordVisit(topicId) {
  const prev = read(VIEWED_KEY).filter((id) => id !== topicId)
  prev.unshift(topicId)
  localStorage.setItem(VIEWED_KEY, JSON.stringify(prev.slice(0, 5)))
}

export function getRecentTracks() {
  return read(VIEWED_KEY)
}

// Consecutive-day streak ending today (or yesterday if nothing yet today).
export function getStreak() {
  const days = new Set(read(DAYS_KEY))
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

// Count of distinct active days in the last 7 calendar days.
export function getActiveDaysThisWeek() {
  const days = read(DAYS_KEY)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 6)
  const c = cutoff.toISOString().slice(0, 10)
  return days.filter((d) => d >= c).length
}
