# Phase 27: Impose Daily Limit on Usage - Research

**Researched:** 2026-01-19
**Domain:** PostgreSQL + Supabase Edge Functions + React + TanStack Query
**Confidence:** HIGH

## Summary

This phase implements daily usage limits to control LLM API costs: 2 recommendation generations and 10 chat messages per user. The implementation requires three main components: (1) a new `user_limits` table to track daily counters with UTC midnight reset, (2) Edge Function layer validation before API calls to prevent unnecessary costs, and (3) client-side counter display with disabled button states when limits are reached.

**Primary recommendation:** Use PostgreSQL upsert pattern with `INSERT ... ON CONFLICT DO UPDATE` for atomic counter updates, check limits in Edge Functions before LLM API calls, and leverage TanStack Query's `setQueryData` for optimistic counter updates.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | Current (Supabase) | Database with daily counters | Built-in support, already used in project |
| Supabase Edge Functions | Deno 2.x | Limit enforcement before API calls | Existing infrastructure, access to env vars |
| TanStack Query | v5 (in use) | Client state for usage counters | Existing caching/invalidation patterns |
| shadcn/ui | + Radix UI Primitives | Button + Tooltip components | Already in use, consistent design |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | v5 | Optimistic counter updates | Refresh counts after actions |
| lucide-react | Current | RefreshCw, MessageCircle icons | Existing UI iconography |
| date-fns | Current | Time calculations | Already imported for time display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL counters | Redis counters | PostgreSQL is already deployed, adds no infrastructure, but slightly slower (not a concern for daily limits) |
| Edge Function check | Database trigger | Edge Function check is more explicit, easier to test, allows custom error messages |
| TanStack Query cache | localStorage cache | TanStack Query integrates with existing architecture, automatic refetch on mutations |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
# Database migration required:
npx supabase db push

# Environment variables required:
supabase secrets set DAILY_REC_LIMIT=2
supabase secrets set DAILY_CHAT_LIMIT=10
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── useUserLimits.ts      # Hook for fetching/managing usage limits
├── services/
│   └── limits.ts             # Service for limit checking queries
├── components/features/
│   ├── coach-page.tsx         # Update with rec counter display
│   └── chat-page.tsx         # Update with chat counter display
supabase/
├── migrations/
│   └── create_user_limits.sql   # New table migration
└── functions/
    ├── openrouter-coach/
    │   └── index.ts            # Add rec limit check
    └── openrouter-chat/
        └── index.ts            # Add chat limit check
```

### Pattern 1: Database Counter Table with Upsert

**What:** PostgreSQL table with separate counters for recommendations and chat messages, using upsert pattern for atomic updates and UTC midnight reset.

**When to use:** Any time you need to track daily usage with atomic increments and day-based resets.

**Example:**
```sql
-- Source: PostgreSQL INSERT ON CONFLICT pattern
-- Ref: https://medium.com/the-table-sql-and-devtalk/postgresql-upsert-with-insert-on-conflict-clean-inserts-and-updates-8f720c5cfe6c

