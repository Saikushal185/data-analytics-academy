import { createContext, useContext, useState, useCallback } from 'react'
import { api, getEmail, getToken, setSession, clearSession } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(getEmail())
  const isAuthed = !!getToken() && !!email

  const login = useCallback(async (e, p) => {
    const { token, email } = await api.login(e, p)
    setSession(token, email)
    setEmail(email)
  }, [])

  const register = useCallback(async (e, p) => {
    const { token, email } = await api.register(e, p)
    setSession(token, email)
    setEmail(email)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setEmail(null)
  }, [])

  return (
    <AuthContext.Provider value={{ email, isAuthed, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
