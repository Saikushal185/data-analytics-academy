import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../components/AuthContext.jsx'

const GRADES = [
  { q: 2, label: 'Again', cls: 'again' },
  { q: 3, label: 'Hard', cls: 'hard' },
  { q: 4, label: 'Good', cls: 'good' },
  { q: 5, label: 'Easy', cls: 'easy' },
]

export default function Review() {
  const { isAuthed } = useAuth()
  const [queue, setQueue] = useState([])
  const [counts, setCounts] = useState(null)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [doneCount, setDoneCount] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    api.reviewsDue()
      .then((d) => { setQueue(d.cards); setCounts(d.counts); setI(0); setFlipped(false) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (isAuthed) load() }, [isAuthed, load])

  if (!isAuthed)
    return <div className="review-page"><h1>Review</h1><p className="topic-blurb"><Link to="/login">Sign in</Link> to use spaced-repetition review.</p></div>
  if (loading) return <div className="review-page"><h1>Review</h1><p className="topic-blurb">Loading cards…</p></div>

  const card = queue[i]
  if (!card)
    return (
      <div className="review-page">
        <h1>Review</h1>
        <div className="card review-empty">
          <p>{doneCount > 0 ? `Nice — ${doneCount} card(s) reviewed.` : 'No cards due right now.'}</p>
          {counts && <p className="topic-blurb">{counts.learned}/{counts.total} cards learned.</p>}
          <button className="btn btn-primary" onClick={() => { setDoneCount(0); load() }}>Reload</button>
        </div>
      </div>
    )

  async function grade(q) {
    await api.gradeReview(card.id, q).catch(() => {})
    setDoneCount((n) => n + 1)
    if (i + 1 < queue.length) { setI(i + 1); setFlipped(false) }
    else setQueue([]) // finished session
  }

  return (
    <div className="review-page">
      <div className="review-head">
        <h1>Review</h1>
        <span className="review-counter">{i + 1} / {queue.length}{card.isNew && <span className="review-new">new</span>}</span>
      </div>

      <div className="card review-card" onClick={() => setFlipped(true)}>
        <span className="track-label">{card.topicLabel}</span>
        <div className="review-front">{card.front}</div>
        {flipped ? (
          <div className="review-back">{card.back}</div>
        ) : (
          <div className="review-tap">Tap to reveal answer</div>
        )}
      </div>

      {flipped && (
        <div className="review-grades">
          {GRADES.map((g) => (
            <button key={g.q} className={`btn grade-${g.cls}`} onClick={() => grade(g.q)}>{g.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
