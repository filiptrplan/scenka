# Phase 22: OpenRouter Model Configuration - Research

**Researched:** 2026-01-19
**Domain:** Supabase Edge Functions, OpenRouter API, Deno runtime, Cost tracking
**Confidence:** MEDIUM

## Summary

This phase involves making the OpenRouter model selection configurable via environment variables instead of hardcoding it in Edge Functions. The implementation spans two Edge Functions (openrouter-chat and openrouter-coach), requires environment variable configuration in Supabase, and involves updating cost tracking to use OpenRouter's usage data directly.

Key findings:
- Both Edge Functions currently hardcode `model: 'google/gemini-2.5-pro'` in API calls
- Deno Edge Functions read env vars via `Deno.env.get()` with pattern already established for other env vars
- Supabase CLI uses `supabase secrets set NAME=VALUE` for Edge Function configuration
- Cost tracking currently uses internal `calculateCost()` function that needs to be replaced with OpenRouter's provided cost data
- Streaming responses (openrouter-chat) require special handling for usage data capture

**Primary recommendation:** Use `Deno.env.get('OPENROUTER_MODEL')` in both Edge Functions, fail fast if missing, and use OpenRouter's usage.cost field directly for cost tracking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenAI SDK (npm:openai) | v4 | OpenRouter API calls | Provides OpenAI-compatible API with baseURL override |
| Supabase Client | v2 | Database operations | Standard for Supabase Edge Functions |
| @microsoft/fetch-event-source | v2.0.1 | SSE streaming | Used in useStreamingChat hook (Phase 21) |

### Deno Runtime
| Component | Purpose | Usage |
|-----------|---------|-------|
| `Deno.env.get()` | Read environment variables | Access OPENROUTER_MODEL env var |
| `Deno.serve()` | Edge Function handler | Standard Deno runtime pattern |

### Environment Management
| Tool | Command | Purpose |
|------|---------|---------|
| Supabase CLI | `supabase secrets set NAME=VALUE` | Set env vars for Edge Functions |
| Supabase CLI | `supabase secrets list` | View configured secrets |
| Supabase CLI | `supabase functions deploy` | Deploy with env vars |

**Installation:**
No new dependencies required. Already using:
- `npm:openai@4` in Edge Functions (already installed)
- `@microsoft/fetch-event-source` in client (already installed)

**Environment Variable Setup:**
```bash
# Set the OpenRouter model for Edge Functions
supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro
```

## Architecture Patterns

### Edge Function Environment Variable Pattern

**What:** Reading and validating environment variables at Edge Function initialization

**When to use:** Any Edge Function that needs configuration from environment variables

**Example:**
```typescript
// Environment variable validation (existing pattern in both functions)
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_MODEL']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const model = Deno.env.get('OPENROUTER_MODEL')!

// Use in API call
const response = await openai.chat.completions.create({
  model,  // Use configured model instead of hardcoded
  messages,
  stream: false,
})
```

### OpenRouter API Call with OpenAI SDK

**What:** Using OpenAI SDK with baseURL override to call OpenRouter API

**When to use:** All OpenRouter API calls through Edge Functions

**Example:**
```typescript
// Initialize OpenAI client with OpenRouter baseURL
const openai = new OpenAI({
  apiKey: openrouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

// Non-streaming call (openrouter-coach)
const response = await openai.chat.completions.create({
  model: Deno.env.get('OPENROUTER_MODEL')!,
  messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
  temperature: 0.6,
  response_format: { type: 'json_object' },
})

// Access usage data
const usage = response.usage
const { prompt_tokens, completion_tokens, total_tokens, cost } = usage
```

### SSE Streaming with Usage Tracking

**What:** Streaming responses with deferred usage tracking

**When to use:** Chat endpoints using SSE for real-time responses

