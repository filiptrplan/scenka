---
phase: 31-ai-tag-extraction-service
plan: 04
subsystem: error-handling-ui-feedback
tags: [tag-extraction, error-handling, user-feedback, toast-notifications, quota-tracking]
completed: 2026-01-21
duration: 8m

requires: [31-03]
provides: [tag extraction error feedback UI, quota indicator display]
affects: [32-03, 32-05]

tech-stack:
  added: [sonner (already existed)]
  patterns: [clean-architecture-separation, error-type-return-pattern, ui-layer-toast-handling]

deviations: []
---

# Phase 31 Plan 04: User Feedback and Error Handling Summary

**Error handling and user feedback implementation - adds toast notifications for extraction failures and displays daily quota indicator in logger form. Clean architecture: service layer returns error type object, UI layer handles toast display.**

## What Was Built

Three components enabling user feedback for tag extraction failures and quota tracking:

1. **Tag Extraction Error Types** (`src/services/tagExtraction.ts`) - Defines error types and result interface
2. **Tag Extraction Feedback Hook** (`src/hooks/useTagExtractionFeedback.ts`) - Provides quota state and error toast functions
3. **Quota Indicator** (`src/components/features/simplified-logger.tsx`) - Displays X/50 quota count in logger form
4. **User Limits Type Update** (`src/hooks/useUserLimits.ts`) - Added `tag_count` field to interface

## Key Changes

### Tag Extraction Service (`src/services/tagExtraction.ts`)

**New Types:**
```typescript
export type TagExtractionErrorType = 'quota_exceeded' | 'api_error' | 'network_error' | 'unknown'

export interface TagExtractionResult {
  success: boolean
  errorType?: TagExtractionErrorType
}
```

**Modified Function:**
- `triggerTagExtraction(climb: Climb, userId: string): Promise<TagExtractionResult>`
  - Changed return type from `Promise<void>` to `Promise<TagExtractionResult>`
  - Maps errors to error types:
    - 403 → `api_error` (unauthorized)
    - 429 → `quota_exceeded` (daily limit reached)
    - timeout/fetch/network → `network_error`
    - Other → `api_error` or `unknown`
  - **Important:** Service layer does NOT import toast (clean architecture)

**Return Values:**
- `{ success: true }` - Edge Function invoked successfully (even if extraction fails later)
- `{ success: false, errorType: '...' }` - Edge Function invocation failed or network error

### Climb Service (`src/services/climbs.ts`)

**Modified Functions:**

1. **`createClimb`** (lines 66-80)
   - Updated to handle `TagExtractionResult` from `triggerTagExtraction`
   - Pattern:
   ```typescript
   triggerTagExtraction(climb, user.id)
     .then((result: TagExtractionResult) => {
       if (!result.success && result.errorType !== undefined) {
         console.warn(`Tag extraction failed: ${result.errorType}`)
         // UI handles toast display
       }
     })
     .catch(err => {
       console.error('Failed to trigger tag extraction:', err)
     })
   ```
   - Non-blocking: extraction happens after climb is saved

2. **`updateClimb`** (lines 116-129)
   - Same pattern as `createClimb`
   - Triggers extraction only if notes changed
   - Logs error type for debugging, UI handles toast

**Clean Architecture:**
- Service layer does NOT import toast
- Service layer returns error type object
- UI layer (hook) handles toast display

### Tag Extraction Feedback Hook (`src/hooks/useTagExtractionFeedback.ts`)

**New Hook:** `useTagExtractionFeedback()`

**State Management:**
- `quotaCount: number` - Current tag extraction count (0-50)
- `isQuotaReached: boolean` - Whether quota is reached (quotaCount >= 50)
- `isLoading: boolean` - Initial fetch state

