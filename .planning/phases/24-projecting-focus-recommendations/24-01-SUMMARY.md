---
phase: 24-projecting-focus-recommendations
plan: 01
subsystem: api, llm
tags: edge-function, openrouter, supabase, projecting-focus, recommendations

# Dependency graph
requires:
  - phase: 23-refocus-coach
    provides: technique-first coaching system with recent climb history
provides:
  - Projecting focus recommendations in coach Edge Function
  - Validation for projecting_focus JSON structure (3-4 items with required fields)
  - System prompt guidelines for gym-aware focus area generation
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
  - Edge Function validation pattern for JSON arrays
  - LLM system prompt with gym limitation awareness
  - Qualitative grade guidance instead of specific ranges

key-files:
  created: []
  modified:
    - supabase/functions/openrouter-coach/index.ts

key-decisions:
  - "Qualitative grade guidance only (e.g., 'slightly above max grade') rather than specific grade ranges"
  - "Gym limitation awareness in focus recommendations (crimpy overhangs common, dynos with toe hooks rare)"
  - "3-4 focus areas to give users options rather than single recommendation"
  - "Base recommendations primarily on style weaknesses from pattern analysis"

patterns-established:
  - "LLM prompt guidelines: enumerate concrete examples for what to recommend vs avoid"
  - "JSON array validation: check count bounds (3-4 items) and individual item field validation"

# Metrics
duration: 9min
completed: 2026-01-19
---

# Phase 24 Plan 1: Projecting Focus Recommendations Summary

**Extended Edge Function to generate 3-4 projecting focus areas with qualitative grade guidance and gym limitation awareness**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-19T15:42:44Z
- **Completed:** 2026-01-19T15:51:47Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Added projecting_focus field to system prompt with full field definition and guidelines
- Implemented validation for projecting_focus array (3-4 items with required fields and minimum lengths)
- Updated example output to demonstrate projecting_focus structure
- Included gym limitation awareness to recommend commonly-set styles

## Task Commits

Each task was committed atomically:

1. **Task 1: Update system prompt to include projecting_focus field** - `4341708` (feat)
2. **Task 2: Update validateResponse to validate projecting_focus** - `f14da0e` (feat)
3. **Task 3: Update example output in buildUserPrompt** - `1830a3a` (feat)

## Files Created/Modified
- `supabase/functions/openrouter-coach/index.ts` - Extended to generate projecting_focus recommendations

## Decisions Made

1. **Qualitative grade guidance only** - The LLM provides guidance like "slightly above max grade" rather than specific grade ranges. This accounts for different grade scales (Font, V-Scale, Color) and individual progression patterns.

2. **Gym limitation awareness** - System prompt instructs LLM to recommend styles that most gyms set (e.g., "crimpy overhangs are common; dynos with toe hooks are rare"). This prevents users from being told to find problems that don't exist in their gym.

3. **3-4 focus areas for options** - Rather than a single recommendation, the system generates 3-4 focus areas to give users choice based on what's actually available at their gym.

4. **Style weakness-based recommendations** - Focus areas are primarily based on style weaknesses (e.g., if struggling with Sloper, recommend "Sloper problems" or "Sloper overhangs").

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Edge Function deployment required.** The updated openrouter-coach Edge Function must be deployed:

```bash
supabase functions deploy openrouter-coach
```

This extends the existing Edge Function without requiring any new environment variables.

## Next Phase Readiness

- Projecting focus recommendations fully integrated into coach Edge Function
- Client-side UI will need to display projecting_focus content in Phase 24-02
- No database schema changes needed - JSONB content storage supports new field

---
*Phase: 24-projecting-focus-recommendations*
*Completed: 2026-01-19*
