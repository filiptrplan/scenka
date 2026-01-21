---
phase: 31-ai-tag-extraction-service
verified: 2026-01-21T14:30:00Z
status: passed
score: 26/26 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 23/25
  gaps_closed:
    - "Toast notifications for extraction failures (api_error, network_error, unknown) now fully wired to UI"
  gaps_remaining: []
  regressions: []
gaps: []
---

# Phase 31: AI Tag Extraction Service Verification Report

**Phase Goal:** AI-powered tag extraction service that analyzes climb notes and extracts style tags and failure reasons
**Verified:** 2026-01-21T14:30:00Z
**Status:** passed
**Re-verification:** Yes - after gap closure from plan 31-07

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
| 20   | Toast notification shows when tag extraction fails (api_error, network_error, unknown) | ✓ VERIFIED | NOW WIRED - App.tsx lines 94-99 call showExtractionError when extractionError set |
| 21   | Toast notification shows when quota exceeded (429 response) | ✓ VERIFIED | Hook has showExtractionError with quota_exceeded toast, called from App.tsx (line 131) |
| 22   | Toast notification shows when quota reached (hard limit) | ✓ VERIFIED | Hook has showQuotaReached function called from App.tsx (line 131) |
| 23   | Form shows daily quota indicator (X/50 used) | ✓ VERIFIED | simplified-logger.tsx lines 437-447 display "Tags extracted today: X/50" |
| 24   | Error messages are user-friendly, not technical | ✓ VERIFIED | useTagExtractionFeedback lines 82-95 have user-friendly messages |
| 25   | All toast notifications use sonner library (project standard) | ✓ VERIFIED | useTagExtractionFeedback imports toast from 'sonner' |
| 26   | Service layer returns error type object, UI layer handles toast display (clean architecture) | ✓ VERIFIED | tagExtraction.ts returns TagExtractionResult, useTagExtractionFeedback handles toasts |

**Score:** 26/26 essential truths verified (100%)

**Gap closure verified (from plan 31-07):**
- Extraction error toast notifications are NOW WIRED to UI via callback pattern ✓

### Required Artifacts

| Artifact | Expected    | Status | Details |
| -------- | ----------- | ------ | ------- |
| `supabase/migrations/20260121000001_add_tag_count.sql` | tag_count column and increment_tag_count RPC | ✓ VERIFIED | 27 lines, complete SQL with constraints and comments, DEPLOYED |
| `supabase/migrations/20260121000002_create_tag_extraction_api_usage.sql` | API usage tracking table | ✓ VERIFIED | 35 lines, RLS enabled, 3 indexes, DEPLOYED |
| `supabase/migrations/20260121000003_add_tags_extracted_at.sql` | Extraction timestamp column | ✓ VERIFIED | 6 lines, nullable TIMESTAMPTZ, DEPLOYED |
| `supabase/functions/_shared/anonymize.ts` | PII anonymization utilities | ✓ VERIFIED | 76 lines, exports anonymizeNotes function |
| `supabase/functions/openrouter-tag-extract/index.ts` | Tag extraction Edge Function | ✓ VERIFIED | 547 lines, complete implementation with all features, DEPLOYED |
| `src/services/tagExtraction.ts` | Tag extraction client service | ✓ VERIFIED | 117 lines, exports triggerTagExtraction with TagExtractionResult |
| `src/services/climbs.ts` | Climb logging with tag extraction trigger | ✓ VERIFIED | Lines 29-88: createClimb accepts onExtractionError callback (plan 31-07), lines 72-80 call callback on failure |
| `src/lib/constants.ts` | Tag extraction limits | ✓ VERIFIED | Lines 119-120 export DAILY_TAG_LIMIT and TAG_EXTRACTION_TIMEOUT_MS |
| `src/hooks/useTagExtractionFeedback.ts` | Tag extraction error feedback hook | ✓ VERIFIED | 115 lines, provides quota state and showExtractionError/showQuotaReached |
| `src/hooks/useClimbs.ts` | useCreateClimb hook with extraction error state | ✓ VERIFIED | Lines 16-35: extractionError state tracking, callback passed to createClimb (plan 31-07) |
| `src/App.tsx` | App with extraction error toast wiring | ✓ VERIFIED | Lines 82, 86, 94-99: extractionError extracted, useEffect calls showExtractionError (plan 31-07) |
| `src/types/index.ts` | Type exports for commonly used types | ✓ VERIFIED | Lines 419-454: exports Climb, AnonymizedClimb, Style, FailureReason, etc. (plan 31-07 fix) |
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
| src/services/climbs.ts | src/services/tagExtraction.ts | triggerTagExtraction call | ✓ WIRED | Lines 71, 125 call triggerTagExtraction(climb, userId) |
| src/services/tagExtraction.ts | supabase/functions/openrouter-tag-extract | supabase.functions.invoke | ✓ WIRED | Lines 58-64 invoke Edge Function with timeout |
| src/services/climbs.ts | src/hooks/useClimbs.ts | onExtractionError callback | ✓ WIRED | Line 31: callback parameter, Line 21: setExtractionError passed (plan 31-07) |
| src/hooks/useClimbs.ts | src/App.tsx | extractionError state | ✓ WIRED | Line 33: extractionError returned, Line 86: extracted in App.tsx (plan 31-07) |
| src/App.tsx | src/hooks/useTagExtractionFeedback.ts | showExtractionError call | ✓ WIRED | Lines 94-99: useEffect calls showExtractionError(extractionError) (plan 31-07) |
| simplified-logger.tsx | useTagExtractionFeedback | quotaCount, isQuotaReached | ✓ WIRED | Line 45 imports and uses hook for display |
| useTagExtractionFeedback.ts | user_limits | TanStack Query | ✓ WIRED | Lines 25-59 query tag_count and limit_date |
| App.tsx | useTagExtractionFeedback | showQuotaReached call | ✓ WIRED | Line 131 calls showQuotaReached() when isQuotaReached |

