import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/index.css'
import App from './App'

import { AuthProvider } from '@/lib/auth'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  )
}
