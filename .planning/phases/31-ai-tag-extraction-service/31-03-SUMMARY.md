---
phase: 31-ai-tag-extraction-service
plan: 03
subsystem: client-services
tags: [tag-extraction, supabase, edge-function, async-non-blocking, error-handling]
completed: 2026-01-21
duration: 2m

requires: [31-02]
provides: [tag extraction client service, climb save with async tag extraction]
affects: [32-03]

tech-stack:
  added: []
  patterns: [fire-and-forget-async, error-suppression-for-non-blocking-critical-flow, timeout-race-pattern]

deviations: []
---

# Phase 31 Plan 03: Client Service and Wiring Summary

**Client-side tag extraction service wired into climb save flow with non-blocking async execution, graceful error handling, and quota exceeded detection.**

## What Was Built

Two components enabling client-side async tag extraction triggered after successful climb saves:

1. **Tag Extraction Client Service** (`src/services/tagExtraction.ts`) - Calls Edge Function with timeout and error handling
2. **Climb Service Integration** (`src/services/climbs.ts`) - Triggers tag extraction after successful save (non-blocking)
3. **Constants** (`src/lib/constants.ts`) - Daily tag limit and timeout values

## Key Changes

### Tag Extraction Client Service (`src/services/tagExtraction.ts`)

**Function: `triggerTagExtraction(climb: Climb, userId: string): Promise<void>`**

- **Purpose**: Fire-and-forget async function that triggers Edge Function
- **Validation**:
  - Checks `supabase` client exists
  - Validates `climb.id` is present
  - Skips extraction if `climb.notes` is empty/null
- **Edge Function Invocation**:
  - Calls `supabase.functions.invoke('openrouter-tag-extract')`
  - Sends `climb_id`, `notes`, `user_id` in body
  - Uses `Promise.race` for timeout protection (5s invocation timeout)
- **Error Handling** (never throws, always resolves):
  - **403**: "Unauthorized tag extraction request"
  - **429**: "Quota exceeded for user {userId} (limit: 50/day)" - Plan 04 will add toast
  - **Timeout**: "Tag extraction timeout for climb {climbId}"
  - **Network**: "Network error triggering extraction for climb {climbId}"
  - **Other errors**: Logs full error with context
- **Return**: `Promise<void>` (fire-and-forget pattern)

**Constants Used**:
- `DAILY_TAG_LIMIT = 50` (from lib/constants)
- `TAG_EXTRACTION_TIMEOUT_MS = 5000` (from lib/constants)

**Import Pattern**:
```typescript
import { triggerTagExtraction } from '@/services/tagExtraction'
```

### Climb Service Integration (`src/services/climbs.ts`)

**Modified Functions**:

1. **`createClimb(input: CreateClimbInput): Promise<Climb>`** (lines 53-74)
   - After successful insert, triggers tag extraction:
   ```typescript
   // Save climb first
   const { data, error } = await supabase
     .from('climbs')
     .insert({ ...input, user_id: user.id } as TablesInsert<'climbs'>)
     .select()
     .single()

   if (error) throw error

   const climb = data as Climb

   // Trigger tag extraction AFTER save succeeds (non-blocking)
   // Do NOT await - extraction happens in background
   triggerTagExtraction(climb, user.id).catch(err => {
     console.error('Failed to trigger tag extraction:', err)
     // Continue - extraction failure doesn't break climb save
   })

   return climb
   ```

2. **`updateClimb(id: string, updates: Partial<CreateClimbInput>): Promise<Climb>`** (lines 109-115)
   - Triggers tag extraction if notes were changed:
   ```typescript
   // Trigger tag extraction if notes were changed (non-blocking)
   if (updates.notes !== undefined) {
     triggerTagExtraction(climb, user.id).catch(err => {
       console.error('Failed to trigger tag extraction:', err)
       // Continue - extraction failure doesn't break update
     })
   }
   ```

**Key Principles**:
- **Save first, extract after**: Climb saved immediately, extraction in background
- **Non-blocking**: No await on `triggerTagExtraction`
- **Graceful degradation**: Extraction failures logged but don't break save/update
- **Conditional trigger**: Only extract if notes exist

### Constants (`src/lib/constants.ts`)

**Added** (lines 118-120):
```typescript
// Tag extraction (Phase 31) - happens async after climb save (EXTR-03)
export const DAILY_TAG_LIMIT = 50
export const TAG_EXTRACTION_TIMEOUT_MS = 5000 // Edge Function invocation timeout
```

## Technical Decisions

