# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-17)

**Core value:** Quick, frictionless climb logging
**Current focus:** Phase 21: Chat Interface

## Current Position

Phase: 21 of 21 (Chat Interface)
Plan: 5 of 5 in current phase
Status: Phase complete
Last activity: 2026-01-19 — Completed Phase 21-05: Loading States and Error Handling

Progress: [████████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 49 (v1.0 + v1.1 + v2.0 phase 18-21)
- Average duration: 9 min
- Total execution time: 7.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-04 (v1.0) | 6 | 93 min | 16 min |
| 05-17 (v1.1) | 19 | 147 min | 8 min |
| 18 (AI Coach) | 6 | 40 min | 7 min |
| 19 (Coach UI) | 8 | 19 min | 2 min |
| 20 (LLM Integration) | 3 | 18 min | 6 min |
| 21 (Chat Interface) | 5 | 33 min | 7 min |

**Recent Trend:**
- Last 5 plans: 9 min
- Trend: Steady

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 18-01: Used JSONB for recommendation content to support schema evolution
- Phase 18-01: Added separate columns (generation_date, time_window_start) for frequently queried fields
- Phase 18-01: Created GIN indexes on JSONB columns using jsonb_path_ops operator class
- Phase 18-01: Followed existing climbs table migration pattern for consistency
- Phase 18-02: Filter styles with <3 attempts to avoid noise from insufficient data
- Phase 18-02: Use ISO 8601 week numbering for consistent week calculation across timezones
- Phase 18-02: Group climbs by day to approximate session count (simpler than explicit session tracking)
- Phase 18-02: Normalize grades across Font/V-Scale/Color scales to 1-100 for comparison
- Phase 18-02: Return empty patterns object when no climbs exist (no crashes)
- Phase 18-03: calculateCost() called internally in trackApiUsage() instead of accepting cost_usd as parameter
- Phase 18-03: Failed API calls still tracked with cost=0 for monitoring visibility
- Phase 18-03: Rate limit of 50k tokens/day per user balances utility with cost control
- Phase 18-04: Anonymize data at the source before any external API calls
- Phase 18-04: Map specific gym/crag names to generic "indoor_gym" or "outdoor_crags"
- Phase 18-04: Add validateAnonymizedData() for runtime PII detection as defensive programming
- Phase 18-05: 24h stale time for recommendations enables offline support
- Phase 18-05: 5min stale time for rate limit balances freshness with API efficiency
- Phase 18-05: 1h stale time for chat messages - infrequent refresh is acceptable
- Phase 18: Database schema for coach tables with JSONB flexibility
- Phase 18: Cost tracking and rate limiting implemented from day one
- Phase 19: UI built with mock data before LLM integration for faster iteration
- Phase 19-01: usePatternAnalysis hook with 24h cache for consistency with recommendations
- Phase 19-02: Used Radix UI Tabs for accessible, keyboard-navigable tab switching
- Phase 19-02: Integrated user profile preferences (discipline, grade scale) for recommendation generation input
- Phase 19-05: Enhanced documentation for caching behavior to clarify offline support and cache retention
- Phase 19-06: Stub route for /coach/chat uses simple placeholder div to establish navigation structure before Phase 21 implementation
- Phase 20-01: Used OpenAI SDK with baseURL override for OpenRouter API compatibility
- Phase 20-01: Implemented JWT validation using supabase.auth.getUser() pattern in Edge Function
- Phase 20-01: Built template-based prompt system with pattern analysis data injection
- Phase 20-01: Requested JSON output format from LLM for structured parsing (response_format: { type: 'json_object' })
- Phase 20-01: Set temperature 0.6 to balance creativity with reliability for drill suggestions
- Phase 20-01: Used climbing-specific technical terminology (hangboard, campus board, antagonistic training) for domain expertise
- Phase 20-02: Retry up to 3 times for LLM response validation failures with MAX_RETRIES constant
- Phase 20-02: Strip markdown code blocks before JSON parsing using cleanResponse() function
- Phase 20-02: Validate all drill fields including minimum 20 character descriptions and 1-10 set range
- Phase 20-02: Store failed requests with error_message and cost=0 for monitoring visibility
- Phase 20-02: Database errors logged but don't fail request (graceful degradation pattern)
- Phase 20-03: Fetch cached recommendations before API calls for graceful fallback on failure
- Phase 20-03: Privacy validation before LLM call prevents PII leakage to external APIs
- Phase 20-03: Client coach.ts now calls 'openrouter-coach' instead of incorrect 'generate-recommendations'
- Phase 20-03: Response format includes is_cached flag for UI handling of cached data
- Phase 21-01: SSE streaming chosen over WebSocket for one-way server-to-client streaming (simpler, built-in reconnection, HTTP-based)
- Phase 21-01: Message history limit of 20 balances context relevance with token usage
- Phase 21-01: User message stored before LLM call, assistant message stored after streaming completes (non-blocking on storage errors)
- Phase 21-01: System prompt module in _shared for reusability and centralized maintenance
- Phase 21-02: Used @microsoft/fetch-event-source instead of native EventSource for SSE (supports POST, custom headers, abort signals)
- Phase 21-02: Used hasErrorRef to track errors across async callbacks (onmessage, onclose, onerror)
- Phase 21-02: AbortController stored in ref for cleanup on unmount and manual abort
- Phase 21-02: useStreamingChat hook provides streaming state management and message persistence for React chat UI
- Phase 21-03: Inline MessageBubble and TypingIndicator components within chat-page.tsx for self-contained chat interface
- Phase 21-03: Mobile auto-focus on textarea mount to reduce friction on mobile devices
- Phase 21-03: Auto-scroll behavior triggered on both messages and streamingResponse changes
- Phase 21-03: Empty message state displays friendly prompt rather than blank screen
- Phase 21-05: Used skeleton UI with pulsing animation for loading state instead of simple text
- Phase 21-05: Added Brain icon to empty state and typing indicator for visual consistency
- Phase 21-05: Exported setError from useStreamingChat hook to allow manual error clearing for retry
- Phase 21-05: Added lastMessage state to track the most recent sent message for retry
- Phase 21-05: Used opacity-50 and cursor-not-allowed for disabled visual feedback
- Phase 21-05: Added transition-all duration-200 for smooth UI changes
- Phase 21-05: Added shadow-lg to message bubbles for depth
- Phase 21-05: Used explicit boolean checks (isStreaming === true, length > 0) to satisfy ESLint

### Pending Todos

None yet.

### Blockers/Concerns

- **Supabase CLI authentication:** User must run `npx supabase login` and `npx supabase db push` to apply coach tables migration
- **Edge Function deployment:** User must run `npx supabase functions deploy openrouter-chat` to deploy new Edge Function
- **OpenRouter API key required:** User must configure OPENROUTER_API_KEY in Supabase Dashboard before Edge Function works (documented in 20-01 SUMMARY)

### Roadmap Evolution

- Phase 22 added: OpenRouter model configuration via environment variables
- Phase 23 added: Refocus coach on technique (review system prompt and data passed to coach)

## Session Continuity

Last session: 2026-01-19
Stopped at: Completed Phase 21-05: Loading States and Error Handling
Resume file: None
