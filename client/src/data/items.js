// Progress enumeration computed from the fetched content payload.
// Trackable items per topic = lessons + quiz questions + interview questions +
// capstone + (sql challenges / python exercises where applicable).

export function itemsForTopic(content, topicId) {
  const topic = content.topics.find((t) => t.id === topicId)
  if (!topic) return []
  const ids = []
  for (const l of topic.lessons) ids.push(l.id)
  for (const q of topic.quiz || []) ids.push(q.id)
  for (const iv of topic.interview || []) ids.push(iv.id)
  if (topic.capstone) ids.push(topic.capstone.id)
  if (topicId === 'sql') for (const c of content.sql.challenges) ids.push(c.id)
  if (topicId === 'python') for (const e of content.python.exercises) ids.push(e.id)
  return ids
}

export function topicProgress(content, topicId, isDone) {
  const ids = itemsForTopic(content, topicId)
  const done = ids.filter(isDone).length
  return { done, total: ids.length, pct: ids.length ? Math.round((100 * done) / ids.length) : 0 }
}

export function overallProgress(content, isDone) {
  let done = 0
  let total = 0
  for (const t of content.topics) {
    const p = topicProgress(content, t.id, isDone)
    done += p.done
    total += p.total
  }
  return { done, total, pct: total ? Math.round((100 * done) / total) : 0 }
}