**Example:**
```typescript
// Streaming call (openrouter-chat)
const response = await openai.chat.completions.create({
  model: Deno.env.get('OPENROUTER_MODEL')!,
  messages,
  stream: true,
})

let assistantContent = ''

// Stream each chunk
for await (const chunk of response) {
  const content = chunk.choices[0]?.delta?.content || ''
  if (content) {
    assistantContent += content
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
  }
}

// After stream completes, usage is available in the final chunk
// Note: OpenRouter provides usage data in streaming responses
const finalChunk = response as any  // Type assertion for usage data
const usage = finalChunk.usage || {}

// Track usage with cost from OpenRouter
await supabase.from('coach_api_usage').insert({
  user_id: userId,
  prompt_tokens: usage.prompt_tokens || 0,
  completion_tokens: usage.completion_tokens || 0,
  total_tokens: usage.total_tokens || 0,
  cost_usd: usage.cost || 0,  // Use OpenRouter's cost directly
  model: Deno.env.get('OPENROUTER_MODEL')!,
  endpoint: 'openrouter-chat',
  time_window_start: new Date().toISOString(),
})
```

### Recommended Project Structure

```
supabase/functions/
├── openrouter-chat/
│   ├── index.ts              # SSE streaming chat endpoint
│   └── deno.json*            # Deno configuration (if needed)
├── openrouter-coach/
│   ├── index.ts              # Non-streaming recommendations endpoint
│   └── deno.json*            # Deno configuration (if needed)
└── _shared/
    ├── cors.ts               # Shared CORS headers
    └── system-prompt.ts      # Shared prompt generation
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cost calculation | Custom pricing logic | OpenRouter's `usage.cost` field | Models have different pricing, OpenRouter calculates accurately |
| Model validation | Regex/pattern matching | Let OpenRouter validate | Model IDs are provider-specific, changes frequently |
| SSE parsing | Manual event parsing | @microsoft/fetch-event-source | Handles reconnection, backoff, error cases |
| Env var handling | Custom config loader | Deno.env.get() | Built-in, secure, works with Supabase secrets |

**Key insight:** OpenRouter provides accurate cost data directly in the response. Using internal pricing calculations is error-prone and requires maintenance as model pricing changes.

## Common Pitfalls

### Pitfall 1: Streaming Usage Data Not Available During Stream

**What goes wrong:** Trying to access usage data while stream is still active returns undefined

**Why it happens:** In SSE streaming, usage data is only available after the stream completes (in the final chunk)

**How to avoid:**
- Track content during streaming phase
- Access usage data after the `for await (const chunk of response)` loop completes
- Store usage tracking after message is saved to database

**Warning signs:** `response.usage` is undefined during streaming loop

### Pitfall 2: Missing Environment Variable Causes Runtime Error

**What goes wrong:** Edge Function crashes when OPENROUTER_MODEL is not set

**Why it happens:** `Deno.env.get()` returns undefined, causing TypeError when using the value

**How to avoid:**
- Add OPENROUTER_MODEL to requiredEnvVars validation at startup
- Fail fast with clear error message on startup
- Document env var requirements in .env.example

**Warning signs:** Edge Function returns 500 error with "Missing required environment variable"

### Pitfall 3: Cost Calculation Inconsistency

**What goes wrong:** Manually calculated costs don't match OpenRouter billing

**Why it happens:** Different models have different pricing, caching affects costs, special tokens (reasoning, cached) have different rates

**How to avoid:**
- Use `usage.cost` field directly from OpenRouter response
- Remove internal `calculateCost()` functions
- Store only cost_usd from OpenRouter, don't calculate

**Warning signs:** Discrepancy between tracked costs and OpenRouter dashboard

### Pitfall 4: Model ID Format Mismatch

**What goes wrong:** Model ID not recognized by OpenRouter (404 or 400 error)

**Why it happens:** Model IDs are provider-specific (e.g., "google/gemini-2.5-pro", "anthropic/claude-3.5-sonnet")

**How to avoid:**
- Use exact format from OpenRouter model list (provider/model-name)
- Validate model ID by checking OpenRouter docs or models endpoint
- Include valid example in .env.example

**Warning signs:** API returns error "Model not found" or "Invalid model"

## Code Examples

### Environment Variable Setup

```bash
# .env.example (client-side - for documentation only)
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Edge Function secrets (set via CLI)
supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro
```

### Updated openrouter-chat/index.ts (streaming with usage tracking)

```typescript
// Source: Modified from /workspace/supabase/functions/openrouter-chat/index.ts