**All key links WIRED** - Callback pattern successfully propagates extraction errors from service layer through hook to UI toast.

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
| EXTR-08: Graceful failure with user notification | ✓ SATISFIED | All error types show toast (quota, api_error, network_error, unknown) |

**Overall:** 8/8 requirements satisfied. EXTR-08 now 100% complete - plan 31-07 wired all extraction error toasts to UI via callback pattern.

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
**Expected:** Toast "Tag extraction failed. You can add tags manually." appears (NOW WORKING - gap closed)
**Why human:** Toast is UI element requiring browser to verify display

### 4. Network Error Toast Test

**Test:** Disable network in DevTools, save climb, verify network error toast appears
**Expected:** Toast "Tag extraction failed due to network. Check your connection." appears
**Why human:** Requires network manipulation to trigger error condition

### 5. OpenRouter API Cost Verification

**Test:** Extract tags for 10 climbs, check tag_extraction_api_usage table for accurate cost tracking
**Expected:** Each entry has correct token counts, model name, cost_usd value
**Why human:** Requires actual API calls and cost calculations to verify accuracy

### 6. Performance Verification

**Test:** Save climb with notes, check Supabase Edge Function logs for API duration
**Expected:** Duration < 3000ms typical, warning logged if exceeded
**Why human:** Requires real API call to measure actual performance

### Gap Closure Summary (Plan 31-07)

**Previous gap (now closed):**
- Toast notifications for extraction failures (api_error, network_error, unknown) were not wired to UI

**Solution implemented (plan 31-07):**
1. **Service layer callback pattern** - climbs.ts createClimb accepts optional onExtractionError callback
2. **Hook error state** - useCreateClimb tracks extractionError via useState
3. **UI toast trigger** - App.tsx useEffect calls showExtractionError when error set
4. **Type exports fix** - Added missing type aliases to src/types/index.ts (blocking issue resolved)

**Technical decisions:**
- Optional callback maintains backward compatibility
- quota_exceeded excluded from callback (existing isQuotaReached logic handles separately)
- Non-blocking preservation - extraction errors don't interfere with climb save
- onMutate clearing prevents stale errors
- Clean separation: service layer provides error, UI layer displays toast

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
         - api_error: "Tag extraction failed. You can add tags manually."
         - network_error: "Tag extraction failed due to network. Check your connection."
         - unknown: "Tag extraction failed. You can add tags manually."
```

**All phase 31 requirements complete.** Phase 31 passes verification.

---

_Verified: 2026-01-21T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
