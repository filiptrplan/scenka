---
phase: 22-openrouter-model-configuration
plan: 01
subsystem: api
tags: [openrouter, edge-functions, cost-tracking, environment-variables, llm]

# Dependency graph
requires:
  - phase: 21-chat-interface
    provides: Chat SSE endpoint with streaming support
provides:
  - Configurable OpenRouter model selection via OPENROUTER_MODEL environment variable
  - OpenRouter cost tracking using usage.cost field directly
  - Chat endpoint usage tracking after streaming completes
  - Coach endpoint usage tracking using OpenRouter's cost data
  - Documentation for OPENROUTER_MODEL configuration in .env.example
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Environment variable configuration in Edge Functions
    - OpenRouter usage data capture from streaming responses
    - Cost tracking using provider-supplied usage.cost field

key-files:
  created: []
  modified:
    - supabase/functions/openrouter-chat/index.ts - Added OPENROUTER_MODEL env var and usage tracking
    - supabase/functions/openrouter-coach/index.ts - Added OPENROUTER_MODEL env var, removed calculateCost
    - src/services/coach.ts - Added optional cost_usd parameter for backward compatibility
    - .env.example - Documented OPENROUTER_MODEL configuration

key-decisions:
  - "Phase 22-01: Used OPENROUTER_MODEL env var for both chat and coach Edge Functions (single shared configuration)"
  - "Phase 22-01: Removed calculateCost() functions in favor of OpenRouter's provided usage.cost field"
  - "Phase 22-01: Track usage data in openrouter-chat after streaming completes (not during)"
  - "Phase 22-01: Keep calculateCost in client service for backward compatibility (unused but prevents breakage)"

patterns-established:
  - "Pattern 1: Edge Functions read OPENROUTER_MODEL from Deno.env.get() and validate at startup"
  - "Pattern 2: Streaming responses capture usage data in final chunk for deferred tracking"
  - "Pattern 3: Cost tracking uses provider-supplied cost (usage.cost || 0) with defensive fallbacks"

# Metrics
duration: 5min
completed: 2026-01-19
---

# Phase 22 Plan 1: OpenRouter Model Configuration Summary

**Configurable OpenRouter model selection via OPENROUTER_MODEL environment variable and accurate cost tracking using provider-supplied usage.cost field**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-19T11:13:05Z
- **Completed:** 2026-01-19T11:18:05Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Both Edge Functions now read model from OPENROUTER_MODEL environment variable
- Chat endpoint tracks API usage with OpenRouter's cost data after streaming completes
- Coach endpoint uses OpenRouter's usage.cost directly instead of calculating internally
- Internal calculateCost() functions removed from Edge Functions
- Client service updated to accept optional cost_usd parameter for backward compatibility
- OPENROUTER_MODEL documented in .env.example with setup instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure OpenRouter model in openrouter-chat** - `e4c86e4` (feat)
2. **Task 2: Configure model and remove calculateCost from openrouter-coach** - `4d9bdad` (feat)
3. **Task 3: Update client service for cost tracking from Edge Function** - `4745ef9` (feat)
4. **Task 4: Document OPENROUTER_MODEL in .env.example** - `74f6b79` (docs)

## Files Created/Modified

- `supabase/functions/openrouter-chat/index.ts` - Added OPENROUTER_MODEL env var validation, model constant, finalUsage capture, usage tracking after streaming
- `supabase/functions/openrouter-coach/index.ts` - Added OPENROUTER_MODEL env var, removed calculateCost(), updated all model references to use env var
- `src/services/coach.ts` - Added optional cost_usd parameter, kept calculateCost for backward compatibility
- `.env.example` - Documented OPENROUTER_MODEL with setup instructions and example values

## Decisions Made

- Used single shared OPENROUTER_MODEL env var for both Edge Functions (simplifies configuration)
- Captured finalUsage during streaming loop and tracked after assistant message stored (prevents premature tracking before content is persisted)
- Used defensive coding (|| 0 fallbacks) for usage data since streaming responses may have uncertain availability
- Kept calculateCost() in client service for backward compatibility though Edge Functions don't use it (prevents breaking existing code paths)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

User must set OPENROUTER_MODEL environment variable via Supabase CLI:

```bash
supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro
```

Then deploy the updated Edge Functions:

```bash
supabase functions deploy openrouter-chat
supabase functions deploy openrouter-coach
```

**Note:** OPENROUTER_API_KEY must already be configured (from Phase 20).

## Next Phase Readiness

- OpenRouter model configuration complete
- Cost tracking now uses OpenRouter's accurate cost data
- Ready for future LLM-related phases
- Blockers: User must set OPENROUTER_MODEL env var and redeploy Edge Functions

---
*Phase: 22-openrouter-model-configuration*
*Completed: 2026-01-19*
