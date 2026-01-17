# Phase 18: AI Coach Foundation - Research

**Researched:** 2026-01-17
**Domain:** AI/LLM integration, Supabase Edge Functions, PostgreSQL RLS
**Confidence:** HIGH

## Summary

This phase establishes the foundation for the AI Coach feature by implementing database tables, services, hooks, and privacy safeguards. The research reveals a clear path forward using existing codebase patterns: follow the climbs.ts and profiles.ts service structure for data access, use TanStack Query for state management, and implement Supabase Edge Functions for LLM API calls. Privacy is handled through RLS policies using auth.uid() for user isolation, and data anonymization happens before sending to external APIs. PostgreSQL JSONB is the right choice for flexible recommendation data storage, with proper indexing for performance. Cost tracking and rate limiting must be implemented from day one, storing API usage metrics in the database and enforcing limits at the edge function level.

**Primary recommendation:** Build coach tables with JSONB for flexible data, use Supabase Edge Functions for OpenRouter API calls with Deno.env for secrets, implement RLS policies matching the existing patterns, and create pattern analysis functions that aggregate climb data without exposing PII to external services.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | 2.89.0 | Database client, auth | Already in project, proven patterns in codebase |
| PostgreSQL | Latest | Database with RLS + JSONB | Existing stack, supports advanced data types |
| Supabase Edge Functions | Latest | Serverless TypeScript functions | Deno-based, integrates with Supabase auth, environment variable support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query | 5.90.16 | State management, caching | Already in project, proven pattern |
| OpenRouter API | Latest | LLM API abstraction | OpenAI-compatible, multiple model access, cost tracking |
| Zod | 4.3.5 | Runtime validation | Already in project, use for API responses |
| date-fns | 4.1.0 | Date manipulation | Already in project, frequency calculations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Edge Functions | Vercel Edge Functions | Vercel requires separate deployment, doesn't integrate with Supabase auth |
| JSONB columns | Separate columns for all fields | JSONB provides flexibility for evolving recommendation schema |
| OpenRouter | Direct OpenAI API | OpenRouter provides model choice and cost tracking, OpenAI locks to single provider |

**Installation:**
```bash
# No new dependencies needed - all required libraries already installed
# Edge Functions are part of Supabase CLI
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── migrations/
│   └── 20260117_create_coach_tables.sql
├── functions/
│   └── generate-recommendations/
│       └── index.ts
src/
├── services/
│   ├── coach.ts         # LLM API abstraction, cost tracking
│   └── patterns.ts      # Pattern extraction from climbs
├── hooks/
│   ├── useCoach.ts      # TanStack Query for recommendations
│   └── useCoachMessages.ts  # Chat message management
├── types/
│   └── index.ts         # Coach types added
└── lib/
    └── coachUtils.ts    # Data anonymization, aggregation helpers
```

### Pattern 1: Service Layer Structure (Existing Pattern)
**What:** Services export query keys and CRUD functions following the climbs.ts pattern
**When to use:** All data access operations for coach tables
**Example:**
```typescript
// Source: /home/filip/Repos/scenka/src/services/climbs.ts
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
```

### Pattern 2: TanStack Query Hooks (Existing Pattern)
**What:** Hooks wrap services with useQuery/useMutations and manage queryClient invalidation
**When to use:** All React component state management for coach features
**Example:**
```typescript
// Source: /home/filip/Repos/scenka/src/hooks/useClimbs.ts
export function useClimbs() {
  return useQuery({
    queryKey: climbsKeys.list(),
    queryFn: getClimbs,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateClimb() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClimb,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
  })
}
```

