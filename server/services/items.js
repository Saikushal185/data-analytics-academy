// Authoritative server-side index of every trackable item: maps itemId ->
// { kind, topicId, xp }. Used to validate completions and award the right XP.
import { topics } from '../content/index.js'
import { challenges } from '../content/sql.js'
import { exercises } from '../content/python.js'

const XP = {
  lesson: 10,
  quiz: 15,
  interview: 10,
  capstone: 50,
  challenge: 25,
  exercise: 25,
  project: 20,
}

const index = {}
function add(id, kind, topicId) {
  index[id] = { kind, topicId, xp: XP[kind] || 10 }
}

for (const t of topics) {
  for (const l of t.lessons) add(l.id, 'lesson', t.id)
  for (const q of t.quiz || []) add(q.id, 'quiz', t.id)
  for (const iv of t.interview || []) add(iv.id, 'interview', t.id)
  if (t.capstone) add(t.capstone.id, 'capstone', t.id)
}
for (const c of challenges) add(c.id, 'challenge', 'sql')
for (const e of exercises) add(e.id, 'exercise', 'python')

export function itemInfo(itemId) {
  return index[itemId] || null
}

export function allItemIds() {
  return Object.keys(index)
}

// Item ids belonging to a topic (for badge "completed all of track" checks).
export function itemIdsForTopic(topicId) {
  return Object.entries(index)
    .filter(([, v]) => v.topicId === topicId)
    .map(([id]) => id)
}

export function challengeIds() {
  return challenges.map((c) => c.id)
}
