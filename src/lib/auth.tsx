import type { User, Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  // eslint-disable-next-line no-unused-vars
  signUpWithEmail: (email: string, password: string) => Promise<void>
  // eslint-disable-next-line no-unused-vars
  signInWithPassword: (email: string, password: string) => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase is not configured. Please check your .env file.')
      setLoading(false)
      return
    }

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
    if (!supabase) {
      return Promise.reject(new Error('Supabase is not configured'))
    }
    await supabase.auth.signOut()
  }

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      return Promise.reject(new Error('Supabase is not configured'))
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      throw error
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      return Promise.reject(new Error('Supabase is not configured'))
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        signUpWithEmail,
        signInWithPassword,
        isConfigured: supabase !== null,
      }}
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
