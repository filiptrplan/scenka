import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

import './styles/index.css'
import App from './App'

import { AuthProvider } from '@/lib/auth'

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // TODO: Implement proper UI for update prompt instead of using confirm
    void updateSW(true)
  },
  onOfflineReady() {
    // App ready to work offline
  },
  onRegistered(/* registration */) {
    // Service worker registered successfully
  },
  onRegisterError(/* error */) {
    // Failed to register service worker
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
