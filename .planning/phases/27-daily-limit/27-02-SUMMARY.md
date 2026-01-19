---
phase: 27-daily-limit
plan: 02
subsystem: Edge Functions
tags: [supabase, edge-functions, rate-limiting, daily-limits]
completed: 2026-01-19
duration: 5 min

requires:
  - Phase 27-01: Database Foundation for Daily Limits (user_limits table and RPC functions)

provides:
  - Daily recommendation limit enforcement in openrouter-coach Edge Function
  - 429 response with reset time calculation when limit exceeded

affects:
  - Phase 27-03: UI feedback for limit enforcement (client needs to handle 429 responses)
  - Users hitting daily recommendation limit (will see error message instead of incurring API costs)

tech-stack:
  added: []
  patterns:
    - Pre-API limit check pattern (validate before expensive operations)
    - Atomic counter increment before API call
    - UTC midnight reset calculation pattern
    - 429 Too Many Requests with time-until-reset response

deviations: []
---

# Phase 27 Plan 02: Edge Function Daily Recommendation Limit Enforcement Summary

Daily recommendation limit enforcement in openrouter-coach Edge Function, preventing expensive LLM API calls for users who have exceeded their daily quota of 2 recommendations per day.

## What Was Built

### Edge Function: openrouter-coach

**Environment Variable:**
- `DAILY_REC_LIMIT` added to requiredEnvVars (defaults to 2)
- Read via: `const dailyRecLimit = parseInt(Deno.env.get('DAILY_REC_LIMIT') ?? '2')`

**Limit Check Logic (before LLM API call):**
1. Query `user_limits` table for `rec_count` and `limit_date`
2. Calculate `effectiveCount` with day reset handling:
   - Compare `limit_date` with today's UTC date
   - If same day: use existing `rec_count`
   - If different day: count is 0 (reset on first request)
3. Return 429 response if `effectiveCount >= dailyRecLimit`
4. Include time-until-reset in error message

**429 Response Format:**
```json
{
  "error": "You've reached your daily limit. Next reset in 8 hours.",
  "limit_type": "recommendations",
  "current_count": 2,
  "limit": 2
}
```

**Counter Increment:**
- Call `supabase.rpc('increment_rec_count', { p_user_id: userId })` BEFORE LLM API call
- RPC function handles atomic increment and day reset in database
- Ensures we don't make expensive API calls for blocked requests

## Technical Implementation

### Code Location: `supabase/functions/openrouter-coach/index.ts`

**Lines 8-26:** Environment variable setup
- Added `DAILY_REC_LIMIT` to requiredEnvVars
- Parse with fallback to '2'

**Lines 483-529:** Limit check and counter increment
- Query user_limits with `maybeSingle()` (handles users without limits yet)
- Calculate `effectiveCount` using ISO date comparison
- Calculate hours until next UTC midnight reset
- Return 429 with formatted time message
- Increment counter via RPC BEFORE proceeding to LLM API call

### Time Until Reset Calculation

```typescript
const tomorrow = new Date(today)
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
const hoursUntilReset = Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60))

const resetMessage = hoursUntilReset <= 1
  ? 'Next reset in less than 1 hour'
  : hoursUntilReset < 24
    ? `Next reset in ${hoursUntilReset} hours`
    : 'Next reset tomorrow at midnight UTC'
```

## Decisions Made

### Client-side effective count calculation
Calculate `effectiveCount` client-side in Edge Function using date comparison:
- `isSameDay = limitDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]`
- If same day: use `rec_count`
- If different day: `effectiveCount = 0`

This allows first request after reset to proceed even before RPC executes, while RPC handles atomic reset-and-increment on database side.

### Error handling for limit check failure
Gracefully handle limit check errors:
```typescript
if (limitsError) {
  console.error('Failed to fetch user limits:', limitsError)
  // Continue anyway - limit check is a safety feature, don't block on errors
}
```
Limit check is a safety feature, so we don't block requests if database query fails.

### Increment happens BEFORE LLM API call
Critical for cost control: increment counter via RPC before making LLM API call. This ensures we don't make expensive API calls for requests that would be blocked at limit.

## Deviations from Plan

None - plan executed exactly as written.

## Testing

**Manual Testing Required:**

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy openrouter-coach --no-verify-jwt
   ```

2. **Set DAILY_REC_LIMIT environment variable:**
   ```bash
   supabase secrets set DAILY_REC_LIMIT=2
   ```

3. **Test with user at limit:**
   - Manually set `rec_count=2` and `limit_date=today` in database
   - Call Edge Function with valid JWT token
   - Verify returns 429 status with error message
   - Verify error message contains `limit_type: "recommendations"`
   - Verify no LLM API call made (check logs)

4. **Test with user below limit:**
   - Ensure `rec_count < 2` in database
   - Call Edge Function with valid JWT token
   - Verify counter increments via RPC
   - Verify returns 200 with recommendations
   - Verify LLM API call made

5. **Test with new user (no limits row):**
   - Delete or ensure no row exists in `user_limits` for test user
   - Call Edge Function with valid JWT token
   - Verify RPC creates limits row with `rec_count=1`
   - Verify returns 200 with recommendations

## Next Phase Readiness

**Ready for Phase 27-03 (UI feedback for limit enforcement):**
- Edge Function returns 429 with structured error response when limit exceeded
- Client can parse `limit_type`, `current_count`, and `limit` to display appropriate UI
- Error message includes time-until-reset for user feedback
- Counter increments atomically before API calls, preventing race conditions

**Remaining tasks for full daily limit implementation:**
- Phase 27-04: Add daily chat limit check to openrouter-chat Edge Function
- Phase 27-05: Add client-side usage counter display for recommendations
- Phase 27-06: Add client-side usage counter display for chat messages

**Deployment Required:**
- User must run `supabase functions deploy openrouter-coach --no-verify-jwt` to deploy updated Edge Function
- User must set `DAILY_REC_LIMIT=2` environment variable via `supabase secrets set`

## Metrics

**Duration:** 5 minutes
**Completed:** 2026-01-19

**Tasks:** 1/1 complete

**Commits:**
- e2a85f0: feat(27-02): add daily recommendation limit check to openrouter-coach

## Summary

Successfully implemented daily recommendation limit enforcement in openrouter-coach Edge Function. The implementation checks user_limits table before making LLM API calls, returning 429 with a clear error message and time-until-reset when users exceed their daily quota. Counter increments atomically via RPC function BEFORE LLM API call, preventing expensive API calls for blocked requests. The DAILY_REC_LIMIT environment variable is required with default value of 2 recommendations per day.
