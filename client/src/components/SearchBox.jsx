import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SearchBox() {
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')

  // Keep the box in sync if the URL query changes (e.g. back button).
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search)
      setQ(params.get('q') || '')
    }
  }, [location])

  function onChange(e) {
    const value = e.target.value
    setQ(value)
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value)}`, { replace: location.pathname === '/search' })
  }

  function onSubmit(e) {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form className="searchbox" onSubmit={onSubmit} role="search">
      <input
        type="search"
        value={q}
        onChange={onChange}
        placeholder="Search lessons, terms, challenges…"
        aria-label="Search"
      />
    </form>
  )
}
