---
phase: 31-ai-tag-extraction-service
plan: 07
subsystem: tag-extraction-ui-feedback
tags: [toast-notifications, error-handling, callbacks, react-hooks, fire-and-forget]

requires: [31-04, 31-05]
provides: [extraction-error-notifications, user-feedback-on-failure]
affects: [none]

tech-stack:
  added: []
  patterns: [optional-callback-pattern, error-propagation-service-to-ui, useEffect-toast-trigger]

decisions:
  - Optional callback pattern for extraction errors (maintains backward compatibility)
  - quota_exceeded excluded from callback (handled separately by existing isQuotaReached logic)
  - Non-blocking toast display - extraction never interferes with climb save
  - Error state cleared on mutation start (prevents stale errors)

file-changes:
  created: []
  modified: [src/services/climbs.ts, src/hooks/useClimbs.ts, src/App.tsx, src/types/index.ts]

metrics:
  duration: 3m
  completed: 2026-01-21

---

# Phase 31 Plan 07: Wire Extraction Error Toasts Summary

**Added toast notifications for all tag extraction failure types (api_error, network_error, unknown) while maintaining non-blocking save flow.**

## What Was Built

Wired tag extraction error notifications to UI for graceful user feedback when AI tag extraction fails:

1. **Extraction error callback in service layer** - Optional callback parameter in createClimb function
2. **Error state in hook** - useCreateClimb tracks extractionError from service layer
3. **Toast trigger in App.tsx** - useEffect displays appropriate toast message when error occurs
4. **Type system fixes** - Added missing type exports to resolve TypeScript errors

## Implementation Details

### Task 1: Service Layer Callback Pattern

**File: src/services/climbs.ts**

Added optional `onExtractionError` callback to `createClimb` function:

```typescript
export async function createClimb(
  input: CreateClimbInput,
  onExtractionError?: (errorType: TagExtractionErrorType) => void
): Promise<Climb>
```

**Key implementation details:**
- Callback is optional (maintains backward compatibility)
- Called inside triggerTagExtraction() Promise chain
- Only called for actual errors (excludes quota_exceeded since handled separately)
- Never awaited - maintains fire-and-forget pattern
- Extraction failure never blocks climb save flow

**Error handling in callback:**
```typescript
triggerTagExtraction(climb, user.id)
  .then((result: TagExtractionResult) => {
    if (!result.success && result.errorType !== undefined) {
      console.warn(`Tag extraction failed: ${result.errorType}`)
      if (result.errorType !== 'quota_exceeded') {
        onExtractionError?.(result.errorType)
      }
    }
  })
```

### Task 2: Hook State Management

**File: src/hooks/useClimbs.ts**

Modified `useCreateClimb` to track extraction error state:

```typescript
export function useCreateClimb() {
  const queryClient = useQueryClient()
  const [extractionError, setExtractionError] = useState<TagExtractionErrorType | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: (data: CreateClimbInput) => createClimb(data, setExtractionError),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
    onMutate: () => {
      setExtractionError(undefined) // Clear stale errors on new submission
    },
  })

  return {
    ...mutation,
    extractionError, // Exposed to UI
  }
}
```

**Key design decisions:**
- State cleared on onMutate (prevents showing stale errors)
- extractionError returned in hook return object for UI access
- Callback passed directly to createClimb function
- Maintains all existing mutation properties (isPending, mutate, etc.)

### Task 3: UI Toast Integration

**File: src/App.tsx**

Added useEffect to show extraction error toast when error is set:

```typescript
const { isQuotaReached, showQuotaReached, showExtractionError } = useTagExtractionFeedback()
const extractionError = createClimb.extractionError

useEffect(() => {
  if (extractionError !== undefined && extractionError !== 'quota_exceeded') {
    showExtractionError(extractionError)
  }
}, [extractionError, showExtractionError])
```

**Toast messages from useTagExtractionFeedback (existing from Phase 31-04):**
- `api_error`: "Tag extraction failed. You can add tags manually."
- `network_error`: "Tag extraction failed due to network. Check your connection."
- `unknown`: "Tag extraction failed. You can add tags manually."
- `quota_exceeded`: "Daily quota reached - tags extracted tomorrow. [time]" (excluded here)

**User flow:**
1. User saves climb with notes
2. "Climb logged successfully" toast appears immediately
3. Tag extraction runs in background (non-blocking)
4. If extraction fails, extractionError is set
5. useEffect triggers appropriate error toast
6. User sees both toasts (success + error)

### Task 4: Type System Fixes (Rule 3 - Blocking Issue)

**File: src/types/index.ts**

Added missing type exports that were causing TypeScript compilation errors:

