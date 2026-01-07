import { supabase } from '@/lib/supabase'
import type { Profile, TablesInsert, TablesUpdate } from '@/types'

export const profileKeys = {
  current: ['profile'] as const,
}

export async function getProfile(): Promise<Profile> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (error) {
    if (error.code === 'PGRST116') {
      return createProfile(user.id)
    }
    throw error
  }

  return data as Profile
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates as TablesUpdate<'profiles'>)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data as Profile
}

export async function createProfile(userId: string): Promise<Profile> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      preferred_grade_scale: 'font',
      preferred_discipline: 'boulder',
      home_gym: 'My Gym',
      onboarding_completed: false,
    } as TablesInsert<'profiles'>)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data as Profile
}
