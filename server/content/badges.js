// Badge definitions. Each `test(ctx)` returns true when earned.
// ctx = { doneSet, xp, streak, topicProgress(topicId)->{done,total}, attempts }
import { topics } from './index.js'

export const badges = [
  { id: 'first-step', name: 'First Step', desc: 'Complete your first item.',
    test: (c) => c.doneSet.size >= 1 },
  { id: 'getting-going', name: 'Getting Going', desc: 'Complete 10 items.',
    test: (c) => c.doneSet.size >= 10 },
  { id: 'half-century', name: 'Half Century', desc: 'Complete 50 items.',
    test: (c) => c.doneSet.size >= 50 },
  { id: 'sql-slinger', name: 'SQL Slinger', desc: 'Finish every SQL challenge.',
    test: (c) => c.challengesDone },
  { id: 'first-capstone', name: 'Capstone Crafter', desc: 'Complete any capstone.',
    test: (c) => topics.some((t) => t.capstone && c.doneSet.has(t.capstone.id)) },
  { id: 'polyglot', name: 'Polyglot', desc: 'Touch all 8 tracks.',
    test: (c) => topics.every((t) => c.topicProgress(t.id).done > 0) },
  { id: 'week-warrior', name: 'Week Warrior', desc: 'Reach a 7-day streak.',
    test: (c) => c.streak >= 7 },
  { id: 'track-master', name: 'Track Master', desc: 'Finish a whole track 100%.',
    test: (c) => topics.some((t) => { const p = c.topicProgress(t.id); return p.total > 0 && p.done === p.total }) },
  { id: 'xp-1000', name: 'Grinder', desc: 'Earn 1,000 XP.',
    test: (c) => c.xp >= 1000 },
]
