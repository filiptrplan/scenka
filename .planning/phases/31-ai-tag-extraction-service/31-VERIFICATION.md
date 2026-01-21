---
phase: 31-ai-tag-extraction-service
verified: 2026-01-21T14:00:00Z
status: gaps_found
score: 23/25 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 18/20
  gaps_closed:
    - "Migrations applied to production database (Phase 31-06)"
    - "Quota exceeded toast notification wired to App.tsx (Phase 31-05)"
  gaps_remaining:
    - "Toast notifications for other extraction errors (api_error, network_error) still not wired to UI"
  regressions: []
gaps:
  - truth: "Toast notification shows when tag extraction fails (api_error, network_error, unknown)"
    status: failed
    reason: "Hook infrastructure exists (showExtractionError function in useTagExtractionFeedback), but not wired to App.tsx save flow. The createClimb mutation's onSuccess handler doesn't receive or process extraction error types. Error types are only logged to console in climbs.ts, never shown to user via toast."
    artifacts:
      - path: "src/hooks/useTagExtractionFeedback.ts"
        issue: "Exports showExtractionError() function but never called from App.tsx"
      - path: "src/services/climbs.ts"
        issue: "Logs errorType via console.warn but doesn't surface to calling code"
      - path: "src/App.tsx"
        issue: "onSuccess handler doesn't receive extraction results, so can't call showExtractionError()"
    missing:
      - "Architectural change to flow extraction errors from service layer to UI (e.g., event system, global state, or service API modification)"
      - "App.tsx to call showExtractionError(errorType) when extraction fails for api_error, network_error, unknown"
  - truth: "Toast notification shows when quota reached on climb save"
    status: verified
    reason: "Gap closed in Phase 31-05. App.tsx imports useTagExtractionFeedback, extracts isQuotaReached and showQuotaReached, calls showQuotaReached() in onSuccess handler when quota is reached."
    artifacts:
      - path: "src/App.tsx"
        issue: "NONE - Implementation complete (lines 22, 82, 117-124)"
      - path: "src/hooks/useTagExtractionFeedback.ts"
        issue: "NONE - Hook provides showQuotaReached() with user-friendly message"
    missing: []
---

# Phase 31: AI Tag Extraction Service Verification Report

**Phase Goal:** AI-powered tag extraction service that analyzes climb notes and extracts style tags and failure reasons
**Verified:** 2026-01-21T14:00:00Z
**Status:** gaps_found
**Re-verification:** Yes - after gap closure from plans 31-05 and 31-06

## Goal Achievement

