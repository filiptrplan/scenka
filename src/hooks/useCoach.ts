import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import {
  checkUserRateLimit,
  coachKeys,
  generateRecommendations,
  getLatestRecommendations,
} from '@/services/coach'
import { extractPatterns } from '@/services/patterns'

export function useCoachRecommendations() {
  return useQuery({
    queryKey: coachKeys.currentRecommendations(),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      return getLatestRecommendations(user.id)
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - show last cached recommendations, enable offline support
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - persist cache for a week before garbage collection
  })
}

export function usePatternAnalysis() {
  return useQuery({
    queryKey: coachKeys.patterns(),
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      return extractPatterns(user.id)
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
  })
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateRecommendations,
    onSuccess: () => {
      // Invalidate recommendations cache to fetch fresh data after regeneration
      void queryClient.invalidateQueries({
        queryKey: coachKeys.currentRecommendations(),
      })
    },
    onError: (error) => {
      console.error('Failed to generate recommendations:', error)
      // Don't throw - UI will show cached recommendations
    },
  })
}

export function useCoachRateLimit() {
  return useQuery({
    queryKey: ['coach', 'rate-limit'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { allowed: false, remaining: 0 }
      }

      return checkUserRateLimit(user.id)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