CREATE TABLE public.user_limits (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rec_count INTEGER NOT NULL DEFAULT 0 CHECK (rec_count >= 0),
  chat_count INTEGER NOT NULL DEFAULT 0 CHECK (chat_count >= 0),
  limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookup (primary key already indexed)
-- Check constraint for non-negative counters

-- Upsert pattern: insert or increment counters
INSERT INTO public.user_limits (user_id, rec_count, chat_count, limit_date)
VALUES ($1, 1, 0, CURRENT_DATE)
ON CONFLICT (user_id)
DO UPDATE SET
  rec_count = CASE
    WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
    ELSE user_limits.rec_count + 1           -- Increment
  END,
  chat_count = CASE
    WHEN user_limits.limit_date < CURRENT_DATE THEN 0  -- Reset only
    ELSE user_limits.chat_count                 -- No change
  END,
  limit_date = CURRENT_DATE,
  updated_at = now();
```

**Key insight:** `CURRENT_DATE` in PostgreSQL returns UTC date if server timezone is UTC (Supabase default), eliminating need for explicit time zone handling.

### Pattern 2: Edge Function Limit Check Before API Call

**What:** Validate user hasn't exceeded limit in Edge Function handler before making expensive LLM API calls.

**When to use:** Any operation that calls paid APIs where you want to prevent unnecessary costs.

**Example:**
```typescript
// Source: Existing openrouter-coach Edge Function pattern
// Ref: /workspace/supabase/functions/openrouter-coach/index.ts (lines 454-503)

// Check limit BEFORE LLM API call
const dailyRecLimit = parseInt(Deno.env.get('DAILY_REC_LIMIT') ?? '2')

// Get current user limits
const { data: limits, error: limitsError } = await supabase
  .from('user_limits')
  .select('rec_count, limit_date')
  .eq('user_id', userId)
  .single()

// Check if limit exceeded
if (limits && limits.limit_date >= CURRENT_DATE && limits.rec_count >= dailyRecLimit) {
  return new Response(
    JSON.stringify({
      error: 'Daily limit exceeded',
      limit_type: 'recommendations',
      current_count: limits.rec_count,
      limit: dailyRecLimit,
    }),
    { status: 429, headers: corsHeaders }
  )
}

// Increment counter (upsert) - DO THIS BEFORE API CALL
await supabase.rpc('increment_rec_count', { p_user_id: userId })

// NOW make LLM API call (only if limit not exceeded)
const response = await openai.chat.completions.create(...)
```

**Key insight:** Check limits and increment counters BEFORE LLM API call. This prevents API costs for blocked requests.

### Pattern 3: Client-Side Counter with TanStack Query

**What:** Fetch current usage counts from database, display inline next to buttons, refresh after each action.

**When to use:** Display real-time usage counters that update after mutations.

**Example:**
```typescript
// Source: TanStack Query patterns
// Ref: https://tanstack.com/query/v5/docs/react/guides/optimistic-updates

export function useUserLimits() {
  return useQuery({
    queryKey: ['user-limits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('user_limits')
        .select('rec_count, chat_count, limit_date')
        .eq('user_id', user.id)
        .single()
      return data
    },
    staleTime: 0,      // Always fetch fresh data
    gcTime: 30 * 1000, // Cache for 30s (short duration)
  })
}

// In component:
const { data: limits } = useUserLimits()
const dailyRecLimit = 2 // From env var or config

const remaining = dailyRecLimit - (limits?.rec_count ?? 0)
const isAtLimit = remaining <= 0

// Display inline counter:
<p className="text-xs text-[#888]">
  {remaining}/{dailyRecLimit} recommendations used today
</p>
```

### Pattern 4: Disabled Button with Inline Message

**What:** Disable action button when limit reached with tooltip/inline message explaining the situation.

**When to use:** Prevent user from attempting actions that will be blocked by Edge Function.

**Example:**
```typescript
// Source: shadcn/ui Button + disabled state patterns
// Ref: /workspace/src/components/features/coach-page.tsx (lines 272-280)

// PROBLEM: shadcn Tooltip doesn't work on disabled elements
// SOLUTION: Wrap in span for tooltip, check limit manually

<Button
  onClick={handleRegenerate}
  disabled={generateRecommendations.isPending || isAtLimit}
  className="w-full h-12 bg-white text-black disabled:opacity-50"
>
  <RefreshCw className="h-4 w-4 mr-2" />
  {generateRecommendations.isPending ? 'Generating...' : 'Regenerate'}
</Button>

// Show inline message when at limit (instead of tooltip)
{isAtLimit && (
  <p className="text-xs text-red-400 mt-2">
    {limitsError?.error || 'You&apos;ve reached your daily limit'}
  </p>
)}
```

**Anti-patterns to Avoid:**
- **Tooltip on disabled button:** shadcn/ui Tooltip doesn't trigger on disabled elements. Use inline message or wrapper span.
- **Optimistic counter updates for limits:** Don't optimistically increment counters. Limits must be validated server-side for correctness.

### Pattern 5: Time Until Reset Calculation

**What:** Calculate hours until next UTC midnight reset for error messages.

**When to use:** Display countdown or "next reset in X hours" messaging.

**Example:**
```typescript
// Source: JavaScript Date API
// Ref: https://stackoverflow.com/questions/8583694/determine-minutes-until-midnight

function getTimeUntilNextReset(): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0) // Set to UTC midnight

  const msUntilReset = tomorrow.getTime() - now.getTime()
  const hoursUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60))

  if (hoursUntilReset <= 1) {
    return 'Next reset in less than 1 hour'
  } else if (hoursUntilReset < 24) {
    return `Next reset in ${hoursUntilReset} hours`
  } else {
    return 'Next reset tomorrow at midnight UTC'
  }
}
```

### Anti-Patterns to Avoid
- **Optimistic limit checks on client:** Client can be bypassed. Always enforce limits server-side in Edge Functions.
- **JSONB for counters:** CONTEXT.md explicitly requires separate columns (rec_count, chat_count). Don't use JSONB.
- **In-memory cache for limits:** CONTEXT.md requires direct database queries. Cache bypasses limit enforcement.
- **Scheduled background job for reset:** CONTEXT.md requires reset on first request of day. Simpler, no infra overhead.
- **Progress bars for counters:** CONTEXT.md explicitly requires simple counter text (e.g., "2/2"). Don't use progress bars.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Counter increment logic | Manual update queries | PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` with CASE statement | Atomic, handles race conditions, one roundtrip |
| Time zone handling | Manual UTC calculations | PostgreSQL `CURRENT_DATE` function | Supabase defaults to UTC, built-in function |
| Edge Function env vars | Custom config file | `Deno.env.get()` + `supabase secrets set` | Standard pattern, integrates with dashboard |
| Counter refresh on action | Manual state updates | TanStack Query `invalidateQueries()` or `setQueryData()` | Existing architecture, automatic cache management |
| Button disabled states | Custom disabled handling | shadcn/ui Button `disabled` prop | Consistent UI, accessible |

