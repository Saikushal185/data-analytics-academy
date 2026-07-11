import { useState } from 'react'
import { useContent } from './ContentContext.jsx'
import { useProgress } from './ProgressContext.jsx'

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'

// Lazy-load Pyodide + pandas once, shared across exercises. On failure we reset
// the cached promise so a later attempt can retry instead of being stuck.
let pyPromise = null
function getPyodide(onStage) {
  if (!pyPromise) {
    pyPromise = (async () => {
      onStage?.('Loading Python runtime…')
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = PYODIDE_URL + 'pyodide.js'
          s.onload = resolve
          s.onerror = () => reject(new Error('Could not load Pyodide (check your connection).'))
          document.head.appendChild(s)
        })
      }
      const pyodide = await window.loadPyodide({ indexURL: PYODIDE_URL })
      onStage?.('Loading pandas (~10MB, first time only)…')
      await pyodide.loadPackage('pandas')
      return pyodide
    })().catch((e) => {
      pyPromise = null // allow retry after a transient/network failure
      throw e
    })
  }
  return pyPromise
}

// Compare ignoring trailing whitespace per line and surrounding blank lines,
// so pandas version differences in repr padding don't fail a correct answer.
function normalizeOutput(s) {
  return String(s)
    .replace(/[ \t]+$/gm, '')
    .replace(/\s+$/, '')
    .replace(/^\s+/, '')
}

function Exercise({ ex, preamble }) {
  const { isDone, complete } = useProgress()
  const [code, setCode] = useState(ex.starter)
  const [output, setOutput] = useState(null)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState(null)
  const [showSol, setShowSol] = useState(false)

  async function run() {
    setBusy(true)
    setStatus(null)
    try {
      const pyodide = await getPyodide(setStage)
      setStage(null)
      pyodide.runPython(preamble) // reset df each run
      // Capture stdout
      pyodide.runPython('import sys, io\n_buf = io.StringIO()\n_old = sys.stdout\nsys.stdout = _buf')
      pyodide.runPython(code)
      const out = pyodide.runPython('sys.stdout = _old\n_buf.getvalue()')
      setOutput(out)
      const ok = normalizeOutput(out) === normalizeOutput(ex.expectedOutput)
      setStatus(ok ? 'pass' : 'fail')
      if (ok) complete(ex.id)
    } catch (e) {
      setOutput(String(e.message || e))
      setStatus('error')
    } finally {
      setBusy(false)
      setStage(null)
    }
  }

  const done = isDone(ex.id)
  return (
    <div className={`card challenge ${done ? 'is-done' : ''}`}>
      <h4>{ex.title} {done && <span className="tick">Done</span>}</h4>
      <p className="challenge-prompt">{ex.prompt}</p>
      <textarea className="sql-editor" rows={4} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
      <div className="btn-row">
        <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run & check'}</button>
        <button className="btn" onClick={() => setShowSol((s) => !s)}>{showSol ? 'Hide' : 'Show'} solution</button>
        {stage && <span className="status">{stage}</span>}
        {status === 'pass' && <span className="status ok">Correct</span>}
        {status === 'fail' && <span className="status no">Output doesn’t match</span>}
        {status === 'error' && <span className="status no">Error</span>}
      </div>
      {showSol && <pre className="code-block">{ex.solution}</pre>}
      {output != null && (
        <div className="py-output">
          <div className="out-label">Your output</div>
          <pre className="code-block out">{output}</pre>
          <div className="out-label">Expected</div>
          <pre className="code-block out expected">{ex.expectedOutput}</pre>
        </div>
      )}
    </div>
  )
}

export default function PyPlayground() {
  const content = useContent()
  const { preamble, exercises } = content.python
  return (
    <div className="playground">
      <div className="schema-hint card">
        A pandas DataFrame <code>df</code> with columns <code>city, month, sales</code> is preloaded before each run.
        Real Python runs in your browser via Pyodide — the first run downloads pandas (~10MB), so give it a moment.
      </div>
      {exercises.map((ex) => <Exercise key={ex.id} ex={ex} preamble={preamble} />)}
    </div>
  )
}
