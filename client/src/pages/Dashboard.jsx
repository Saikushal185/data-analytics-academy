import { Link } from 'react-router-dom'
import { useContent } from '../components/ContentContext.jsx'
import { useStats } from '../components/StatsContext.jsx'
import { useProgress } from '../components/ProgressContext.jsx'
import { useAuth } from '../components/AuthContext.jsx'
import { topicProgress } from '../data/items.js'

// 12-week activity heatmap (GitHub-style) from the activity day list.
function Heatmap({ activity }) {
  const counts = Object.fromEntries((activity || []).map((a) => [a.day, a.count]))
  const weeks = 13
  const cells = []
  const today = new Date()
  // Start on the Sunday weeks ago.
  const start = new Date(today)
  start.setDate(start.getDate() - (weeks * 7 - 1))
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    cells.push({ key, count: counts[key] || 0, col: Math.floor(i / 7), row: i % 7 })
  }
  const level = (c) => (c === 0 ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 7 ? 3 : 4)
  const size = 13, gap = 3
  return (
    <svg className="heatmap" width={weeks * size + 8} height={7 * size + 8} role="img" aria-label="Activity heatmap">
      {cells.map((c) => (
        <rect
          key={c.key}
          x={c.col * size + 2}
          y={c.row * size + 2}
          width={size - gap}
          height={size - gap}
          rx="2"
          className={`hm-l${level(c.count)}`}
        >
          <title>{c.key}: {c.count} item(s)</title>
        </rect>
      ))}
    </svg>
  )
}

function Ring({ pct, label, value }) {
  const r = 30, c = 2 * Math.PI * r
  return (
    <div className="ring-stat">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} className="ring-bg" />
        <circle
          cx="38" cy="38" r={r} className="ring-fg"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          transform="rotate(-90 38 38)"
        />
        <text x="38" y="43" textAnchor="middle" className="ring-text">{value}</text>
      </svg>
      <span className="ring-label">{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const content = useContent()
  const { stats } = useStats()
  const { isDone } = useProgress()
  const { isAuthed } = useAuth()

  if (!isAuthed) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="topic-blurb"><Link to="/login">Sign in</Link> to track XP, streaks, badges, and your activity over time.</p>
      </div>
    )
  }
  if (!stats) return <div className="dashboard"><h1>Dashboard</h1><p className="topic-blurb">Loading your stats…</p></div>

  const levelPct = Math.round((100 * stats.levelInto) / stats.levelSpan)
  const goalPct = Math.min(100, Math.round((100 * stats.todayCount) / stats.dailyGoal))
  const accByTopic = Object.fromEntries((stats.quizAccuracy || []).map((a) => [a.topic, a]))

  return (
    <div className="dashboard">
      <h1>Your Dashboard</h1>

      <div className="dash-rings">
        <Ring pct={levelPct} label={`Level ${stats.level} · ${stats.xp} XP`} value={`Lv${stats.level}`} />
        <Ring pct={goalPct} label={`Daily goal ${stats.todayCount}/${stats.dailyGoal}`} value={`${stats.todayCount}/${stats.dailyGoal}`} />
        <Ring pct={Math.min(100, stats.streak * 10)} label="Day streak" value={`${stats.streak}d`} />
        <Ring pct={100} label="Items done" value={stats.doneCount} />
      </div>

      <h2 className="section-title">Activity</h2>
      <div className="card heatmap-card">
        <Heatmap activity={stats.activity} />
        <div className="heatmap-legend">Less <span className="hm-l0" /><span className="hm-l1" /><span className="hm-l2" /><span className="hm-l3" /><span className="hm-l4" /> More</div>
      </div>

      <h2 className="section-title">Mastery by track</h2>
      <div className="card mastery">
        {content.topics.map((t) => {
          const p = topicProgress(content, t.id, isDone)
          const acc = accByTopic[t.id]
          return (
            <Link to={`/topic/${t.id}`} key={t.id} className="mastery-row">
              <span className="mastery-label"><span className="track-label">{t.label}</span> {t.title}</span>
              <span className="mastery-bar"><span className="mastery-fill" style={{ width: `${p.pct}%` }} /></span>
              <span className="mastery-pct">{p.pct}%</span>
              {acc && <span className="mastery-acc">{Math.round((100 * acc.correct) / acc.total)}% quiz</span>}
            </Link>
          )
        })}
      </div>

      <h2 className="section-title">Badges ({stats.badges.length}/{stats.allBadges.length})</h2>
      <div className="badges-grid">
        {stats.allBadges.map((b) => (
          <div key={b.id} className={`card badge ${b.owned ? 'earned' : 'locked'}`}>
            <div className="badge-name">{b.name}</div>
            <div className="badge-desc">{b.desc}</div>
            <div className="badge-state">{b.owned ? 'Earned' : 'Locked'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
