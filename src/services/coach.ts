import { supabase } from '@/lib/supabase'
import { extractPatterns, extractRecentClimbs } from '@/services/patterns'
import { getProfile } from '@/services/profiles'
import type { Climb, AnonymizedClimb } from '@/types'

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

export interface ProjectingFocus {
  focus_area: string
  description: string
  grade_guidance: string
  rationale: string
}

export interface GenerateRecommendationsResponse {
  weekly_focus: string
  drills: Array<{
    name: string
    description: string
    sets: number
    reps: string
    rest: string
    measurable_outcome: string
  }>
  projecting_focus: ProjectingFocus[]
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
    .order('created_at', { ascending: false })
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
    .from('api_usage')
    .select('total_tokens')
    .eq('user_id', userId)
    .gte('time_window_start', dayAgo)

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
  input: GenerateRecommendationsInput
): Promise<GenerateRecommendationsResponse> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!user || !session) {
    throw new Error('Not authenticated')
  }

  // Check rate limit
  const rateLimit = await checkUserRateLimit(user.id)
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. ${rateLimit.remaining} tokens remaining.`)
  }

  // Extract patterns
  const patterns = await extractPatterns(user.id)
  const recentClimbs: AnonymizedClimb[] = await extractRecentClimbs(user.id)
  const profile = await getProfile()

  // Call Supabase Edge Function with JWT token in Authorization header
  const { data, error } = await supabase.functions.invoke('openrouter-coach', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {
      user_id: user.id,
      patterns_data: patterns,
      user_preferences: input.user_preferences,
      recent_climbs: recentClimbs,
      climbing_context: profile?.climbing_context,
    },
  })

  const parsed_data = JSON.parse(data)

  if (error) {
    // Edge Function already tracks all API usage (including failures)
    throw new Error(`Failed to generate recommendations: ${error.message}`)
  }

  // Handle Edge Function response format
  if (!parsed_data.success && parsed_data.error) {
    throw new Error(parsed_data.error)
  }

  // Log warning if cached data returned
  if (parsed_data.warning) {
    console.warn('Recommendations warning:', parsed_data.warning)
  }

  return {
    weekly_focus: parsed_data.content.weekly_focus,
    drills: parsed_data.content.drills,
    projecting_focus: parsed_data.content.projecting_focus || [],
  } as GenerateRecommendationsResponse
}
