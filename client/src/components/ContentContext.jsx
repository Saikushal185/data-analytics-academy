import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getContent().then(setContent).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="boot-msg">Could not load content: {error}. Is the server running?</div>
  if (!content) return <div className="boot-msg">Loading…</div>

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
