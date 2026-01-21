# Phase 31: AI Tag Extraction Service - Research

**Researched:** 2026-01-21
**Domain:** AI-powered tag extraction with Supabase Edge Functions + OpenRouter API
**Confidence:** HIGH

## Summary

Phase 31 implements an asynchronous AI tag extraction service that analyzes climb notes to automatically extract style tags and failure reasons. The service must never block the climb save flow - extraction happens after the climb is persisted. The architecture follows established patterns from existing Edge Functions (openrouter-coach and openrouter-chat) with adaptations for non-blocking operation.

Key technical requirements:
- Extract both style tags (Slab, Vert, Overhang, etc.) and failure reasons (Pumped, Finger Strength, etc.) from notes
- Use structured JSON output with OpenAI's response_format
- Track costs via OpenRouter's usage.cost field (same pattern as Phase 22-01)
- Enforce 50 climbs/day quota before calling AI (pattern from Phase 27-01)
- Retry 2 times on failures with exponential backoff (1s, then 2s)
- PII anonymization before sending notes to OpenRouter (Phase 18-04 decision)
- Notes truncated to 1000 tokens before API call (from CONTEXT.md)

**Primary recommendation:** Follow the openrouter-coach function's pattern with structured JSON output, but modify to return immediately after triggering extraction (non-blocking), and add a separate increment_tag_count RPC function for quota tracking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai@4` | 4.x | OpenRouter API client | Used by existing Edge Functions, provides response_format for structured output |
| `@supabase/supabase-js@2` | 2.x | Supabase client | Project's database client, required for RPC calls and data updates |
| Deno runtime | Latest | Edge Functions execution | Supabase's native Edge Function runtime |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `corsHeaders` | Local | CORS headers for Edge Functions | All Edge Functions for cross-origin requests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI SDK | Direct fetch calls | OpenAI SDK provides built-in streaming, error handling, and response_format support |
| Structured JSON output | Free-form text with regex parsing | Structured output guarantees valid JSON schema compliance, easier to validate |

**Installation:**
```bash
# Edge Functions use Deno imports - no npm install needed
# Dependencies specified in import statements:
import OpenAI from 'npm:openai@4'
import { createClient } from 'npm:@supabase/supabase-js@2'
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
├── openrouter-tag-extract/
│   └── index.ts                      # Tag extraction Edge Function
├── _shared/
│   ├── cors.ts                       # CORS headers (existing)
│   ├── anonymize.ts                  # NEW: PII anonymization utilities
│   └── system-prompt.ts              # Existing (coach prompts)
supabase/migrations/
├── 20260121XXXXXX_add_tag_count.sql  # NEW: Add tag_count column and RPC function
src/services/
├── tagExtraction.ts                 # NEW: Client-side tag extraction service
└── climbs.ts                        # Existing (climb logging)
```

### Pattern 1: Asynchronous Non-Blocking Tag Extraction

**What:** Client saves climb first, then triggers tag extraction Edge Function. Edge Function returns immediately with job ID, extraction continues in background. Client polls or uses real-time subscription to get extracted tags.

**When to use:** When you need AI-powered processing but want to keep the user-facing operation fast and responsive.

**Example:**
```typescript
// Client-side (src/services/tagExtraction.ts)
// Save climb first
const { data: climb, error } = await supabase
  .from('climbs')
  .insert(climbData)
  .select()
  .single()

if (error) throw error

// Trigger async tag extraction AFTER save succeeds
supabase.functions.invoke('openrouter-tag-extract', {
  body: {
    climb_id: climb.id,
    notes: climb.notes,
    user_id: userId,
  },
}).catch(err => {
  // Extraction failed but climb is saved - log error
  console.error('Tag extraction failed:', err)
})

// UI shows climb immediately, tags appear when ready
```

**Key differences from coach/chat:**
- Coach/chat wait for LLM response before returning
- Tag extraction returns immediately with `{ success: true, message: "Tag extraction started" }`
- No streaming needed for tag extraction (simple JSON response)

### Pattern 2: Structured JSON Output with Confidence Thresholds

**What:** Use OpenAI's response_format with json_object type to enforce JSON schema. Include confidence scores (0-100) and only include tags above 70% threshold.

**When to use:** When you need LLM to output structured data with reliable validation.

