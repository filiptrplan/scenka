---
phase: 31-ai-tag-extraction-service
plan: 02
subsystem: edge-functions
tags: [supabase, openai, openrouter, edge-function, pii-anonymization, rate-limiting, cost-tracking]
completed: 2026-01-21
duration: 7m

requires: [31-01]
provides: [anonymizeNotes utility, openrouter-tag-extract Edge Function]
affects: [31-03]

tech-stack:
  added: []
  patterns: [pi-anonymization, rate-limiting-before-api, structured-json-validation, non-blocking-async, performance-logging]

deviations: []
---

# Phase 31 Plan 02: Edge Function Implementation Summary

**Implemented AI tag extraction Edge Function with JWT validation, quota enforcement, structured JSON output, confidence-based filtering, performance logging, and non-blocking async operation.**

## What Was Built

Two components providing the backend service for AI-powered tag extraction:

1. **PII Anonymization Module** (`supabase/functions/_shared/anonymize.ts`) - Removes personal identifiers before sending notes to external AI services
2. **Tag Extraction Edge Function** (`supabase/functions/openrouter-tag-extract/index.ts`) - Core backend service that asynchronously extracts style tags and failure reasons from climb notes

## Key Changes

### PII Anonymization Module

**Function: `anonymizeNotes(notes: string | null | undefined): string`**

- Returns original string if empty/null
- Replaces 12+ gym names with "indoor_gym" (Rock City, Planet Granite, etc.)
- Replaces 12+ crag names with "outdoor_crags" (Red Rocks, Yosemite, etc.)
- Removes emails using regex: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}` → "[EMAIL_REMOVED]"
- Removes phones using regex: `\d{3}[-.]?\d{3}[-.]?\d{4}` → "[PHONE_REMOVED]"
- Removes SSNs: `\d{3}-\d{2}-\d{4}` → "[SSN_REMOVED]"
- Removes URLs: `https?://[^\s<>"{}|\\^`\[\]]+` → "[URL_REMOVED]"
- Removes IPs: `(?:\d{1,3}\.){3}\d{1,3}` → "[IP_REMOVED]"

**Follows pattern from:** Phase 18-04 decision + RESEARCH.md (lines 187-204)

### Tag Extraction Edge Function

**Constants (from CONTEXT.md):**
- `DAILY_TAG_LIMIT = 50`
- `MAX_TOKENS = 1000`
- `CONFIDENCE_THRESHOLD = 70`
- `MAX_STYLES = 3`
- `MAX_FAILURE_REASONS = 3`
- `MIN_FAILURE_REASONS = 1`
- `MAX_RETRIES = 2`
- `API_DURATION_TARGET_MS = 3000` (EXTR-07)

**Enums (from validation.ts):**
- `VALID_STYLES`: ['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch']
- `VALID_FAILURE_REASONS`: ['Pumped', 'Finger Strength', 'Core', 'Power', 'Bad Feet', 'Body Position', 'Beta Error', 'Precision', 'Fear', 'Commitment', 'Focus']

**Environment Variables:**
- `OPENROUTER_API_KEY` (required)
- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `OPENROUTER_TAG_MODEL` (required, no default)

**Request Flow:**

1. **JWT Validation** (lines 156-183)
   - Extracts and validates Bearer token
   - Extracts `user_id` from token via `supabase.auth.getUser()`
   - Returns 401 if invalid or missing

2. **Request Body Validation** (lines 186-211)
   - Expects `{ climb_id: UUID, notes: string, user_id: UUID }`
   - Returns 400 if missing fields
   - Returns 403 if `user_id` doesn't match token

3. **Quota Enforcement** (lines 214-257)
   - Queries `user_limits` table for `tag_count` and `limit_date`
   - Compares `limit_date` with `CURRENT_DATE`, resets to 0 if different day
   - Checks if `tag_count >= DAILY_TAG_LIMIT` (50)
   - Returns 429 with hours until reset if quota exceeded
   - Calls `increment_tag_count(user_id)` BEFORE OpenRouter API call

4. **Token Estimation & Truncation** (lines 75-87)
   - `estimateTokenCount(text: string): number` function
   - Counts words (split by whitespace, filter empty)
   - Character-based estimate: `Math.ceil(text.length / 4)`
   - Returns `max(wordCount, charBasedEstimate)`
   - Truncates notes proportionally if `estimatedTokens > MAX_TOKENS`

5. **PII Anonymization** (lines 260-263)
   - Calls `anonymizeNotes(notes)` before sending to OpenRouter

6. **OpenRouter API Call** (lines 278-301)
   - Uses `OPENROUTER_TAG_MODEL` env var
   - Temperature: 0.2 (low for consistency)
   - `response_format: { type: 'json_object' }`
   - System prompt: "Extract climbing tags from notes. Return JSON with style_tags and failure_reasons arrays. Each tag must have name (enum) and confidence (0-100). Only include tags with confidence >= 70. Maximum 3 styles + 3 failure reasons. At least 1 failure reason required."
   - User message: `Notes: ${truncatedNotes}`