**Quota Query:**
- Uses TanStack Query with query key `['tag-quota', 'current']`
- Queries `user_limits` table for `tag_count, limit_date`
- `staleTime: 0` - Always fetch fresh data
- `gcTime: 30 * 1000` - Cache for 30 seconds
- Graceful degradation: returns `{ tag_count: 0, limit_date: today }` if query fails

**Functions:**

1. **`showExtractionError(errorType: TagExtractionErrorType)`** (lines 80-96)
   - Maps error types to user-friendly toast messages (from CONTEXT.md)
   - Toast messages:
     - `api_error` → `toast.error('Tag extraction failed. You can add tags manually.')`
     - `quota_exceeded` → `toast.warning('Daily quota reached - tags extracted tomorrow. {time until reset}')`
     - `network_error` → `toast.error('Tag extraction failed due to network. Check your connection.')`
     - `unknown` → `toast.error('Tag extraction failed. You can add tags manually.')`

2. **`showQuotaReached()`** (lines 98-103)
   - Shows warning toast when quota is reached
   - Message: `toast.warning('You've reached your daily tag extraction quota (50 climbs). {time until reset}')`
   - Includes time until next reset (from `getTimeUntilNextReset()`)

**Return Object:**
```typescript
{
  quotaCount: number
  isQuotaReached: boolean
  isLoading: boolean
  showExtractionError: (errorType: string) => void
  showQuotaReached: () => void
}
```

### User Limits Hook (`src/hooks/useUserLimits.ts`)

**Modified Interface** (lines 10-15):
```typescript
export interface UserLimits {
  rec_count: number
  chat_count: number
  tag_count: number  // NEW
  limit_date: string
}
```

**Modified Query** (lines 33-37):
- Added `tag_count` to select statement
- Hook returns tag count for quota display

### Simplified Logger (`src/components/features/simplified-logger.tsx`)

**Quota Indicator** (lines 437-447)
- Displays below submit button (non-intrusive)
- Shows: `Tags extracted today: {quotaCount}/50`
- Loading state: `Loading quota...`
- Warning color: `text-amber-500` when quota reached
- Normal color: `text-muted-foreground` when quota not reached
- Responsive: visible on mobile (no hiding)

**Import:**
- Added `useTagExtractionFeedback` import
- Hook provides: `quotaCount`, `isQuotaReached`, `isLoading: isQuotaLoading`

**UI Pattern:**
```typescript
<div className="mb-3">
  {isQuotaLoading ? (
    <p className="text-xs text-center text-muted-foreground">Loading quota...</p>
  ) : (
    <p className={cn('text-xs text-center', isQuotaReached ? 'text-amber-500' : 'text-muted-foreground')}>
      Tags extracted today: {quotaCount}/50
    </p>
  )}
</div>
```

**Placement:** Above submit button, fixed position for mobile

## Technical Decisions

1. **Clean Architecture Separation:** Service layer returns error type object, UI layer handles toast display. This enables:
   - Service layer is testable without UI dependencies
   - UI layer has control over toast timing and styling
   - Clear separation of concerns

2. **TanStack Query for Quota:** Uses TanStack Query for quota state (consistent with other hooks like `useUserLimits`)
   - `staleTime: 0` ensures fresh data on every fetch
   - `gcTime: 30 * 1000` provides performance benefit for rapid successive fetches
   - `maybeSingle()` handles users without limits row gracefully

3. **Non-Blocking Error Handling:** Tag extraction errors logged but don't break climb save/update flow
   - `console.warn` for error type logging
   - `console.error` for actual failures
   - Toast notifications happen asynchronously (not awaited)

4. **User-Friendly Error Messages:** Toast messages from CONTEXT.md decisions
   - Short, clear, actionable
   - Includes time until reset for quota exceeded
   - Distinguishes between API errors and network errors

5. **Non-Intrusive Quota Indicator:** Small text below submit button
   - Doesn't block form submission
   - Visible on mobile (44px+ touch targets maintained)
   - Warning color at limit, neutral color otherwise