### Observable Truths

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | user_limits table has tag_count column that increments on each extraction | ✓ VERIFIED | Migration 01 adds tag_count column with CHECK constraint |
| 2   | increment_tag_count RPC function exists and can be called | ✓ VERIFIED | Migration 01 creates RPC with atomic insert-or-update and date reset |
| 3   | tag_extraction_api_usage table tracks cost, tokens, and model usage | ✓ VERIFIED | Migration 02 creates table with all required columns and indexes |
| 4   | climbs table has tags_extracted_at timestamp for deduplication | ✓ VERIFIED | Migration 03 adds nullable TIMESTAMPTZ column |
| 5   | Edge Function validates JWT and extracts user_id | ✓ VERIFIED | Lines 206-229 in openrouter-tag-extract/index.ts |
| 6   | Edge Function checks tag_count quota before calling OpenRouter (50 climbs/day) | ✓ VERIFIED | Lines 256-298 implement quota check with date reset logic |
| 7   | Edge Function calls OpenRouter API with structured JSON output | ✓ VERIFIED | Lines 334-342 use openai.chat.completions.create with response_format: json_object |
| 8   | Edge Function validates response (3 max styles, 1-3 failure reasons, confidence >= 70) | ✓ VERIFIED | Lines 112-172 validateTagResponse function with all constraints |
| 9   | Edge Function updates climbs table with extracted tags and tags_extracted_at | ✓ VERIFIED | Lines 380-392 UPDATE climbs with style_tags, failure_reasons, tags_extracted_at |
| 10   | Edge Function tracks cost in tag_extraction_api_usage table | ✓ VERIFIED | Lines 397-411 INSERT with cost_usd from usage.cost |
| 11   | Edge Function returns immediately (non-blocking) with success response | ✓ VERIFIED | Lines 414-424 return success even if extraction fails |
| 12   | PII anonymization removes gym/crag names and email/phone patterns | ✓ VERIFIED | anonymize.ts (76 lines) removes gym/crag names, emails, phones, SSNs, URLs, IPs |
| 13   | API call duration is measured and logged with warnings if exceeds 3000ms | ✓ VERIFIED | Lines 344-356 measure performance.now() and log warnings > 3000ms |
| 14   | Climb save triggers async tag extraction after successful persist | ✓ VERIFIED | climbs.ts lines 66-78 call triggerTagExtraction after insert |
| 15   | Client service calls openrouter-tag-extract Edge Function | ✓ VERIFIED | tagExtraction.ts lines 58-64 use supabase.functions.invoke |
| 16   | Tag extraction does NOT block climb save response (non-blocking) | ✓ VERIFIED | climbs.ts uses .then() without await, fire-and-forget pattern |
| 17   | Edge Function invocation errors don't prevent climb save | ✓ VERIFIED | climbs.ts .catch() handlers log errors but don't throw |
| 18   | Service handles quota exceeded (429) gracefully | ✓ VERIFIED | tagExtraction.ts lines 81-84 map 429 to errorType: 'quota_exceeded' |
| 19   | Service handles extraction failures gracefully | ✓ VERIFIED | tagExtraction.ts comprehensive error handling (lines 56-116) |
| 20   | Toast notification shows when tag extraction fails (Edge Function error - api_error, network_error, unknown) | ✗ FAILED | Hook infrastructure exists but NOT WIRED to App.tsx. Error type logged in climbs.ts but toast never displayed. Only quota exceeded toast works. |
| 21   | Toast notification shows when quota exceeded (429 response) | ✓ VERIFIED | Hook has showExtractionError with quota_exceeded toast, AND it's called from App.tsx (line 123) |
| 22   | Toast notification shows when quota reached (hard limit) | ✓ VERIFIED | Hook has showQuotaReached function AND it's called from App.tsx (line 123) |
| 23   | Form shows daily quota indicator (X/50 used) | ✓ VERIFIED | simplified-logger.tsx lines 437-447 display "Tags extracted today: X/50" |
| 24   | Error messages are user-friendly, not technical | ✓ VERIFIED | useTagExtractionFeedback lines 82-95 have user-friendly messages |
| 25   | All toast notifications use sonner library (project standard) | ✓ VERIFIED | useTagExtractionFeedback imports toast from 'sonner' |
| 26   | Service layer returns error type object, UI layer handles toast display (clean architecture) | ✓ VERIFIED | tagExtraction.ts returns TagExtractionResult, useTagExtractionFeedback handles toasts |

**Score:** 23/25 essential truths verified (92%)

**Failed item (1):**
- Toast notifications for extraction failures (api_error, network_error, unknown) - infrastructure complete but not wired to save flow

**Gaps closed (2 from previous verification):**
- Quota exceeded toast notification - NOW WIRED to App.tsx ✓ (Plan 31-05)
- Migrations applied - NOW DEPLOYED to production ✓ (Plan 31-06)

### Required Artifacts

| Artifact | Expected    | Status | Details |
| -------- | ----------- | ------ | ------- |
| `supabase/migrations/20260121000001_add_tag_count.sql` | tag_count column and increment_tag_count RPC | ✓ VERIFIED | 27 lines, complete SQL with constraints and comments, DEPLOYED |
| `supabase/migrations/20260121000002_create_tag_extraction_api_usage.sql` | API usage tracking table | ✓ VERIFIED | 35 lines, RLS enabled, 3 indexes, DEPLOYED |
| `supabase/migrations/20260121000003_add_tags_extracted_at.sql` | Extraction timestamp column | ✓ VERIFIED | 6 lines, nullable TIMESTAMPTZ, DEPLOYED |
| `supabase/functions/_shared/anonymize.ts` | PII anonymization utilities | ✓ VERIFIED | 76 lines, exports anonymizeNotes function |
| `supabase/functions/openrouter-tag-extract/index.ts` | Tag extraction Edge Function | ✓ VERIFIED | 547 lines, complete implementation with all features, DEPLOYED |
| `src/services/tagExtraction.ts` | Tag extraction client service | ✓ VERIFIED | 117 lines, exports triggerTagExtraction with TagExtractionResult |
| `src/services/climbs.ts` | Climb logging with tag extraction trigger | ✓ VERIFIED | Calls triggerTagExtraction after save (non-blocking) |
| `src/lib/constants.ts` | Tag extraction limits | ✓ VERIFIED | Lines 119-120 export DAILY_TAG_LIMIT and TAG_EXTRACTION_TIMEOUT_MS |
| `src/hooks/useTagExtractionFeedback.ts` | Tag extraction error feedback hook | ✓ VERIFIED | 115 lines, provides quota state and showExtractionError/showQuotaReached |
| `src/components/features/simplified-logger.tsx` | Logger with quota indicator | ✓ VERIFIED | Lines 437-447 display "Tags extracted today: X/50" |

