---
phase: 18-ai-coach-foundation
plan: 05
subsystem: state-management
tags: [tanstack-query, react-hooks, caching, recommendations, chat]

# Dependency graph
requires:
  - phase: 18-01
    provides: Database schema for coach_recommendations and coach_messages tables
  - phase: 18-03
    provides: Coach service API abstraction (generateRecommendations, getLatestRecommendations, checkUserRateLimit)
provides:
  - TanStack Query hooks for fetching coach recommendations with 24h stale time
  - Mutation hooks for generating new recommendations with cache invalidation
  - Query hooks for rate limit status with 5min stale time
  - Query hooks for fetching chat messages (last 20) with 1h stale time
  - Mutation hooks for creating/clearing chat messages
affects: [19-coach-ui, 21-coach-chat]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack Query cache management with queryKeys and queryClient invalidation"
    - "Auth error handling (throws Error for components to handle)"
    - "Graceful error logging without throwing (allows UI to show cached data)"

key-files:
  created:
    - src/hooks/useCoach.ts
    - src/hooks/useCoachMessages.ts
  modified: []

key-decisions:
  - "24h stale time for recommendations enables offline support (REC-07 requirement)"
  - "5min stale time for rate limit balances freshness with API efficiency"
  - "1h stale time for chat messages - infrequent refresh is acceptable"

patterns-established:
  - "Pattern: Query key hierarchy with coachKeys and coachMessagesKeys"
  - "Pattern: Supabase auth.getUser() for authentication in queryFn"
  - "Pattern: queryClient.invalidateQueries() in mutation onSuccess callbacks"

# Metrics
duration: 6min
completed: 2026-01-17
---

# Phase 18: TanStack Query Hooks for Coach Features Summary

**TanStack Query hooks for coach recommendations with 24h caching, rate limit monitoring, and chat message management with 20-message limit**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-17T21:15:32Z
- **Completed:** 2026-01-17T21:21:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `useCoach.ts` with recommendation query (24h stale time) and generation mutation with cache invalidation
- Created `useCoachMessages.ts` with message query (20 limit, 1h stale time) and create/clear mutations
- Established TanStack Query patterns matching existing useClimbs.ts hooks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCoach hooks for recommendations** - `37a48fc` (feat)
2. **Task 2: Create useCoachMessages hooks for chat** - `25a0913` (feat)

## Files Created/Modified

- `src/hooks/useCoach.ts` - TanStack Query hooks for coach recommendations and rate limit
- `src/hooks/useCoachMessages.ts` - TanStack Query hooks for coach chat messages

## Decisions Made

- 24h stale time for recommendations enables offline support and reduces unnecessary API calls (REC-07 requirement)
- 5min stale time for rate limit balances freshness with API efficiency
- 1h stale time for chat messages - infrequent refresh is acceptable for chat history

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused GenerateRecommendationsInput import**
- **Found during:** Task 1 (TypeScript type check)
- **Issue:** GenerateRecommendationsInput was imported but never used, causing TS6133 error
- **Fix:** Removed the unused import from useCoach.ts
- **Files modified:** src/hooks/useCoach.ts
- **Verification:** `pnpm typecheck` passes without errors
- **Committed in:** 37a48fc (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix essential for type safety. No scope creep.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Coach hooks complete and ready for Phase 19 (Coach UI implementation)
- Chat message hooks complete and ready for Phase 21 (Chat implementation)
- All queries export queryKeys for cache management and invalidation
- Auth errors handled properly for UI integration

---
*Phase: 18-ai-coach-foundation*
*Completed: 2026-01-17*
