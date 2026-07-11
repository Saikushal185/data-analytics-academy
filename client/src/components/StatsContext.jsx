import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import { useAuth } from './AuthContext.jsx'

const StatsContext = createContext(null)

export function StatsProvider({ children }) {
  const { isAuthed } = useAuth()
  const [stats, setStats] = useState(null)

  const refresh = useCallback(() => {
    if (!isAuthed) {
      setStats(null)
      return
    }
    api.getStats().then(setStats).catch(() => {})
  }, [isAuthed])

  useEffect(() => { refresh() }, [refresh])

  // Apply a stats object returned by a progress mutation (avoids a refetch).
  const applyStats = useCallback((s) => { if (s) setStats(s) }, [])

  return (
    <StatsContext.Provider value={{ stats, refresh, applyStats }}>
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats must be used within StatsProvider')
  return ctx
}