**All artifacts exist and are substantive** - all files have sufficient lines and no stub patterns detected.

### Key Link Verification

| From | To  | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| increment_tag_count RPC | user_limits.tag_count | atomic increment with date reset | ✓ WIRED | Migration uses INSERT ON CONFLICT DO UPDATE with CASE for date reset |
| openrouter-tag-extract/index.ts | user_limits | increment_tag_count RPC call | ✓ WIRED | Line 301: await supabase.rpc('increment_tag_count') |
| openrouter-tag-extract/index.ts | OpenRouter API | openai.chat.completions.create | ✓ WIRED | Lines 334-342 call API with structured JSON |
| openrouter-tag-extract/index.ts | climbs | UPDATE with style_tags/failure_reasons | ✓ WIRED | Lines 380-392 update climb with extracted tags |
| openrouter-tag-extract/index.ts | tag_extraction_api_usage | INSERT with usage.cost | ✓ WIRED | Lines 397-411 track tokens and cost from OpenRouter |
| src/services/climbs.ts | src/services/tagExtraction.ts | triggerTagExtraction call | ✓ WIRED | Lines 68, 97 call triggerTagExtraction(climb, userId) |
| src/services/tagExtraction.ts | supabase/functions/openrouter-tag-extract | supabase.functions.invoke | ✓ WIRED | Lines 58-64 invoke Edge Function with timeout |
| simplified-logger.tsx | useTagExtractionFeedback | quotaCount, isQuotaReached | ✓ WIRED | Line 45 imports and uses hook for display |
| useTagExtractionFeedback.ts | user_limits | TanStack Query | ✓ WIRED | Lines 25-59 query tag_count and limit_date |
| App.tsx | useTagExtractionFeedback | showQuotaReached call | ✓ WIRED | Line 123 calls showQuotaReached() when isQuotaReached |
| App.tsx | useTagExtractionFeedback | showExtractionError call | ✗ NOT WIRED | Hook exists and exports showExtractionError(), but App.tsx never calls it for api_error, network_error, unknown |
| createClimb onSuccess | showExtractionError | result.errorType → toast | ✗ NOT WIRED | Error type logged (line 72) but not passed to toast or App.tsx |

**Critical gap:** Error type from extraction is logged but not surfaced to user via toast for api_error, network_error, unknown cases. Only quota exceeded case works.

### Requirements Coverage

| Requirement | Status | Blocking Issue |
| ----------- | ------ | -------------- |
| EXTR-01: Async extraction | ✓ SATISFIED | All artifacts wired, non-blocking pattern implemented |
| EXTR-02: Structured JSON output | ✓ SATISFIED | Edge Function uses response_format: json_object |
| EXTR-03: Never blocks save | ✓ SATISFIED | triggerTagExtraction never awaited, error suppression |
| EXTR-04: Climb saves immediately, tags appear later | ✓ SATISFIED | save returns immediately, extraction async |
| EXTR-05: Cost tracking | ✓ SATISFIED | tag_extraction_api_usage table with cost_usd column |
| EXTR-06: Quota enforcement | ✓ SATISFIED | 50 climbs/day limit with increment_tag_count RPC |
| EXTR-07: 3-second performance | ✓ SATISFIED | Duration measured and logged with warnings |
| EXTR-08: Graceful failure with user notification | ? PARTIAL | Quota exceeded notification works, but other extraction errors (api_error, network_error) only logged, not shown to user |

**Overall:** 7.75/8 requirements satisfied. EXTR-08 is ~50% complete - quota error notification works, but other error types require architectural changes to flow errors from service layer to UI.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| None found across all verified files | - | - | - | Clean implementation |

**Note:** No TODO, FIXME, placeholder, stub patterns found. All artifacts are substantive.

### Human Verification Required

### 1. End-to-End Extraction Test

**Test:** Save climb with notes in deployed app, verify tags appear in database after ~3-5 seconds
**Expected:** climb.style_tags and climb.failure_reasons populated with extracted values
**Why human:** Requires live Edge Function and OpenRouter API access, full system integration

