import { Link } from 'react-router-dom'
import { useContent } from '../components/ContentContext.jsx'
import { topicProgress, overallProgress } from '../data/items.js'
import { useProgress } from '../components/ProgressContext.jsx'
import { useAuth } from '../components/AuthContext.jsx'
import { useStats } from '../components/StatsContext.jsx'
import { getStreak, getActiveDaysThisWeek, getRecentTracks } from '../data/activity.js'

export default function Home() {
  const content = useContent()
  const { isDone } = useProgress()
  const { isAuthed } = useAuth()
  const { stats } = useStats()
  const overall = overallProgress(content, isDone)

  // Prefer server stats when signed in; fall back to localStorage when not.
  const streak = stats ? stats.streak : getStreak()
  const weekDays = getActiveDaysThisWeek()
  const goalDone = stats ? stats.todayCount : 0
  const goalTarget = stats ? stats.dailyGoal : 3
  const recent = getRecentTracks()
    .map((id) => content.topics.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 4)

  return (
    <div className="home">
      <header className="hero">
        <h1>Data Analytics Academy</h1>
        <p className="hero-sub">
          A hands-on path from mid-level to fluent: deep SQL, statistics &amp; A/B testing, pandas,
          data modeling, storytelling, Power BI, visualization, and analytics engineering — with live
          practice, interview questions, and a capstone in every track.
        </p>
        <div className="progress-line big">
          <div className="bar"><div className="bar-fill" style={{ width: `${overall.pct}%` }} /></div>
          <span className="progress-label">{overall.done}/{overall.total} complete · {overall.pct}%</span>
        </div>
        {!isAuthed && (
          <p className="hero-note">
            <Link to="/login">Sign in</Link> to sync your progress across devices.
          </p>
        )}
      </header>

      <div className="widgets">
        <div className="card widget">
          <div className="widget-value">{overall.pct}%</div>
          <div className="widget-label">Overall complete</div>
        </div>
        <div className="card widget">
          <div className="widget-value">{streak}</div>
          <div className="widget-label">Day streak</div>
        </div>
        {isAuthed ? (
          <div className="card widget">
            <div className="widget-value">{goalDone}<span className="widget-unit">/{goalTarget}</span></div>
            <div className="widget-label">Today's goal</div>
          </div>
        ) : (
          <div className="card widget">
            <div className="widget-value">{weekDays}<span className="widget-unit">/7</span></div>
            <div className="widget-label">Active days this week</div>
          </div>
        )}
        <div className="card widget">
          <div className="widget-value">{stats ? stats.xp : overall.done}</div>
          <div className="widget-label">{stats ? 'Total XP' : 'Items completed'}</div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="recent-row">
          <span className="recent-label">Recently viewed</span>
          {recent.map((t) => (
            <Link key={t.id} to={`/topic/${t.id}`} className="recent-chip">
              <span className="track-label">{t.label}</span>
              {t.title}
            </Link>
          ))}
        </div>
      )}

      <h2 className="section-title">Your roadmap</h2>
      <p className="roadmap-note">Follow this order — each track builds on the last. SQL and statistics are the biggest unlocks.</p>

      <ol className="roadmap">
        {content.roadmap.map((id, i) => {
          const t = content.topics.find((x) => x.id === id)
          const p = topicProgress(content, id, isDone)
          return (
            <li key={id}>
              <Link to={`/topic/${id}`} className="roadmap-card card">
                <span className="step-num">{i + 1}</span>
                <span className="track-label">{t.label}</span>
                <span className="roadmap-main">
                  <strong>{t.title}</strong>
                  <span className="roadmap-blurb">{t.blurb}</span>
                  <span className="mini-bar"><span className="mini-fill" style={{ width: `${p.pct}%` }} /></span>
                </span>
                <span className="roadmap-pct">{p.pct}%</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
