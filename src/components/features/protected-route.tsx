import type { ReactNode } from 'react'

import { LoginScreen } from './login-screen'

import { useAuth } from '@/lib/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isConfigured } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center p-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-red-400">
            Configuration Error
          </h1>
          <p className="text-sm text-[#ccc] leading-relaxed">
            Supabase is not configured. Please create a{' '}
            <code className="text-xs font-mono bg-white/10 px-2 py-1 rounded">.env</code> file in
            the project root with:
          </p>
          <pre className="text-xs font-mono bg-white/[0.02] border-2 border-white/10 p-4 text-left overflow-x-auto">
            <code>
              VITE_SUPABASE_URL=your_supabase_project_url
              <br />
              VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
            </code>
          </pre>
          <p className="text-xs text-[#888] uppercase tracking-wider">
            See .env.example for more details
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return children
}
