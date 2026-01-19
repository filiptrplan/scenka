# Phase 27: Impose Daily Limit on Usage - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

## Phase Boundary

Implement daily usage limits of 2 recommendation generations and 10 chat messages per user. Limits should be enforced before LLM API calls to control costs, with configurable limits via environment variables.

## Implementation Decisions

### Limit enforcement
- Edge Function only — check limits at Edge Function layer, not database RLS
- Check limit **before** LLM API call to save costs on blocked requests
- Store daily counts as **two separate counters** in database (not JSONB)
- Check current daily count via **direct database query** (no in-memory cache)

### Day reset behavior
- Daily count resets at **UTC midnight** (same reset time for all users)
- Store current date in a **new separate table** (user_limits) with columns: user_id, rec_count, chat_count, limit_date
- Reset happens **on first request** of the day (not scheduled background job)
- On first request after reset: **reset counts and allow request** in same operation

### User feedback & messaging
- Display usage as **simple counter text** (e.g., "2/2 recommendations used today"), not progress bar
- **No warnings** before hitting daily limit — just show the count
- Display counter **inline next to actions** (next to Generate button on Coach page, Send button on Chat page)
- **Refresh count after each action** (not just on page load)

### Exceeded behavior
- **Hard block** when user exceeds limit — completely block the action with clear error message
- Error message shows **time until reset** (e.g., "You've reached your daily limit. Next reset in 8 hours.")
- When at limit, **disable the button** with tooltip/inline message
- **Separate limits for each** — recommendations and chat have independent counters (2 recs, 10 chat)

### Configurable limits
- Use **two separate env vars**: `DAILY_REC_LIMIT` and `DAILY_CHAT_LIMIT`
- Default values: 2 for recommendations, 10 for chat
- Edge Functions read these env vars to enforce limits

### Claude's Discretion
- Exact schema design for user_limits table (indexing, constraints)
- Time calculation for "next reset in X hours" display
- Error message wording and styling
- Button disabled state design (visual feedback)
- Env var validation/fallback if not set

## Specific Ideas

No specific requirements — open to standard approaches

## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 27-daily-limit*
*Context gathered: 2026-01-19*
