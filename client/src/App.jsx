import { Routes, Route, NavLink, Link } from 'react-router-dom'
import { useContent } from './components/ContentContext.jsx'
import { topicProgress, overallProgress } from './data/items.js'
import { useProgress } from './components/ProgressContext.jsx'
import { useAuth } from './components/AuthContext.jsx'
import { useStats } from './components/StatsContext.jsx'
import { useTheme } from './components/ThemeContext.jsx'
import Home from './pages/Home.jsx'
import TopicPage from './pages/TopicPage.jsx'
import Login from './pages/Login.jsx'
import Search from './pages/Search.jsx'
import Reference from './pages/Reference.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Settings from './pages/Settings.jsx'
import Review from './pages/Review.jsx'
import RightRail from './components/RightRail.jsx'
import SearchBox from './components/SearchBox.jsx'
import Tutor from './components/Tutor.jsx'

function XpChip() {
  const { stats } = useStats()
  if (!stats) return null
  const pct = Math.round((100 * stats.levelInto) / stats.levelSpan)
  return (
    <Link to="/dashboard" className="xp-chip" title={`${stats.xp} XP`}>
      <span className="xp-level">Lv {stats.level}</span>
      <span className="xp-track"><span className="xp-fill" style={{ width: `${pct}%` }} /></span>
      {stats.streak > 0 && <span className="xp-streak">{stats.streak}d</span>}
    </Link>
  )
}

function ThemeToggle() {
  const { theme, cycle } = useTheme()
  const label = theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'
  return <button className="theme-toggle" onClick={cycle} title="Toggle theme">{label}</button>
}

function AccountArea() {
  const { isAuthed, email, logout } = useAuth()
  return (
    <div className="account">
      <ThemeToggle />
      {isAuthed ? (
        <>
          <XpChip />
          <Link to="/settings" className="account-email" title={email}>{email}</Link>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </>
      ) : (
        <Link to="/login" className="link-btn">Sign in</Link>
      )}
    </div>
  )
}

function Sidebar() {
  const content = useContent()
  const { isDone, reset } = useProgress()
  const { isAuthed } = useAuth()
  const overall = overallProgress(content, isDone)

  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand">Data Analytics Academy</NavLink>
      <nav className="nav">
        <NavLink to="/" end className="nav-item">Home</NavLink>
        {isAuthed && (
          <NavLink to="/dashboard" className="nav-item">
            <span className="nav-label">DASH</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
        )}
        {isAuthed && (
          <NavLink to="/review" className="nav-item">
            <span className="nav-label">REV</span>
            <span className="nav-text">Review (SRS)</span>
          </NavLink>
        )}
        <NavLink to="/reference" className="nav-item">
          <span className="nav-label">REF</span>
          <span className="nav-text">Quick Reference</span>
        </NavLink>
        {content.topics.map((t) => {
          const p = topicProgress(content, t.id, isDone)
          return (
            <NavLink key={t.id} to={`/topic/${t.id}`} className="nav-item">
              <span className="nav-label">{t.label}</span>
              <span className="nav-text">{t.title}</span>
              {p.done > 0 && <span className="nav-pct">{p.pct}%</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="overall-mini">Overall {overall.pct}%</div>
        <button
          className="reset-btn"
          onClick={() => { if (confirm('Reset all progress?')) reset() }}
        >
          Reset progress
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <SearchBox />
          <AccountArea />
        </div>
        <div className="workspace">
          <main className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/search" element={<Search />} />
              <Route path="/reference" element={<Reference />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/review" element={<Review />} />
              <Route path="/topic/:topicId" element={<TopicPage />} />
            </Routes>
          </main>
          <RightRail />
        </div>
      </div>
      <Tutor />
    </div>
  )
}
