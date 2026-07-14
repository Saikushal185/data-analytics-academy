// Thin API client. Token persisted in localStorage; helpers throw on error.
const TOKEN_KEY = 'daa-token'
const EMAIL_KEY = 'daa-email'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function getEmail() {
  return localStorage.getItem(EMAIL_KEY)
}
export function setSession(token, email) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const t = getToken()
    if (t) headers.Authorization = `Bearer ${t}`
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  getContent: () => request('/content'),

  getProgress: () => request('/progress', { auth: true }),
  addProgress: (id) => request(`/progress/${encodeURIComponent(id)}`, { method: 'PUT', auth: true }),
  removeProgress: (id) => request(`/progress/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  mergeProgress: (items) => request('/progress/merge', { method: 'POST', body: { items }, auth: true }),
  recordAttempt: (itemId, correct) => request('/progress/attempt', { method: 'POST', body: { itemId, correct }, auth: true }),

  sqlRun: (sql) => request('/sql/run', { method: 'POST', body: { sql } }),
  sqlGrade: (challengeId, sql) => request('/sql/grade', { method: 'POST', body: { challengeId, sql } }),

  getStats: () => request('/me/stats', { auth: true }),
  setPrefs: (prefs) => request('/me/prefs', { method: 'PUT', body: prefs, auth: true }),

  changePassword: (currentPassword, newPassword) =>
    request('/account/change-password', { method: 'POST', body: { currentPassword, newPassword }, auth: true }),
  deleteAccount: () => request('/account', { method: 'DELETE', auth: true }),
  requestReset: (email) => request('/auth/request-reset', { method: 'POST', body: { email } }),
  doReset: (token, password) => request('/auth/reset', { method: 'POST', body: { token, password } }),

  tutorStatus: () => request('/tutor/status'),

  reviewsDue: () => request('/reviews/due', { auth: true }),
  gradeReview: (cardId, quality) => request('/reviews/grade', { method: 'POST', body: { cardId, quality }, auth: true }),
  
  getCustomTracks: () => request('/tracks/my', { auth: true }),
  generateCustomTrack: (topic) => request('/tracks/generate', { method: 'POST', body: { topic }, auth: true }),
  deleteCustomTrack: (id) => request(`/tracks/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
}

// Streaming tutor chat — calls onToken for each text chunk. Returns when done.
export async function tutorChat({ messages, context }, onToken, signal) {
  const res = await fetch('/api/tutor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
    signal,
  })
  if (!res.body) throw new Error('No response stream')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    onToken(decoder.decode(value, { stream: true }))
  }
}
