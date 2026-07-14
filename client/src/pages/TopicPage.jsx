import { useEffect } from 'react'
import { useParams, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useContent } from '../components/ContentContext.jsx'
import { recordVisit } from '../data/activity.js'
import { topicProgress } from '../data/items.js'
import { useProgress } from '../components/ProgressContext.jsx'
import Lesson from '../components/Lesson.jsx'
import Quiz from '../components/Quiz.jsx'
import Interview from '../components/Interview.jsx'
import SqlPlayground from '../components/SqlPlayground.jsx'
import PyPlayground from '../components/PyPlayground.jsx'

export default function TopicPage() {
  const { topicId } = useParams()
  const content = useContent()
  const location = useLocation()
  const navigate = useNavigate()
  const { isDone } = useProgress()
  const topic = content.topics.find((t) => t.id === topicId)

  useEffect(() => {
    if (topic) recordVisit(topic.id)
  }, [topic])

  // Scroll to a lesson anchor when arriving via a #hash (search / reference links).
  useEffect(() => {
    if (!topic) return
    const id = location.hash.replace('#', '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [topic, location.hash])

  if (!topic) return <Navigate to="/" replace />

  const p = topicProgress(content, topicId, isDone)

  async function handleDelete() {
    if (!topic.isCustom) return
    if (!confirm(`Delete "${topic.title}"? This cannot be undone.`)) return
    await content.deleteCustomTopic(topic)
    navigate('/')
  }

  return (
    <div className="topic-page">
      <header className="topic-header">
        <span className="track-label">{topic.label}</span>
        <h1>{topic.title}</h1>
        <p className="topic-blurb">{topic.blurb}</p>
        <div className="progress-line">
          <div className="bar"><div className="bar-fill" style={{ width: `${p.pct}%` }} /></div>
          <span className="progress-label">{p.done}/{p.total} done · {p.pct}%</span>
        </div>
        {topic.isCustom && (
          <button className="delete-track-btn" onClick={handleDelete}>
            Delete topic
          </button>
        )}
      </header>

      <section>
        <h2 className="section-title">Lessons</h2>
        {topic.lessons.map((l) => <Lesson key={l.id} lesson={l} />)}
      </section>

      {topicId === 'sql' && (
        <section>
          <h2 className="section-title">SQL Playground</h2>
          <SqlPlayground />
        </section>
      )}

      {topicId === 'python' && (
        <section>
          <h2 className="section-title">pandas Exercises</h2>
          <PyPlayground />
        </section>
      )}

      {topic.quiz && topic.quiz.length > 0 && (
        <section>
          <h2 className="section-title">Quiz</h2>
          <Quiz items={topic.quiz} />
        </section>
      )}

      {topic.interview && topic.interview.length > 0 && (
        <section>
          <h2 className="section-title">Interview Questions</h2>
          <Interview items={topic.interview} />
        </section>
      )}

      {topic.capstone && (
        <section>
          <h2 className="section-title">Capstone</h2>
          <Lesson lesson={topic.capstone} />
        </section>
      )}
    </div>
  )
}
