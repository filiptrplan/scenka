---
phase: 20-llm-integration
plan: 01
subsystem: edge-functions
tags: [supabase, edge-functions, openrouter, openai-sdk, jwt, llm]

# Dependency graph
requires:
  - phase: 19
    provides: Coach UI with pattern analysis and recommendation display
provides:
  - openrouter-coach Edge Function with OpenRouter API integration
  - JWT authentication for coach recommendations
  - Climbing-specific prompt engineering system
affects:
  - coach service (needs to update function name from 'generate-recommendations' to 'openrouter-coach')
  - UI components (will receive structured AI-generated recommendations)

# Tech tracking
tech-stack:
  added: [openai@4 (for OpenRouter API compatibility)]
  patterns: [Edge Function pattern, JWT authentication pattern, OpenRouter via OpenAI SDK pattern]

key-files:
  created:
    - supabase/functions/openrouter-coach/index.ts - Edge Function handler
  modified: []

key-decisions:
  - "Used OpenAI SDK with baseURL override for OpenRouter compatibility"
  - "Implemented JWT validation using supabase.auth.getUser() pattern"
  - "Built template-based prompt system with pattern data injection"
  - "Requested JSON output format from LLM for structured parsing"
  - "Temperature 0.6 balances creativity with reliability"

patterns-established:
  - "Pattern: Edge Function with JWT authentication and CORS support"
  - "Pattern: Template-based prompt construction with context injection"
  - "Pattern: OpenRouter integration using OpenAI SDK with baseURL override"

# Metrics
duration: 1min
completed: 2026-01-18
---

# Phase 20-01: OpenRouter Coach Edge Function Summary

**Supabase Edge Function with OpenRouter LLM API integration, JWT authentication, and climbing-specific prompt engineering**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-18T10:32:59Z
- **Completed:** 2026-01-18T10:33:59Z
- **Tasks:** 3 (executed as single implementation)
- **Files created:** 1

## Accomplishments

### Task 1: Edge Function Handler with JWT Validation and OpenRouter SDK
- Created `supabase/functions/openrouter-coach/index.ts` (268 lines)
- Imported Supabase client and OpenAI SDK
- Initialized Supabase client with environment variables
- Configured OpenAI SDK for OpenRouter with baseURL override
- Implemented JWT token extraction from Authorization header
- Added JWT validation using `supabase.auth.getUser()` (401 on invalid)
- Parsed request body for user_id, patterns_data, user_preferences
- Added user_id verification to match authenticated user
- Implemented CORS preflight support and method validation
- Added environment variable validation at startup

### Task 2: Climbing-Specific Prompts
- Created `systemPrompt` constant with climbing coach role
- Defined JSON output structure (weekly_focus, drills array)
- Specified drill requirements (name, description, sets, reps, rest)
- Included technical climbing terminology throughout
- Created `buildUserPrompt()` function that injects pattern analysis:
  - Failure patterns (most_common_failure_reasons with reason, count, percentage)
  - Style weaknesses (struggling_styles with style, fail_rate)
  - Climbing frequency (climbs_per_month, avg_climbs_per_session)
  - Recent successes (redemption_count, grade_progression)
  - User preferences (preferred_discipline, preferred_grade_scale)
- Added example JSON structure demonstrating expected drill format

### Task 3: OpenRouter API Call with JSON Output
- Implemented OpenRouter API call using `openai/gpt-4o-mini` model
- Set temperature to 0.6 for balanced creativity/reliability
- Requested JSON output format with `response_format: { type: 'json_object' }`
- Sent both system and user messages
- Wrapped API call in try/catch with error logging
- Added JSON parsing with validation
- Returned structured response with content and usage data

## Task Commits

Each task was committed atomically:

1. **Task 1-3: Create Edge Function handler with JWT validation and OpenRouter SDK** - `96baef0` (feat)

## Files Created/Modified

### Created
- `supabase/functions/openrouter-coach/index.ts` - Complete Edge Function handler with authentication and LLM integration

## Decisions Made

1. **OpenRouter via OpenAI SDK**: Used OpenAI SDK with baseURL override (`https://openrouter.ai/api/v1`) for OpenRouter API compatibility
2. **JWT Validation Pattern**: Implemented standard Supabase Auth pattern using `supabase.auth.getUser(token)` for token validation
3. **Template-Based Prompts**: Built template-based system with data slots filled by user's pattern analysis data
4. **JSON Output Format**: Requested structured JSON output from LLM for reliable parsing and type safety
5. **Temperature 0.6**: Balanced temperature value to provide creative drill suggestions while maintaining reliability
6. **Technical Terminology**: Used climbing-specific technical terms (hangboard, campus board, antagonistic training) for domain expertise
7. **Educational Descriptions**: Required each drill to explain what it is and why it's beneficial for user engagement

## Deviations from Plan

None - plan executed exactly as written. All three tasks were implemented in a single comprehensive Edge Function file.

## Issues Encountered

None - implementation proceeded smoothly without issues.

## User Setup Required

**Critical**: User must configure OpenRouter API key in Supabase Dashboard:

1. Sign up for OpenRouter at https://openrouter.ai/
2. Generate API key from Dashboard → API Keys
3. Add `OPENROUTER_API_KEY` to Supabase Edge Functions environment variables:
   - Navigate to Supabase Dashboard → Edge Functions → Settings → Environment Variables
   - Add key `OPENROUTER_API_KEY` with your API key value

**Note**: `SUPABASE_URL` and `SB_PUBLISHABLE_KEY` should already be configured from previous phases.

## Authentication Gates

None - this plan did not require external authentication during execution. The OPENROUTER_API_KEY must be manually configured by the user in Supabase Dashboard before the Edge Function can be deployed and used.

## Next Phase Readiness

### Completed
- Edge Function `openrouter-coach` exists in supabase/functions/
- OpenRouter API client is configured with correct base URL
- JWT validation ensures only authenticated users can access recommendations
- Climbing-specific prompts include system role and user context
- API call requests JSON output format with gpt-4o-mini model

### TODOs for Next Plans
- **20-02**: Update `src/services/coach.ts` to call `openrouter-coach` function instead of `generate-recommendations`
- **20-02**: Store recommendations in `coach_recommendations` table with usage tracking
- **20-03**: Test Edge Function locally with Supabase CLI
- **20-04**: Deploy to production and verify with real data

### Blockers/Concerns
- **User Action Required**: OPENROUTER_API_KEY must be configured in Supabase Dashboard before Edge Function works
- **Function Name Mismatch**: Coach service currently calls `generate-recommendations`, needs update to `openrouter-coach` (tracked for 20-02)

---
*Phase: 20-llm-integration*
*Completed: 2026-01-18*
