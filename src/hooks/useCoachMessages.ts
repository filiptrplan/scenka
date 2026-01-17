import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types'

export interface CoachMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  context: Record<string, unknown>
}

export const coachMessagesKeys = {
  all: ['coach-messages'] as const,
  lists: () => [...coachMessagesKeys.all, 'list'] as const,
  list: () => [...coachMessagesKeys.lists(), 'all'] as const,
}

async function getCoachMessages(): Promise<CoachMessage[]> {
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
    .from('coach_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(20) // Last 20 messages (CHAT-04 requirement)

  if (error) {
    throw error
  }

  return data as CoachMessage[]
}

async function createCoachMessage(
  message: Omit<CoachMessage, 'id' | 'user_id' | 'created_at'>,
): Promise<CoachMessage> {
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
    .from('coach_messages')
    .insert({
      ...message,
      user_id: user.id,
    } as TablesInsert<'coach_messages'>)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as CoachMessage
}

export function useCoachMessages() {
  return useQuery({
    queryKey: coachMessagesKeys.list(),
    queryFn: getCoachMessages,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useCreateCoachMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCoachMessage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachMessagesKeys.lists() })
    },
  })
}

export function useClearCoachMessages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('coach_messages')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachMessagesKeys.lists() })
    },
  })
}