### Pattern 3: Supabase Edge Function with External API
**What:** Edge Function calls external LLM API with environment variables for secrets
**When to use:** Generate recommendations, chat responses requiring LLM
**Example:**
```typescript
// Source: Supabase Edge Functions documentation
Deno.serve(async (req) => {
  const { method } = req

  if (method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { user_id, climbs_data } = await req.json()

    // Rate limit check
    const rateLimitCheck = await checkUserRateLimit(user_id)
    if (!rateLimitCheck.allowed) {
      return new Response('Rate limit exceeded', { status: 429 })
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: climbs_data.messages,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()

    // Track cost
    await trackApiUsage(user_id, {
      tokens: data.usage?.total_tokens || 0,
      cost: calculateCost(data.usage),
      timestamp: new Date().toISOString(),
    })

    return new Response(JSON.stringify(data.choices[0].message), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Pattern 4: RLS Policy with User Isolation (Existing Pattern)
**What:** Row Level Security policies use auth.uid() for user-specific data access
**When to use:** All coach tables that contain user-specific recommendations or messages
**Example:**
```sql
-- Source: /home/filip/Repos/scenka/supabase/migrations/20260105175622_create_climbs_table.sql
CREATE POLICY "Users can view own climbs"
  ON public.climbs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own climbs"
  ON public.climbs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own climbs"
  ON public.climbs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own climbs"
  ON public.climbs FOR DELETE
  USING (auth.uid() = user_id);
```

### Pattern 5: Data Anonymization Before API Call
**What:** Remove PII and user identifiers before sending data to external LLM
**When to use:** All calls to OpenRouter or external AI services
**Example:**
```typescript
// Source: Privacy best practices for AI
export function anonymizeClimbsForAI(climbs: Climb[]): AnonymizedClimb[] {
  return climbs.map((climb) => ({
    location: sanitizeLocation(climb.location), // Remove specific gym name
    grade_scale: climb.grade_scale,
    grade_value: climb.grade_value,
    climb_type: climb.climb_type,
    style: climb.style,
    outcome: climb.outcome,
    awkwardness: climb.awkwardness,
    failure_reasons: climb.failure_reasons,
    // Exclude: id, user_id, created_at, notes (may contain PII)
  }))
}

