import { useState } from 'react'
import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom'
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
import { useToast } from './components/ToastContext.jsx'

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

function GenerateForm() {
  const content = useContent()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const t = topic.trim()
    if (!t) return
    try {
      const result = await content.generateCustomTopic(t)
      if (result) {
        setTopic('')
        setShowForm(false)
        addToast({ title: 'Topic generated' })
        navigate(`/topic/${result.id}`)
      }
    } catch (err) {
      addToast({ title: err.message || 'Generation failed. Is Ollama running?' })
    }
  }

  if (!showForm) {
    return (
      <button className="generate-toggle" onClick={() => setShowForm(true)}>
        + Generate
      </button>
    )
  }

  return (
    <form className="generate-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="generate-input"
        placeholder="e.g. Machine Learning"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        disabled={content.generating}
        autoFocus
      />
      <div className="generate-actions">
        <button type="submit" className="generate-btn" disabled={content.generating || !topic.trim()}>
          {content.generating ? 'Generating…' : 'Create'}
        </button>
        <button type="button" className="generate-cancel" onClick={() => setShowForm(false)} disabled={content.generating}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function Sidebar({ isOpen, onClose }) {
  const content = useContent()
  const { isDone, reset } = useProgress()
  const { isAuthed } = useAuth()
  const overall = overallProgress(content, isDone)

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <NavLink to="/" className="brand" onClick={(e) => e.stopPropagation()}>Data Analytics Academy</NavLink>
      <nav className="nav" onClick={(e) => e.stopPropagation()}>
        <NavLink to="/" end className="nav-item" onClick={onClose}>Home</NavLink>
        {isAuthed && (
          <NavLink to="/dashboard" className="nav-item" onClick={onClose}>
            <span className="nav-label">DASH</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
        )}
        {isAuthed && (
          <NavLink to="/review" className="nav-item" onClick={onClose}>
            <span className="nav-label">REV</span>
            <span className="nav-text">Review (SRS)</span>
          </NavLink>
        )}
        <NavLink to="/reference" className="nav-item" onClick={onClose}>
          <span className="nav-label">REF</span>
          <span className="nav-text">Quick Reference</span>
        </NavLink>
        {content.topics.map((t) => {
          const p = topicProgress(content, t.id, isDone)
          return (
            <NavLink key={t.id} to={`/topic/${t.id}`} className="nav-item" onClick={onClose}>
              <span className="nav-label">{t.label}</span>
              <span className="nav-text">{t.title}</span>
              {p.done > 0 && <span className="nav-pct">{p.pct}%</span>}
            </NavLink>
          )
        })}

        {isAuthed && <GenerateForm />}
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main">
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
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