// Add OPENROUTER_MODEL to required env vars
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_MODEL']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const model = Deno.env.get('OPENROUTER_MODEL')!

// In the streaming loop:
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder()
    let assistantContent = ''

    try {
      const response = await openai.chat.completions.create({
        model,  // Use configured model
        messages,
        stream: true,
      })

      let finalUsage: any = null

      // Stream each chunk
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || ''

        if (content) {
          assistantContent += content
          const data = JSON.stringify({ content })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        // Capture usage from final chunk
        if (chunk.usage) {
          finalUsage = chunk.usage
        }
      }

      // Store assistant message
      if (assistantContent) {
        await supabase.from('coach_messages').insert({
          user_id: userId,
          role: 'assistant',
          content: assistantContent,
          context: body.patterns_data || {},
        }).catch((err) => {
          console.error('Failed to store assistant message:', err)
        })
      }

      // Track API usage with OpenRouter's cost
      if (finalUsage) {
        await supabase.from('coach_api_usage').insert({
          user_id: userId,
          prompt_tokens: finalUsage.prompt_tokens || 0,
          completion_tokens: finalUsage.completion_tokens || 0,
          total_tokens: finalUsage.total_tokens || 0,
          cost_usd: finalUsage.cost || 0,  // Use OpenRouter's cost directly
          model,
          endpoint: 'openrouter-chat',
          time_window_start: new Date().toISOString(),
        }).catch((err) => {
          console.error('Failed to track API usage:', err)
        })
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    } catch (error: any) {
      // Error handling...
    }
  },
})
```

### Updated openrouter-coach/index.ts (non-streaming with usage tracking)

```typescript
// Source: Modified from /workspace/supabase/functions/openrouter-coach/index.ts

// Add OPENROUTER_MODEL to required env vars
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_MODEL']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const model = Deno.env.get('OPENROUTER_MODEL')!

// Remove calculateCost function - use OpenRouter's cost directly

// In the retry loop:
const response = await openai.chat.completions.create({
  model,  // Use configured model
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.6,
  response_format: { type: 'json_object' },
})

const lastContent = response.choices[0].message.content
const lastUsage = response.usage

// Validate and store recommendations
const validated = validateResponse(lastContent)

// Track API usage - use OpenRouter's cost directly
const { error: usageError } = await supabase.from('coach_api_usage').insert({
  user_id: userId,
  prompt_tokens: lastUsage.prompt_tokens,
  completion_tokens: lastUsage.completion_tokens,
  total_tokens: lastUsage.total_tokens,
  cost_usd: lastUsage.cost || 0,  // Use OpenRouter's cost
  model,
  endpoint: 'openrouter-coach',
  time_window_start: new Date().toISOString(),
})

