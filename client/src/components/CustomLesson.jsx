import { useProgress } from './ProgressContext.jsx'

// Renders a lesson in the flat content format from Ollama-generated tracks.
// content = HTML/text prose, code_example = code string, note = tip string.
export default function CustomLesson({ lesson, lessonId }) {
  const { isDone, toggle } = useProgress()
  const done = isDone(lessonId)

  // Split content on double newlines into paragraphs, render HTML safely.
  const paragraphs = (lesson.content || '').split(/\n\n+/).filter(Boolean)

  return (
    <article id={lessonId} className={`lesson card custom-lesson ${done ? 'is-done' : ''}`}>
      <header className="lesson-head">
        <h3>{lesson.title}</h3>
        <button className={`pill ${done ? 'pill-done' : ''}`} onClick={() => toggle(lessonId)}>
          {done ? 'Completed' : 'Mark complete'}
        </button>
      </header>
      <div className="lesson-body">
        {paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}

        {lesson.has_code && lesson.code_example && (
          <pre className="code-block">{lesson.code_example}</pre>
        )}

        {lesson.note && (
          <div className="note">
            <span className="note-label">Note</span>
            {lesson.note}
          </div>
        )}
      </div>
    </article>
  )
}
