import { Link } from 'react-router-dom'
import { useContent } from '../components/ContentContext.jsx'
import { generalResources, resourcesByTrack } from '../data/resources.js'

function ResourceLink({ r }) {
  return (
    <a className="resource" href={r.url} target="_blank" rel="noopener noreferrer">
      <span className="resource-type">{r.type === 'youtube' ? 'YouTube' : 'Site'}</span>
      <span className="resource-body">
        <strong>{r.name}</strong>
        <span className="resource-note">{r.note}</span>
      </span>
    </a>
  )
}

export default function Reference() {
  const content = useContent()

  // A–Z glossary aggregated from every track's key terms.
  const glossary = []
  for (const t of content.topics) {
    for (const [term, def] of t.aside?.terms || []) {
      glossary.push({ term, def, topicId: t.id, label: t.label })
    }
  }
  glossary.sort((a, b) => a.term.localeCompare(b.term))

  // Cheat-sheet lessons exist in every track as `<id>-cheatsheet`.
  const cheatsheets = content.topics
    .map((t) => {
      const cs = t.lessons.find((l) => l.id.endsWith('-cheatsheet'))
      return cs ? { topicId: t.id, label: t.label, title: t.title, anchor: cs.id } : null
    })
    .filter(Boolean)

  return (
    <div className="reference-page">
      <h1>Quick Reference</h1>
      <p className="topic-blurb">A glossary of every key term and a jump-list to each track’s cheat sheet.</p>

      <h2 className="section-title">Cheat sheets</h2>
      <div className="cheatsheet-grid">
        {cheatsheets.map((c) => (
          <Link key={c.topicId} to={`/topic/${c.topicId}#${c.anchor}`} className="card cheatsheet-link">
            <span className="track-label">{c.label}</span>
            <strong>{c.title}</strong>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Learn more — websites &amp; YouTube</h2>
      <p className="topic-blurb">Hand-picked free resources to go deeper than this course.</p>
      <div className="resource-group">
        <h3 className="resource-heading">General &amp; career</h3>
        <div className="resource-list">
          {generalResources.map((r) => <ResourceLink key={r.url} r={r} />)}
        </div>
      </div>
      {content.topics.map((t) => {
        const list = resourcesByTrack[t.id]
        if (!list) return null
        return (
          <div key={t.id} className="resource-group">
            <h3 className="resource-heading">
              <span className="track-label">{t.label}</span> {t.title}
            </h3>
            <div className="resource-list">
              {list.map((r) => <ResourceLink key={r.url} r={r} />)}
            </div>
          </div>
        )
      })}

      <h2 className="section-title">Glossary ({glossary.length} terms)</h2>
      <dl className="glossary-full">
        {glossary.map((g, i) => (
          <div key={i} className="card glossary-row">
            <dt>
              {g.term}
              <Link to={`/topic/${g.topicId}`} className="track-label glossary-track">{g.label}</Link>
            </dt>
            <dd>{g.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