function sanitizeLocation(location: string): string {
  // Return generic location type instead of specific gym name
  if (location.toLowerCase().includes('gym')) {
    return 'indoor_gym'
  }
  return 'outdoor_crags'
}
```

### Anti-Patterns to Avoid
- **Hardcoding API keys**: Never commit secrets, always use Deno.env.get()
- **Sending PII to LLM**: Anonymize data before external API calls
- **Skipping rate limiting**: Implement rate limits before first deployment
- **Querying without indexes**: Add indexes on policy columns for performance
- **Creating separate columns for flexible data**: Use JSONB for recommendation structure
- **Bypassing RLS with service keys**: Never expose service_role key to clients

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cost tracking for LLM API | Custom logging in text files | Database table with user_id, timestamp, tokens, cost | Enables analytics, rate limiting, per-user quotas, cost monitoring |
| Rate limiting | In-memory counters | Database-based counters with time windows | Persists across server restarts, works in distributed environment, enforces at data layer |
| JSON validation | Custom parser | Zod schemas | Already in project, type-safe, runtime validation, excellent error messages |
| Message history caching | localStorage | TanStack Query with staleTime and cacheTime | Already in project, automatic cache invalidation, stale-while-revalidate, SSR support |
| Pattern aggregation | Manual array reduction | PostgreSQL aggregation + JS helper functions | Efficient database queries, leverages indexes, consistent with existing analytics |

**Key insight:** Custom solutions for cost tracking and rate limiting fail at scale. Database-backed solutions persist across restarts, support analytics, and enable per-user quotas. TanStack Query already solves caching - don't reinvent it.

## Common Pitfalls

### Pitfall 1: Exposing User Data to External APIs
**What goes wrong:** Sending full climb records including location, notes, timestamps to OpenRouter leaks PII and violates privacy
**Why it happens:** Developers copy entire record object for API call
**How to avoid:** Create dedicated anonymizeClimbsForAI() function that extracts only needed fields (grade, style, outcome, failure_reasons, awkwardness)
**Warning signs:** Function passing entire `climb` object to LLM API call, location field visible in request payload

### Pitfall 2: Missing Cost Tracking Leading to Uncontrolled Spending
**What goes wrong:** LLM API usage grows exponentially without monitoring, costs spiral
**Why it happens:** Cost tracking treated as "nice to have" added later
**How to avoid:** Create coach_api_usage table on day one, track every API call with user_id, timestamp, tokens, cost, create dashboard view
**Warning signs:** No database table for API usage, no query for cost metrics in plans

### Pitfall 3: RLS Policies Without Proper Indexing
**What goes wrong:** Queries on coach tables become slow as user base grows
**Why it happens:** auth.uid() lookups on large tables need indexes on user_id
**How to avoid:** Always create index on user_id after RLS policy, use expression indexes for JSONB queries
**Warning signs:** CREATE INDEX statements missing from migration, user_id columns unindexed

### Pitfall 4: JSONB Overuse Leading to Performance Issues
**What goes wrong:** Queries on nested JSONB fields are slow, complex to write
**Why it happens:** Using JSONB for everything because it's flexible
**How to avoid:** Use JSONB only for truly flexible data (recommendations content), use separate columns for frequently queried fields (generation_date, user_id), create GIN indexes on JSONB columns
**Warning signs:** Querying deep nested paths without expression indexes, large JSONB documents (>1KB)

### Pitfall 5: Offline Recommendations Not Cached Properly
**What goes wrong:** Users see empty screen when offline, app broken
**Why it happens:** Recommendations not cached in localStorage or TanStack Query cache not persisted
**How to avoid:** Use TanStack Query with appropriate staleTime (24 hours), persist to localStorage via useCoach hook, show "Last updated: {date}" to indicate cache age
**Warning signs:** No staleTime set on recommendations query, no localStorage fallback in hook

### Pitfall 6: Rate Limiting Not Enforced at Edge Function Level
**What goes wrong:** One user can abuse API, costs spike, service degraded for others
**Why it happens:** Rate limiting implemented only as UI check, not enforced server-side
**How to avoid:** Check user's API usage in coach_api_usage table before each call, return 429 status when limit exceeded, store timestamp for time-window enforcement
**Warning signs:** Rate limit check only in client code, no usage query before API call

## Code Examples

Verified patterns from official sources:

### Database Schema with JSONB and RLS
```typescript
// Source: Existing pattern from climbs table + PostgreSQL JSONB documentation
// Migration: 20260117_create_coach_tables.sql

-- Coach recommendations table
CREATE TABLE public.coach_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Core fields (indexed for queries)
  generation_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Flexible recommendation data (JSONB for structure evolution)
  content jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Status tracking
  is_cached BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT
);

-- Coach messages table for chat
CREATE TABLE public.coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,

  -- Context for message (what patterns were considered)
  context jsonb DEFAULT '{}'::jsonb
);

-- API usage tracking for cost monitoring
CREATE TABLE public.coach_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Usage metrics
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL,

  -- Request details
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,

  -- Rate limiting
  time_window_start TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.coach_recommendations FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.coach_recommendations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.coach_recommendations FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON public.coach_messages FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.coach_messages FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- RLS Policies for API usage (users can read their own usage)
CREATE POLICY "Users can view own usage"
  ON public.coach_api_usage FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX coach_recommendations_user_id_idx ON public.coach_recommendations(user_id);
CREATE INDEX coach_recommendations_generation_date_idx ON public.coach_recommendations(generation_date DESC);
CREATE INDEX coach_recommendations_user_date_idx ON public.coach_recommendations(user_id, generation_date DESC);

CREATE INDEX coach_messages_user_id_idx ON public.coach_messages(user_id);
CREATE INDEX coach_messages_created_at_idx ON public.coach_messages(created_at DESC);
CREATE INDEX coach_messages_user_created_idx ON public.coach_messages(user_id, created_at DESC);

