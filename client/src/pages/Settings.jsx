import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../components/AuthContext.jsx'
import { useStats } from '../components/StatsContext.jsx'
import { useTheme } from '../components/ThemeContext.jsx'

export default function Settings() {
  const { isAuthed, email, logout } = useAuth()
  const { stats, applyStats } = useStats()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState(stats?.displayName || '')
  const [goal, setGoal] = useState(stats?.dailyGoal || 3)
  const [msg, setMsg] = useState(null)
  const [pw, setPw] = useState({ cur: '', next: '' })
  const [pwMsg, setPwMsg] = useState(null)

  if (!isAuthed) {
    navigate('/login')
    return null
  }

  async function savePrefs(e) {
    e.preventDefault()
    setMsg(null)
    try {
      const s = await api.setPrefs({ display_name: name, daily_goal: goal, theme })
      applyStats(s)
      setMsg('Saved.')
    } catch (err) {
      setMsg(err.message)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg(null)
    try {
      await api.changePassword(pw.cur, pw.next)
      setPw({ cur: '', next: '' })
      setPwMsg('Password changed.')
    } catch (err) {
      setPwMsg(err.message)
    }
  }

  async function deleteAccount() {
    if (!confirm('Delete your account and all progress? This cannot be undone.')) return
    try {
      await api.deleteAccount()
      logout()
      navigate('/')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p className="topic-blurb">Signed in as {email}</p>

      <form className="card settings-form" onSubmit={savePrefs}>
        <h3>Profile &amp; preferences</h3>
        <label>Display name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label>Daily goal (items/day)
          <input type="number" min="1" max="20" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <label>Theme
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit">Save</button>
          {msg && <span className="status">{msg}</span>}
        </div>
      </form>

      <form className="card settings-form" onSubmit={changePassword}>
        <h3>Change password</h3>
        <label>Current password
          <input type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} required />
        </label>
        <label>New password
          <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={6} />
        </label>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit">Update password</button>
          {pwMsg && <span className="status">{pwMsg}</span>}
        </div>
      </form>

      <div className="card settings-form danger">
        <h3>Danger zone</h3>
        <p className="topic-blurb">Permanently delete your account and all progress.</p>
        <button className="btn btn-danger" onClick={deleteAccount}>Delete account</button>
      </div>
    </div>
  )
}
