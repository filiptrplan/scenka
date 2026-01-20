# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Quick, frictionless climb logging
**Current focus:** Planning next milestone

## Current Position

Phase: Next phase not started
Plan: Not started
Status: Ready to plan
Last activity: 2026-01-20 — v2.0 milestone complete

Progress: [██████████] 100% (67/67 plans complete) - v2.0 shipped

## Performance Metrics

**Velocity:**
- Total plans completed: 67 (v1.0 + v1.1 + v2.0 phase 18-29)
- Average duration: 9 min
- Total execution time: 10.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-04 (v1.0) | 6 | 93 min | 16 min |
| 05-17 (v1.1) | 19 | 147 min | 8 min |
| 18 (AI Coach) | 6 | 40 min | 7 min |
| 19 (Coach UI) | 8 | 19 min | 2 min |
| 20 (LLM Integration) | 3 | 18 min | 6 min |
| 21 (Chat Interface) | 5 | 33 min | 7 min |
| 22 (OpenRouter Config) | 1 | 5 min | 5 min |
| 23 (Refocus Coach) | 7 | 20 min | 3 min |
| 24 (Projecting Focus) | 3 | 17 min | 6 min |
| 25 (User Context) | 4 | 17 min | 4 min |
| 26 (README Update) | 1 | 2 min | 2 min |
| 27 (Daily Limit) | 6 | 11 min | 2 min |
| 28 (Chat System Prompt) | 1 | 8 min | 8 min |
| 29 (Markdown Rendering) | 3 | 6 min | 2 min |