1. **Fire-and-forget pattern**: `triggerTagExtraction` returns `Promise<void>` and is never awaited, ensuring climb save completes immediately (satisfies EXTR-03 and EXTR-04)

2. **Error suppression for non-blocking**: All errors are caught and logged but never thrown, preventing extraction failures from blocking the critical save flow

3. **Timeout race with Promise.race**: 5-second timeout on Edge Function invocation prevents hangs, using `Promise.race` pattern

4. **Consolidated error handling**: Single catch block in caller (`.catch(err => { ... })`) provides final safety net

5. **Trigger on notes change only**: Tag extraction only triggered when notes are updated (create or update with notes), avoiding unnecessary API calls

6. **Separate constants file**: `DAILY_TAG_LIMIT` and `TAG_EXTRACTION_TIMEOUT_MS` exported from `lib/constants` for UI use in Plan 04

7. **console.log for info, console.error for errors**: Fixed bug where informational messages were incorrectly logged as errors

## Technical Implementation

### Import Pattern

```typescript
// In climbs.ts
import { triggerTagExtraction } from '@/services/tagExtraction'

// In tagExtraction.ts
import { DAILY_TAG_LIMIT, TAG_EXTRACTION_TIMEOUT_MS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Climb } from '@/types'
```

### Flow Diagram

```
User saves climb
    ↓
createClimb() or updateClimb()
    ↓
INSERT/UPDATE climbs table
    ↓
[Return climb immediately to UI] ←── Non-blocking
    ↓
triggerTagExtraction(climb, userId)
    ↓
supabase.functions.invoke('openrouter-tag-extract')
    ↓
Edge Function validates quota, calls OpenRouter
    ↓
Tags saved to climbs table (async, in background)
```

### Error Handling Strategy

| Error Type      | Response                                  | User Impact      |
| --------------- | ----------------------------------------- | ---------------- |
| 429 (Quota)     | Log "Quota exceeded"                      | None (climb saved) |
| 403 (Auth)      | Log "Unauthorized"                         | None (climb saved) |
| Timeout         | Log "Tag extraction timeout"              | None (climb saved) |
| Network         | Log "Network error"                       | None (climb saved) |
| Other           | Log full error                            | None (climb saved) |

## Deviations from Plan

**Bug fix applied during execution (Rule 1 - Auto-fix bugs):**

1. **[Rule 1 - Bug] Fixed console usage for informational messages**
   - **Found during:** Initial review of code
   - **Issue:** `console.error` was used for informational messages (trigger log, success log) instead of just errors
   - **Fix:** Changed informational messages to `console.log`, kept `console.error` only for actual errors
   - **Files modified:** `src/services/tagExtraction.ts` (lines 42, 77)
   - **Commit:** e5c6f5a fix(31-03): correct console usage in tag extraction

## Verification

**TypeScript type checking:** Passed (no errors)

**Linting:** Warnings in tagExtraction.ts are expected (console.log allowed for informational logging)

**File verification:**
- `src/services/tagExtraction.ts` exists and exports `triggerTagExtraction` - VERIFIED
- `src/services/climbs.ts` calls `triggerTagExtraction` after save - VERIFIED (lines 68-71, 111-114)
- `src/lib/constants.ts` exports `DAILY_TAG_LIMIT` and `TAG_EXTRACTION_TIMEOUT_MS` - VERIFIED (lines 119-120)
- Non-blocking pattern: `triggerTagExtraction` called without `.await()` - VERIFIED
- Error handling: `.catch()` on `triggerTagExtraction` prevents throws - VERIFIED

**Integration verification:**
- Import `triggerTagExtraction` in climbs.ts compiles - VERIFIED
- Call to `supabase.functions.invoke('openrouter-tag-extract')` present - VERIFIED
- Timeout protection with `Promise.race` - VERIFIED

## Next Phase Readiness

**Completed:**
- Client-side tag extraction service with error handling
- Non-blocking integration into climb save/update flow
- Constants exported for UI use (Plan 04)

**Ready for:**
- Phase 32-03: Tag display UI can read `style_tags` and `failure_reasons` from climbs table
- Phase 32-03: Tag editing UI can update tags via `updateClimb`
- Phase 32-05: Toast notifications can display quota exceeded messages (429 handling)
- Phase 32-05: Toast notifications can display extraction failure messages

**Action required:**
- User must deploy Edge Function: `npx supabase functions deploy openrouter-tag-extract --no-verify-jwt`
- User must set `OPENROUTER_TAG_MODEL` environment variable
- User must set `OPENROUTER_API_KEY` environment variable

**No blockers identified** (pending Edge Function deployment and env var configuration).
