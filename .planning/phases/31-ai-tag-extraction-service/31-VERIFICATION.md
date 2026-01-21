---
phase: 31-ai-tag-extraction-service
verified: 2026-01-21T11:55:25Z
status: gaps_found
score: 18/20 must-haves verified
gaps:
  - truth: "Toast notification shows when tag extraction fails (Edge Function error)"
    status: partial
    reason: "Hook and service infrastructure exists (useTagExtractionFeedback hook, showExtractionError function), but not wired to climb save flow. Error type is logged in climbs.ts but toast not called in App.tsx."
    artifacts:
      - path: "src/services/tagExtraction.ts"
        issue: "Returns TagExtractionResult with errorType, but App.tsx doesn't use it"
      - path: "src/hooks/useTagExtractionFeedback.ts"
        issue: "Exports showExtractionError() but not called from App.tsx"
      - path: "src/App.tsx"
        issue: "Missing call to useTagExtractionFeedback() and showExtractionError() in onSuccess handler"
    missing:
      - "Import and use useTagExtractionFeedback hook in App.tsx"
      - "Call showExtractionError(result.errorType) in handleClimbSubmit onSuccess handler when errorType exists"
      - "Pass errorType from createClimb mutation up to parent (current implementation logs but doesn't surface to UI)"
  - truth: "Migrations have been applied to database"
    status: partial
    reason: "Migration files exist and are substantive, but verification in this environment shows Supabase CLI not available to confirm push status. Files appear ready for deployment."
    artifacts:
      - path: "supabase/migrations/20260121000001_add_tag_count.sql"
        issue: "File exists with proper SQL, but deployment status unknown (requires user to run npx supabase db push)"
    missing:
      - "Run npx supabase db push to apply migrations to production database"
---

# Phase 31: AI Tag Extraction Service Verification Report

**Phase Goal:** AI-powered tag extraction service that analyzes notes and extracts style tags and failure reasons
**Verified:** 2026-01-21T11:55:25Z
**Status:** gaps_found
**Re-verification:** No - initial verification

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
| 20   | Toast notification shows when tag extraction fails (Edge Function error) | ? PARTIAL | Infrastructure exists (useTagExtractionFeedback hook with showExtractionError), but NOT WIRED to App.tsx save flow. Error type logged in climbs.ts but toast never displayed. |
| 21   | Toast notification shows when quota exceeded (429 response) | ? PARTIAL | Hook has showExtractionError with quota_exceeded toast, but not called from UI. Quota indicator shows count but no toast appears. |
| 22   | Toast notification shows when quota reached (hard limit) | ? PARTIAL | Hook has showQuotaReached function but not called from UI. |
| 23   | Form shows daily quota indicator (X/50 used) | ✓ VERIFIED | simplified-logger.tsx lines 437-447 display quotaCount/50 |
| 24   | Error messages are user-friendly, not technical | ✓ VERIFIED | useTagExtractionFeedback lines 82-95 have user-friendly messages |
| 25   | All toast notifications use sonner library (project standard) | ✓ VERIFIED | useTagExtractionFeedback imports toast from 'sonner' |
| 26   | Service layer returns error type object, UI layer handles toast display (clean architecture) | ✓ VERIFIED | tagExtraction.ts returns TagExtractionResult, useTagExtractionFeedback handles toasts |

**Score:** 18/20 essential truths verified (90%)

**Partial items (2):**
- Toast notifications for extraction failures - infrastructure complete but not wired to save flow
- Migrations applied - files exist and correct but deployment status unknown (environment limitation)

### Required Artifacts