**Recent Trend:**
- Last 5 plans: 3 min
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
- Phase 23-01: AnonymizedClimb type extended with notes and date fields for LLM context
- Phase 23-01: Privacy validation added to check notes field for PII (>200 char threshold)
- Phase 23-02: Refactored system prompt to technique-first coaching philosophy (strength failures = technique gaps)
- Phase 23-02: Added specific strength-to-technique reframing for pumped, finger strength, core, power failures
- Phase 23-02: Replaced strength terminology with technique drills (movement, positioning, efficiency, footwork, body positioning)
- Phase 23-02: Added measurable_outcome field validation (min 10 chars) to drill schema for progress tracking
- Phase 23-02: No schema migration needed - JSONB content storage supports field addition seamlessly
- Phase 23-03: Added extractRecentClimbs function to fetch last 30 climbs for LLM context (30 limit balances context with token usage)
- Phase 23-03: Reuses existing anonymization utility from Phase 18-04 for privacy protection
- Phase 23-03: Returns empty array for no climbs (graceful degradation pattern)
- Phase 23-04: Fetch recent climbs after pattern extraction in generateRecommendations (sequential execution maintains existing pattern extraction logic)
- Phase 23-04: Include recent_climbs in Edge Function request body alongside patterns_data and user_preferences
- Phase 23-04: Added explicit type annotation for recentClimbs variable (AnonymizedClimb[]) to eliminate "unused import" warning
- Phase 23-04: No schema changes required - recent_climbs passed as request body field, JSONB supports schema evolution
- Phase 23-05: Added AnonymizedClimb interface to Edge Function matching client-side type from src/types/index.ts
- Phase 23-05: Made recent_climbs optional in RequestBody for backward compatibility with older clients
- Phase 23-05: Used compact JSON formatting (null indentation) in "Recent Climb History" section to minimize token usage
- Phase 23-05: Added conditional check to only include "Recent Climb History" section when recentClimbs exists and has data
- Phase 23-07: Updated example output to technique-focused drill (Silent Feet Ladder) aligning with system prompt philosophy
- Phase 23-07: Added measurable_outcome field to example output (was missing in old example)
- Phase 23-07: Changed weekly_focus from strength to technique emphasis (footwork and body positioning)
- Phase 23-07: Replaced hangboard protocol drill with silent feet drill for movement pattern training
- Phase 22-01: Used OPENROUTER_MODEL env var for both chat and coach Edge Functions (single shared configuration)
- Phase 22-01: Removed calculateCost() functions in favor of OpenRouter's provided usage.cost field
- Phase 22-01: Track usage data in openrouter-chat after streaming completes (not during)
- Phase 22-01: Keep calculateCost in client service for backward compatibility (unused but prevents breakage)
- Phase 24-01: Qualitative grade guidance only (e.g., 'slightly above max grade') rather than specific grade ranges
- Phase 24-01: Gym limitation awareness in focus recommendations (crimpy overhangs common, dynos with toe hooks rare)
- Phase 24-01: 3-4 focus areas to give users options rather than single recommendation
- Phase 24-01: Base recommendations primarily on style weaknesses from pattern analysis
- Phase 24-01: No schema migration needed - JSONB content storage supports projecting_focus field addition
- Phase 24-03: Added CoachRecommendation interface in useCoach.ts with projecting_focus field for type-safe UI display
- Phase 24-03: Removed as any casts from Weekly Focus and Drills sections by using proper types
- Phase 24-03: Purple divider color for Projecting Focus section matching "Recent Successes" in Pattern Analysis tab
- Phase 25-01: Nullable column (TEXT) for climbing context to support existing users without migration
- Phase 25-01: 2000 character limit enforced via database check constraint for data consistency
- Phase 25-01: Database comment added for documentation of field purpose
- Phase 25-02: Optional climbing_context field in profileSchema to avoid requiring existing users to fill it in immediately
- Phase 25-02: 2000 character limit follows ChatGPT's 1500-char precedent with more flexibility
- Phase 25-02: Explicit PII warning in help text to prevent PII leakage to OpenRouter API
- Phase 25-02: Real-time character count via React Hook Form watch() for live updates
- Phase 25-02: Used nullish coalescing (??) instead of logical or (||) for character count to satisfy ESLint
- Phase 25-03: Sequential profile fetch placed after pattern extraction to maintain existing execution pattern
- Phase 25-03: Optional chaining (profile?.climbing_context) allows null/undefined for profiles without context
- Phase 25-04: Optional context parameter pattern for backward compatibility (climbingContext?: string | null)
- Phase 25-04: Null-coalescing for safety (profile?.climbing_context ?? null) to ensure proper null handling
- Phase 25-04: Climbing context integrated into system prompt after User Profile section and before footer instruction
- Phase 26-01: Added TODO comments for screenshot capture to avoid broken image links
- Phase 26-01: Used code blocks for bash commands (supabase secrets set, supabase functions deploy)
- Phase 26-01: Placed AI Coach section after "What Makes Scenka Different" and before "Tech Stack"
- Phase 26-01: Placed Upgrade section after Development Notes, Technical Details section at end
- Phase 26-01: Included all migration file references for developer access
- Phase 26-01: Listed 4 tables including profiles.climbing_context in schema section
- Phase 26-01: Described 5-step privacy architecture data flow
- Phase 27-01: Used separate rec_count and chat_count columns (not JSONB) for simpler queries and check constraints
- Phase 27-01: Atomic reset and increment pattern with CASE statement handles both reset and increment in one operation
- Phase 27-01: RLS policy with SELECT only (no INSERT/UPDATE) because Edge Functions use RPC functions with elevated permissions
- Phase 27-01: PostgreSQL CURRENT_DATE returns UTC date on Supabase servers (no explicit timezone handling needed)
- Phase 27-03: Check limit before increment and API call to prevent expensive LLM operations for blocked requests
- Phase 27-03: Atomic increment via RPC function before any message storage or API calls
- Phase 27-03: Client-side effectiveCount calculation handles day reset case before RPC function executes
- Phase 27-03: Time until reset calculation shows user-friendly messages for UTC midnight reset
- Phase 27-04: staleTime: 0 ensures fresh data on every fetch for accurate limit display
- Phase 27-04: 30-second gcTime provides performance benefit for rapid successive fetches
- Phase 27-04: maybeSingle() handles users without limits row gracefully (returns null instead of error)
- Phase 27-04: Invalidation in useCreateCoachMessage ensures counter refreshes after every chat message
- Phase 27-05: Simple text counter display ("1/2 used today") instead of progress bar as specified in CONTEXT.md
- Phase 27-05: Inline error message used instead of tooltip because shadcn/ui Tooltip doesn't work on disabled elements
- Phase 27-05: Counter refresh via query invalidation pattern (staleTime: 0 + invalidation on success) ensures fresh data
- Phase 27-05: Button disabled state uses `isRecAtLimit` alongside existing `isPending` check
- Phase 27-05: Same counter and error pattern applied to both Generate (empty state) and Regenerate (existing state) buttons
- Phase 27-06: Simple text counter display ("5/10 used today") for chat messages matches recommendation counter pattern
- Phase 27-06: Client-side limit check in handleSend provides immediate feedback via toast notification before server enforcement
- Phase 27-06: Inline error message when at limit shows time until reset via getTimeUntilNextReset helper
- Phase 27-06: whitespace-nowrap on counter text prevents wrapping on small screens
- Phase 27-06: Explicit boolean check (isChatAtLimit === true) for ESLint compliance with strict-boolean-expressions rule
- Phase 28-01: Exported Drill, ProjectingFocus, RecommendationsContent, and RecommendationsData interfaces to enable Edge Function import
- Phase 28-01: Used formatRecommendationsForLLM helper to structure recommendations with clear headers (Weekly Focus, Drills, Projecting Focus Areas)
- Phase 28-01: Concept-first format: 'What to work on: [description]' before drill name in drill sections
- Phase 28-01: Conditional recommendations section only added if recommendations.content exists (graceful degradation)
- Phase 28-01: fetchRecommendationsIfMissing checks body.recommendations first before database query (client-optimized)
- Phase 28-01: Added logging for recommendation fetch status ('Recommendations found' / 'No recommendations available')
- Phase 28-01: useCoachRecommendations hook leverages existing 24h TanStack Query cache (minimal refetch overhead)
- Phase 29-01: Used npm instead of pnpm for package installation (pnpm not available in environment)
- Phase 29-01: Renamed markdown-components.ts to markdown-components.tsx for JSX syntax support
- Phase 29-01: Code block detection via className presence (rehype-highlight adds language-specific classes)
- Phase 29-01: Dark-themed components match app's color system (#09090b background, white/gray text)
- Phase 29-02: Conditional markdown rendering only for assistant messages (user messages remain plain text)
- Phase 29-02: User expectation: "what you type is what you see" - avoid markdown interpretation for user input
- Phase 29-03: rehypeHighlight plugin added to remarkPlugins array for syntax coloring (after remarkGfm for proper composition)
- Phase 29-03: github-dark.css theme imported for syntax highlighting (matches app's dark theme)

### Pending Todos

None yet.

### Blockers/Concerns

- **Edge Function deployment (UPDATED):** User must run `supabase functions deploy openrouter-chat` to deploy updated system prompt with recommendations support (after Phase 28-01). Also run `supabase functions deploy openrouter-coach` for projecting focus (if not already deployed)
- **OPENROUTER_MODEL required:** User must set OPENROUTER_MODEL environment variable via `supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro` (documented in 22-01 SUMMARY)
- **OpenRouter API key required:** User must configure OPENROUTER_API_KEY in Supabase Dashboard before Edge Function works (documented in 20-01 SUMMARY)
- **Database migration required:** User must run `npx supabase db push` to apply climbing_context migration to profiles table (documented in 25-01 SUMMARY)
- **Screenshots need capture:** README includes TODO comments for screenshot capture that need to be fulfilled (coach page, chat page)

### Roadmap Evolution

- Phase 22 added: OpenRouter model configuration via environment variables
- Phase 23 added: Refocus coach on technique (review system prompt and data passed to coach)
- Phase 24 added: Projecting focus recommendations to help users select boulders to project on each week
- Phase 25 added: User climbing context for prompts (allow users to describe what kind of climber they are)
- Phase 26 added: Update README with the work done in this milestone
- Phase 27 added: Impose daily limit of 2 recommendation generations and 10 chat messages per day
- Phase 28 added: Rework chat system prompt and data context (include latest recommendations in chatbot context)
- Phase 29 added: Add markdown rendering to chat bubbles for better formatted responses

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed Phase 29-03: Wire Up rehype-highlight for Syntax Highlighting
Status: Project complete (67/67 plans finished)
Resume file: None
