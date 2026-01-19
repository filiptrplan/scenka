---
phase: 23-refocus-coach-on-technique
plan: 06
type: execute
wave: 3
autonomous: true
depends_on: [23-01, 23-02, 23-03, 23-04, 23-05]
tags:
  - client types
  - UI components
  - measurable outcomes
  - TypeScript
  - React
---

# Phase 23 Plan 06: Client Type and UI Update for measurable_outcome Summary

**One-liner:** Added measurable_outcome field to GenerateRecommendationsResponse interface and coach-page UI to display drill goals with conditional rendering for backward compatibility.

## Deliverables

### Files Modified

| File | Description |
|------|-------------|
| `src/services/coach.ts` | Added measurable_outcome field to GenerateRecommendationsResponse drill type |
| `src/components/features/coach-page.tsx` | Added conditional UI rendering for measurable_outcome with green styling |

### Key Changes

**1. Updated GenerateRecommendationsResponse Interface:**
```typescript
export interface GenerateRecommendationsResponse {
  weekly_focus: string
  drills: Array<{
    name: string
    description: string
    sets: number
    reps: string
    rest: string
    measurable_outcome: string  // NEW - required field
  }>
}
```

**2. Added measurable_outcome Display in Coach Page:**
```typescript
{drill.measurable_outcome && (
  <p className="text-sm text-green-400/80 leading-relaxed font-mono mt-2 pt-2 border-t border-white/10">
    Goal: {drill.measurable_outcome}
  </p>
)}
```

## Architecture

### Type Consistency Flow

```
Edge Function (Phase 23-02)
  ↓ Drill schema validation with measurable_outcome (min 10 chars)
  ↓
Client Interface (src/services/coach.ts)
  ↓ GenerateRecommendationsResponse.drills.measurable_outcome
  ↓
UI Component (coach-page.tsx)
  ↓ Conditional rendering with drill.measurable_outcome
  ↓
User Display
  ↓ Green text with "Goal:" prefix for visual distinction
```

### Design Rationale

**UI Styling:**
- `text-green-400/80`: Green color to distinguish goals from descriptions
- `font-mono`: Code-like feel for measurable, specific metrics
- `border-t border-white/10`: Separator line for visual separation
- `mt-2 pt-2`: Spacing above and below the separator
- Conditional rendering: Handles old cached recommendations without this field

## Dependencies

### Required

- Phase 23-02: Edge Function drill schema with measurable_outcome validation
- Phase 23-05: Edge Function recent climbs integration

### Provides

- Client-side type safety for measurable_outcome field
- UI display of drill goals for progress tracking
- Backward compatibility with old cached recommendations

## Technical Decisions

### 1. Required Field (Non-Optional)

**Reasoning:**
- Edge Function enforces measurable_outcome as required (min 10 chars)
- Client interface should match server contract exactly
- No "?" in type definition - all new recommendations will have this field

### 2. Conditional Rendering in UI

**Reasoning:**
- Old cached recommendations won't have measurable_outcome field
- Prevents errors when displaying historical data
- No migration needed - graceful degradation built in
- Matches pattern used for description field

### 3. Green Color for measurable_outcome

**Reasoning:**
- Visual distinction from description (text-[#bbb])
- Green semantically suggests "success" or "goal achieved"
- Consistent with other section colors (blue for focus, green for drills, orange for patterns)
- /80 opacity for readability on dark background

### 4. font-mono for measurable_outcome

**Reasoning:**
- Measurable outcomes are specific metrics (e.g., "Hang for 20s", "Complete 5 sets")
- Monospace font feels technical/precise
- Differentiates from description which uses normal font

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Success Criteria Verification

- [x] GenerateRecommendationsResponse interface includes measurable_outcome field
- [x] UI renders measurable_outcome with conditional rendering
- [x] TypeScript compiles without errors (pnpm typecheck)
- [x] Styling distinguishes measurable_outcome from description
- [x] Conditional rendering handles old cached recommendations

## Next Phase Readiness

### Ready For:
- Edge Function deployment with updated system prompt (23-02)
- Testing with real recommendations to verify goal display
- User can now see measurable outcomes and track drill progress

### Considerations:
- Users need to regenerate recommendations to see measurable_outcome
- Old cached recommendations will not display goals until regenerated
- Edge Function must be deployed with Phase 23-02 changes for new drill generation

### Blockers:
- **Edge Function deployment:** User must run `npx supabase functions deploy openrouter-coach` to deploy Phase 23-02 changes
- **Recommendation regeneration:** Users must click "Regenerate Recommendations" to see new drill format

## Metrics

- **Duration:** 4 minutes
- **Files Modified:** 2
- **Lines Changed:** 6
- **Commits:** 2 (2 feature)

---

**Phase:** 23 of 23 (Refocus Coach on Technique)
**Plan:** 06 of 5 (additional gap closure)
**Status:** Complete
**Completed:** 2026-01-19