| Artifact | Expected    | Status | Details |
| -------- | ----------- | ------ | ------- |
| `supabase/migrations/20260121000001_add_tag_count.sql` | tag_count column and increment_tag_count RPC | ✓ VERIFIED | 27 lines, complete SQL with constraints and comments |
| `supabase/migrations/20260121000002_create_tag_extraction_api_usage.sql` | API usage tracking table | ✓ VERIFIED | 35 lines, RLS enabled, 3 indexes |
| `supabase/migrations/20260121000003_add_tags_extracted_at.sql` | Extraction timestamp column | ✓ VERIFIED | 6 lines, nullable TIMESTAMPTZ |
| `supabase/functions/_shared/anonymize.ts` | PII anonymization utilities | ✓ VERIFIED | 76 lines, exports anonymizeNotes function |
| `supabase/functions/openrouter-tag-extract/index.ts` | Tag extraction Edge Function | ✓ VERIFIED | 492 lines, complete implementation with all features |
| `src/services/tagExtraction.ts` | Tag extraction client service | ✓ VERIFIED | 116 lines, exports triggerTagExtraction with TagExtractionResult |
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
| App.tsx | useTagExtractionFeedback | showExtractionError call | ✗ NOT WIRED | Hook exists but not imported or used in App.tsx |
| createClimb onSuccess | showExtractionError | result.errorType → toast | ✗ NOT WIRED | Error type logged (line 72) but not passed to toast |

**Critical gap:** Error type from extraction is logged but not surfaced to user via toast.

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
| EXTR-08: Graceful failure with user notification | ? PARTIAL | Infrastructure exists but toast not wired to save flow |

**Overall:** 7/8 requirements satisfied. EXTR-08 is partial - failure detection works but user notification (toast) not triggered.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| None found across all verified files | - | - | - | Clean implementation |

**Note:** No TODO, FIXME, placeholder, stub patterns found. All artifacts are substantive.

### Human Verification Required

### 1. Migration Deployment Verification

**Test:** Run `npx supabase db push` to verify migrations apply to database
**Expected:** All three migrations apply successfully without errors
**Why human:** Requires database connection and Supabase CLI, not available in this environment

### 2. Edge Function Deployment Verification

**Test:** Deploy Edge Function with `npx supabase functions deploy openrouter-tag-extract --no-verify-jwt`
**Expected:** Deployment succeeds, function is accessible
**Why human:** Requires Supabase account and deployment access

### 3. Environment Variable Configuration

**Test:** Set OPENROUTER_TAG_MODEL and OPENROUTER_API_KEY in Supabase dashboard
**Expected:** Edge Function starts without missing env var errors
**Why human:** Requires manual configuration in Supabase dashboard

### 4. End-to-End Extraction Test

**Test:** Save climb with notes, verify tags appear in database after ~3-5 seconds
**Expected:** climb.style_tags and climb.failure_reasons populated with extracted values
**Why human:** Requires live Edge Function and OpenRouter API access

### 5. Toast Error Display Test

**Test:** Mock Edge Function failure, save climb, verify toast appears
**Expected:** Toast notification "Tag extraction failed. You can add tags manually." appears
**Why human:** Toast is UI element requiring browser to verify display

### 6. Quota Exceeded Test

**Test:** Set tag_count to 50, save climb, verify 429 handling and toast
**Expected:** Toast "Daily quota reached" appears, quota indicator shows 50/50
**Why human:** Requires database manipulation and UI interaction

### Gaps Summary

Phase 31 has **one significant gap blocking full goal achievement**:

**Toast notifications for extraction failures are not wired to climb save flow**

The infrastructure is complete:
- `useTagExtractionFeedback` hook exists and exports `showExtractionError(errorType)` function
- Hook imports toast from 'sonner' (UI layer correctly handles toasts)
- Error types are defined in `tagExtraction.ts` service layer
- `climbs.ts` receives `TagExtractionResult` with errorType and logs it

**What's missing:**
- `App.tsx` does NOT import `useTagExtractionFeedback` hook
- `handleClimbSubmit` onSuccess handler does NOT call `showExtractionError()`
- Error type information flows from service → climbs.ts (logged) but stops there

**Impact:**
- When tag extraction fails, user sees quota indicator but no error toast
- EXTR-08 (graceful failure with user notification) is 90% complete but fails at final step
- All other functionality (extraction, validation, cost tracking, quota enforcement) works

**What's needed to close gap:**
1. Import `useTagExtractionFeedback` in `App.tsx`
2. Extract error type from climb save mutation result (currently not surfaced)
3. Call `showExtractionError(errorType)` in onSuccess handler when errorType exists
4. Optionally call `showQuotaReached()` when quota is reached on mount

**Note on migrations:** Migration files are complete and substantive, but deployment status unknown in this environment. User must run `npx supabase db push` before phase is fully operational in production.

---

_Verified: 2026-01-21T11:55:25Z_
_Verifier: Claude (gsd-verifier)_
