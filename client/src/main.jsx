import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './components/AuthContext.jsx'
import { ContentProvider } from './components/ContentContext.jsx'
import { ToastProvider } from './components/ToastContext.jsx'
import { StatsProvider } from './components/StatsContext.jsx'
import { ProgressProvider } from './components/ProgressContext.jsx'
import { ThemeProvider } from './components/ThemeContext.jsx'
import './styles.css'

// Register the service worker for offline support (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ContentProvider>
            <ToastProvider>
              <StatsProvider>
                <ProgressProvider>
                  <App />
                </ProgressProvider>
              </StatsProvider>
            </ToastProvider>
          </ContentProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
