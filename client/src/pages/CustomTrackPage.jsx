import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useCustomTracks } from '../components/CustomTracksContext.jsx'
import CustomLesson from '../components/CustomLesson.jsx'
import CustomQuiz from '../components/CustomQuiz.jsx'

function SrsCards({ cards }) {
  const [flipped, setFlipped] = useState({})
  if (!cards || !cards.length) return null

  return (
    <div className="srs-cards-section">
      <h4 className="module-sub-title">Review Cards</h4>
      <div className="srs-cards-grid">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`card srs-card ${flipped[i] ? 'srs-flipped' : ''}`}
            onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
          >
            <div className="srs-front">{card.front}</div>
            {flipped[i] && <div className="srs-back">{card.back}</div>}
            {!flipped[i] && <div className="srs-tap">Tap to reveal</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Module({ mod, trackId, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`module-accordion ${open ? 'module-open' : ''}`}>
      <button className="module-toggle" onClick={() => setOpen(!open)}>
        <span className="module-order">M{mod.order_index}</span>
        <span className="module-title-text">{mod.title}</span>
        <span className="module-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="module-body">
          {mod.lessons && mod.lessons.length > 0 && (
            <div className="module-lessons">
              {mod.lessons.map((lesson, lIdx) => (
                <CustomLesson
                  key={lIdx}
                  lesson={lesson}
                  lessonId={`custom-lesson-${trackId}-${mod.id}-${lIdx}`}
                />
              ))}
            </div>
          )}

          {mod.quiz_questions && mod.quiz_questions.length > 0 && (
            <div className="module-quiz">
              <h4 className="module-sub-title">Quiz</h4>
              <CustomQuiz items={mod.quiz_questions} trackId={trackId} moduleId={mod.id} />
            </div>
          )}

          <SrsCards cards={mod.srs_cards} />
        </div>
      )}
    </div>
  )
}

const DIFF_COLORS = {
  beginner: 'diff-beginner',
  intermediate: 'diff-intermediate',
  advanced: 'diff-advanced',
}

export default function CustomTrackPage() {
  const { trackId } = useParams()
  const navigate = useNavigate()
  const { tracks, deleteTrack } = useCustomTracks()
  const track = tracks.find((t) => String(t.id) === trackId)

  if (!track) return <Navigate to="/" replace />

  async function handleDelete() {
    if (!confirm(`Delete "${track.title}"? This cannot be undone.`)) return
    await deleteTrack(track.id)
    navigate('/')
  }

  return (
    <div className="topic-page custom-track-page">
      <header className="topic-header">
        <div className="custom-track-meta">
          <span className="track-label custom-label">{track.tag}</span>
          <span className={`difficulty-badge ${DIFF_COLORS[track.difficulty] || ''}`}>
            {track.difficulty}
          </span>
        </div>
        <h1>{track.title}</h1>
        <p className="topic-blurb">{track.description}</p>
        <button className="delete-track-btn" onClick={handleDelete}>
          Delete track
        </button>
      </header>

      <section>
        <h2 className="section-title">Modules</h2>
        {track.modules && track.modules.map((mod, i) => (
          <Module
            key={mod.id || i}
            mod={mod}
            trackId={track.id}
            defaultOpen={i === 0}
          />
        ))}
      </section>

      {track.quiz_questions && track.quiz_questions.length > 0 && (
        <section>
          <h2 className="section-title">Track Quiz</h2>
          <CustomQuiz items={track.quiz_questions} trackId={track.id} moduleId="track" />
        </section>
      )}
    </div>
  )
}