**Example:**
```typescript
// Source: Existing openrouter-coach pattern + CONTEXT.md decisions
const response = await openai.chat.completions.create({
  model: tagModel,  // OPENROUTER_TAG_MODEL env var
  messages: [
    {
      role: 'system',
      content: tagSystemPrompt,  // Separate from coach prompt
    },
    {
      role: 'user',
      content: `Extract tags from this climbing note: ${truncatedNotes}`,
    },
  ],
  response_format: { type: 'json_object' },  // Enforce JSON output
  temperature: 0.2,  // Low temperature for consistent extraction (from CONTEXT.md)
})

const tags = JSON.parse(response.choices[0].message.content)

// Validate and apply confidence threshold (from CONTEXT.md)
const confidentStyleTags = tags.style_tags.filter((t: Tag) => t.confidence >= 70)
const confidentFailureReasons = tags.failure_reasons.filter((t: Tag) => t.confidence >= 70)
```

### Pattern 3: Quota Enforcement Before API Call

**What:** Check daily quota (50 climbs) BEFORE calling OpenRouter API. Use atomic RPC function to increment counter. Return 429 if quota exceeded.

**When to use:** When you need to prevent runaway AI costs while providing user feedback.

**Example:**
```typescript
// Source: Existing openrouter-coach pattern (lines 483-529)
const { data: limits } = await supabase
  .from('user_limits')
  .select('tag_count, limit_date')  // NEW: tag_count column
  .eq('user_id', userId)
  .maybeSingle()

const tagCount = limits?.tag_count ?? 0
const limitDate = limits?.limit_date ? new Date(limits.limit_date) : new Date('1970-01-01')
const today = new Date()
today.setUTCHours(0, 0, 0, 0)

const isSameDay = limitDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]
const effectiveCount = isSameDay ? tagCount : 0

const DAILY_TAG_LIMIT = 50  // From CONTEXT.md

if (effectiveCount >= DAILY_TAG_LIMIT) {
  return new Response(
    JSON.stringify({
      error: `Daily quota reached. Tags extracted tomorrow. Add manually in Settings.`,
      limit_type: 'tag_extraction',
      current_count: effectiveCount,
      limit: DAILY_TAG_LIMIT,
    }),
    { status: 429, headers: corsHeaders }
  )
}

// Increment counter BEFORE API call
await supabase.rpc('increment_tag_count', { p_user_id: userId })
```

### Pattern 4: PII Anonymization Before API Call

**What:** Strip or replace personal identifiers from notes before sending to OpenRouter. Map gym names to "indoor_gym", crag names to "outdoor_crags" (from Phase 18-04).

**When to use:** When sending user-generated content to external AI services to protect privacy.

**Example:**
```typescript
// Source: Phase 18-04 decision + CONTEXT.md
function anonymizeNotes(notes: string): string {
  if (!notes) return notes

  let anonymized = notes

  // Replace specific gym/crag names with generic terms
  anonymized = anonymized.replace(/Rock ?City/i, 'indoor_gym')
  anonymized = anonymized.replace(/Planet Granite/i, 'indoor_gym')
  anonymized = anonymized.replace(/Red Rocks/i, 'outdoor_crags')
  anonymized = anonymized.replace(/Yosemite/i, 'outdoor_crags')

  // Remove common PII patterns (from WebSearch - MEDIUM confidence)
  anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REMOVED]')
  anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REMOVED]')

  return anonymized
}
```

### Pattern 5: Retry with Exponential Backoff

**What:** Retry failed API calls up to 2 times with delays (1s, then 2s). Log all attempts.

**When to use:** When calling external APIs that may have transient failures (network errors, rate limits).

**Example:**
```typescript
// Source: Existing openrouter-coach pattern (lines 566-735)
const MAX_RETRIES = 2  // From CONTEXT.md (2 retries)
let lastError: Error | null = null
let lastContent: string | null = null
let lastUsage: any = null

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    const response = await openai.chat.completions.create({...})

    lastContent = response.choices[0].message.content
    lastUsage = response.usage

    // Validate response structure
    const validated = validateTagResponse(lastContent)

    // Success - update climb with tags and track cost
    await updateClimbWithTags(climbId, validated)
    await trackApiUsage(userId, lastUsage)

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    })
  } catch (error: any) {
    lastError = error
    console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.message)

    // Exponential backoff
    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }

    // Last attempt failed
    if (attempt === MAX_RETRIES - 1) {
      console.error('OpenRouter API failed after retries:', lastError?.message)

      // Return success - climb is saved, tags just didn't extract
      // Client shows toast notification
      return new Response(
        JSON.stringify({
          success: true,
          tags_extracted: false,
          error: 'Tag extraction failed, you can add tags manually',
        }),
        { headers: corsHeaders }
      )
    }
  }
}
```

