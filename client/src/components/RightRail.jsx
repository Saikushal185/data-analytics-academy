import { useLocation, Link } from 'react-router-dom'
import { useContent } from './ContentContext.jsx'
import { useProgress } from './ProgressContext.jsx'
import { topicProgress, overallProgress, itemsForTopic } from '../data/items.js'
import { resourcesByTrack } from '../data/resources.js'

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const STUDY_TIPS = [
  'Do the practice before reading the answer — retrieval beats re-reading.',
  'Teach a concept out loud as if to a colleague; gaps surface fast.',
  'Space your reviews: revisit a track a day later, then a week later.',
  'Type every code example yourself instead of copy-pasting.',
  'Finish one track before starting the next — depth beats breadth.',
]

function TopicRail({ topicId }) {
  const content = useContent()
  const { isDone } = useProgress()
  const topic = content.topics.find((t) => t.id === topicId)
  if (!topic) return null
  const p = topicProgress(content, topicId, isDone)

  return (
    <>
      <div className="rail-card">
        <div className="rail-title">Progress</div>
        <div className="rail-bar"><div className="rail-fill" style={{ width: `${p.pct}%` }} /></div>
        <div className="rail-meta">{p.done} of {p.total} items · {p.pct}%</div>
      </div>

      <div className="rail-card">
        <div className="rail-title">On this page</div>
        <ul className="rail-outline">
          {topic.lessons.map((l) => (
            <li key={l.id}>
              <button className="rail-link" onClick={() => scrollTo(l.id)}>
                {isDone(l.id) ? <span className="rail-dot done" /> : <span className="rail-dot" />}
                {l.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {topic.aside && (
        <div className="rail-card">
          <div className="rail-title">Key terms</div>
          <dl className="rail-glossary">
            {topic.aside.terms.map(([term, def]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {topic.aside?.tip && (
        <div className="rail-card rail-tip">
          <div className="rail-title">Tip</div>
          <p>{topic.aside.tip}</p>
        </div>
      )}

      {resourcesByTrack[topicId] && (
        <div className="rail-card">
          <div className="rail-title">Learn more</div>
          <ul className="rail-resources">
            {resourcesByTrack[topicId].map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a>
                <span className="rail-res-type">{r.type === 'youtube' ? 'YT' : 'web'}</span>
              </li>
            ))}
          </ul>
          <Link to="/reference" className="rail-more-link">All resources →</Link>
        </div>
      )}
    </>
  )
}

function HomeRail() {
  const content = useContent()
  const { isDone } = useProgress()
  const overall = overallProgress(content, isDone)

  // Next-up = first track that isn't finished, in roadmap order.
  const nextId = content.roadmap.find((id) => topicProgress(content, id, isDone).pct < 100)
  const next = nextId && content.topics.find((t) => t.id === nextId)

  const totalItems = content.topics.reduce((n, t) => n + itemsForTopic(content, t.id).length, 0)

  return (
    <>
      <div className="rail-card">
        <div className="rail-title">Overall progress</div>
        <div className="rail-bar"><div className="rail-fill" style={{ width: `${overall.pct}%` }} /></div>
        <div className="rail-meta">{overall.done} of {overall.total} items · {overall.pct}%</div>
      </div>

      {next && (
        <div className="rail-card">
          <div className="rail-title">Continue learning</div>
          <Link to={`/topic/${next.id}`} className="rail-next">
            <span className="track-label">{next.label}</span>
            <strong>{next.title}</strong>
          </Link>
        </div>
      )}

      <div className="rail-card">
        <div className="rail-title">By the numbers</div>
        <ul className="rail-stats">
          <li><strong>{content.topics.length}</strong> tracks</li>
          <li><strong>{content.sql.challenges.length}</strong> SQL challenges</li>
          <li><strong>{content.python.exercises.length}</strong> pandas exercises</li>
          <li><strong>{totalItems}</strong> total items to master</li>
        </ul>
      </div>

      <div className="rail-card rail-tip">
        <div className="rail-title">How to study</div>
        <ul className="rail-tips">
          {STUDY_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </>
  )
}

export default function RightRail() {
  const { pathname } = useLocation()

  let body = null
  if (pathname === '/') body = <HomeRail />
  else if (pathname.startsWith('/topic/')) body = <TopicRail topicId={pathname.split('/topic/')[1]} />
  else return null // no rail on auth pages

  return <aside className="rail">{body}</aside>
}