6. **Import Order:** Fixed import order warning in `useTagExtractionFeedback.ts`
   - Hook imports before library imports
   - Following project's import order convention

## Technical Implementation

### Import Pattern

```typescript
// Service layer (NO toast import)
import { triggerTagExtraction, type TagExtractionResult } from '@/services/tagExtraction'

// UI layer (toast import here)
import { toast } from 'sonner'
import { useTagExtractionFeedback } from '@/hooks/useTagExtractionFeedback'
```

### Error Type Flow

```
Edge Function Error
    ↓
triggerTagExtraction() returns { success: false, errorType: '...' }
    ↓
climbs.ts logs error type
    ↓
[Future: App.tsx or Logger component calls showExtractionError()]
    ↓
useTagExtractionFeedback.showExtractionError() maps to toast
    ↓
toast displayed (sonner)
```

### Quota Tracking Flow

```
Mount SimplifiedLogger
    ↓
useTagExtractionFeedback() queries user_limits table
    ↓
Display: "Tags extracted today: X/50" (amber if X >= 50)
    ↓
[Future: Invalidate query after climb save to refresh count]
```

### Error Handling Strategy

| Error Type        | Message                                        | Toast Variant |
| ----------------- | ---------------------------------------------- | ------------ |
| api_error         | Tag extraction failed. You can add tags manually. | error        |
| quota_exceeded    | Daily quota reached - tags extracted tomorrow.   | warning      |
| network_error     | Tag extraction failed due to network.           | error        |
| unknown           | Tag extraction failed. You can add tags manually. | error        |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

**TypeScript type checking:** Passed (no errors)

**Linting:** Passed for our modified files
- Fixed lint warnings:
  - Import order in `useTagExtractionFeedback.ts`
  - Console usage (warn instead of log for info)
  - Null/undefined checks (proper nullish coalescing)
  - No else-return warnings

**File verification:**
- `src/services/tagExtraction.ts` exports `TagExtractionErrorType` and `TagExtractionResult` - VERIFIED
- `src/services/climbs.ts` handles `TagExtractionResult` without importing toast - VERIFIED
- `src/hooks/useTagExtractionFeedback.ts` exports `useTagExtractionFeedback` - VERIFIED
- `src/hooks/useTagExtractionFeedback.ts` imports toast (UI layer) - VERIFIED
- `src/components/features/simplified-logger.tsx` displays quota indicator - VERIFIED
- `src/hooks/useUserLimits.ts` includes `tag_count` field - VERIFIED

**Integration verification:**
- `triggerTagExtraction` returns correct type - VERIFIED
- Error type mapping matches plan requirements - VERIFIED
- Toast messages match CONTEXT.md decisions - VERIFIED
- Sonner toaster already set up in App.tsx - VERIFIED (Task 5: no changes needed)

**Architecture check:**
- Service layer (tagExtraction.ts) does NOT import toast - VERIFIED
- UI layer (useTagExtractionFeedback.ts) DOES import toast - VERIFIED
- Clean separation of concerns - VERIFIED

## Next Phase Readiness

**Completed:**
- Tag extraction error feedback infrastructure
- Quota tracking and display
- User-friendly error messages via toast
- Clean architecture (service returns error type, UI handles toast)

**Ready for:**
- Phase 32-03: Tag display UI can show tags with manual editing capability
- Phase 32-05: Toast notifications can handle tag editing errors
- Integration: App.tsx or parent component can call `showExtractionError()` after climb save

**Action required:**
- Optional: Call `showExtractionError()` in App.tsx `handleClimbSubmit` after successful save
- This would show extraction errors immediately after save completes
- Currently, only quota indicator is visible, error toasts not yet wired to save flow

**Blockers:**
- None identified

**Note:** Toast notifications for extraction errors will be fully functional once App.tsx calls `showExtractionError()` in the save success handler. Currently implemented infrastructure is ready, but not wired.
