# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-17)

**Core value:** Quick, frictionless climb logging
**Current focus:** Phase 20: LLM Integration

## Current Position

Phase: 20 of 21 (LLM Integration)
Plan: 0 of 5 in current phase
Status: Ready to plan
Last activity: 2026-01-17 — Phase 19: Coach Page + Recommendations UI completed (6/6 plans, verified)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 39 (v1.0 + v1.1 + v2.0 phase 18-19)
- Average duration: 9 min
- Total execution time: 5.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-04 (v1.0) | 6 | 93 min | 16 min |
| 05-17 (v1.1) | 19 | 147 min | 8 min |
| 18 (AI Coach) | 6 | 40 min | 7 min |
| 19 (Coach UI) | 8 | 19 min | 2 min |

**Recent Trend:**
- Last 5 plans: 4 min
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

### Pending Todos

None yet.

### Blockers/Concerns

- **Supabase CLI authentication:** User must run `npx supabase login` and `npx supabase db push` to apply coach tables migration
- **Prompt engineering quality:** Climbing-specific drill knowledge needs validation during Phase 20 planning
- **Streaming implementation:** @microsoft/fetch-event-source patterns need validation during Phase 21

## Session Continuity

Last session: 2026-01-17
Stopped at: Completed Phase 19: Coach Page + Recommendations UI
Resume file: None
