import { supabase } from '@/lib/supabase'
import { anonymizeClimbsForAI } from '@/lib/coachUtils'
import { extractPatterns } from '@/services/patterns'
import type { Climb } from '@/types'

export interface ApiUsage {
  id: string
  user_id: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: number
  model: string
  endpoint: string
  time_window_start: string
}

export interface GenerateRecommendationsInput {
  climbs: Climb[]
  user_preferences: {
    preferred_discipline: string
    preferred_grade_scale: string
  }
}

export interface GenerateRecommendationsResponse {
  weekly_focus: string
  drills: Array<{
    name: string
    description: string
    sets: number
    reps: string
    rest: string
  }>
}

export const coachKeys = {
  all: ['coach'] as const,
  recommendations: () => [...coachKeys.all, 'recommendations'] as const,
  currentRecommendations: () => [...coachKeys.recommendations(), 'current'] as const,
  patterns: () => [...coachKeys.all, 'patterns'] as const,
}

export async function getLatestRecommendations(userId: string) {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { data, error } = await supabase
    .from('coach_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('generation_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No recommendations yet
    }
    throw error
  }

  return data
}

export async function checkUserRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt?: string
}> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  // Count API calls in last 24 hours
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: usage, error } = await supabase
    .from('coach_api_usage')
    .select('total_tokens')
    .eq('user_id', userId)
    .gte('created_at', dayAgo)

  if (error) {
    throw error
  }

  const tokensUsed = usage?.reduce((sum, u) => sum + u.total_tokens, 0) || 0
  const dailyLimit = 50000 // 50k tokens per day
  const remaining = Math.max(0, dailyLimit - tokensUsed)

  return {
    allowed: tokensUsed < dailyLimit,
    remaining,
  }
}

export async function generateRecommendations(
  input: GenerateRecommendationsInput,
): Promise<GenerateRecommendationsResponse> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check rate limit
  const rateLimit = await checkUserRateLimit(user.id)
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. ${rateLimit.remaining} tokens remaining.`)
  }

  // Anonymize data before API call
  const anonymizedClimbs = anonymizeClimbsForAI(input.climbs)
  const patterns = await extractPatterns(user.id)

  // Call Supabase Edge Function (stub for now - will implement in Phase 20)
  const { data, error } = await supabase.functions.invoke('generate-recommendations', {
    body: {
      user_id: user.id,
      climbs_data: anonymizedClimbs,
      patterns_data: patterns,
      user_preferences: input.user_preferences,
    },
  })

  if (error) {
    // Track failed attempt
    await trackApiUsage(
      user.id,
      {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        model: 'openai/gpt-4o-mini',
        endpoint: 'generate-recommendations',
      },
      true,
    )

    throw new Error(`Failed to generate recommendations: ${error.message}`)
  }

  return data as GenerateRecommendationsResponse
}

export async function trackApiUsage(
  userId: string,
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    model: string
    endpoint: string
  },
  isError: boolean = false,
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  // Calculate cost internally using calculateCost helper
  const cost_usd = isError ? 0 : calculateCost(usage)

  const { error } = await supabase.from('coach_api_usage').insert({
    user_id: userId,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    cost_usd,
    model: usage.model,
    endpoint: usage.endpoint,
    time_window_start: new Date().toISOString(),
  })

  if (error) {
    console.error('Failed to track API usage:', error)
    // Don't throw - tracking failure shouldn't break the main flow
  }
}

function calculateCost(usage: {
  prompt_tokens: number
  completion_tokens: number
}): number {
  // OpenRouter pricing for gpt-4o-mini
  const promptCost = (usage.prompt_tokens * 0.00015) / 1000 // $0.15 per 1M tokens
  const completionCost = (usage.completion_tokens * 0.0006) / 1000 // $0.60 per 1M tokens
  return promptCost + completionCost
}
