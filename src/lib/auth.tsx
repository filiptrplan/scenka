import type { User, Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithPasskey: () => Promise<void>
  // eslint-disable-next-line no-unused-vars
  signInWithEmail: (_email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
      setSession(sessionData)
      setUser(sessionData?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sessionData) => {
      setSession(sessionData)
      setUser(sessionData?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithPasskey = () => {
    console.error('Passkey authentication not yet implemented')
    return Promise.reject(new Error('Passkey authentication not yet implemented'))
  }

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signOut, signInWithPasskey, signInWithEmail }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
