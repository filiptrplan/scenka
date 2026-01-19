# Phase 27 Plan 05: Coach Page Recommendation Usage Counter Summary

**Phase:** 27-daily-limit
**Plan:** 05
**Type:** execute
**Status:** complete
**Completed:** 2026-01-19

---

## One-Liner

Added inline recommendation usage counter display to coach page with button disabling and time-until-reset error messages when limit exceeded.

---

## Objective

Update coach-page.tsx to display recommendation usage counter inline next to Generate button and disable button at limit.

---

## Deliverables

### Key Features Implemented

| Feature | Description | Location |
|---------|-------------|----------|
| Inline usage counter | Displays "X/2 used today" text next to Generate/Regenerate buttons | coach-page.tsx |
| Button disabling | Button disabled when limit reached (isRecAtLimit) | coach-page.tsx |
| Inline error message | Shows time until reset when at limit | coach-page.tsx |
| Counter auto-refresh | Counter updates after each action via query invalidation | useUserLimits hook |

### Files Modified

| File | Changes |
|------|---------|
| src/components/features/coach-page.tsx | Added useUserLimits import, inline counter display, button disabled state, inline error message |
| src/hooks/useCoach.ts | Added userLimits invalidation on successful recommendations |
| src/hooks/useStreamingChat.ts | Added userLimits invalidation on successful chat messages |
| src/hooks/useUserLimits.ts | Added null check for supabase client (Rule 2 fix) |

### Technical Implementation

**Coach page updates:**
- Import `useUserLimits` and `getTimeUntilNextReset` from useUserLimits hook
- Fetch current limits data: `const { data: limits } = useUserLimits()`
- Calculate usage state:
  ```typescript
  const dailyRecLimit = 2
  const recCount = limits?.rec_count ?? 0
  const recRemaining = Math.max(0, dailyRecLimit - recCount)
  const isRecAtLimit = recRemaining <= 0
  ```
- Update Generate/Regenerate buttons with `disabled={generateRecommendations.isPending || isRecAtLimit}`
- Add inline counter display: `<span className="text-xs text-[#888]">{recCount}/{dailyRecLimit} used today</span>`
- Add inline error when at limit: `{isRecAtLimit && <p className="text-xs text-red-400">{getTimeUntilNextReset()}</p>}`
- Applied to both empty state (Generate button) and existing recommendations view (Regenerate button)

**Hook updates for counter refresh:**
- Updated `useGenerateRecommendations` to invalidate user-limits query on success
- Updated `useStreamingChat` to invalidate user-limits query on successful message
- This ensures counter displays correct value after each action

---

## Decisions Made

1. **Simple text counter only:** Used inline text display ("1/2 used today") instead of progress bar, as specified in CONTEXT.md
2. **Inline error message:** Used inline error message instead of tooltip because shadcn/ui Tooltip doesn't work on disabled elements
3. **Error message positioning:** Placed error message after counter display for clear visual flow
4. **Counter refresh via invalidation:** Used query invalidation pattern (staleTime: 0 + invalidation on success) to ensure counter always shows fresh data
5. **Button disabled state:** Added `isRecAtLimit` to existing `isPending` check in disabled prop
6. **Same pattern in both locations:** Applied identical counter and error display to both Generate (empty state) and Regenerate (existing state) buttons

---

## Deviations from Plan

### Auto-fixed Issues (Rule 2 - Missing Critical Functionality)

**1. [Rule 2 - Missing Critical] Added null check for supabase client in useUserLimits**

- **Found during:** Task 1 (typecheck)
- **Issue:** useUserLimits.ts was missing null check for supabase client, causing TypeScript errors
- **Fix:** Added `if (!supabase) { throw new Error('Supabase client not configured') }` before using supabase
- **Files modified:** src/hooks/useUserLimits.ts
- **Impact:** Prevents runtime crashes when Supabase client is not configured

**2. [Rule 2 - Missing Critical] Added query invalidation to useGenerateRecommendations**

- **Found during:** Task 1 (counter refresh requirement)
- **Issue:** useGenerateRecommendations did not invalidate user-limits query after successful recommendations, so counter would not refresh
- **Fix:** Added `void queryClient.invalidateQueries({ queryKey: userLimitsKeys.current() })` to onSuccess callback
- **Files modified:** src/hooks/useCoach.ts
- **Impact:** Ensures counter displays updated value after each successful recommendation generation

**3. [Rule 2 - Missing Critical] Added query invalidation to useStreamingChat**

- **Found during:** Task 1 (counter refresh requirement)
- **Issue:** useStreamingChat did not invalidate user-limits query after successful chat messages, so counter would not refresh
- **Fix:** Added `void queryClient.invalidateQueries({ queryKey: userLimitsKeys.current() })` to onclose callback
- **Files modified:** src/hooks/useStreamingChat.ts
- **Impact:** Ensures counter displays updated value after each successful chat message

---

## Tech Stack Updates

**Added:** None (used existing @tanstack/react-query and lucide-react)

**Patterns established:**
- Query invalidation for counter freshness (staleTime: 0 + invalidation on success)
- Inline error messaging for disabled button states
- Usage state calculation pattern (count, remaining, isAtLimit)

---

## Performance Notes

- Counter queries use `staleTime: 0` to always fetch fresh data (as required by CONTEXT.md)
- Short `gcTime: 30 * 1000` (30s) to keep cache small while avoiding unnecessary refetches
- Query invalidation on successful mutations ensures counter updates without polling

---

## Blockers/Concerns

None. Plan executed successfully with only expected auto-fixes for critical functionality.

---

## Next Phase Readiness

**Completed for Phase 27-05:**
- Recommendation usage counter displays inline next to Generate/Regenerate buttons
- Button disabled when limit reached
- Inline error message shows time until reset when at limit
- Counter refreshes after each action (via query invalidation)

**Remaining Phase 27 tasks:**
- Plan 27-06: Add chat usage counter to chat-page.tsx

**No blockers to proceed.**
