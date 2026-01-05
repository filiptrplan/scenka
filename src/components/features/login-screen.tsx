import {
  Mail,
  Lock,
  UserPlus,
  LogIn,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

export function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const { signUpWithEmail, signInWithPassword } = useAuth()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setStatus('idle')
    setIsLoading(true)

    const authMethod = isSignUp ? signUpWithEmail : signInWithPassword
    void authMethod(email, password)
      .then(() => {
        setStatus('success')
        setStatusMessage(
          isSignUp ? 'Account created! Check your email to confirm.' : 'Welcome back!'
        )
      })
      .catch((error: unknown) => {
        setStatus('error')
        setStatusMessage(error instanceof Error ? error.message : 'Authentication failed')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-4 text-center">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Scenka
            </h1>
            <p className="text-sm font-mono text-[#888] uppercase tracking-[0.2em]">
              Track your technique failures
            </p>
          </div>

          <div className="bg-[#111] border-2 border-white/10 p-6 space-y-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setStatus('idle')
                }}
                className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  !isSignUp ? 'bg-white text-black' : 'bg-transparent text-[#666] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setStatus('idle')
                }}
                className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  isSignUp ? 'bg-white text-black' : 'bg-transparent text-[#666] hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/20 pl-10 hover:border-white/30 focus:border-white/50 transition-colors"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/20 pl-10 pr-10 hover:border-white/30 focus:border-white/50 transition-colors"
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {isSignUp ? (
                  <p className="text-xs text-[#666]">Must be at least 6 characters</p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                size="lg"
                className="w-full h-14 bg-white text-black hover:bg-white/90 font-black text-lg tracking-wider transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>{isSignUp ? 'Creating...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    {isSignUp ? (
                      <>
                        <UserPlus className="h-5 w-5" />
                        <span>Create Account</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </>
                    )}
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            {status !== 'idle' && (
              <div
                className={`relative overflow-hidden p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  status === 'success'
                    ? 'bg-emerald-950/30 border-2 border-emerald-500/20'
                    : 'bg-red-950/30 border-2 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {status === 'success' && (
                    <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  )}
                  {status === 'error' && <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />}
                  <p
                    className={`text-sm font-mono uppercase tracking-wide ${
                      status === 'success' ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {statusMessage}
                  </p>
                </div>
                {status === 'error' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                )}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs font-mono text-[#666] uppercase tracking-wider">
              Secure authentication powered by Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
