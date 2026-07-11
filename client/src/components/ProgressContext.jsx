import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../api.js'
import { useAuth } from './AuthContext.jsx'
import { useStats } from './StatsContext.jsx'
import { useToast } from './ToastContext.jsx'
import { recordActiveDay } from '../data/activity.js'

const KEY = 'daa-progress-v1'
const ProgressContext = createContext(null)

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function ProgressProvider({ children }) {
  const { isAuthed } = useAuth()
  const { applyStats } = useStats()
  const { addToast } = useToast()
  const [done, setDone] = useState(loadLocal)
  const syncedFor = useRef(null)

  // Apply XP/badge feedback from a progress-mutation response.
  const handleResp = useCallback(
    (resp) => {
      if (!resp) return
      applyStats(resp.stats)
      if (resp.xpAwarded) addToast({ kind: 'xp', title: `+${resp.xpAwarded} XP` })
      for (const b of resp.newBadges || [])
        addToast({ kind: 'badge', title: 'Badge unlocked', body: b.name, duration: 6000 })
    },
    [applyStats, addToast]
  )

  // Persist to localStorage as a cache/offline fallback.
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(done))
  }, [done])

  // On login, merge local progress into the server then hydrate from it.
  useEffect(() => {
    if (!isAuthed) {
      syncedFor.current = null
      return
    }
    if (syncedFor.current === 'authed') return
    syncedFor.current = 'authed'
    const localIds = Object.keys(loadLocal())
    api
      .mergeProgress(localIds)
      .then((resp) => {
        setDone(Object.fromEntries(resp.items.map((id) => [id, true])))
        applyStats(resp.stats)
      })
      .catch(() => {})
  }, [isAuthed, applyStats])

  const complete = useCallback(
    (id) => {
      setDone((d) => (d[id] ? d : { ...d, [id]: true }))
      recordActiveDay()
      if (isAuthed) api.addProgress(id).then(handleResp).catch(() => {})
    },
    [isAuthed, handleResp]
  )

  const toggle = useCallback(
    (id) => {
      let wasDone
      setDone((d) => {
        const next = { ...d }
        wasDone = !!next[id]
        if (wasDone) delete next[id]
        else next[id] = true
        return next
      })
      if (!wasDone) recordActiveDay()
      if (isAuthed) {
        const call = wasDone ? api.removeProgress(id) : api.addProgress(id)
        call.then(handleResp).catch(() => {})
      }
    },
    [isAuthed, handleResp]
  )

  const reset = useCallback(() => {
    setDone((d) => {
      if (isAuthed) Object.keys(d).forEach((id) => api.removeProgress(id).catch(() => {}))
      return {}
    })
  }, [isAuthed])

  const isDone = useCallback((id) => !!done[id], [done])

  return (
    <ProgressContext.Provider value={{ done, isDone, complete, toggle, reset }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
