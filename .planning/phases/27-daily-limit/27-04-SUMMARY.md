---
phase: 27-daily-limit
plan: 04
one-liner: Client-side hooks for fetching daily usage limits and refreshing counters after actions
subsystem: Client Hooks
tags: [tanstack-query, react-hooks, usage-limits, cache-invalidation]
---

# Phase 27 Plan 04: Client-side Usage Limits Hooks Summary

## Objective

Create client-side hook for fetching usage limits and update existing hooks to invalidate limits after actions. This enables the UI to display current usage counts and refresh counters after each action (recommendation generation, chat message).

## What Was Built

### New Hook: useUserLimits

**File created:** `src/hooks/useUserLimits.ts`

**Exports:**
- `userLimitsKeys` - Query key factory for TanStack Query
- `useUserLimits()` - Hook for fetching current daily usage limits
- `getTimeUntilNextReset()` - Helper function for calculating hours until UTC midnight reset
- `UserLimits` - TypeScript interface for type safety

**Query configuration:**
- `queryKey`: `['user-limits', 'current']` (via userLimitsKeys.current())
- `staleTime: 0` - Always fetch fresh data (required by CONTEXT.md)
- `gcTime: 30 * 1000` - Cache for 30 seconds (short duration for performance)
- Returns `UserLimits | null` (null for unauthenticated users or users without limits row)

**Query behavior:**
- Fetches `rec_count`, `chat_count`, `limit_date` from `user_limits` table
- Uses `maybeSingle()` to handle users without limits row (returns null instead of error)
- Checks for authenticated user before querying database

### Updated Hooks: useCoach.ts

**File modified:** `src/hooks/useCoach.ts`

**Changes:**
- Added `userLimitsKeys` import from `./useUserLimits`
- Updated `useGenerateRecommendations` `onSuccess` callback:
  - Added invalidation of `user-limits` query
  - Counter displays will refresh after successful recommendation generation

### Updated Hooks: useCoachMessages.ts

**File modified:** `src/hooks/useCoachMessages.ts`

**Changes:**
- Added `userLimitsKeys` import from `./useUserLimits`
- Updated `useCreateCoachMessage` `onSuccess` callback:
  - Added invalidation of `user-limits` query
  - Counter displays will refresh after each chat message

## Technical Implementation

### Code Location: `src/hooks/useUserLimits.ts`

**Lines 1-13:** Imports and exports
- TanStack Query `useQuery` for data fetching
- Supabase client for database queries
- `userLimitsKeys` query key factory
- `UserLimits` interface for type safety

**Lines 15-46:** useUserLimits hook
- `staleTime: 0` ensures fresh data on every fetch (required by CONTEXT.md)
- `gcTime: 30 * 1000` provides short cache duration for performance
- `maybeSingle()` handles users without limits row gracefully
- Null return for unauthenticated users

**Lines 48-64:** getTimeUntilNextReset helper
- Calculates UTC midnight for tomorrow
- Computes hours until reset
- Returns user-friendly messages:
  - "Next reset in less than 1 hour"
  - "Next reset in X hours"
  - "Next reset tomorrow at midnight UTC"

### Cache Invalidation Pattern

Both `useGenerateRecommendations` and `useCreateCoachMessage` now invalidate the `user-limits` query on successful mutations:

```typescript
onSuccess: () => {
  void queryClient.invalidateQueries({
    queryKey: userLimitsKeys.current(),
  })
}
```

This forces a refetch to get the updated counter from the database after each action.

## Decisions Made

### staleTime: 0 for fresh data on every fetch

Per CONTEXT.md requirements, the hook uses `staleTime: 0` to ensure fresh data is always fetched. This is critical for accurate limit display because:
- Counters are incremented in Edge Functions before API calls
- Client needs to see the updated count immediately after action
- No caching of limit data prevents stale counter displays

### 30-second gcTime for performance

While `staleTime` is 0 (no cache freshness), `gcTime: 30 * 1000` keeps data in garbage collection cache for 30 seconds. This provides:
- Performance benefit for rapid successive fetches
- No stale data risk (invalidation forces refetch)
- Reduced database queries during page transitions

