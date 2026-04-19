import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AdminLanguageProvider } from './AdminLanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminLanguageProvider>
      <App />
    </AdminLanguageProvider>
  </StrictMode>,
)
