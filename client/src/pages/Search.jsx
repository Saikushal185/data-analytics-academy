import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useContent } from '../components/ContentContext.jsx'

function blockText(blocks = []) {
  return blocks
    .map((b) => b.p || b.h || b.note || b.code || (b.html ? b.html.replace(/<[^>]*>/g, ' ') : '') || (b.ul ? b.ul.join(' ') : ''))
    .join(' ')
}

// Flatten all content into a searchable index once per content load.
function buildIndex(content) {
  const items = []
  for (const t of content.topics) {
    const base = { topicId: t.id, topicLabel: t.label, topicTitle: t.title }
    for (const l of t.lessons) {
      items.push({ ...base, kind: 'Lesson', title: l.title, anchor: l.id, text: `${l.title} ${blockText(l.blocks)}` })
    }
    for (const [term, def] of t.aside?.terms || []) {
      items.push({ ...base, kind: 'Term', title: term, snippet: def, text: `${term} ${def}` })
    }
    for (const q of t.quiz || []) items.push({ ...base, kind: 'Quiz', title: q.q, text: q.q })
    for (const iv of t.interview || []) items.push({ ...base, kind: 'Interview', title: iv.q, text: iv.q })
    if (t.capstone) items.push({ ...base, kind: 'Capstone', title: t.capstone.title, anchor: t.capstone.id, text: `${t.capstone.title} ${blockText(t.capstone.blocks)}` })
  }
  for (const c of content.sql.challenges) {
    const t = content.topics.find((x) => x.id === 'sql')
    items.push({ topicId: 'sql', topicLabel: t.label, topicTitle: t.title, kind: 'SQL challenge', title: c.title, snippet: c.prompt, text: `${c.title} ${c.prompt}` })
  }
  for (const e of content.python.exercises) {
    const t = content.topics.find((x) => x.id === 'python')
    items.push({ topicId: 'python', topicLabel: t.label, topicTitle: t.title, kind: 'pandas exercise', title: e.title, snippet: e.prompt, text: `${e.title} ${e.prompt}` })
  }
  return items
}

export default function Search() {
  const content = useContent()
  const location = useLocation()
  const q = (new URLSearchParams(location.search).get('q') || '').trim()
  const index = useMemo(() => buildIndex(content), [content])

  const results = useMemo(() => {
    if (!q) return []
    const needle = q.toLowerCase()
    return index
      .filter((it) => it.text.toLowerCase().includes(needle))
      .slice(0, 60)
  }, [index, q])

  return (
    <div className="search-page">
      <h1>Search</h1>
      {!q && <p className="topic-blurb">Type in the search box above to find any lesson, key term, quiz question, or challenge across all tracks.</p>}
      {q && <p className="topic-blurb">{results.length} result{results.length === 1 ? '' : 's'} for “{q}”</p>}

      <div className="search-results">
        {results.map((r, i) => {
          const to = r.anchor ? `/topic/${r.topicId}#${r.anchor}` : `/topic/${r.topicId}`
          return (
            <Link key={i} to={to} className="card search-result">
              <div className="search-result-head">
                <span className="track-label">{r.topicLabel}</span>
                <span className="search-kind">{r.kind}</span>
              </div>
              <strong>{r.title}</strong>
              {r.snippet && <span className="search-snippet">{r.snippet}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
