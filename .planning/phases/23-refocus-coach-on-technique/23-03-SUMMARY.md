---
phase: 23-refocus-coach-on-technique
plan: 03
type: execute
wave: 2
autonomous: true
depends_on: [23-01]
tags:
  - data extraction
  - anonymization
  - pattern analysis
  - climbing data
  - LLM context
---

# Phase 23 Plan 03: Add extractRecentClimbs Function Summary

**One-liner:** Added extractRecentClimbs function to fetch and anonymize the last 30 climbs for LLM context, enabling more nuanced technique recommendations based on raw climb data.

## Deliverables

### Files Modified

| File | Description |
|------|-------------|
| `src/services/patterns.ts` | Added extractRecentClimbs function with anonymization |

### Key Changes

**New Function: extractRecentClimbs**
- Function signature: `export async function extractRecentClimbs(userId: string): Promise<AnonymizedClimb[]>`
- Fetches the last 30 climbs from the climbs table ordered by date descending
- Anonymizes all climbs using the existing `anonymizeClimsForAI` utility
- Returns empty array when no climbs exist (graceful degradation)
- Validates Supabase client configuration before querying
- Properly handles database errors with throw statements

**Added Imports:**
- `AnonymizedClimb` type from '@/types'
- `anonymizeClimsForAI` utility from '@/lib/coachUtils'

**Positioning:**
- Placed after `extractPatterns` function
- Positioned before helper functions section
- Exported for use by Edge Function and coach services

## Architecture

### Data Flow

```
Edge Function / Coach Service
  ↓
extractRecentClimbs(userId)
  ↓
Supabase Query (select '*', eq user_id, order desc, limit 30)
  ↓
anonymizeClimsForAI(climbs)
  ↓
AnonymizedClimb[]
  ↓
Passed to LLM as context
```

### AnonymizedClimb Structure

```typescript
{
  location: string        // Sanitized (indoor_gym/outdoor_crags/climbing_location)
  grade_scale: string     // font/v_scale/color_circuit
  grade_value: string     // Grade value from scale
  climb_type: string      // Boulder/Sport
  style: Style[]          // Array of climbing styles
  outcome: string         // Sent/Fail
  awkwardness: number     // 1-5 scale
  failure_reasons: FailureReason[]  // Array of failure reasons
  notes?: string | null   // User notes (validated for PII)
  date: string           // YYYY-MM-DD format
}
```

## Dependencies

### Required

- Phase 18: Pattern Analysis (patterns.ts structure)
- Phase 18-04: Anonymization utilities (anonymizeClimsForAI)
- Phase 23-01: AnonymizedClimb type with notes and date fields

### Provides

- Raw climb data extraction for LLM context
- Anonymized data pipeline for privacy protection
- Foundation for Phase 23-04: (if added) Integrate recent climbs into Edge Function prompt

## Technical Decisions

### 1. 30 Climb Limit

**Reasoning:**
- Provides sufficient recent context for pattern recognition
- Balances with token usage constraints in LLM calls
- Last 30 climbs typically represents ~3-6 climbing sessions
- Aligns with existing extractPatterns limit (100 climbs) for consistency

### 2. Order By Date Descending

**Reasoning:**
- Most recent climbs are most relevant for current coaching
- LLM can identify recent trends in performance
- Allows detection of short-term technique improvements or regressions
- Standard pattern for time-series data analysis

### 3. Existing Anonymization Utility

**Reasoning:**
- Reuses proven anonymization logic from Phase 18-04
- Maintains single source of truth for privacy protection
- Reduces code duplication and maintenance burden
- Validates for PII automatically through validateAnonymizedData

### 4. Empty Array Return for No Data

**Reasoning:**
- Graceful degradation pattern - app continues functioning with no climbs
- Edge Function can handle empty data in prompt generation
- Consistent with existing extractPatterns behavior
- Prevents crashes for new users

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Success Criteria Verification

- [x] extractRecentClimbs function exists in patterns.ts
- [x] Function imports and uses anonymizeClimsForAI
- [x] Function returns AnonymizedClimb[] type
- [x] Query limits to 30 climbs and orders by date descending
- [x] Function handles empty result case correctly (returns [])
- [x] TypeScript compiles without errors

## Next Phase Readiness

### Ready For:
- Phase 23-04: (if added) Integrate extractRecentClimbs into Edge Function prompt generation
- Phase 24: (if added) Use recent climbs data in chat context for more nuanced Q&A

### Considerations:
- Edge Function can now call extractRecentClimbs to get raw data for analysis
- LLM will have both aggregated patterns (PatternAnalysis) and raw climbs (AnonymizedClimb[])
- No database migration required - function operates on existing climbs table
- Privacy is maintained through anonymization before external API calls

### Blockers:
None identified. Implementation is complete and follows established patterns.

## Metrics

- **Duration:** 3 minutes
- **Files Modified:** 1
- **Lines Changed:** +25, -1
- **Functions Added:** 1 (extractRecentClimbs)
- **Commits:** 1

---

**Phase:** 23 of 23 (Refocus Coach on Technique)
**Plan:** 03 of 5
**Status:** Complete
**Completed:** 2026-01-19
