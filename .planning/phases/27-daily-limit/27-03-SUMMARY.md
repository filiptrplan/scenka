---
phase: 27-daily-limit
plan: 03
one-liner: Daily chat limit enforcement in openrouter-chat Edge Function with atomic counter increment
subsystem: Edge Functions
tags: [edge-function, daily-limits, openrouter, sse-streaming]
---

# Phase 27 Plan 03: Daily Chat Limit Enforcement Summary

## Objective

Update openrouter-chat Edge Function to check daily chat limit before starting SSE stream, returning 429 when exceeded. Enforce daily limit of 10 chat messages per user before making expensive LLM API calls to prevent unnecessary costs.

## What Was Built

### Edge Function Enhancement (openrouter-chat)

**Added environment variable:**
- `DAILY_CHAT_LIMIT` - Configurable daily limit (default 10)

**Limit check logic (before LLM API call):**
1. Query `user_limits` table for `chat_count` and `limit_date` using `maybeSingle()`
2. Calculate `effectiveCount` - resets to 0 if `limit_date` != today
3. Return 429 status when `effectiveCount >= dailyChatLimit`
4. Error response includes `limit_type: 'chat'`, `current_count`, and `limit`
5. Calculate and display time until next UTC midnight reset

**Counter increment (atomic):**
- Call `supabase.rpc('increment_chat_count', { p_user_id: userId })` BEFORE storing message
- Increment happens before any LLM API call or message storage
- RPC function handles atomic reset and increment (created in 27-01)

**Error response format when limit exceeded:**
```json
{
  "error": "You've reached your daily limit. Next reset in 8 hours",
  "limit_type": "chat",
  "current_count": 10,
  "limit": 10
}
```

## Key Decisions Made

### Check limit before increment and API call
The limit check happens BEFORE any message storage or LLM API call. This prevents:
- Expensive LLM API calls for blocked requests
- Database writes for messages that will be rejected
- Wasted processing time and resources

### Atomic increment via RPC function
Using `supabase.rpc('increment_chat_count')` ensures atomic counter increment with automatic daily reset handling. The RPC function (from 27-01) handles:
- INSERT with default `chat_count=1` if no record exists
- ON CONFLICT: Increment existing counter or reset to 1 if new day
- All in one database transaction

### Client-side effectiveCount calculation
The Edge Function calculates `effectiveCount` client-side to handle the case where `limit_date != today` (first request after reset). The comparison:
```typescript
const isSameDay = limitDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]
const effectiveCount = isSameDay ? chatCount : 0
```
This ensures the limit check works correctly even before the RPC function has performed the reset.

### Time until reset calculation
Calculate hours until next UTC midnight and format user-friendly messages:
- "< 1 hour": "Next reset in less than 1 hour"
- "< 24 hours": "Next reset in X hours"
- Otherwise: "Next reset tomorrow at midnight UTC"

### Graceful degradation on limit check error
If fetching user_limits fails, the function continues anyway. This prevents the Edge Function from failing entirely if there's a temporary database issue, though in practice this shouldn't happen because user_limits table exists from 27-01.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None - no authentication was required during this plan execution.

## Dependency Graph

**Requires:**
- Phase 27-01: Database foundation for Daily Limits (user_limits table, increment_chat_count RPC function)

**Provides:**
- Daily chat limit enforcement at Edge Function layer
- Cost protection from preventing LLM API calls for blocked requests

**Affects:**
- Phase 27-04: Frontend UI feedback (must handle 429 responses and display error messages)

## Tech Stack Changes

**Added:**
- `DAILY_CHAT_LIMIT` environment variable requirement
- Daily limit check logic in openrouter-chat Edge Function

**Patterns Established:**
- Pre-request limit check pattern to prevent expensive operations
- Atomic counter increment via RPC function before resource usage
- User-friendly error messages with time until reset

## Key Files

### Created
- None (new plan files in .planning directory)

### Modified
- `supabase/functions/openrouter-chat/index.ts` - Added daily limit check before LLM API call

## Verification

**Code Changes:**
- DAILY_CHAT_LIMIT added to requiredEnvVars (line 7)
- dailyChatLimit parsed from environment with default of 10 (line 18)
- Limit query added after userId extraction (lines 112-117)
- effectiveCount calculation with day reset handling (lines 124-131)
- 429 response returned when limit exceeded (lines 133-154)
- Counter increment via RPC before message storage (line 157)

**TypeScript:**
- Type checking passed (`npm run typecheck`)

**Linting:**
- No new linting errors introduced in Edge Function
- Pre-existing linting errors in other files (unrelated to this change)

## Next Phase Readiness

**Ready for Phase 27-04 (Frontend UI Feedback):**
- Edge Function now returns 429 status with structured error response when chat limit exceeded
- Frontend can display appropriate error messages when limit is reached
- Users will see time until next reset in error messages

**No blockers or concerns.**

## Metrics

**Duration:** 1 minute
**Completed:** 2026-01-19

**Tasks:** 1/1 complete

## Summary

Successfully implemented daily chat limit enforcement in the openrouter-chat Edge Function. The function now checks the user_limits table before making any LLM API calls, returning a 429 status with a clear error message when the daily limit of 10 chat messages is exceeded. The counter increments atomically via the increment_chat_count RPC function before any message storage or API calls, ensuring cost protection by preventing expensive operations for blocked requests. Error messages include time until next UTC midnight reset for user clarity.
