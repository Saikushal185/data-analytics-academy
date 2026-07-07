// Review cards for spaced repetition, generated from existing content:
// key terms (front=term, back=definition) and quiz questions (front=question,
// back=correct option + explanation).
import { topics } from '../content/index.js'

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
}

const cards = []
for (const t of topics) {
  for (const [term, def] of t.aside?.terms || []) {
    cards.push({ id: `t:${t.id}:${slug(term)}`, topicId: t.id, topicLabel: t.label, kind: 'term', front: term, back: def })
  }
  for (const q of t.quiz || []) {
    cards.push({
      id: `q:${q.id}`,
      topicId: t.id,
      topicLabel: t.label,
      kind: 'quiz',
      front: q.q,
      back: `${q.options[q.answer]}\n\n${q.why}`,
    })
  }
}

export const allCards = cards
export const cardById = Object.fromEntries(cards.map((c) => [c.id, c]))
export const cardIds = cards.map((c) => c.id)