**Key insight:** PostgreSQL upsert with CASE statement handles both increment and reset in one atomic operation. No need for separate SELECT then UPDATE logic.

## Common Pitfalls

### Pitfall 1: Counter Race Conditions
**What goes wrong:** Concurrent requests can both increment counter from 2 to 3 instead of 3 and 4.

**Why it happens:** Separate SELECT and UPDATE operations aren't atomic.

**How to avoid:** Use PostgreSQL upsert (`INSERT ... ON CONFLICT DO UPDATE`) with atomic counter increment.

**Warning signs:** Counts don't match actual usage, limits reached prematurely.

### Pitfall 2: Time Zone Confusion in Reset
**What goes wrong:** Users in different timezones reset at different times, causing inconsistent experience.

**Why it happens:** Using local time or `Date.now()` instead of server time.

**How to avoid:** Use PostgreSQL `CURRENT_DATE` which returns UTC date on Supabase servers.

**Warning signs:** Users report reset happening at wrong times.

### Pitfall 3: LLM API Calls Before Limit Check
**What goes wrong:** Expensive API calls made even when user exceeded limit.

**Why it happens:** Limit check happens after API call or not at all.

**How to avoid:** Check limits BEFORE making LLM API call in Edge Function.

**Warning signs:** API costs higher than expected, rate limit errors after API calls.

### Pitfall 4: Not Refreshing Counters After Actions
**What goes wrong:** Counter display shows stale count after user performs action.

**Why it happens:** Cache not invalidated after mutation.

**How to avoid:** Use TanStack Query `invalidateQueries()` or `setQueryData()` in mutation callbacks.

**Warning signs:** Users confused why button disabled when count shows remaining.

### Pitfall 5: Tooltip on Disabled Button Not Working
**What goes wrong:** Tooltip message doesn't appear when button is disabled.

**Why it happens:** shadcn/ui Tooltip (Radix UI) doesn't trigger on disabled elements by design.

**How to avoid:** Show inline message or wrap button in span for tooltip.

**Warning signs:** Users can't see why button is disabled.

## Code Examples

Verified patterns from official sources:

