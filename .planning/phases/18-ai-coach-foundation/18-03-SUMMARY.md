---
phase: 18-ai-coach-foundation
plan: 03
subsystem: api
tags: [supabase, edge-functions, llm, cost-tracking, rate-limiting]

# Dependency graph
requires:
  - phase: 18-ai-coach-foundation
    provides: [database schema for coach tables, pattern extraction service, data anonymization utilities]
provides:
  - Coach service with LLM API abstraction layer
  - Rate limiting (50k tokens/day per user)
  - API usage tracking with cost calculation
  - Edge Function integration stub
affects: [20-llm-integration, 21-chat-interface]

# Tech tracking
tech-stack:
  added: [supabase edge functions, openrouter pricing model]
  patterns: [cost tracking internal helpers, rate limiting via database queries, data anonymization before API calls]

key-files:
  created: [src/services/coach.ts]
  modified: []

key-decisions:
  - "calculateCost() called internally in trackApiUsage() - not exposed externally"
  - "Failed API calls still tracked with cost=0 for monitoring"
  - "Rate limit: 50k tokens per 24 hours per user"

patterns-established:
  - "Pattern: Service layer exports query keys for TanStack Query"
  - "Pattern: Rate limiting queries database for last 24h usage"
  - "Pattern: Cost tracking uses internal helper, not external parameter"

# Metrics
duration: 2min
completed: 2026-01-17
---

# Phase 18 Plan 3: Coach Service with API Abstraction Summary

**LLM API service abstraction with rate limiting (50k tokens/day), cost tracking via calculateCost() helper, and Edge Function integration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-17T21:11:20Z
- **Completed:** 2026-01-17T21:12:53Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created coach service with complete API abstraction for LLM recommendations
- Implemented rate limiting checking 50k token daily limit per user
- Built cost tracking system with internal calculateCost() helper for gpt-4o-mini pricing
- Added Edge Function integration stub ready for Phase 20 implementation
- Enforced data anonymization before all external API calls

## Task Commits

Each task was committed atomically:

1. **Task 1: Create coach service with API abstraction** - `6e90115` (feat)

**Plan metadata:** [to be added]

## Files Created/Modified

- `src/services/coach.ts` - Complete LLM API service with rate limiting, cost tracking, and Edge Function integration

## Decisions Made

- calculateCost() is called internally in trackApiUsage() instead of accepting cost_usd as parameter - prevents duplicate cost calculation and ensures pricing logic is centralized
- Failed API calls still tracked with cost=0 to maintain monitoring visibility even when things break
- Rate limit of 50k tokens/day balances user utility with cost control ($0.15/1M prompt + $0.60/1M completion)

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None - no external service authentication required during this plan execution.

## Issues Encountered

None - implementation proceeded smoothly with all verification checks passing.

## User Setup Required

None - this plan built service layer foundation only. External service (OpenRouter) setup will be documented in Phase 20.

## Next Phase Readiness

- Coach service fully implemented and type-checked
- Rate limiting and cost tracking infrastructure in place
- Edge Function call structure defined (stub will be implemented in Phase 20)
- Ready for Phase 20 LLM integration implementation

---
*Phase: 18-ai-coach-foundation*
*Plan: 03*
*Completed: 2026-01-17*