### Anti-Patterns to Avoid

- **Blocking save flow:** Never wait for tag extraction before returning climb save success. The climb is the primary data; tags are metadata.
- **Shared model env var:** Don't reuse OPENROUTER_MODEL for tagging. Use separate OPENROUTER_TAG_MODEL (from CONTEXT.md).
- **Shared Edge Function:** Don't add tag extraction to openrouter-coach. Create separate openrouter-tag-extract function (from CONTEXT.md).
- **Without quota check:** Don't call OpenRouter API without checking user_limits first. This prevents runaway costs.
- **Cost tracking before API call:** Don't track costs before API call succeeds. Only track cost from usage.cost field AFTER successful response (from Phase 22-01 pattern).
- **Streaming for simple JSON:** Don't use SSE streaming for tag extraction. Simple non-streaming JSON response is sufficient and simpler (unlike chat which needs streaming).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON parsing and validation | Custom regex parsing | OpenAI `response_format: { type: 'json_object' }` + Zod validation | Ensures valid JSON output, structured format enforcement |
| Retry logic | Manual setTimeout loops | Structured retry loop with exponential backoff (pattern from openrouter-coach) | Handles transient failures, reduces unnecessary retries |
| Quota enforcement | Client-side counters | Database RPC function with atomic increment + CHECK constraint | Prevents race conditions, ensures accurate counting |
| PII detection | Custom regex patterns | Anonymization utilities in `_shared/anonymize.ts` with regex patterns from WebSearch | Centralized, maintainable, follows best practices |
| Cost calculation | Manual token counting | OpenRouter's `usage.cost` field (pattern from Phase 22-01) | Accurate, includes all factors, no calculation errors |

**Key insight:** The openrouter-coach Edge Function already implements most of these patterns. Tag extraction can follow the same patterns with modifications for non-blocking operation.

## Common Pitfalls

### Pitfall 1: Blocking Save Flow with Tag Extraction

**What goes wrong:** User experiences slow climb logging because waiting for AI tag extraction to complete before confirming save. App feels unresponsive, users abandon logging.

**Why it happens:** Developer treats tag extraction as synchronous part of save operation, similar to form validation.

**How to avoid:** Save climb first, return success to user, then trigger tag extraction as separate async operation. Tags appear when ready via polling or real-time subscription.

**Warning signs:** `await supabase.functions.invoke('openrouter-tag-extract')` before returning from climb save handler.

### Pitfall 2: Exceeding Daily Quota Without Enforcement

**What goes wrong:** Tag extraction continues beyond 50 climbs/day limit, causing runaway AI costs. No user feedback about quota.

**Why it happens:** Missing quota check before API call, or counter not incremented atomically.

**How to avoid:** Check user_limits.tag_count BEFORE calling OpenRouter. Use atomic RPC function `increment_tag_count()` to increment. Return 429 with quota info when limit exceeded.

**Warning signs:** Direct `openai.chat.completions.create()` call without prior quota check.

### Pitfall 3: Malformed AI Response Crashes Application

**What goes wrong:** LLM returns invalid JSON, missing fields, or unexpected structure. Application crashes, climb save fails.

**Why it happens:** No response validation, or validation too strict without retry logic.

**How to avoid:** Use structured JSON output (`response_format: { type: 'json_object' }`), validate response with Zod schema, retry on validation failures, return success even if extraction fails (climb is saved).

**Warning signs:** `JSON.parse(llmResponse)` without try-catch or schema validation.

### Pitfall 4: PII Leaked to External AI Service

**What goes wrong:** User's gym names, partner names, or other identifiers sent to OpenRouter API. Potential privacy violation.

**Why it happens:** Notes sent directly to LLM without anonymization.

**How to avoid:** Implement anonymizeNotes() function that replaces gym names with "indoor_gym", crag names with "outdoor_crags", and removes PII patterns (email, phone, etc.).

**Warning signs:** Raw notes included in `openai.chat.completions.create()` call.

### Pitfall 5: Cost Tracking Inaccurate or Missing