### Database Migration: Create user_limits Table
```sql
-- Source: PostgreSQL counter table design
-- Ref: https://www.dbvis.com/thetable/postgresql-upsert-insert-on-conflict-guide/

CREATE TABLE public.user_limits (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rec_count INTEGER NOT NULL DEFAULT 0 CHECK (rec_count >= 0),
  chat_count INTEGER NOT NULL DEFAULT 0 CHECK (chat_count >= 0),
  limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for limit_date queries (optional, helps with daily reset queries)
CREATE INDEX user_limits_limit_date_idx ON public.user_limits(limit_date);

-- Add comment
COMMENT ON TABLE public.user_limits IS 'Daily usage limits for recommendations and chat';
```

### Edge Function: Check Recommendation Limit
```typescript
// Source: Supabase Edge Function patterns
// Ref: /workspace/supabase/functions/openrouter-coach/index.ts

// Get environment variable with fallback
const dailyRecLimit = parseInt(Deno.env.get('DAILY_REC_LIMIT') ?? '2')
const dailyChatLimit = parseInt(Deno.env.get('DAILY_CHAT_LIMIT') ?? '10')

// Check limit BEFORE API call
const { data: limits, error } = await supabase
  .from('user_limits')
  .select('rec_count, limit_date')
  .eq('user_id', userId)
  .single()

if (limits && limits.rec_count >= dailyRecLimit) {
  const hoursUntilReset = calculateHoursUntilReset()
  return new Response(
    JSON.stringify({
      error: `You've reached your daily limit. Next reset in ${hoursUntilReset}.`,
      limit_type: 'recommendations',
      current_count: limits.rec_count,
      limit: dailyRecLimit,
    }),
    { status: 429, headers: corsHeaders }
  )
}

// Increment counter with upsert (atomic)
await supabase.rpc('increment_rec_count', { p_user_id: userId })

// NOW make LLM API call
const response = await openai.chat.completions.create(...)
```

### Edge Function: Check Chat Limit
```typescript
// Source: Supabase Edge Function patterns
// Ref: /workspace/supabase/functions/openrouter-chat/index.ts

// Check chat limit BEFORE streaming
const { data: limits, error } = await supabase
  .from('user_limits')
  .select('chat_count, limit_date')
  .eq('user_id', userId)
  .single()

const dailyChatLimit = parseInt(Deno.env.get('DAILY_CHAT_LIMIT') ?? '10')

if (limits && limits.chat_count >= dailyChatLimit) {
  const hoursUntilReset = calculateHoursUntilReset()
  return new Response(
    JSON.stringify({
      error: `You've reached your daily limit. Next reset in ${hoursUntilReset}.`,
      limit_type: 'chat',
      current_count: limits.chat_count,
      limit: dailyChatLimit,
    }),
    { status: 429, headers: corsHeaders }
  )
}

// Increment counter with upsert
await supabase.rpc('increment_chat_count', { p_user_id: userId })

// NOW store user message and start streaming
await supabase.from('coach_messages').insert({ ... })
const stream = await openai.chat.completions.create({ stream: true, ... })
```

### Client: Display Usage Counter on Coach Page
```typescript
// Source: TanStack Query + React patterns
// Ref: /workspace/src/hooks/useCoach.ts

export function useUserLimits() {
  return useQuery({
    queryKey: ['user-limits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('user_limits')
        .select('rec_count, chat_count, limit_date')
        .eq('user_id', user.id)
        .maybeSingle()
      return data ?? { rec_count: 0, chat_count: 0, limit_date: new Date().toISOString() }
    },
    staleTime: 0,
  })
}

// In coach-page.tsx:
const { data: limits } = useUserLimits()
const generateRecommendations = useGenerateRecommendations()
const dailyRecLimit = 2

const recCount = limits?.rec_count ?? 0
const recRemaining = Math.max(0, dailyRecLimit - recCount)
const isRecAtLimit = recRemaining <= 0