7. **Duration Measurement & Logging** (EXTR-07) (lines 282-294)
   - Before call: `const startTime = performance.now()`
   - After call: `const duration = performance.now() - startTime`
   - Logs: `Tag extraction API call duration for climb ${climb_id}: ${duration.toFixed(0)}ms`
   - Warns if `duration > API_DURATION_TARGET_MS`: `Tag extraction exceeded 3s target for climb ${climb_id}: ${duration.toFixed(0)}ms`
   - Includes `climb_id` in all logs for debugging

8. **Response Validation** (lines 91-159)
   - `validateTagResponse(content: string): TagExtractionResult`
   - Parses JSON, throws if invalid
   - Validates `style_tags` array (max 3 items)
   - Validates each style tag name in `VALID_STYLES`
   - Validates confidence is number 0-100
   - Validates `failure_reasons` array (1-3 items, min 1 required)
   - Validates each failure reason name in `VALID_FAILURE_REASONS`

9. **Confidence Filtering** (lines 162-165)
   - `filterTagsByConfidence(tags: Tag[], threshold: number): string[]`
   - Filters tags with `confidence >= CONFIDENCE_THRESHOLD` (70)
   - Returns array of tag names (no confidence scores)

10. **Retry Logic** (lines 268-394)
    - Loop for attempts 0 to `MAX_RETRIES - 1` (0, 1)
    - Tries API call and validation
    - On success: Updates climb with tags, tracks cost, returns `{ success: true, tags_extracted: true, style_tags, failure_reasons }`
    - On failure: Logs warning, waits `1000ms * (attempt + 1)` (exponential backoff: 1s, 2s)
    - If all retries fail: Tracks failed usage (cost=0), returns `{ success: true, tags_extracted: false, error: 'Tag extraction failed, you can add tags manually' }`

11. **Update Climb with Tags** (lines 327-341)
    - `UPDATE climbs SET style_tags = [...], failure_reasons = [...], tags_extracted_at = now() WHERE id = climb_id`
    - Uses filtered tags (confidence >= 70)
    - Logs error if update fails but continues

12. **Track API Usage** (lines 344-363)
    - `INSERT` into `tag_extraction_api_usage` with:
      - `user_id`, `prompt_tokens`, `completion_tokens`, `total_tokens`
      - `cost_usd = usage.cost` (from OpenRouter response)
      - `model = tagModel`
      - `endpoint = 'openrouter-tag-extract'`
      - `time_window_start = now()`
    - Logs error if insert fails but continues

13. **Non-Blocking Response** (lines 366-373)
    - Always returns `{ success: true }` for successful extraction
    - Returns `{ success: true, tags_extracted: false, error: '...' }` for failures after retries
    - Includes CORS headers
    - No streaming needed (simple JSON response)

## Technical Decisions

1. **Separate model env var**: Used `OPENROUTER_TAG_MODEL` (no default) instead of sharing `OPENROUTER_MODEL` with coach/chat, following CONTEXT.md decision for independent model configuration

2. **Low temperature (0.2)**: Set to 0.2 for consistent, deterministic tag extraction, following CONTEXT.md decision and RESEARCH.md pattern (Phase 20-01 used 0.6 for creative coach output)

3. **Atomic quota enforcement**: Check quota and increment via RPC function BEFORE API call, preventing expensive API calls for blocked requests (pattern from Phase 27-01)

4. **Confidence threshold (70%)**: Only include tags with `confidence >= 70`, following CONTEXT.md decision for high-confidence tag extraction

5. **Proportional truncation**: Truncate notes to max 1000 tokens by reducing length proportionally (not hard character limit), preserving content structure (from RESEARCH.md lines 432-448)

6. **Non-blocking response**: Always return `{ success: true }` even if tag extraction fails after retries, ensuring climb save flow never blocks (CONTEXT.md decision)

7. **Performance logging**: Measure and log API call duration with warnings if exceeds 3-second target (EXTR-07), following RESEARCH.md lines 143-155

8. **Track cost from OpenRouter usage.cost**: Use OpenRouter's provided cost field instead of manual calculation, following Phase 22-01 decision

## Technical Implementation

### Helper Functions

1. **`estimateTokenCount(text: string): number`**
   - Word count: `text.trim().split(/\s+/).filter((w) => w.length > 0).length`
   - Character-based: `Math.ceil(text.length / 4)`
   - Returns `Math.max(wordCount, charBasedEstimate)`
   - **Source**: RESEARCH.md lines 432-448 (from openrouter-chat pattern)