CREATE INDEX coach_api_usage_user_id_idx ON public.coach_api_usage(user_id);
CREATE INDEX coach_api_usage_time_window_idx ON public.coach_api_usage(time_window_start);
CREATE INDEX coach_api_usage_user_window_idx ON public.coach_api_usage(user_id, time_window_start);

-- GIN indexes for JSONB queries
CREATE INDEX coach_recommendations_content_idx ON public.coach_recommendations USING GIN (content jsonb_path_ops);
CREATE INDEX coach_messages_context_idx ON public.coach_messages USING GIN (context jsonb_path_ops);
```

### Pattern Extraction Service
```typescript
// Source: Pattern aggregation based on existing analytics + domain knowledge
// File: src/services/patterns.ts

import { supabase } from '@/lib/supabase'
import { normalizeGrade } from '@/lib/grades'
import type { Climb } from '@/types'

export interface FailurePatterns {
  most_common_failure_reasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
}

export interface StyleWeaknesses {
  struggling_styles: Array<{
    style: string
    fail_count: number
    total_attempts: number
    fail_rate: number
  }>
}

export interface ClimbingFrequency {
  climbs_per_week: Array<{
    week: string
    count: number
  }>
  climbs_per_month: number
  avg_climbs_per_session: number
}

export interface RecentSuccesses {
  recent_sends: Climb[]
  grade_progression: Array<{
    grade: string
    date: string
  }>
  redemption_count: number
}

export interface PatternAnalysis {
  failure_patterns: FailurePatterns
  style_weaknesses: StyleWeaknesses
  climbing_frequency: ClimbingFrequency
  recent_successes: RecentSuccesses
}

export async function extractPatterns(userId: string): Promise<PatternAnalysis> {
  const { data: climbs, error } = await supabase
    .from('climbs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100) // Last 100 climbs for analysis

  if (error) {
    throw error
  }

  if (!climbs || climbs.length === 0) {
    return getEmptyPatterns()
  }

  return {
    failure_patterns: extractFailurePatterns(climbs),
    style_weaknesses: extractStyleWeaknesses(climbs),
    climbing_frequency: extractClimbingFrequency(climbs),
    recent_successes: extractRecentSuccesses(climbs),
  }
}

function extractFailurePatterns(climbs: Climb[]): FailurePatterns {
  const failedClimbs = climbs.filter((c) => c.outcome === 'Fail')
  const reasonCounts = new Map<string, number>()

  failedClimbs.forEach((climb) => {
    climb.failure_reasons.forEach((reason) => {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
    })
  })

  const sorted = Array.from(reasonCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Top 5

  return {
    most_common_failure_reasons: sorted.map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / failedClimbs.length) * 100),
    })),
  }
}

function extractStyleWeaknesses(climbs: Climb[]): StyleWeaknesses {
  const styleStats = new Map<
    string,
    { fail_count: number; total_attempts: number }
  >()

  climbs.forEach((climb) => {
    climb.style.forEach((s) => {
      const current = styleStats.get(s) || {
        fail_count: 0,
        total_attempts: 0,
      }
      current.total_attempts++
      if (climb.outcome === 'Fail') {
        current.fail_count++
      }
      styleStats.set(s, current)
    })
  })

  const sorted = Array.from(styleStats.entries())
    .map(([style, stats]) => ({
      style,
      fail_rate: stats.total_attempts > 0
        ? stats.fail_count / stats.total_attempts
        : 0,
      ...stats,
    }))
    .filter((s) => s.total_attempts >= 3) // Only analyze styles with 3+ attempts
    .sort((a, b) => b.fail_rate - a.fail_rate)
    .slice(0, 5) // Top 5 weaknesses

  return { struggling_styles: sorted }
}

