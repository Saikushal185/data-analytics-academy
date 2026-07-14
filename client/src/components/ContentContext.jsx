import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from './AuthContext.jsx'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const { isAuthed } = useAuth()
  const [baseContent, setBaseContent] = useState(null)
  const [customTopics, setCustomTopics] = useState([])
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      const base = await api.getContent()
      setBaseContent(base)
      if (isAuthed) setCustomTopics(await api.getCustomTracks())
      else setCustomTopics([])
    } catch (e) {
      setError(e.message)
    }
  }, [isAuthed])

  useEffect(() => { load() }, [load])

  const content = useMemo(() => {
    if (!baseContent) return null
    return {
      ...baseContent,
      topics: [...baseContent.topics, ...customTopics],
      roadmap: [...baseContent.roadmap, ...customTopics.map((topic) => topic.id)],
      customTopics,
      generating,
      generateCustomTopic: async (topicName) => {
        if (generating) return null
        setGenerating(true)
        try {
          const topic = await api.generateCustomTrack(topicName)
          setCustomTopics((prev) => [topic, ...prev])
          return topic
        } finally {
          setGenerating(false)
        }
      },
      deleteCustomTopic: async (topic) => {
        const customId = topic.customId || String(topic.id).replace(/^custom-/, '')
        await api.deleteCustomTrack(customId)
        setCustomTopics((prev) => prev.filter((item) => item.customId !== Number(customId) && String(item.customId) !== String(customId)))
      },
      refetchContent: load
    }
  }, [baseContent, customTopics, generating, load])

  if (error) return <div className="boot-msg">Could not load content: {error}. Is the server running?</div>
  if (!content) return <div className="boot-msg">Loading…</div>

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
