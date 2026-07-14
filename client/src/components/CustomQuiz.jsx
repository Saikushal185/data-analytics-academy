import { useState } from 'react'
import { useProgress } from './ProgressContext.jsx'
import { useAuth } from './AuthContext.jsx'
import { api } from '../api.js'

// Quiz component for custom track quiz format:
// { question, options[], correct_index, explanation }
function CustomQuestion({ item, questionId }) {
  const { isDone, complete } = useProgress()
  const { isAuthed } = useAuth()
  const [picked, setPicked] = useState(null)
  const answered = picked !== null
  const correct = answered && picked === item.correct_index

  function choose(i) {
    if (answered) return
    setPicked(i)
    const right = i === item.correct_index
    if (right) complete(questionId)
    if (isAuthed) api.recordAttempt(questionId, right).catch(() => {})
  }

  return (
    <div className={`card quiz-q ${isDone(questionId) ? 'is-done' : ''}`}>
      <p className="quiz-prompt">
        {item.question} {isDone(questionId) && <span className="tick">Done</span>}
      </p>
      <ul className="quiz-options">
        {item.options.map((opt, i) => {
          let cls = 'quiz-opt'
          if (answered) {
            if (i === item.correct_index) cls += ' opt-correct'
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
          <strong>{correct ? 'Correct!' : 'Not quite.'}</strong> {item.explanation}
        </div>
      )}
    </div>
  )
}

export default function CustomQuiz({ items, trackId, moduleId }) {
  if (!items || !items.length) return null
  return (
    <div className="quiz">
      {items.map((item, idx) => (
        <CustomQuestion
          key={idx}
          item={item}
          questionId={`custom-quiz-${trackId}-${moduleId}-${idx}`}
        />
      ))}
    </div>
  )
}