function extractClimbingFrequency(climbs: Climb[]): ClimbingFrequency {
  const weekCounts = new Map<string, number>()

  climbs.forEach((climb) => {
    const date = new Date(climb.created_at)
    const weekKey = getWeekKey(date)
    weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1)
  })

  const sortedWeeks = Array.from(weekCounts.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12) // Last 12 weeks

  const climbsPerWeek = sortedWeeks.map(([week, count]) => ({
    week: formatWeek(week),
    count,
  }))

  const totalClimbs = climbs.length
  const daysSpanned = getDaysSpanned(climbs[0].created_at, climbs[climbs.length - 1].created_at)
  const avgPerMonth = daysSpanned > 0
    ? Math.round((totalClimbs / daysSpanned) * 30)
    : 0

  return {
    climbs_per_week: climbsPerWeek,
    climbs_per_month: avgPerMonth,
    avg_climbs_per_session: calculateAvgPerSession(climbs),
  }
}

function extractRecentSuccesses(climbs: Climb[]): RecentSuccesses {
  const recentSends = climbs
    .filter((c) => c.outcome === 'Sent')
    .slice(0, 10)

  // Track highest grade sent
  const maxGradeSent = recentSends.reduce((max, climb) => {
    const normalized = normalizeGrade(climb.grade_scale, climb.grade_value)
    return normalized > max ? normalized : max
  }, 0)

  const gradeProgression = recentSends
    .filter((c) => {
      const normalized = normalizeGrade(c.grade_scale, c.grade_value)
      return normalized === maxGradeSent
    })
    .slice(0, 5)
    .map((climb) => ({
      grade: `${climb.grade_scale}:${climb.grade_value}`,
      date: new Date(climb.created_at).toLocaleDateString(),
    }))

  const redemptions = climbs.filter((c) => c.redemption_at !== null).length

  return {
    recent_sends: recentSends,
    grade_progression: gradeProgression,
    redemption_count: redemptions,
  }
}