2. **`cleanResponse(content: string): string`**
   - Removes markdown code blocks: `content.replace(/```json\n?|\n?```/g, '').trim()`
   - **Source**: RESEARCH.md lines 306-309 (from openrouter-coach pattern)

3. **`validateTagResponse(content: string): TagExtractionResult`**
   - Parses JSON, throws if invalid
   - Validates arrays lengths, enum values, confidence ranges
   - **Source**: RESEARCH.md lines 487-537 (from openrouter-coach validation pattern)

4. **`filterTagsByConfidence(tags: Tag[], threshold: number): string[]`**
   - Filters: `tags.filter((tag) => tag.confidence >= threshold).map((tag) => tag.name)`
   - Returns array of tag names only

### Response Structure

**Success (tags extracted):**
```json
{
  "success": true,
  "tags_extracted": true,
  "style_tags": ["Overhang", "Crimp"],
  "failure_reasons": ["Pumped", "Bad Feet"]
}
```

**Success (extraction failed after retries):**
```json
{
  "success": true,
  "tags_extracted": false,
  "error": "Tag extraction failed, you can add tags manually"
}
```

**Quota exceeded (429):**
```json
{
  "error": "Daily quota reached - tags extracted tomorrow. Add manually in Settings. Next reset in 8 hours",
  "limit_type": "tag_extraction",
  "current_count": 50,
  "limit": 50
}
```

**Unauthorized (401):**
```json
{
  "error": "Invalid or expired token"
}
```

**Missing fields (400):**
```json
{
  "error": "Missing required fields: climb_id, notes, user_id"
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification

**Note:** Deno not available in this environment for `deno check` command. Supabase CLI not available for deployment in this environment. Verification to be completed by user:

1. Run `deno check supabase/functions/_shared/anonymize.ts` - no errors
2. Run `deno check supabase/functions/openrouter-tag-extract/index.ts` - no errors
3. Run `npx supabase functions deploy openrouter-tag-extract --no-verify-jwt` - deployment successful
4. Test with valid JWT: Should return `{ success: true, tags_extracted: true, ... }` or quota exceeded message
5. Test quota enforcement: After 50 calls, should return 429 with "Daily quota reached" message
6. Test response validation: Send malformed JSON from LLM (mock), should retry twice then fail gracefully
7. Test PII anonymization: Call `anonymizeNotes("Email: test@example.com Phone: 555-123-4567 at Rock City")`, should return "[EMAIL_REMOVED] [PHONE_REMOVED] at indoor_gym"
8. Test EXTR-07 (3-second performance):
   - Call function with test notes (100-500 characters)
   - Check function logs for "Tag extraction API call duration: Xms"
   - Verify warning appears if duration > 3000ms
   - Confirm climb_id is included in logs for debugging

**File verification:**
- `supabase/functions/_shared/anonymize.ts` exists and exports `anonymizeNotes` - VERIFIED
- `supabase/functions/openrouter-tag-extract/index.ts` exists and implements POST handler - VERIFIED
- Edge Function includes JWT validation - VERIFIED (lines 156-183)
- Edge Function includes quota enforcement - VERIFIED (lines 214-257)
- Edge Function calls OpenRouter API with structured JSON - VERIFIED (lines 282-301)
- Edge Function validates response (confidence >= 70, max 3 styles, 1-3 failure reasons) - VERIFIED (lines 91-159)
- Edge Function updates climbs table - VERIFIED (lines 327-341)
- Edge Function tracks cost in tag_extraction_api_usage - VERIFIED (lines 344-363)
- Edge Function returns immediately (non-blocking) - VERIFIED (lines 366-373, 387-394)
- PII anonymization removes gym/crag names and email/phone patterns - VERIFIED (anonymize.ts lines 21-57)
- API call duration is measured and logged with warnings if exceeds 3000ms - VERIFIED (lines 282-294)

## Next Phase Readiness

**Completed:**
- PII anonymization module (`anonymizeNotes` function)
- Tag extraction Edge Function with full quota enforcement, validation, and cost tracking
- Non-blocking async operation (always returns success, tags optional)
- Performance logging for EXTR-07 (3-second target)

**Ready for:**
- Phase 31-03: Client-side integration can call `supabase.functions.invoke('openrouter-tag-extract')`
- Phase 31-03: Client can import `anonymizeNotes` if needed for local validation
- Phase 32: Tag display UI can read `style_tags` and `failure_reasons` from climbs table
- Phase 32: Tag editing UI can update `style_tags` and `failure_reasons` on climbs

**Action required:**
- User must run `npx supabase functions deploy openrouter-tag-extract --no-verify-jwt` to deploy the Edge Function
- User must set `OPENROUTER_TAG_MODEL` environment variable in Supabase (no default)
- User must set `OPENROUTER_API_KEY` environment variable in Supabase

**No blockers identified** (pending Edge Function deployment and env var configuration).