// Also update model in error handling paths (fallback and error cases)
await supabase.from('coach_api_usage').insert({
  user_id: userId,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  cost_usd: 0,
  model,  // Use configured model
  endpoint: 'openrouter-coach',
  time_window_start: new Date().toISOString(),
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded model ID in API calls | Configurable via OPENROUTER_MODEL env var | Phase 22 (this phase) | Enables easy model switching without code changes |
| Internal cost calculation (calculateCost) | Use OpenRouter's usage.cost field | Phase 22 (this phase) | More accurate cost tracking, no maintenance for pricing changes |
| No cost tracking in chat endpoint | Track usage in coach_api_usage | Phase 22 (this phase) | Complete usage visibility across all endpoints |

**Deprecated/outdated:**
- `calculateCost()` function: Should be removed entirely in favor of `usage.cost`
- Hardcoded model strings: Replace with `Deno.env.get('OPENROUTER_MODEL')`
- Cost calculation based on fixed pricing: Unnecessary with OpenRouter's provided cost

## Open Questions

### 1. **OpenRouter usage.cost Field Verification**

**What we know:**
- CONTEXT.md mentions OpenRouter provides `usage.cost` field
- Example format: `{ usage: { cost: 0.95, prompt_tokens: 194, completion_tokens: 2, total_tokens: 196 } }`

**What's unclear:**
- Could not verify from official OpenRouter documentation (docs.openrouter.ai returned 404)
- Unknown if usage.cost is available in streaming responses
- Unclear if `include_usage` parameter exists (mentioned in CONTEXT.md but unverified)

**Recommendation:**
- Test with actual API calls to verify usage.cost field presence
- Check if `include_usage: true` parameter is needed
- Implement defensive coding: `cost_usd: lastUsage.cost || 0`

### 2. **SSE Streaming Usage Data Access**

**What we know:**
- openrouter-chat uses SSE streaming with `@microsoft/fetch-event-source`
- Usage data is typically available after stream completes

**What's unclear:**
- Exact pattern for accessing usage data from streaming response with OpenAI SDK
- Whether usage comes in final chunk or requires separate API call
- Type safety for usage data in streaming context

**Recommendation:**
- Use type assertion `const finalUsage: any = response.usage` as fallback
- Test with actual streaming requests to verify usage data availability
- Consider adding a separate non-streaming usage query if needed

### 3. **Model ID Validation**

**What we know:**
- Model IDs follow format: `provider/model-name` (e.g., "google/gemini-2.5-pro")
- Invalid model IDs return API errors

**What's unclear:**
- Should we validate model ID format in Edge Function before API call?
- Should we provide a default fallback or fail fast?
- Where to document valid model IDs?

**Recommendation:**
- Fail fast on missing OPENROUTER_MODEL (already in CONTEXT.md as Claude's Discretion)
- Pass through to OpenRouter for validation (let API validate model ID)
- Document format in .env.example: "OpenRouter model ID (e.g., google/gemini-2.5-pro, anthropic/claude-3.5-sonnet)"

### 4. **include_usage Parameter**

**What we know:**
- CONTEXT.md mentions "Always enable `include_usage: true` in all OpenRouter API calls"
- This is standard OpenAI API pattern for getting usage data

**What's unclear:**
- Could not verify this parameter exists in OpenRouter API
- May not be needed with OpenAI SDK (might include usage by default)
- Unclear if it affects streaming responses

**Recommendation:**
- Test with and without `include_usage: true` to verify effect
- Check OpenAI SDK documentation for default behavior
- Add to API call if testing shows it's needed, otherwise omit

## Implementation Locations

### Files to Modify

1. **/workspace/supabase/functions/openrouter-chat/index.ts**
   - Line 6-12: Add OPENROUTER_MODEL to requiredEnvVars
   - Line 16-17: Add `const model = Deno.env.get('OPENROUTER_MODEL')!`
   - Line 173: Change `model: 'google/gemini-2.5-pro'` to `model`
   - Line 193-203: Add usage tracking after stream completes

2. **/workspace/supabase/functions/openrouter-coach/index.ts**
   - Line 8-14: Add OPENROUTER_MODEL to requiredEnvVars
   - Line 18-19: Add `const model = Deno.env.get('OPENROUTER_MODEL')!`
   - Line 289-294: Remove `calculateCost()` function
   - Line 384: Change `model: 'google/gemini-2.5-pro'` to `model`
   - Line 405: Change `const costUsd = calculateCost(lastUsage)` to `const costUsd = lastUsage.cost || 0`
   - Line 428, 482, 525: Change `model: 'google/gemini-2.5-pro'` to `model` (3 error paths)

3. **/workspace/src/services/coach.ts**
   - Line 188-212: Remove `calculateCost()` function
   - Line 190: Change `const cost_usd = isError ? 0 : calculateCost(usage)` to use passed cost
   - Update trackApiUsage signature to accept cost_usd parameter

4. **/workspace/.env.example**
   - Add comment documenting OPENROUTER_MODEL environment variable

### Files to Verify (No changes needed)

- /workspace/src/types/index.ts: coach_api_usage already has model column (line 149)
- /workspace/supabase/migrations/20260117_create_coach_tables.sql: Table schema is correct

## Sources

### Primary (HIGH confidence)

**Edge Function Environment Variables:**
- Supabase CLI Reference - Verified `supabase secrets` commands for managing env vars
  - `supabase secrets set <NAME=VALUE> ...`
  - `supabase secrets list`
  - `supabase secrets unset [NAME] ...`

**Codebase Analysis (Direct Observation):**
- /workspace/supabase/functions/openrouter-chat/index.ts - Current implementation (HIGH confidence)
- /workspace/supabase/functions/openrouter-coach/index.ts - Current implementation (HIGH confidence)
- /workspace/src/services/coach.ts - Current cost tracking logic (HIGH confidence)
- /workspace/supabase/migrations/20260117_create_coach_tables.sql - Table schema (HIGH confidence)

### Secondary (MEDIUM confidence)

**OpenRouter SDK:**
- @openrouter/sdk npm package (v0.3.15) - TypeScript SDK exists for OpenRouter API
  - Homepage: https://github.com/OpenRouterTeam/typescript-sdk
  - Provides type-safe toolkit for 300+ models

**Streaming Libraries:**
- @microsoft/fetch-event-source (v2.0.1) - Already in use for SSE streaming (Phase 21)

**OpenAI SDK with OpenRouter:**
- Using `npm:openai@4` with `baseURL: 'https://openrouter.ai/api/v1'` pattern already established in code

### Tertiary (LOW confidence - marked for validation)

**OpenRouter usage.cost Field:**
- CONTEXT.md (Phase 22) mentions usage.cost field exists in OpenRouter responses
- Example format: `{ usage: { cost: 0.95, prompt_tokens: 194, completion_tokens: 2, total_tokens: 196 } }`
- Could not verify from official docs (docs.openrouter.ai returned 404)
- Recommendation: Test with actual API calls to confirm

**include_usage Parameter:**
- CONTEXT.md (Phase 22) mentions enabling `include_usage: true` in API calls
- Could not verify this parameter exists in OpenRouter API
- May not be needed with OpenAI SDK (might include usage by default)
- Recommendation: Test with and without to verify necessity

**Streaming Usage Data:**
- Assumption based on OpenAI SDK behavior that usage data is available after stream completes
- Unknown exact pattern for accessing usage from streaming response
- Recommendation: Test with actual streaming requests

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from codebase and npm packages
- Architecture patterns: HIGH - Based on existing code patterns and Deno runtime
- Pitfalls: MEDIUM - Most identified from code analysis, streaming usage is LOW confidence
- Environment variable handling: HIGH - Supabase CLI docs verify commands
- OpenRouter usage.cost: LOW - Mentioned in CONTEXT.md but unverified from official docs

**Research date:** 2026-01-19
**Valid until:** 7 days (OpenRouter API is relatively stable but docs accessibility is unreliable)

**Notes:**
- Official OpenRouter documentation (openrouter.ai/docs) was not accessible during research (404 errors)
- Findings based on codebase analysis, npm packages, and CONTEXT.md specifications
- Recommend testing OpenRouter API directly to verify usage.cost field and include_usage parameter behavior
- Defensive coding approach recommended for unverified aspects (use `|| 0` fallbacks, type assertions where needed)
