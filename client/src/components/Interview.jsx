import { useState } from 'react'
import { useProgress } from './ProgressContext.jsx'

function InterviewQ({ item }) {
  const { isDone, complete } = useProgress()
  const [open, setOpen] = useState(false)

  function reveal() {
    setOpen(true)
    complete(item.id)
  }

  return (
    <div className={`card interview-q ${isDone(item.id) ? 'is-done' : ''}`}>
      <p className="interview-prompt">{item.q}</p>
      {open ? (
        <div className="interview-answer">
          <span className="answer-label">Model answer</span>
          <p>{item.a}</p>
        </div>
      ) : (
        <button className="btn" onClick={reveal}>
          Show model answer
        </button>
      )}
    </div>
  )
}

export default function Interview({ items }) {
  if (!items || !items.length) return null
  return (
    <div className="interview">
      <p className="section-note">
        Try to answer each out loud first, then reveal a model answer to compare.
      </p>
      {items.map((item) => (
        <InterviewQ key={item.id} item={item} />
      ))}
    </div>
  )
}
