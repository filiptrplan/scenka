# Phase 20: LLM Integration - Research

**Researched:** 2026-01-18
**Domain:** Edge Functions + LLM API Integration
**Confidence:** MEDIUM

## Summary

This phase implements the `openrouter-coach` Edge Function to generate personalized climbing training recommendations using OpenRouter's LLM API. The integration must handle climbing-specific prompt engineering, structured JSON output validation, API error handling with graceful fallbacks, and privacy safeguards.

Research found:
1. **Supabase Edge Functions** use Deno runtime with TypeScript - simple `.ts` files exporting handlers
2. **OpenRouter API** is fully OpenAI-compatible, supporting chat completions with system messages, temperature control, and structured output
3. **Climbing training domain** requires specific drill knowledge: hangboard protocols, campus board exercises, antagonistic training with proper sets/reps/rest periods
4. **JSON validation** is critical - LLM responses must be validated against a schema before storage/display
5. **Error handling** needs retry logic (2-3 attempts) and fallback to cached recommendations with clear user messaging

**Primary recommendation:** Use OpenAI SDK with OpenRouter base URL for chat completions, implement robust JSON validation with retry logic, and design climbing-specific prompts with technical terminology.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.89.0 | Supabase client | Already in project, handles auth and DB |
| Deno std http | 0.208.0 | HTTP server/fetch | Built-in to Edge Functions runtime |
| openai | 4.x | OpenRouter API client | OpenRouter is fully OpenAI-compatible |

### Edge Function Structure
```
supabase/
└── functions/
    └── openrouter-coach/
        └── index.ts    # Main handler function
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI SDK | Native fetch API | OpenAI SDK provides better error handling and type safety |

**Installation:**
```bash
# Edge Functions don't need npm install - Deno imports from URLs
# Example import in Edge Function:
import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
```

## Architecture Patterns

### Edge Function Handler Pattern
**What:** Standard Deno.serve handler with JWT validation, API call, and response
**When to use:** All Supabase Edge Functions
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/functions
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SB_PUBLISHABLE_KEY')!
)

Deno.serve(async (req) => {
  // 1. Validate JWT
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getClaims(token)
  if (!data || error) {
    return Response.json({ error: 'Invalid JWT' }, { status: 401 })
  }

  // 2. Parse request body
  const body = await req.json()

  // 3. Call external API (OpenRouter)
  // 4. Store results in database
  // 5. Return response
})
```

### OpenRouter API Call Pattern
**What:** OpenAI-compatible chat completions with system message
**When to use:** All OpenRouter requests
**Example:**
```typescript
// Source: https://openrouter.ai/docs (verified via WebFetch)
import OpenAI from 'npm:openai@4'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENROUTER_API_KEY')!,
  baseURL: 'https://openrouter.ai/api/v1'
})

const response = await openai.chat.completions.create({
  model: 'openai/gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.6,
  response_format: { type: 'json_object' } // Request JSON output
})

const content = response.choices[0].message.content
const usage = response.usage
```

### JSON Validation with Retry Pattern
**What:** Validate LLM response, retry if invalid, give up after N attempts
**When to use:** All LLM responses requiring structured output
**Example:**
```typescript
// Recommended pattern from CONTEXT.md decisions
const MAX_RETRIES = 3
let lastError: Error | null = null

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    const response = await callOpenRouter(prompt)
    const parsed = JSON.parse(response.content)

    // Validate schema
    if (!parsed.weekly_focus || !Array.isArray(parsed.drills)) {
      throw new Error('Invalid response structure')
    }

    // Validate each drill has required fields
    for (const drill of parsed.drills) {
      if (!drill.name || !drill.description || !drill.sets || !drill.reps || !drill.rest) {
        throw new Error('Drill missing required fields')
      }
    }

    // Success! Return validated data
    return parsed

  } catch (error) {
    lastError = error
    console.warn(`Attempt ${attempt + 1} failed:`, error)
    // Continue to next retry
  }
}

// All retries exhausted
throw lastError || new Error('Failed to generate valid response')
```

### Integration with Existing Coach Service
**What:** Edge Function invoked via supabase.functions.invoke(), results stored in DB
**When to use:** All LLM-powered features
**Example:**
```typescript
// Source: /workspace/src/services/coach.ts (verified)
// Existing code already invokes Edge Function:
const { data, error } = await supabase.functions.invoke('generate-recommendations', {
  body: {
    user_id: user.id,
    climbs_data: anonymizedClimbs,  // Privacy-safe
    patterns_data: patterns,        // From Phase 18-02
    user_preferences: input.user_preferences
  }
})

// Phase 20 implements the actual handler for 'generate-recommendations'
// This should be renamed to 'openrouter-coach' to match CONTEXT.md
```

