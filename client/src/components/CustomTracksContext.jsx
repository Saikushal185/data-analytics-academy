import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'

const CustomTracksContext = createContext(null)

export function CustomTracksProvider({ children }) {
  const { isAuthed } = useAuth()
  const { toast } = useToast()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchTracks = useCallback(() => {
    if (!isAuthed) { setTracks([]); return }
    setLoading(true)
    api.getCustomTracks()
      .then(setTracks)
      .catch(() => setTracks([]))
      .finally(() => setLoading(false))
  }, [isAuthed])

  useEffect(() => { fetchTracks() }, [fetchTracks])

  async function generate(topic) {
    if (generating) return null
    setGenerating(true)
    try {
      const track = await api.generateCustomTrack(topic)
      setTracks((prev) => [track, ...prev])
      toast('Track generated!')
      return track
    } catch (err) {
      toast(err.message || 'Generation failed. Is Ollama running?')
      return null
    } finally {
      setGenerating(false)
    }
  }

  async function deleteTrack(id) {
    try {
      await api.deleteCustomTrack(id)
      setTracks((prev) => prev.filter((t) => t.id !== id))
      toast('Track deleted.')
    } catch (err) {
      toast(err.message || 'Delete failed.')
    }
  }

  return (
    <CustomTracksContext.Provider value={{ tracks, loading, generating, generate, deleteTrack, refetch: fetchTracks }}>
      {children}
    </CustomTracksContext.Provider>
  )
}

export function useCustomTracks() {
  const ctx = useContext(CustomTracksContext)
  if (!ctx) throw new Error('useCustomTracks must be used within CustomTracksProvider')
  return ctx
}
