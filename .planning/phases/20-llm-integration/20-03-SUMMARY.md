---
phase: 20-llm-integration
plan: 03
subsystem: edge-functions
tags: [openrouter, error-handling, fallback, privacy, validation, supabase-edge-functions, deno]

# Dependency graph
requires:
  - phase: 20-01
    provides: Edge Function with JWT validation and OpenRouter SDK
  - phase: 20-02
    provides: JSON schema validation with retry logic
provides:
  - Error handling with fallback to cached recommendations
  - Privacy validation before LLM API calls
  - Client-side coach.ts calling correct Edge Function name
affects: [20-04, 20-05, 21-chat]

# Tech tracking
tech-stack:
  added: []
  patterns: [fallback-to-cache, privacy-validation-first, graceful-degradation]

key-files:
  created: []
  modified:
    - supabase/functions/openrouter-coach/index.ts
    - src/services/coach.ts

key-decisions:
  - None - followed plan as specified

patterns-established:
  - Fallback pattern: Always fetch cached data before external API calls for graceful degradation
  - Privacy-first: Validate anonymized data contains no PII before sending to external APIs
  - Response consistency: Include is_cached flag in all responses for UI handling

# Metrics
duration: 12min
completed: 2026-01-18
---

# Phase 20 Plan 03: Error Handling with Fallback Summary

**Edge Function with cached recommendations fallback, privacy validation before LLM calls, and client-side coach.ts updated to call 'openrouter-coach'**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-18T10:39:49Z
- **Completed:** 2026-01-18T10:52:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `getExistingRecommendations()` helper function to fetch cached recommendations from database
- Implemented `validateAnonymizedData()` function for defensive PII detection before LLM calls
- Edge Function fetches cached recommendations before calling OpenRouter API for fallback
- API failures return cached recommendations with informative warning message
- Privacy validation returns 400 error if PII detected in anonymized data
- Client-side `coach.ts` now calls 'openrouter-coach' Edge Function (previously incorrect 'generate-recommendations')
- Response handling updated for new Edge Function format (success, content, usage, is_cached, warning)

## Task Commits

**Note:** Task 1 (Edge Function error handling) was already implemented in Phase 20-02 commit 95dafcf as part of the retry logic implementation.

1. **Task 2: Update coach.ts to call 'openrouter-coach' Edge Function** - `bd5616b` (feat)

**Plan metadata:** (will be created after summary)

## Files Created/Modified

- `supabase/functions/openrouter-coach/index.ts` - Edge Function with error handling and fallback logic
- `src/services/coach.ts` - Client service updated to call correct Edge Function name and handle new response format

## Decisions Made

None - followed plan as specified. The fallback logic, privacy validation, and response format were all implemented according to the plan specification.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Error handling with fallback is fully implemented
- Privacy validation ensures data safety before LLM calls
- Client-side service correctly calls the 'openrouter-coach' Edge Function
- Response format includes is_cached flag for UI handling
- Edge Function is ready for Phase 20-04 (chat streaming)

---
*Phase: 20-llm-integration*
*Completed: 2026-01-18*