### maybeSingle() instead of single()

The hook uses `maybeSingle()` to handle users without a limits row yet. This is important because:
- New users won't have a limits row until first action
- Returns `null` instead of throwing error
- Enables graceful degradation (null counts handled by UI)

### Invalidated in useCreateCoachMessage

Chat messages use `useStreamingChat` which internally uses `useCreateCoachMessage` for storing messages. By invalidating user limits in `useCreateCoachMessage`, we ensure:
- Counter refreshes after every chat message (both user and assistant)
- Single source of truth for invalidation
- Consistent with existing invalidation pattern (coach messages list)

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None - no authentication was required during this plan execution.

## Dependency Graph

**Requires:**
- Phase 27-01: Database foundation for Daily Limits (user_limits table exists)
- Phase 27-02: Edge Function daily recommendation limit enforcement (counter increments)
- Phase 27-03: Edge Function daily chat limit enforcement (counter increments)

**Provides:**
- Client-side hook for fetching current usage limits
- Cache invalidation for refreshing counters after actions
- Helper function for calculating time until next reset

**Affects:**
- Phase 27-05: Frontend UI feedback for recommendations (will use useUserLimits hook)
- Phase 27-06: Frontend UI feedback for chat (will use useUserLimits hook)

## Tech Stack Changes

**Added:**
- `useUserLimits` hook for fetching daily usage limits
- `getTimeUntilNextReset` helper function for time calculations
- `userLimitsKeys` query key factory for TanStack Query

**Patterns Established:**
- Query key export pattern for invalidation in other hooks
- staleTime: 0 pattern for critical real-time data
- Invalidation on success pattern for counter updates

## Key Files

### Created
- `src/hooks/useUserLimits.ts` - Hook for fetching daily usage limits

### Modified
- `src/hooks/useCoach.ts` - Added user limits invalidation to useGenerateRecommendations
- `src/hooks/useCoachMessages.ts` - Added user limits invalidation to useCreateCoachMessage

## Verification

**Code Changes:**
- useUserLimits hook created with all required exports (lines 4-64)
- staleTime: 0 configured correctly (line 43)
- getTimeUntilNextReset returns correct time strings for different scenarios (lines 48-64)
- useGenerateRecommendations invalidates user-limits on success (lines 91-93)
- useCreateCoachMessage invalidates user-limits on success (lines 96-98)

**TypeScript:**
- Type checking passed (`npm run typecheck`)
- UserLimits interface exported for type safety (line 9-13)

**Linting:**
- Pre-existing linting errors in other files (unrelated to this change)
- No new linting errors introduced in modified files

**Imports:**
- userLimitsKeys import added to useCoach.ts (line 12)
- userLimitsKeys import added to useCoachMessages.ts (line 5)
- Correct queryKey pattern for invalidation (userLimitsKeys.current())

## Next Phase Readiness

**Ready for Phase 27-05 (Frontend UI Feedback for Recommendations):**
- useUserLimits hook provides access to current rec_count and limit_date
- Counter will refresh automatically after recommendation generation
- getTimeUntilNextReset helper available for error messages

**Ready for Phase 27-06 (Frontend UI Feedback for Chat):**
- useUserLimits hook provides access to current chat_count and limit_date
- Counter will refresh automatically after each chat message
- getTimeUntilNextReset helper available for error messages

**No blockers or concerns.**

## Metrics

**Duration:** 2 minutes
**Completed:** 2026-01-19

**Tasks:** 2/2 complete

**Commits:**
- 4d1d59e: feat(27-04): create useUserLimits hook for fetching daily usage limits
- 725e958: feat(27-04): invalidate user-limits query after recommendations and chat

## Summary

Successfully created client-side hooks for fetching daily usage limits and refreshing counters after actions. The useUserLimits hook provides access to rec_count, chat_count, and limit_date with staleTime: 0 to ensure fresh data on every fetch. Updated useGenerateRecommendations and useCreateCoachMessage to invalidate the user-limits query on success, ensuring counter displays refresh automatically after each action. The getTimeUntilNextReset helper function provides user-friendly time-until-reset messages for UI integration in the next phase plans (27-05 and 27-06).
