import { useState } from 'react'
import { useProgress } from './ProgressContext.jsx'
import { useAuth } from './AuthContext.jsx'
import { api } from '../api.js'

function Question({ item }) {
  const { isDone, complete } = useProgress()
  const { isAuthed } = useAuth()
  const [picked, setPicked] = useState(null)
  const answered = picked !== null
  const correct = answered && picked === item.answer

  function choose(i) {
    if (answered) return
    setPicked(i)
    const right = i === item.answer
    if (right) complete(item.id)
    if (isAuthed) api.recordAttempt(item.id, right).catch(() => {})
  }

  return (
    <div className={`card quiz-q ${isDone(item.id) ? 'is-done' : ''}`}>
      <p className="quiz-prompt">
        {item.q} {isDone(item.id) && <span className="tick">Done</span>}
      </p>
      <ul className="quiz-options">
        {item.options.map((opt, i) => {
          let cls = 'quiz-opt'
          if (answered) {
            if (i === item.answer) cls += ' opt-correct'
            else if (i === picked) cls += ' opt-wrong'
          }
          return (
            <li key={i}>
              <button className={cls} disabled={answered} onClick={() => choose(i)}>
                {opt}
              </button>
            </li>
          )
        })}
      </ul>
      {answered && (
        <div className={`feedback ${correct ? 'fb-ok' : 'fb-no'}`}>
          <strong>{correct ? 'Correct!' : 'Not quite.'}</strong> {item.why}
        </div>
      )}
    </div>
  )
}

export default function Quiz({ items }) {
  if (!items || !items.length) return null
  return (
    <div className="quiz">
      {items.map((item) => (
        <Question key={item.id} item={item} />
      ))}
    </div>
  )
}
