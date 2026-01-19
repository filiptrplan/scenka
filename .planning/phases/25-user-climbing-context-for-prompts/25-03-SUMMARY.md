---
phase: 25
plan: 03
subsystem: coach-service
tags: typescript, supabase, edge-functions, api-integration
completed: 2026-01-19
duration: 3m

requires:
  - Phase 25-01: Database migration and type definitions for climbing_context
  - Phase 25-02: Settings page UI for climbing context entry

provides:
  - Coach service integration with climbing_context field
  - climbing_context passed to Edge Function in request body
  - Profile fetching for AI coach context

affects:
  - src/services/coach.ts

tech-stack:
  added: []
  patterns:
    - Fetch user profile during recommendation generation
    - Pass optional climbing_context field to Edge Function
    - Backward compatibility with profiles without context

deviations:
  - Rule 1 - Bug: None
  - Rule 2 - Missing Critical: None
  - Rule 3 - Blocking: None
  - Rule 4 - Architectural: None
---

# Phase 25 Plan 03: Coach Service Climbing Context Integration Summary

Updated coach service to fetch user profile and pass climbing_context to the AI coach Edge Function for personalized recommendations.

## What Was Built

Integrated the climbing_context field from user profiles into the AI coach recommendation flow. The coach service now fetches the user's profile and includes their climbing context (goals, weaknesses, style preferences) in the Edge Function request, enabling more personalized coaching recommendations.

## Technical Implementation

### Import Changes (src/services/coach.ts)

- Added `import { getProfile } from '@/services/profiles'` to enable profile fetching

### generateRecommendations() Function Changes

**Profile Fetching:**
- Added `const profile = await getProfile()` after pattern extraction
- Uses existing getProfile() function from profiles service
- Executes sequentially with pattern extraction and recent climbs fetch

**Edge Function Request Body Update:**
- Added `climbing_context: profile?.climbing_context` to request body
- Optional chaining (`?.`) allows null/undefined for profiles without context
- Maintains backward compatibility with existing users

## Decisions Made

1. **Sequential profile fetch:** Profile fetch placed after pattern extraction to maintain existing sequential execution pattern (rate limit check → patterns → recent climbs → profile)
2. **Optional chaining:** Used `profile?.climbing_context` to safely handle profiles without climbing_context field (null/undefined)
3. **No validation required:** Edge Function receives optional climbing_context field and can handle null values gracefully

## Testing

**Type Checking:**
- `npm run typecheck` - No errors

**Manual Verification Checklist:**
- Coach service imports getProfile from profiles service
- generateRecommendations() fetches user profile before Edge Function call
- climbing_context is included in request body
- TypeScript compilation passes
- Profile type correctly imported and used

## Next Phase Readiness

**Blockers:** None

**Considerations:**
1. The climbing_context field is now passed to the Edge Function, but the Edge Function has not yet been updated to include it in the system prompt (Phase 25-04)
2. Coach service is backward compatible - profiles without climbing_context will not cause errors
3. Profile fetch is asynchronous and may add ~100ms to recommendation generation (acceptable for infrequent operation)

**Ready for Phase 25-04:** The Edge Function is ready to receive climbing_context in the request body for system prompt integration.