```typescript
export type Climb = Tables<'climbs'>
export type AnonymizedClimb = Omit<Climb, 'user_id' | 'location'> & {
  location?: string
  notes: string
  date: string
}
export type GradeScale = 'font' | 'v_scale' | 'color_circuit'
export type Discipline = 'boulder' | 'sport'
export type Outcome = 'Sent' | 'Fail'
export type Style = 'Slab' | 'Vert' | 'Overhang' | 'Roof' | 'Dyno' | 'Crimp' | 'Sloper' | 'Pinch' | 'Tension'
export type FailureReason = 'Pumped' | 'Finger Strength' | 'Core' | 'Power' | 'Bad Feet' | 'Body Position' | 'Beta Error' | 'Precision' | 'Fear' | 'Commitment' | 'Focus'
export type HoldColor = 'Teal' | 'Green' | 'Yellow' | 'Orange' | 'Red' | 'Purple' | 'Blue' | 'Pink' | 'White' | 'Black'
export type TerrainType = 'Slab' | 'Vert' | 'Overhang' | 'Roof' | 'Dyno' | 'Crimp' | 'Sloper' | 'Pinch'
export type AwkwardnessLevel = 'awkward' | 'normal' | 'smooth'
```

**Why this was necessary (Rule 3 - Blocking Issue):**
- TypeScript compilation was failing with "Module '@/types' has no exported member 'Climb'"
- Multiple components import these types from '@/types'
- Without these exports, the codebase couldn't compile
- This was a blocker preventing task completion
- Type aliases use existing Tables types (no schema changes needed)

## Technical Decisions

1. **Optional callback pattern** - Backward compatible, doesn't require all callers to pass callback
2. **Excluding quota_exceeded** - Existing isQuotaReached logic handles this separately, avoiding duplicate toasts
3. **Fire-and-forget preserved** - Extraction happens in background, never blocks save flow
4. **onMutate clearing** - Prevents showing stale errors from previous failed extractions
5. **useEffect dependency array** - Properly tracks extractionError changes
6. **Type exports added** - Fundamental types now available across codebase (Rule 3 fix)

## Deviations from Plan

### Auto-fixed Issues (Rule 3 - Blocking Issue)

**1. Missing type exports blocking compilation**

- **Found during:** Task 3 verification
- **Issue:** TypeScript compilation failing with "Module '@/types' has no exported member 'Climb'" and similar errors for AnonymizedClimb, Style, FailureReason, HoldColor, etc.
- **Fix:** Added type aliases to src/types/index.ts for commonly used database and enum types
- **Files modified:** src/types/index.ts
- **Commit:** 2354d4c fix(types): add missing type exports for commonly used types

**Why this was Rule 3 (Blocking Issue):**
- Codebase couldn't compile with TypeScript
- Multiple files import these types from '@/types'
- Task verification requires passing typecheck
- No architectural change needed (just exposing existing types)
- Type aliases use Tables types already in code

### No other deviations - plan executed as written.

## Authentication Gates

No authentication gates encountered during execution.

## Verification

**Automated verification:**
- TypeScript compilation passes (no errors in modified files)
- ESLint passes (all lint rules satisfied)
- No new warnings introduced

**Manual verification steps (recommended for end-to-end testing):**
1. Mock Edge Function failure (disable OPENROUTER_API_KEY in Supabase)
2. Save climb with notes
3. Verify "Climb logged successfully" toast appears
4. Verify "Tag extraction failed. You can add tags manually." toast appears
5. Repeat with network error (disable network in DevTools)
6. Verify "Tag extraction failed due to network. Check your connection." toast appears
7. Verify climb is saved in database regardless of extraction failure
8. Verify quota exceeded flow still works (existing logic from Phase 31-05)

**Expected behavior:**
- Climb save completes successfully even if extraction fails
- Two toasts shown: success toast immediately, error toast 3-5 seconds later
- Error toast message varies by error type (api_error, network_error, unknown)
- Quota exceeded not duplicated (existing logic shows quota toast separately)

## Next Phase Readiness

**Completed:**
- EXTR-08 (graceful failure with user notification) - 100% complete
- Toast notifications for all extraction error types
- Error propagation from service layer to UI
- Non-blocking extraction preserved
- Type system blocking issues resolved

**Phase 31 status:**
- 31-01: Quota enforcement - COMPLETE
- 31-02: Edge Function implementation - COMPLETE
- 31-03: Client-side extraction trigger - COMPLETE
- 31-04: Quota indicator and feedback - COMPLETE
- 31-05: Quota exceeded toast - COMPLETE
- 31-06: Deployment - COMPLETE
- 31-07: Extraction error toasts - COMPLETE

**Phase 31 Complete!** All requirements for AI Tag Extraction Service implemented.

**Ready for:**
- Phase 32: Tag Display & Editing - Display extracted tags and allow user editing
- Phase 33: Offline Support & Analytics Integration - Queue failed extractions and sync

**No blockers identified** - Phase 31 complete, ready to proceed with Phase 32.

## Dependencies and Integration Points

**Provides:**
- Toast notification system for extraction failures
- Error state tracking from service to UI
- Type exports for commonly used database types

**Affects:**
- Phase 32: Tag Display & Editing - relies on tag extraction service operational
- Phase 33: Offline Support - can now show extraction errors when offline sync fails

**Data flow:**
```
User saves climb
  -> createClimb mutation saves to DB
  -> triggerTagExtraction called (fire-and-forget)
  -> On success: tags written to DB (silent)
  -> On failure: onExtractionError callback
     -> setExtractionError in useCreateClimb
     -> useEffect in App.tsx detects change
     -> showExtractionError displays appropriate toast
```
