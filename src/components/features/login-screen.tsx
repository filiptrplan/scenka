import { Fingerprint, Mail, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const { signInWithPasskey, signInWithEmail } = useAuth()

  const handlePasskeyAuth = () => {
    setIsLoading(true)
    void signInWithPasskey().catch((error: unknown) => {
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Authentication failed')
      setIsLoading(false)
    })
  }

  const handleEmailAuth = (e: FormEvent) => {
    e.preventDefault()
    setStatus('idle')
    setIsLoading(true)
    void signInWithEmail(email)
      .then(() => {
        setStatus('success')
        setStatusMessage('Magic link sent! Check your email.')
      })
      .catch((error: unknown) => {
        setStatus('error')
        setStatusMessage(error instanceof Error ? error.message : 'Failed to send magic link')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!showEmail ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4 text-center">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                Scenka
              </h1>
              <p className="text-sm font-mono text-[#888] uppercase tracking-[0.2em]">
                Track your technique failures
              </p>
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                onClick={() => handlePasskeyAuth()}
                disabled={isLoading}
                size="lg"
                className="w-full h-20 bg-white text-black hover:bg-white/90 font-black text-lg tracking-wider transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <Fingerprint className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  <span>Sign in with Passkey</span>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : null}
                </div>
              </Button>

              <button
                type="button"
                onClick={() => setShowEmail(true)}
                disabled={isLoading}
                className="w-full h-20 border-2 border-white/20 hover:border-white/40 bg-white/[0.02] text-[#888] hover:text-white transition-all duration-200 group"
              >
                <div className="flex items-center justify-center gap-4">
                  <Mail className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-black uppercase tracking-wider">
                    Sign in with Email
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </button>
            </div>

            {status !== 'idle' && (
              <div className="flex items-center gap-3 p-4 border-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <p
                  className={`text-sm ${
                    status === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {statusMessage}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs font-mono text-[#666] uppercase tracking-wider">
                Biometric authentication for secure access
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                Enter Email
              </h1>
              <p className="text-sm font-mono text-[#888] uppercase tracking-[0.2em]">
                We&apos;ll send you a magic link
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#666] uppercase tracking-wider">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-14 bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 hover:border-white/30 text-lg"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                size="lg"
                className="w-full h-16 bg-white text-black hover:bg-white/90 font-black text-lg tracking-wider transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Send Magic Link</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            {status !== 'idle' && (
              <div className="flex items-center gap-3 p-4 border-2 animate-in fade-in slide-in-from-right-2 duration-300">
                {status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <p
                  className={`text-sm ${
                    status === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {statusMessage}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowEmail(false)
                setStatus('idle')
              }}
              disabled={isLoading}
              className="w-full text-center text-sm font-mono text-[#888] hover:text-white uppercase tracking-wider transition-colors duration-200"
            >
              Back to Passkey
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
