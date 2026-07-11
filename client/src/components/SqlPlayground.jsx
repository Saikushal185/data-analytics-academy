import { useState } from 'react'
import { api } from '../api.js'
import { useContent } from './ContentContext.jsx'
import { useProgress } from './ProgressContext.jsx'

function ResultTable({ result, error }) {
  if (error) return <div className="sql-error">{error}</div>
  if (!result) return null
  if (!result.columns.length) return <div className="sql-msg">Query ran. No rows returned.</div>
  return (
    <div className="table-wrap">
      <table className="result-table">
        <thead>
          <tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {result.rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v === null ? <em>NULL</em> : String(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Challenge({ ch }) {
  const { isDone, complete } = useProgress()
  const [sql, setSql] = useState(ch.starter)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null) // 'pass' | 'fail'
  const [hints, setHints] = useState([])
  const [busy, setBusy] = useState(false)

  async function run(grade) {
    setBusy(true)
    setError(null)
    setHints([])
    try {
      if (grade) {
        const { correct, result, hints } = await api.sqlGrade(ch.id, sql)
        setResult(result)
        setStatus(correct ? 'pass' : 'fail')
        setHints(hints || [])
        if (correct) complete(ch.id)
      } else {
        setResult(await api.sqlRun(sql))
        setStatus(null)
      }
    } catch (e) {
      setError(e.message)
      setResult(null)
      if (grade) setStatus('fail')
    } finally {
      setBusy(false)
    }
  }

  const done = isDone(ch.id)
  return (
    <div className={`card challenge ${done ? 'is-done' : ''}`}>
      <h4>
        {ch.title} {done && <span className="tick">Done</span>}
      </h4>
      <p className="challenge-prompt">{ch.prompt}</p>
      <textarea
        className="sql-editor"
        rows={6}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        spellCheck={false}
      />
      <div className="btn-row">
        <button className="btn" onClick={() => run(false)} disabled={busy}>Run</button>
        <button className="btn btn-primary" onClick={() => run(true)} disabled={busy}>Check answer</button>
        {status === 'pass' && <span className="status ok">Correct</span>}
        {status === 'fail' && <span className="status no">Not matching — keep trying</span>}
      </div>
      {hints.length > 0 && (
        <div className="hints">
          <span className="hints-label">Hints</span>
          <ul>{hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </div>
      )}
      <ResultTable result={result} error={error} />
    </div>
  )
}

export default function SqlPlayground() {
  const content = useContent()
  const [freeSql, setFreeSql] = useState('SELECT * FROM orders LIMIT 5;')
  const [freeResult, setFreeResult] = useState(null)
  const [freeError, setFreeError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function runFree() {
    setBusy(true)
    setFreeError(null)
    try {
      setFreeResult(await api.sqlRun(freeSql))
    } catch (e) {
      setFreeError(e.message)
      setFreeResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="playground">
      <div className="schema-hint card">
        <strong>Sample database</strong> (queries run on the server):{' '}
        <code>customers(customer_id, name, region, signup_date)</code>,{' '}
        <code>products(product_id, name, category, price)</code>,{' '}
        <code>orders(order_id, customer_id, product_id, order_date, amount)</code>,{' '}
        <code>employees(emp_id, name, manager_id)</code>
      </div>

      <div className="card">
        <h4>Free playground — run any read-only query</h4>
        <textarea
          className="sql-editor"
          rows={4}
          value={freeSql}
          onChange={(e) => setFreeSql(e.target.value)}
          spellCheck={false}
        />
        <div className="btn-row">
          <button className="btn btn-primary" onClick={runFree} disabled={busy}>Run</button>
        </div>
        <ResultTable result={freeResult} error={freeError} />
      </div>

      <h3 className="section-h">Graded Challenges</h3>
      {content.sql.challenges.map((ch) => (
        <Challenge key={ch.id} ch={ch} />
      ))}
    </div>
  )
}