**What goes wrong:** Cost tracking based on estimated token counts or manual calculation. Doesn't match actual OpenRouter billing. No visibility into AI expenses.

**Why it happens:** Developer calculates cost manually instead of using OpenRouter's provided cost field (pattern from Phase 22-01).

**How to avoid:** Always use `usage.cost` field from OpenRouter response. Track cost AFTER successful API call (not before). Store in tag_extraction_api_usage table (similar to coach_api_usage).

**Warning signs:** Cost calculated from `(prompt_tokens * prompt_price + completion_tokens * completion_price)`.

### Pitfall 6: Notes Too Long, Costly API Calls

**What goes wrong:** Long notes (2000+ characters) sent to LLM, causing high token usage and costs. Slow response times.

**Why it happens:** No truncation before API call.

**How to avoid:** Truncate notes to 1000 tokens before sending (from CONTEXT.md decision). Use estimateTokenCount helper (from openrouter-chat, lines 97-104).

**Warning signs:** Full notes sent to `openai.chat.completions.create()` without truncation check.

## Code Examples

Verified patterns from existing codebase and official sources:

### 1. JWT Validation Pattern (from openrouter-coach)

```typescript
// Source: supabase/functions/openrouter-coach/index.ts (lines 457-481)
const authHeader = req.headers.get('Authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
    status: 401,
    headers: corsHeaders,
  })
}

const token = authHeader.replace('Bearer ', '')

const {
  data: { user },
  error: claimsError,
} = await supabase.auth.getUser(token)

if (claimsError || !user) {
  return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
    status: 401,
    headers: corsHeaders,
  })
}

userId = user.id
```

### 2. Cost Tracking Pattern (from openrouter-coach)

```typescript
// Source: supabase/functions/openrouter-coach/index.ts (lines 593-624)
// Track API usage with OpenRouter's cost
const costUsd = lastUsage.cost || 0

const { error: usageError } = await supabase.from('coach_api_usage').insert({
  user_id: userId,
  prompt_tokens: lastUsage.prompt_tokens,
  completion_tokens: lastUsage.completion_tokens,
  total_tokens: lastUsage.total_tokens,
  cost_usd: costUsd,  // Use OpenRouter's cost, don't calculate
  model,
  endpoint: 'openrouter-coach',
  time_window_start: new Date().toISOString(),
})

if (usageError) {
  console.error('Failed to track API usage:', usageError)
  // Continue - tracking failure shouldn't break the response
}
```

### 3. Atomic Counter Increment with Reset Pattern (from migration)

```sql
-- Source: supabase/migrations/20260119140000_create_user_limits.sql (lines 29-43)
CREATE OR REPLACE FUNCTION public.increment_tag_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, tag_count, limit_date)
  VALUES (p_user_id, 0, 0, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    tag_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
      ELSE user_limits.tag_count + 1                     -- Increment
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

### 4. Token Estimation Pattern (from openrouter-chat)

```typescript
// Source: supabase/functions/openrouter-chat/index.ts (lines 97-104)
function estimateTokenCount(text: string): number {
  // Count words (split by whitespace, filter empty)
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length
  // Or count characters / 4 for English text approximation
  const charBasedEstimate = Math.ceil(text.length / 4)
  // Use the higher of the two to be conservative
  return Math.max(wordCount, charBasedEstimate)
}

// Usage:
const MAX_TOKENS = 1000  // From CONTEXT.md
const estimatedTokens = estimateTokenCount(notes)

if (estimatedTokens > MAX_TOKENS) {
  notes = notes.substring(0, Math.floor(notes.length * (MAX_TOKENS / estimatedTokens)))
}
```

### 5. Structured JSON Output Pattern

```typescript
// Source: OpenAI Structured Outputs docs + openrouter-coach pattern
const response = await openai.chat.completions.create({
  model: tagModel,
  messages: [
    {
      role: 'system',
      content: 'Extract climbing tags from notes. Return JSON with style_tags and failure_reasons arrays. Each tag must have name (enum) and confidence (0-100). Only include tags with confidence >= 70. Maximum 3 styles + 3 failure reasons. At least 1 failure reason required.',
    },
    {
      role: 'user',
      content: `Notes: ${truncatedNotes}`,
    },
  ],
  response_format: { type: 'json_object' },  // Enforce JSON
  temperature: 0.2,  // Low for consistency (from CONTEXT.md)
})

