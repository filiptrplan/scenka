---
phase: 23-refocus-coach-on-technique
plan: 05
subsystem: "Edge Function"
tags: ["openrouter-coach", "LLM", "edge-function", "types", "prompts"]
tech-stack:
  added: []
  patterns:
    - "Type safety across Edge Function and client code"
    - "Backward-compatible optional parameters"
    - "Compact JSON formatting for token efficiency"
---

# Phase 23 Plan 05: Edge Function Recent Climbs Integration Summary

**One-liner:** Updated Edge Function to accept and process recent climbs in the user prompt, enabling the LLM to provide more personalized technique recommendations based on raw climb data.

## Overview

This plan extended the OpenRouter Coach Edge Function to accept recent climb data and include it in the LLM prompt. The recent climbs (last 30) provide the LLM with granular context about the user's actual climbing sessions, allowing it to identify specific patterns and provide more targeted technique recommendations.

## Key Changes

### 1. Added AnonymizedClimb Interface
- Defined `AnonymizedClimb` interface matching the TypeScript type from `src/types/index.ts`
- Fields: location, grade_scale, grade_value, climb_type, style, outcome, awkwardness, failure_reasons, notes, date
- Maintains consistency with client-side type definitions

### 2. Updated RequestBody Interface
- Added `recent_climbs?: AnonymizedClimb[]` field
- Made optional for backward compatibility with older clients
- Placed after user_preferences field

### 3. Enhanced buildUserPrompt Function
- Updated signature to accept `recentClimbs?: AnonymizedClimb[]` parameter
- Added "Recent Climb History (last 30 climbs)" section
- Uses compact JSON formatting (`JSON.stringify(recentClimbs, null, 0)`) to save tokens
- Only includes section when recent climbs exist and have data
- Positioned between "Recent Successes" and final request section

### 4. Updated Function Call
- Modified main handler to pass `body.recent_climbs` to `buildUserPrompt`
- Completes the data flow from request body through prompt generation to LLM

## Files Modified

### `/workspace/supabase/functions/openrouter-coach/index.ts`
- Added `AnonymizedClimb` interface (line 66)
- Updated `RequestBody` interface with `recent_climbs` field (line 120)
- Updated `buildUserPrompt` signature with `recentClimbs` parameter (line 147)
- Added "Recent Climb History" section to prompt builder (lines 195-199)
- Updated `buildUserPrompt` call with `body.recent_climbs` argument (line 394)

## Decisions Made

1. **Optional Parameter with Default Undefined:** Made `recentClimbs` optional in the function signature to maintain backward compatibility with existing clients that don't send recent climbs.

2. **Compact JSON Formatting:** Used `JSON.stringify(recentClimbs, null, 0)` instead of pretty-printed JSON to minimize token usage while preserving all data structure.

3. **Conditional Section Inclusion:** Added check `if (recentClimbs && recentClimbs.length > 0)` to avoid including empty sections in the prompt.

4. **Section Placement:** Positioned "Recent Climb History" after "Recent Successes" but before the final request to provide LLM with detailed context before asking for recommendations.

5. **Type Consistency:** Matched the `AnonymizedClimb` interface exactly to the TypeScript type from `src/types/index.ts` (which was updated in Plan 23-01).

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered.

## Success Criteria Met

- [x] AnonymizedClimb interface exists in Edge Function
- [x] RequestBody includes recent_climbs field
- [x] buildUserPrompt accepts recentClimbs parameter
- [x] User prompt includes "Recent Climb History" section
- [x] buildUserPrompt is called with recent_climbs argument
- [x] Edge Function compiles without errors

## Next Steps

The Edge Function is now ready to receive recent climbs data. The next plan will update the client-side `coach.ts` service to fetch and send recent climbs when generating recommendations.

## Blocking Concerns

- **Edge Function deployment:** User must run `npx supabase functions deploy openrouter-coach` to deploy the updated Edge Function before it can accept recent_climbs in requests.

## Metrics

- **Duration:** 3.5 minutes (210 seconds)
- **Completed:** 2026-01-19
- **Commits:** 4 (interface addition, RequestBody update, signature update, prompt integration)