return (
  <>
    <div className="flex items-center justify-between">
      <Button onClick={handleRegenerate} disabled={isRecAtLimit}>
        Regenerate Recommendations
      </Button>
      <span className="text-xs text-[#888]">
        {recCount}/{dailyRecLimit} used today
      </span>
    </div>

    {isRecAtLimit && (
      <p className="text-xs text-red-400 mt-2">
        You've reached your daily limit. Next reset in {getTimeUntilNextReset()}.
      </p>
    )}
  </>
)
```

### Client: Display Usage Counter on Chat Page
```typescript
// Source: TanStack Query + React patterns
// Ref: /workspace/src/components/features/chat-page.tsx

// In chat-page.tsx:
const { data: limits } = useUserLimits()
const dailyChatLimit = 10

const chatCount = limits?.chat_count ?? 0
const chatRemaining = Math.max(0, dailyChatLimit - chatCount)
const isChatAtLimit = chatRemaining <= 0

const handleSend = async () => {
  if (isChatAtLimit) {
    toast.error('You have reached your daily chat limit')
    return
  }
  await sendMessage(message, patterns, profile?.climbing_context ?? null)
}

return (
  <>
    <Textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
    <div className="flex items-center gap-2">
      <Button onClick={handleSend} disabled={!inputValue.trim() || isStreaming || isChatAtLimit}>
        <Send className="h-4 w-4" />
      </Button>
      <span className="text-xs text-[#888]">
        {chatCount}/{dailyChatLimit} used today
      </span>
    </div>

    {isChatAtLimit && (
      <p className="text-xs text-red-400 mt-2">
        You've reached your daily limit. Next reset in {getTimeUntilNextReset()}.
      </p>
    )}
  </>
)
```

### Database: RPC Function for Atomic Counter Increment
```sql
-- Source: PostgreSQL function for atomic increment
-- Ref: PostgreSQL ON CONFLICT pattern

CREATE OR REPLACE FUNCTION public.increment_rec_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, limit_date)
  VALUES (p_user_id, 1, 0, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    rec_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1
      ELSE user_limits.rec_count + 1
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_chat_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, limit_date)
  VALUES (p_user_id, 0, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    chat_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1
      ELSE user_limits.chat_count + 1
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|---------|
| Redis counters | PostgreSQL upsert | PostgreSQL 9.5+ | Simpler infra, atomic operations |
| Scheduled reset job | First-request reset | - | No cron jobs needed, lower complexity |
| Client-side limit checks | Edge Function checks | - | Security, cost control |

**Deprecated/outdated:**
- **Redis for counters:** PostgreSQL upsert is sufficient for daily limits, adds no infrastructure
- **Scheduled background jobs:** First-request reset is simpler and sufficient
- **JSONB for counters:** Separate columns provide type safety and query efficiency

## Open Questions

None - all technical decisions have been clarified through research and CONTEXT.md constraints.

## Sources

### Primary (HIGH confidence)
- PostgreSQL Docs - Date/Time Functions - https://www.postgresql.org/docs/current/functions-datetime.html
- PostgreSQL INSERT ON CONFLICT Guide - https://www.dbvis.com/thetable/postgresql-upsert-insert-on-conflict-guide/
- Supabase Edge Functions Environment Variables - https://supabase.com/docs/guides/functions/secrets
- Supabase Edge Functions Testing - https://supabase.com/docs/guides/functions/unit-test
- TanStack Query Optimistic Updates - https://tanstack.com/query/v5/docs/react/guides/optimistic-updates

### Secondary (MEDIUM confidence)
- Medium: PostgreSQL Upsert with INSERT ON CONFLICT - https://medium.com/the-table-sql-and-devtalk/postgresql-upsert-with-insert-on-conflict-clean-inserts-and-updates-8f720c5cfe6c
- Stack Overflow: Time until midnight - https://stackoverflow.com/questions/8583694/determine-minutes-until-midnight
- MDN: Date.UTC() - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC

### Tertiary (LOW confidence)
- None - all findings verified with official sources or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in use, documented in codebase
- Architecture: HIGH - Patterns verified with official docs and existing codebase
- Pitfalls: HIGH - Issues documented in official sources, solutions validated

**Research date:** 2026-01-19
**Valid until:** 30 days (PostgreSQL and Supabase patterns are stable)
