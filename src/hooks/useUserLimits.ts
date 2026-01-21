import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

export const userLimitsKeys = {
  all: ['user-limits'] as const,
  current: () => [...userLimitsKeys.all, 'current'] as const,
}

export interface UserLimits {
  rec_count: number
  chat_count: number
  tag_count: number
  limit_date: string
}

export function useUserLimits() {
  return useQuery<UserLimits | null>({
    queryKey: userLimitsKeys.current(),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('user_limits')
        .select('rec_count, chat_count, tag_count, limit_date')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data
    },
    staleTime: 0, // Always fetch fresh data (required by CONTEXT.md)
    gcTime: 30 * 1000, // Cache for 30s (short duration)
  })
}

export function getTimeUntilNextReset(): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0) // Set to UTC midnight

  const msUntilReset = tomorrow.getTime() - now.getTime()
  const hoursUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60))

  if (hoursUntilReset <= 1) {
    return 'Next reset in less than 1 hour'
  }
  if (hoursUntilReset < 24) {
    return `Next reset in ${hoursUntilReset} hours`
  }
  return 'Next reset tomorrow at midnight UTC'
}