// Expected response structure:
{
  "style_tags": [
    { "name": "Overhang", "confidence": 85 },
    { "name": "Crimp", "confidence": 72 }
  ],
  "failure_reasons": [
    { "name": "Pumped", "confidence": 90 },
    { "name": "Bad Feet", "confidence": 78 }
  ]
}
```

### 6. Validation Pattern (from openrouter-coach)

```typescript
// Source: supabase/functions/openrouter-coach/index.ts (lines 312-431)
function validateTagResponse(content: string): TagExtractionResult {
  const cleaned = cleanResponse(content)
  let parsed: any

  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error('Invalid JSON in response')
  }

  // Validate style_tags array
  if (!Array.isArray(parsed.style_tags)) {
    throw new Error('Missing or invalid field: style_tags')
  }

  if (parsed.style_tags.length > 3) {
    throw new Error('Field style_tags must contain max 3 items')
  }

  // Validate each style tag
  parsed.style_tags.forEach((tag: any) => {
    if (!VALID_STYLES.includes(tag.name)) {
      throw new Error(`Invalid style tag: ${tag.name}`)
    }
    if (typeof tag.confidence !== 'number' || tag.confidence < 0 || tag.confidence > 100) {
      throw new Error('Confidence must be number 0-100')
    }
  })

  // Validate failure_reasons array
  if (!Array.isArray(parsed.failure_reasons)) {
    throw new Error('Missing or invalid field: failure_reasons')
  }

  if (parsed.failure_reasons.length === 0 || parsed.failure_reasons.length > 3) {
    throw new Error('Field failure_reasons must contain 1-3 items')
  }

  // Validate each failure reason
  parsed.failure_reasons.forEach((tag: any) => {
    if (!VALID_FAILURE_REASONS.includes(tag.name)) {
      throw new Error(`Invalid failure reason: ${tag.name}`)
    }
    if (typeof tag.confidence !== 'number' || tag.confidence < 0 || tag.confidence > 100) {
      throw new Error('Confidence must be number 0-100')
    }
  })

  return parsed
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Free-form text parsing | Structured JSON output with response_format | OpenAI API update (2024) | Guarantees valid JSON, easier validation, reduces parsing errors |
| Manual cost calculation | OpenRouter's usage.cost field | Phase 22-01 (2025) | Accurate cost tracking, matches billing, no calculation errors |
| Client-side quota tracking | Server-side atomic RPC with CHECK constraints | Phase 27-01 (2025) | Prevents race conditions, accurate counting, enforces hard limits |
| Synchronous extraction | Asynchronous non-blocking extraction | Phase 31 (current) | Faster user experience, better UX, tags appear when ready |

**Deprecated/outdated:**
- JSON mode without strict: Use `response_format: { type: 'json_object' }` instead of relying on prompt instructions alone
- Manual token counting for cost: Use `usage.cost` field instead of calculating from token counts
- Streaming for simple JSON responses: Only use streaming for chat (SSE), simple JSON doesn't need streaming

## Database Schema Changes

### Add tag_count column to user_limits table

```sql
-- New migration file: 20260121XXXXXX_add_tag_count.sql

-- Add tag_count column to user_limits
ALTER TABLE public.user_limits
ADD COLUMN tag_count INTEGER NOT NULL DEFAULT 0 CHECK (tag_count >= 0);

-- Create increment_tag_count function
CREATE OR REPLACE FUNCTION public.increment_tag_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, tag_count, limit_date)
  VALUES (p_user_id, 0, 0, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    tag_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
      ELSE user_limits.tag_count + 1                     -- Increment
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Grant EXECUTE to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_tag_count(UUID) TO authenticated;
```

### Create tag_extraction_api_usage table

```sql
-- New migration file: 20260121XXXXXX_create_tag_extraction_api_usage.sql

CREATE TABLE public.tag_extraction_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'openrouter-tag-extract',
  time_window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tag_extraction_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own usage
CREATE POLICY "Users can view own tag extraction usage"
  ON public.tag_extraction_api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE policies. Edge Functions use service role key.

-- Indexes
CREATE INDEX tag_extraction_api_usage_user_id_idx ON public.tag_extraction_api_usage(user_id);
CREATE INDEX tag_extraction_api_usage_time_window_idx ON public.tag_extraction_api_usage(time_window_start);
```

## Open Questions

