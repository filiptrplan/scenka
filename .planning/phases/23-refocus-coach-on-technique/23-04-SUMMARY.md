---
phase: 23-refocus-coach-on-technique
plan: 04
type: execute
wave: 2
autonomous: true
depends_on: [23-03]
tags:
  - coach service
  - LLM integration
  - data extraction
  - climbing data
  - recent climbs
---

# Phase 23 Plan 04: Include Recent Climbs in Edge Function Request Summary

**One-liner:** Updated client coach service to fetch and include the last 30 anonymized climbs in Edge Function request body, enabling LLM to analyze raw climb data for more personalized technique recommendations.

## Deliverables

### Files Modified

| File | Description |
|------|-------------|
| `src/services/coach.ts` | Added recent climbs fetch and inclusion in Edge Function request |

### Key Changes

**Updated Imports:**
- Added `extractRecentClimbs` to patterns import: `import { extractPatterns, extractRecentClimbs } from '@/services/patterns'`
- Added `AnonymizedClimb` type import: `import type { Climb, AnonymizedClimb } from '@/types'`

**generateRecommendations Function Updates:**
- Fetch recent climbs after pattern extraction: `const recentClimbs: AnonymizedClimb[] = await extractRecentClimbs(user.id)`
- Include recent_climbs in Edge Function request body alongside patterns_data and user_preferences
- Added explicit type annotation for recentClimbs variable

**Request Body Structure:**
```typescript
body: {
  user_id: user.id,
  patterns_data: patterns,          // Aggregated pattern analysis
  user_preferences: input.user_preferences,
  recent_climbs: recentClimbs,      // Raw anonymized climb data
}
```

## Architecture

### Data Flow

```
User Request
  ↓
generateRecommendations(input)
  ↓
Extract Patterns (aggregated analysis)
  ↓
Extract Recent Climbs (raw AnonymizedClimb[])
  ↓
Edge Function Invoke
  ↓
Body includes: { user_id, patterns_data, user_preferences, recent_climbs }
  ↓
LLM receives both aggregated patterns AND raw climbs
  ↓
More nuanced technique recommendations based on individual climb data
```

### Why Both Patterns and Raw Climbs?

**PatternAnalysis (aggregated):**
- Failure patterns (most common failure reasons)
- Style weaknesses (struggling styles by fail rate)
- Climbing frequency (climbs per week/month)
- Recent successes (grade progression, redemptions)

**AnonymizedClimb[] (raw):**
- Individual climb records with grade, style, outcome, awkwardness
- Specific failure reasons per climb
- User notes for context
- Dates for temporal pattern analysis

**Combined Value:**
- LLM can cross-reference aggregated stats with individual climbs
- Identify specific technique issues behind high-level patterns
- Provide targeted drills for unique failure scenarios
- Spot subtle trends not captured in aggregated metrics

## Dependencies

### Required

- Phase 18: Pattern Analysis (patterns.ts)
- Phase 18-04: Anonymization utilities (coachUtils.ts)
- Phase 23-01: AnonymizedClimb type with notes and date fields
- Phase 23-03: extractRecentClimbs function

### Provides

- Raw climb data pipeline to Edge Function
- Foundation for LLM to analyze individual climb patterns
- Enables more personalized and specific technique recommendations

## Technical Decisions

### 1. Fetch After Pattern Extraction

**Reasoning:**
- Sequential execution ensures both data sources are available
- Maintains existing pattern extraction logic unchanged
- recentClimbs fetch is independent of patterns extraction
- Parallel execution possible but unnecessary for performance

### 2. Explicit Type Annotation

**Reasoning:**
- `const recentClimbs: AnonymizedClimb[]` makes type intent explicit
- Provides TypeScript documentation for maintainers
- Ensures type safety in request body composition
- Eliminates "unused import" TypeScript warning

### 3. Request Body Order

**Reasoning:**
- user_id first (required for auth/RLS)
- patterns_data next (aggregated analysis)
- user_preferences (user context)
- recent_climbs last (raw data, typically largest)
- Consistent with existing request structure

### 4. No Schema Changes Required

**Reasoning:**
- Recent climbs passed as request body field
- Edge Function can access via `event.body.recent_climbs`
- No database table modifications needed
- JSONB content storage in coach_recommendations supports schema evolution

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Success Criteria Verification

- [x] extractRecentClimbs is imported from '@/services/patterns'
- [x] AnonymizedClimb type is imported from '@/types'
- [x] generateRecommendations fetches recent climbs after extracting patterns
- [x] Request body includes recent_climbs field with AnonymizedClimb[] data
- [x] TypeScript compiles without errors

## Next Phase Readiness

### Ready For:
- Phase 23-05: (if added) Update Edge Function to consume recent_climbs in prompt
- Phase 24: (if added) Use recent climbs in chat context for Q&A

### Considerations:
- Edge Function currently ignores recent_climbs in request body
- LLM will not benefit from raw climb data until Edge Function is updated
- Backward compatible - Edge Function still works with existing fields
- No immediate user impact until Edge Function prompt is updated

### Blockers:
- **Edge Function deployment:** User must run `npx supabase functions deploy openrouter-coach` to update function with recent_climbs consumption
- **LLM prompt update:** System prompt needs to be updated to reference recent_climbs data

## Metrics

- **Duration:** 3 minutes
- **Files Modified:** 1
- **Lines Changed:** +4, -2
- **Imports Added:** 2 (extractRecentClimbs, AnonymizedClimb)
- **Commits:** 1

---

**Phase:** 23 of 23 (Refocus Coach on Technique)
**Plan:** 04 of 5
**Status:** Complete
**Completed:** 2026-01-19
