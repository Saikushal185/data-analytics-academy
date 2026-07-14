import { useProgress } from './ProgressContext.jsx'

function Block({ block }) {
  if (block.h) return <h4 className="lesson-h">{block.h}</h4>
  if (block.p) return <p>{block.p}</p>
  if (block.html) return <p dangerouslySetInnerHTML={{ __html: block.html }} />
  if (block.code) return <pre className="code-block">{block.code}</pre>
  if (block.note)
    return (
      <div className="note">
        <span className="note-label">Note</span>
        {block.note}
      </div>
    )
  if (block.ul)
    return (
      <ul>
        {block.ul.map((li, i) => (
          <li key={i}>{li}</li>
        ))}
      </ul>
    )
  return null
}

export default function Lesson({ lesson }) {
  const { isDone, toggle } = useProgress()
  const done = isDone(lesson.id)
  return (
    <article id={lesson.id} className={`lesson card ${done ? 'is-done' : ''}`}>
      <header className="lesson-head">
        <h3>{lesson.title}</h3>
        <button className={`pill ${done ? 'pill-done' : ''}`} onClick={() => toggle(lesson.id)}>
          {done ? 'Completed' : 'Mark complete'}
        </button>
      </header>
      <div className="lesson-body">
        {lesson.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    </article>
  )
}
