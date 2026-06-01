import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.jsx'

// Lock orientation to portrait — silently ignored on desktop/unsupported browsers
screen?.orientation?.lock?.('portrait').catch?.(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
