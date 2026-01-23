import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getTimeUntilNextReset } from '@/hooks/useUserLimits'
import { DAILY_TAG_LIMIT } from '@/lib/constants/config'
import { supabase } from '@/lib/supabase'
import type { TagExtractionErrorType } from '@/services/tagExtraction'

export const tagQuotaKeys = {
  all: ['tag-quota'] as const,
  current: () => [...tagQuotaKeys.all, 'current'] as const,
}

interface TagLimits {
  tag_count: number
  limit_date: string
}

/**
 * Hook for tag extraction feedback.
 * Provides quota state and functions to show error toasts.
 * UI layer handles toast display (clean architecture).
 */
export function useTagExtractionFeedback() {
  const { data: tagLimits, isLoading } = useQuery<TagLimits | null>({
    queryKey: tagQuotaKeys.current(),
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
        .select('tag_count, limit_date')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        // If no limits row exists, return default (graceful degradation)
        return { tag_count: 0, limit_date: new Date().toISOString() }
      }

      if (!data) {
        return { tag_count: 0, limit_date: new Date().toISOString() }
      }

      return data
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 30 * 1000, // Cache for 30s
  })

  const tagCount = tagLimits?.tag_count ?? 0
  const limitDate = tagLimits?.limit_date ?? new Date().toISOString()
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const limitDateObj = new Date(limitDate)

  // Check if limit date is today (same day in UTC)
  const isSameDay =
    limitDateObj.getUTCFullYear() === today.getUTCFullYear() &&
    limitDateObj.getUTCMonth() === today.getUTCMonth() &&
    limitDateObj.getUTCDate() === today.getUTCDate()

  const effectiveCount = isSameDay ? tagCount : 0
  const isQuotaReached = effectiveCount >= DAILY_TAG_LIMIT

  /**
   * Show toast for tag extraction error based on error type.
   * Messages from CONTEXT.md decisions.
   */
  function showExtractionError(errorType: TagExtractionErrorType): void {
    switch (errorType) {
      case 'api_error':
        toast.error('Tag extraction failed. You can add tags manually.')
        break
      case 'quota_exceeded':
        toast.warning(`Daily quota reached - tags extracted tomorrow. ${getTimeUntilNextReset()}`)
        break
      case 'network_error':
        toast.error('Tag extraction failed due to network. Check your connection.')
        break
      case 'unknown':
      default:
        toast.error('Tag extraction failed. You can add tags manually.')
        break
    }
  }

  /**
   * Show toast when quota is reached.
   * Message from CONTEXT.md decisions.
   */
  function showQuotaReached(): void {
    toast.warning(
      `You've reached your daily tag extraction quota (${DAILY_TAG_LIMIT} climbs). ${getTimeUntilNextReset()}`
    )
  }

  return {
    quotaCount: effectiveCount,
    isQuotaReached,
    isLoading,
    showExtractionError,
    showQuotaReached,
  }
}