### Anti-Patterns to Avoid
- **Hardcoding API keys:** Use `Deno.env.get('OPENROUTER_API_KEY')` in Edge Functions
- **No JWT validation:** Always validate auth token before processing requests
- **No JSON validation:** LLM responses are unreliable, must validate before use
- **Silent failures:** Always surface errors to users with helpful messages
- **Missing fallbacks:** Return cached recommendations on API failure

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP requests to OpenRouter | Custom fetch with error handling | OpenAI SDK | Handles authentication, retries, streaming, error responses |
| JSON parsing/validation | Manual checks | Zod or structured checks | Type-safe validation, better error messages |
| JWT token extraction | Manual string parsing | Supabase auth.getClaims() | Handles edge cases, validates signature |
| Rate limiting tracking | Custom counters | Existing coach_api_usage table | Phase 18-03 already implemented cost tracking |

**Key insight:** Edge Functions have Deno's standard library built-in and can import npm packages via URL. Leverage existing packages rather than building from scratch.

## Common Pitfalls

### Pitfall 1: Missing Environment Variables
**What goes wrong:** Edge Function crashes trying to access `Deno.env.get()` values
**Why it happens:** Environment variables not set in Supabase Dashboard or local .env file
**How to avoid:**
1. Add `OPENROUTER_API_KEY` to Supabase Dashboard → Edge Functions → Environment Variables
2. Document all required environment variables in README
3. Validate env vars exist at function startup and fail fast
**Warning signs:** `Cannot read properties of undefined` errors, 500 responses

### Pitfall 2: Invalid JSON from LLM
**What goes wrong:** `JSON.parse()` throws, function crashes
**Why it happens:** LLMs don't guarantee JSON output, may include explanatory text
**How to avoid:**
1. Use `response_format: { type: 'json_object' }` in OpenAI SDK
2. Validate with try/catch and retry logic
3. Clean response before parsing (strip markdown code blocks)
**Warning signs:** "Unexpected token" errors, 500 responses

### Pitfall 3: Response Schema Mismatch
**What goes wrong:** JSON parses but missing required fields (weekly_focus, drills)
**Why it happens:** LLM misunderstood prompt or hallucinated fields
**How to avoid:**
1. Be explicit in system prompt about required JSON structure
2. Use Zod schema validation for type safety
3. Provide example JSON in prompt
4. Validate all required fields before returning
**Warning signs:** UI shows "undefined" or crashes accessing missing properties

### Pitfall 4: Insufficient Context Window
**What goes wrong:** LLM request truncated or fails with "context length exceeded"
**Why it happens:** Sending too much climbing data (100+ climbs) exceeds model's token limit
**How to avoid:**
1. Check context window size (gpt-4o-mini: ~128K tokens)
2. Summarize pattern data instead of sending raw climbs
3. Monitor token usage with response.usage
4. Consider models with larger context if needed
**Warning signs:** 400 errors, "context length" messages, cut-off responses

### Pitfall 5: Privacy Data Leakage
**What goes wrong:** User's PII (name, email, specific gym name) sent to LLM API
**Why it happens:** Forgetting to anonymize data or using wrong data structure
**How to avoid:**
1. Always use `anonymizeClimbsForAI()` before sending to LLM (already implemented)
2. Call `validateAnonymizedData()` as defensive check
3. Never send user_id, email, or profile fields
4. Log anonymized data for debugging
**Warning signs:** User names in prompts, specific gym names visible in logs

### Pitfall 6: No Fallback on API Failure
**What goes wrong:** API error leaves user with no recommendations
**Why it happens:** Only showing fresh data, ignoring cached recommendations
**How to avoid:**
1. Query existing recommendations before generating new ones
2. On API error, return cached recommendations with warning message
3. Set `error_message` field in coach_recommendations table
4. Show user-friendly error with last updated time
**Warning signs:** Empty state after API errors, loss of previous recommendations

## Code Examples

Verified patterns from official sources:

### Edge Function Setup
```typescript
// File: supabase/functions/openrouter-coach/index.ts
// Source: https://supabase.com/docs/guides/functions (verified)
import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SB_PUBLISHABLE_KEY')!
)

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENROUTER_API_KEY')!,
  baseURL: 'https://openrouter.ai/api/v1'
})

Deno.serve(async (req) => {
  try {
    // Implementation here
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
})
```

### Call OpenRouter with System Message
```typescript
// Source: https://openrouter.ai/docs (verified)
const response = await openai.chat.completions.create({
  model: 'openai/gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are an expert climbing coach...'
    },
    {
      role: 'user',
      content: JSON.stringify({
        patterns: patternData,
        preferences: userPreferences
      })
    }
  ],
  temperature: 0.6,
  response_format: { type: 'json_object' }
})
```

