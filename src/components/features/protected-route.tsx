import type { ReactNode } from 'react'

import { LoginScreen } from './login-screen'

import { useAuth } from '@/lib/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return children
}