1. **Tag Update vs. Replace Strategy**
   - What we know: Edge Function must update climb with extracted tags
   - What's unclear: Should tags replace existing tags (overwrite) or merge (union)? What if user already manually selected some tags?
   - Recommendation: Use merge strategy - extracted tags add to existing tags. If user already selected a tag that AI also extracted, don't duplicate. This respects user's manual selections while adding AI suggestions.

2. **Real-time vs. Polling for Tag Updates**
   - What we know: Extraction is async, client needs to know when tags are ready
   - What's unclear: Should client use Supabase real-time subscription to listen for updates, or poll the climb table every few seconds?
   - Recommendation: Use real-time subscription via `supabase.channel.on('postgres_changes', ...)` for immediate updates without polling overhead. This is more efficient and provides instant feedback when tags are extracted.

3. **Tag Extraction Failure User Experience**
   - What we know: Extraction should fail gracefully, climb is saved regardless
   - What's unclear: Exact toast notification wording and timing. Should user be able to retry extraction?
   - Recommendation: Show toast: "Tag extraction failed. You can add tags manually." No retry button (too complex for Phase 31). User can manually edit tags in Phase 32.

4. **Multiple Tag Extraction Calls**
   - What we know: Climb might be edited, triggering multiple extraction calls
   - What's unclear: Should we prevent duplicate extractions for same climb? Add extracted flag to climb?
   - Recommendation: Add `tags_extracted_at` timestamp to climbs table. Only extract if null or older than climb updated_at. This prevents duplicate API calls while allowing re-extraction if notes change.

## Sources

### Primary (HIGH confidence)

- **supabase/functions/openrouter-coach/index.ts** - Full Edge Function implementation showing JWT validation, quota enforcement, cost tracking, retry logic
- **supabase/functions/openrouter-chat/index.ts** - Streaming implementation pattern, token estimation
- **supabase/migrations/20260119140000_create_user_limits.sql** - Atomic counter increment pattern with reset logic
- **src/lib/validation.ts** - Valid tag enums (styles, failure reasons) for schema validation
- **.planning/phases/31-ai-tag-extraction-service/31-CONTEXT.md** - User decisions for this phase (confidence thresholds, max tags, retry count)

### Secondary (MEDIUM confidence)

- [Structured data extraction from unstructured content using LLM - Simon Willison](https://simonwillison.net/2025/Feb/28/llm-schemas/) - Best practices for LLM schemas and structured output
- [Structured model outputs - OpenAI API](https://platform.openai.com/docs/guides/structured-outputs) - Official OpenAI documentation for structured output with JSON Schema
- [Secure LLM Usage With Reversible Data Anonymization - DZone](https://dzone.com/articles/llm-pii-anonymization-guide) - PII anonymization techniques before sending to LLM
- [Protecting PII data with anonymization in LLM-based projects - tsh.io](https://tsh.io/blog/pii-anonymization-in-llm-projects) - Real-world PII anonymization implementation
- [Supabase Edge Functions: Introducing Background Tasks, WebSockets - Supabase Blog](https://supabase.com/blog/edge-functions-background-tasks-websockets) - Edge Functions capabilities for async operations

### Tertiary (LOW confidence)

- [Guided JSON with LLMs: From Raw PDFs to Structured Intelligence - Medium](https://medium.com/@kimdoil1211/structured-output-with-guided-json-a-practical-guide-for-llm-developers-6577b2eee98a) - JSON schema examples for LLM extraction (verified against OpenAI docs)
- [How to effectively prompt for Structured Output - OpenAI Community](https://community.openai.com/t/how-to-effectively-prompt-for-structured-output/1355135) - Community discussion on best practices
- [A practical guide to OpenAI JSON Mode in 2025 - eesel AI](https://www.eesel.ai/blog/openai-json-mode) - JSON mode explanation (verified against OpenAI docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing codebase (openrouter-coach, openrouter-chat) and official OpenAI docs
- Architecture patterns: HIGH - Verified against existing Edge Functions and CONTEXT.md decisions
- Database schema: HIGH - Based on existing user_limits table pattern and Phase 27-01 decisions
- PII anonymization: MEDIUM - Based on WebSearch best practices, needs implementation validation
- Real-time vs. polling: MEDIUM - Based on Supabase real-time docs, needs testing for this use case

**Research date:** 2026-01-21
**Valid until:** 2026-02-20 (30 days - stable Edge Function patterns, OpenAI API, and Supabase architecture)