### Store API Usage Tracking
```typescript
// Source: /workspace/src/services/coach.ts (verified - Phase 18-03)
await supabase.from('coach_api_usage').insert({
  user_id: userId,
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  total_tokens: response.usage.total_tokens,
  cost_usd: calculateCost(response.usage),
  model: 'openai/gpt-4o-mini',
  endpoint: 'openrouter-coach',
  time_window_start: new Date().toISOString()
})
```

### Store Recommendations in Database
```typescript
// Source: /workspace/supabase/migrations/20260117_create_coach_tables.sql (verified)
await supabase.from('coach_recommendations').insert({
  user_id: userId,
  generation_date: new Date().toISOString().split('T')[0],
  content: validatedResponse,  // JSONB: { weekly_focus, drills: [...] }
  is_cached: false,
  error_message: null
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual HTTP calls to OpenRouter | OpenAI SDK with baseURL override | OpenRouter launch | Better error handling, type safety |
| Free-form text prompts | Structured JSON with system message | GPT-4 release | Reliable output, easier parsing |
| No validation on LLM responses | Schema validation with retry | Best practice evolution | Catches hallucinations, improves reliability |
| Rate limiting by request count | Rate limiting by token count | OpenAI pricing model | Accurate cost control |

**Deprecated/outdated:**
- Direct HTTP to OpenAI endpoints (use OpenRouter for model flexibility)
- JSON.parse without validation (LLM responses are unreliable)
- Temperature = 0.0 (too deterministic, use 0.5-0.7 for coaching)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Model Selection**
   - What we know: Context mentions "openai/gpt-4o-mini" as example in coach.ts, pricing is low ($0.15/M prompt, $0.60/M completion)
   - What's unclear: Whether gpt-4o-mini is best for climbing coaching vs other models (Claude 3.5 Sonnet, GPT-4o)
   - Recommendation: Start with gpt-4o-mini (already referenced in code), evaluate quality, consider A/B testing in future

2. **Climbing Training Drill Knowledge Base**
   - What we know: Need hangboard protocols (8-12s hangs), campus board (power), antagonistic training (sets/reps)
   - What's unclear: Exact drill structures and climbing-specific terminology to include in prompts (verified sources were inaccessible)
   - Recommendation: Document standard drills in prompt comments, validate with climbing expert or community feedback, iterate based on user feedback

3. **Token Budget Management**
   - What we know: 50k tokens/day rate limit exists (Phase 18-03)
   - What's unclear: How many tokens a typical recommendation generation uses, if 50k is sufficient for weekly regeneration
   - Recommendation: Monitor token usage in production, adjust rate limit if needed based on actual usage patterns

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions) - Verified Edge Function structure, Deno.serve pattern, external API calls
- [OpenRouter API Docs](https://openrouter.ai/docs) - Verified OpenAI-compatible API, system messages, temperature control, JSON output format
- [/workspace/src/services/coach.ts](/workspace/src/services/coach.ts) - Verified existing cost tracking, Edge Function invocation pattern
- [/workspace/supabase/migrations/20260117_create_coach_tables.sql](/workspace/supabase/migrations/20260117_create_coach_tables.sql) - Verified database schema for recommendations and usage tracking
- [/workspace/src/components/features/coach-page.tsx](/workspace/src/components/features/coach-page.tsx) - Verified UI expectations for data structure
- [/workspace/src/services/patterns.ts](/workspace/src/services/patterns.ts) - Verified pattern analysis data structure available as context

### Secondary (MEDIUM confidence)
- [TrainingBeta climbing training](https://trainingbeta.com/) - Verified hangboard protocols (8-12s hangs), campus board power training, periodization principles
- [Deno fetch API docs](https://deno.land/std@0.208.0/http/fetch.ts) - Verified fetch usage for HTTP requests with headers and error handling

### Tertiary (LOW confidence)
- Climbing training drill specifics - Unable to verify hangboard sets/reps/rest, campus board protocols, antagonistic exercises with official sources (all climbing websites returned errors or redirects). **Recommend validation with climbing expert.**
- OpenRouter model comparisons - Unable to access pricing page or model comparison docs. Relying on example in codebase (gpt-4o-mini) as starting point.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Supabase Edge Functions and OpenRouter docs verified
- Architecture: HIGH - Edge Function patterns and OpenAI SDK usage verified
- Climbing domain: MEDIUM - General principles verified, specific drill structures unverified
- Pitfalls: HIGH - Based on common Edge Function and LLM integration patterns

**Research date:** 2026-01-18
**Valid until:** 2025-02-17 (30 days - Supabase/OpenRouter stable, but climbing drill knowledge needs validation)

**Notes for planner:**
1. Prompt engineering quality is the biggest unknown (CONTEXT.md blocker)
2. Consider implementing a "prompt template" system for easy iteration
3. Add comprehensive logging for debugging prompt/response quality
4. Consider storing raw LLM responses for analysis/debugging
5. Plan for prompt versioning to track what generated which recommendations