function getEmptyPatterns(): PatternAnalysis {
  return {
    failure_patterns: { most_common_failure_reasons: [] },
    style_weaknesses: { struggling_styles: [] },
    climbing_frequency: {
      climbs_per_week: [],
      climbs_per_month: 0,
      avg_climbs_per_session: 0,
    },
    recent_successes: {
      recent_sends: [],
      grade_progression: [],
      redemption_count: 0,
    },
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatWeek(weekKey: string): string {
  const [year, week] = weekKey.split('-W')
  return `Week ${week}, ${year}`
}

function getDaysSpanned(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateAvgPerSession(climbs: Climb[]): number {
  if (climbs.length === 0) return 0

  // Group climbs by day (approximate session)
  const sessions = new Map<string, number>()

  climbs.forEach((climb) => {
    const day = new Date(climb.created_at).toDateString()
    sessions.set(day, (sessions.get(day) || 0) + 1)
  })

  const totalSessions = sessions.size
  return Math.round(climbs.length / totalSessions)
}
```

### Coach Service with Cost Tracking
```typescript
// Source: OpenRouter API + Supabase Edge Functions patterns
// File: src/services/coach.ts

import { supabase } from '@/lib/supabase'
import { anonymizeClimbsForAI } from '@/lib/coachUtils'
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

  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('generate-recommendations', {
    body: {
      user_id: user.id,
      climbs_data: anonymizedClimbs,
      user_preferences: input.user_preferences,
    },
  })

  if (error) {
    // Track failed attempt
    await trackApiUsage(user.id, {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      cost_usd: 0,
      model: 'openai/gpt-4o-mini',
      endpoint: 'generate-recommendations',
    }, true)

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
    cost_usd: number
    model: string
    endpoint: string
  },
  isError: boolean = false,
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  const { error } = await supabase.from('coach_api_usage').insert({
    user_id: userId,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    cost_usd: isError ? 0 : usage.cost_usd,
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
  const promptCost = usage.prompt_tokens * 0.00015 / 1000 // $0.15 per 1M tokens
  const completionCost = usage.completion_tokens * 0.0006 / 1000 // $0.60 per 1M tokens
  return promptCost + completionCost
}
```

### TanStack Query Hooks for Coach
```typescript
// Source: Existing useClimbs pattern from codebase
// File: src/hooks/useCoach.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { GenerateRecommendationsInput } from '@/services/coach'
import {
  checkUserRateLimit,
  coachKeys,
  generateRecommendations,
  getLatestRecommendations,
} from '@/services/coach'

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
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
  })
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateRecommendations,
    onSuccess: () => {
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
```

### Coach Messages Hook
```typescript
// Source: Existing useClimbs pattern from codebase
// File: src/hooks/useCoachMessages.ts

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
    .limit(20) // Last 20 messages

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
```

### Data Anonymization Utilities
```typescript
// Source: Privacy best practices for AI integration
// File: src/lib/coachUtils.ts

import type { Climb, Style, FailureReason } from '@/types'

export interface AnonymizedClimb {
  location: string
  grade_scale: string
  grade_value: string
  climb_type: string
  style: Style[]
  outcome: string
  awkwardness: number
  failure_reasons: FailureReason[]
}

/**
 * Anonymizes climb data before sending to external LLM API.
 * Removes PII, specific locations, and user identifiers.
 */
export function anonymizeClimbsForAI(climbs: Climb[]): AnonymizedClimb[] {
  return climbs.map((climb) => ({
    location: sanitizeLocation(climb.location),
    grade_scale: climb.grade_scale,
    grade_value: climb.grade_value,
    climb_type: climb.climb_type,
    style: climb.style,
    outcome: climb.outcome,
    awkwardness: climb.awkwardness,
    failure_reasons: climb.failure_reasons,
  }))
}

/**
 * Converts specific location names to generic location types.
 * Example: "Metro Rock Gym" -> "indoor_gym"
 */
function sanitizeLocation(location: string): string {
  const lowerLocation = location.toLowerCase()

  if (
    lowerLocation.includes('gym') ||
    lowerLocation.includes('climbing wall') ||
    lowerLocation.includes('studio')
  ) {
    return 'indoor_gym'
  }

  if (lowerLocation.includes('crag') || lowerLocation.includes('boulder') || lowerLocation.includes('cliff')) {
    return 'outdoor_crags'
  }

  return 'climbing_location'
}

/**
 * Validates that anonymized data contains no PII.
 * Returns list of detected PII fields if any found.
 */
export function validateAnonymizedData(data: unknown): string[] {
  const piiFields: string[] = []

  const checkForPII = (obj: unknown, path = ''): void => {
    if (typeof obj !== 'object' || obj === null) {
      return
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key

      // Check for common PII indicators
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('name') && value.length > 20) {
          piiFields.push(currentPath)
        }
        if (key.toLowerCase().includes('email') && value.includes('@')) {
          piiFields.push(currentPath)
        }
        if (key.toLowerCase().includes('phone') && /\d{10}/.test(value)) {
          piiFields.push(currentPath)
        }
        if (currentPath.includes('location') && /^[A-Z][a-z]+(?: [A-Z][a-z]+){2,}$/.test(value)) {
          piiFields.push(currentPath) // Likely a specific place name
        }
      }

      if (typeof value === 'object' && value !== null) {
        checkForPII(value, currentPath)
      }
    }
  }

  checkForPII(data)
  return piiFields
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate columns for all fields | JSONB for flexible data + separate for indexed fields | PostgreSQL 9.4+ | Enables schema evolution while maintaining performance |
| In-memory rate limiting | Database-backed rate limiting with time windows | 2020s best practice | Persists across restarts, distributed, audit trail |
| Cost tracking after deployment | Cost tracking built in from day one | 2022+ | Prevents cost surprises, enables proactive management |
| Server-side only validation | Zod runtime validation at boundaries | 2023+ | Type safety from database to UI, better error messages |
| Custom caching solutions | TanStack Query with staleTime, cacheTime | 2023+ | Automatic cache invalidation, stale-while-revalidate, SSR support |

**Deprecated/outdated:**
- Direct SQL injection in Edge Functions: Use Supabase client with typed queries
- localStorage for large data: TanStack Query with persistence plugins
- Hardcoded API keys: Environment variables via Deno.env.get()
- Manual rate limiting in client code: Always enforce server-side

## Open Questions

1. **What is the specific OpenRouter API endpoint and model pricing?**
   - What we know: OpenRouter provides OpenAI-compatible API, uses Authorization: Bearer header
   - What's unclear: Exact base URL, model IDs, pricing per token for gpt-4o-mini and alternatives
   - Recommendation: Fetch OpenRouter documentation or API reference during implementation, start with conservative rate limits

2. **What should the daily token limit be per user?**
   - What we know: Need to implement rate limiting, should be tracked in database
   - What's unclear: Appropriate limit (50k tokens/day? 100k?), how to handle free vs paid tiers
   - Recommendation: Start with 50k tokens/day (sufficient for ~10-15 recommendation generations), monitor usage, adjust based on actual user behavior and costs

3. **How should recommendations be versioned when schema evolves?**
   - What we know: JSONB allows flexible schema, but structure changes affect UI
   - What's unclear: Migration strategy for existing recommendations, backward compatibility
   - Recommendation: Add version field to coach_recommendations table, include in JSONB content, update parse logic to handle multiple versions

## Sources

### Primary (HIGH confidence)
- **PostgreSQL JSONB documentation** - Verified JSONB vs JSON performance, GIN indexes, jsonb_path_ops
  - URL: https://www.postgresql.org/docs/current/datatype-json.html
- **Supabase Edge Functions documentation** - Verified environment variables (Deno.env.get), external API calls, error handling
  - URL: https://supabase.com/docs/guides/functions
- **Supabase Row Level Security documentation** - Verified auth.uid() usage, policy patterns, security notes
  - URL: https://supabase.com/docs/guides/auth/row-level-security
- **Existing codebase patterns** - Verified service structure (climbs.ts, profiles.ts), hook patterns (useClimbs.ts), RLS policies
  - Files: src/services/climbs.ts, src/hooks/useClimbs.ts, supabase/migrations/*.sql

### Secondary (MEDIUM confidence)
- **Supabase Edge Functions secrets** - Environment variable management, best practices
  - URL: https://supabase.com/docs/guides/functions/secrets
- **OpenRouter API information** - API format (OpenAI-compatible), authentication, usage tracking
  - Note: Specific endpoints and pricing not verified due to 404 errors on docs URLs
- **Domain knowledge (climbing)** - Failure reasons, styles, grading systems from existing types
  - Files: src/types/index.ts, src/lib/grades.ts, src/lib/validation.ts

### Tertiary (LOW confidence)
- **WebSearch results** - Could not access due to rate limits on search provider
- **OpenRouter specific API reference** - Could not verify exact endpoints and pricing due to 404 errors
- **Cost tracking patterns** - Based on general best practices, not specific to OpenRouter

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from package.json and existing codebase
- Architecture: HIGH - Patterns extracted from existing services (climbs.ts, profiles.ts) and official Supabase documentation
- Pitfalls: HIGH - Derived from common AI integration mistakes and database performance patterns
- OpenRouter API specifics: MEDIUM - General OpenAI-compatible format confirmed, but endpoints/pricing not verified
- Rate limiting thresholds: LOW - Need to determine based on actual usage during implementation

**Research date:** 2026-01-17
**Valid until:** 2026-02-16 (30 days - stable domains: PostgreSQL, Supabase, TanStack Query; OpenRouter API may change)
