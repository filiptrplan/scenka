import { supabase } from '@/lib/supabase'
import type { CreateClimbInput } from '@/lib/validation'
import type { Climb, TablesInsert, TablesUpdate } from '@/types'

export const climbsKeys = {
  all: ['climbs'] as const,
  lists: () => [...climbsKeys.all, 'list'] as const,
  list: () => [...climbsKeys.lists(), 'all'] as const,
}

export async function getClimbs(): Promise<Climb[]> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { data, error } = await supabase
    .from('climbs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return data as Climb[]
}

export async function createClimb(input: CreateClimbInput): Promise<Climb> {
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
    .from('climbs')
    .insert({ ...input, user_id: user.id } as TablesInsert<'climbs'>)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data as Climb
}

export async function updateClimb(id: string, updates: Partial<CreateClimbInput>): Promise<Climb> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { data, error } = await supabase
    .from('climbs')
    .update(updates as TablesUpdate<'climbs'>)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data as Climb
}

export async function deleteClimb(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { error } = await supabase.from('climbs').delete().eq('id', id)

  if (error) {
    throw error
  }
}