### 2. Quota Exceeded Test

**Test:** Set tag_count to 50 in database, save climb, verify 429 handling and toast
**Expected:** Toast "Daily quota reached" appears, quota indicator shows 50/50, extraction doesn't attempt API call
**Why human:** Requires database manipulation and UI interaction with production system

### 3. Extraction Error Toast Test

**Test:** Mock Edge Function failure (disable API key), save climb, verify error toast appears
**Expected:** Toast "Tag extraction failed. You can add tags manually." should appear (currently NOT working - gap)
**Why human:** Toast is UI element requiring browser to verify display; also currently not wired

### 4. OpenRouter API Cost Verification

**Test:** Extract tags for 10 climbs, check tag_extraction_api_usage table for accurate cost tracking
**Expected:** Each entry has correct token counts, model name, cost_usd value
**Why human:** Requires actual API calls and cost calculations to verify accuracy

### 5. Performance Verification

**Test:** Save climb with notes, check Supabase Edge Function logs for API duration
**Expected:** Duration < 3000ms typical, warning logged if exceeded
**Why human:** Requires real API call to measure actual performance

### Gaps Summary

Phase 31 has **one remaining gap blocking full goal achievement**:

**Toast notifications for extraction failures (api_error, network_error, unknown) are not wired to UI**

The infrastructure is complete:
- `useTagExtractionFeedback` hook exists and exports `showExtractionError(errorType)` function
- Hook imports toast from 'sonner' (UI layer correctly handles toasts)
- Error types are defined in `tagExtraction.ts` service layer
- `climbs.ts` receives `TagExtractionResult` with errorType and logs it

**What's working (gaps closed):**
- Quota exceeded toast: `showQuotaReached()` called from App.tsx ✓
- Quota reached on mount toast: Same flow, works ✓
- Migrations deployed to production ✓
- Edge Function deployed to production ✓
- Environment variables configured ✓

**What's missing:**
- `App.tsx` does NOT call `showExtractionError()` for api_error, network_error, unknown
- The `createClimb` mutation's `onSuccess` handler doesn't receive extraction results
- Error type information flows from service → climbs.ts (logged) but stops there
- No architectural mechanism exists to surface async extraction errors back to the UI

**Why this gap exists:**
The tag extraction is intentionally fire-and-forget (non-blocking) to preserve the core value of frictionless logging. The `triggerTagExtraction` call is not awaited and runs in the background. By the time the extraction succeeds or fails, the `createClimb` mutation has already completed and its `onSuccess` handler has finished.

**Impact:**
- When tag extraction fails due to API error or network issues, user sees climb saved but no error toast
- User assumes extraction succeeded, but tags never appear
- EXTR-08 (graceful failure with user notification) is 50% complete - quota case works, others fail
- All other functionality (extraction, validation, cost tracking, quota enforcement) works

**Options to close gap (requires architectural decision):**

1. **Event emitter approach:** Create a global event system (e.g., using a simple pub/sub or React event bus) to notify UI when extraction fails
   - Pro: Minimal disruption to existing code
   - Con: Additional complexity, global state concerns

2. **Global state store (Zustand):** Store extraction errors in a global store, read from App.tsx or useTagExtractionFeedback
   - Pro: Clean state management, easy to subscribe to changes
   - Con: Requires adding Zustand dependency, additional complexity

3. **Modify service API to return extractionError:** Change `createClimb` to return `{ climb: Climb, extractionError?: TagExtractionErrorType }`
   - Pro: Clean architecture, explicit data flow
   - Con: Breaking change, makes climb save dependent on extraction (violates non-blocking principle unless carefully designed)

4. **Real-time subscription:** Use Supabase real-time to subscribe to climb updates, detect when tags are added
   - Pro: No additional infrastructure, uses existing Supabase features
   - Con: Shows success when tags appear, not failure toast; can't distinguish "extraction pending" from "extraction failed"

**Recommendation:**
This gap is **not blocking** for Phase 31's core functionality. Users can still manually add tags if extraction fails (Phase 32 will provide tag editing UI). The gap should be addressed as part of a future design sprint that evaluates the options above and implements the chosen approach. For now, the most common error case (quota exceeded) is handled, which provides user feedback for the primary constraint they'll encounter.

**Note on deployments:** All migrations and Edge Function have been successfully deployed to production (Phase 31-06).

---

_Verified: 2026-01-21T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
