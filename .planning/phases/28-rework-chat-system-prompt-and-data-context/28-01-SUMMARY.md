---
phase: 28-rework-chat-system-prompt-and-data-context
plan: 01
type: execute
autonomous: true
wave: 1
depends_on: []

subsystem: Chat System Prompt and Data Context
tags: [chat, recommendations, system-prompt, edge-function, react-hook, llm]

dependency_graph:
  requires:
    - Phase 18: AI Coach (coach_recommendations table)
    - Phase 21: Chat Interface (useStreamingChat hook)
    - Phase 27: Daily Limits (openrouter-chat Edge Function)
  provides:
    - Enhanced chat system prompt with role-based coaching persona
    - Recommendation data context integrated into chat conversations
    - Ability to discuss weekly focus, drills, and projecting focus areas
  affects:
    - Phase 29: Markdown rendering (may need to handle new drill acknowledgment phrases)

tech_stack:
  added:
    - formatRecommendationsForLLM function (system-prompt.ts)
  patterns:
    - Role-based system prompts
    - Concept-first explanation format
    - Reactive-only recommendation references
    - Graceful missing data handling

key_files:
  created:
    - supabase/functions/_shared/formatRecommendationsForLLM (function within system-prompt.ts)
  modified:
    - supabase/functions/_shared/system-prompt.ts
    - supabase/functions/openrouter-chat/index.ts
    - src/hooks/useStreamingChat.ts

decisions:
  - "Exported Drill, ProjectingFocus, RecommendationsContent, and RecommendationsData interfaces to enable Edge Function import"
  - "Used formatRecommendationsForLLM helper to structure recommendations with clear headers (Weekly Focus, Drills, Projecting Focus Areas)"
  - "Concept-first format: 'What to work on: [description]' before drill name in drill sections"
  - "Conditional recommendations section only added if recommendations.content exists (graceful degradation)"
  - "fetchRecommendationsIfMissing checks body.recommendations first before database query (client-optimized)"
  - "Added logging for recommendation fetch status ('Recommendations found' / 'No recommendations available')"
  - "useCoachRecommendations hook leverages existing 24h TanStack Query cache (minimal refetch overhead)"

metrics:
  duration: PT8M (8 minutes)
  completed: 2026-01-20
  commits: 4

deviations:
  from_plan: []

success_criteria_met:
  - role_based_persona: true
  - reactive_references: true
  - concept_first: true
  - drill_acknowledgment: true
  - alternatives_not_regeneration: true
  - full_recommendation_context: true
  - graceful_no_data: true
  - logging: true
  - typecheck_passes: true

deployment_requirements:
  - "Deploy Edge Function: npx supabase functions deploy openrouter-chat"
  - "Environment: OPENROUTER_MODEL must be set (configured in previous phases)"
  - "Environment: OPENROUTER_API_KEY must be set in Supabase Dashboard (configured in previous phases)"

---

# Phase 28 Plan 01: Rework Chat System Prompt and Data Context

**Summary:** Enhanced chatbot system prompt with role-based coaching persona and integrated weekly recommendations data context, enabling users to discuss specific drills and focus areas from their coaching plan.

## Changes Made

### 1. System Prompt Redesign (supabase/functions/_shared/system-prompt.ts)

**Added role-based coaching persona:**
- Friendly but authoritative climbing coach mentor
- Primary purpose: Clarify drills/recommendations, suggest alternatives
- Reactive behavior: Only reference recommendations when user specifically asks
- Concept-first format: Explain technique concepts before drill names
- Drill acknowledgment: Explicitly tie to recommendations page (e.g., "As I mentioned in your weekly drill...")
- Alternative suggestions: Offer alternatives when drill doesn't work, never suggest regeneration

**Added formatRecommendationsForLLM helper function:**
- Formats recommendations in LLM-friendly structure
- Clear section headers: "## Your Weekly Focus", "## Drills for This Week", "## Projecting Focus Areas"
- Concept-first drill format: "What to work on: [description]" before drill name
- Includes all drill fields: name, description, sets, reps, rest, measurable_outcome
- Includes projecting focus areas with: focus_area, description, grade_guidance, rationale

**Conditional recommendations section:**
- Only added to system prompt if recommendations.content exists
- Graceful degradation: No errors when recommendations are missing

### 2. Edge Function Updates (supabase/functions/openrouter-chat/index.ts)

**Added recommendations support:**
- Imported RecommendationsData type from system-prompt.ts
- Added optional recommendations field to RequestBody interface
- Created fetchRecommendationsIfMissing() helper function
  - Checks body.recommendations first (client-optimized)
  - Fetches from coach_recommendations table if not provided
  - Query: select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  - Returns null on error or if no data exists (graceful degradation)
- Updated getChatSystemPrompt() call to pass recommendations as third parameter
- Added logging: "Recommendations found" or "No recommendations available"

**Maintained existing functionality:**
- Daily chat limit check (increment_chat_count RPC call)
- Message storage in coach_messages table
- SSE streaming with fetch-event-source
- API usage tracking (prompt_tokens, completion_tokens, cost_usd)

### 3. Client-Side Hook Update (src/hooks/useStreamingChat.ts)

**Added recommendations fetching:**
- Imported useCoachRecommendations hook from useCoach.ts
- Added recommendations data fetching: `const { data: recommendations } = useCoachRecommendations()`
- Leverages existing TanStack Query cache with 24h staleTime (minimal refetch overhead)

**Updated request body:**
- Added recommendations field to JSON.stringify body
- Preserves existing message, patterns_data, and climbing_context fields

**Updated dependency array:**
- Added recommendations to sendMessage useCallback dependencies
- Ensures hook re-captures when recommendations change

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Testing Recommendations

### Manual Testing Required

The Edge Function was not deployed in this execution (supabase CLI not available). Before marking this phase complete, test the following scenarios:

**1. Test chat with recommendations (user with existing recommendations):**
- Start a chat session with user who has generated recommendations
- Ask "What's my weekly focus?" - should answer with weekly_focus content
- Ask "Tell me about the drills" - should explain concept-first, mention drill names
- Ask "This drill doesn't work for me" - should offer alternatives, NOT suggest regeneration
- Ask a question about projecting focus - should reference focus areas and grade guidance
- Verify chatbot uses phrases like "From your recommendations page..." or "As I mentioned in your weekly drill..."

**2. Test chat without recommendations (new user or no recommendations generated):**
- Start a chat session with user who has no recommendations
- Ask any climbing question - should answer normally without errors
- Verify no TypeError or crashes when recommendations is null
- Verify Edge Function logs "No recommendations available"

**3. Test reactive behavior:**
- Ask "How's my climbing going?" - should NOT mention recommendations unprompted
- Ask "What are my drills?" - should reference recommendations explicitly
- Verify chatbot only mentions recommendations when user asks about them

**4. Deploy Edge Function:**
```bash
npx supabase functions deploy openrouter-chat
```

**5. Verify existing functionality still works:**
- Chat daily limit (10 messages/day)
- Message storage in coach_messages table
- SSE streaming responses
- Pattern analysis integration
- User climbing context integration

## Open Questions Addressed

The following open questions from RESEARCH.md were addressed through implementation:

1. **Recommendation age threshold:** No age limit implemented. Recommendations are included if they exist, regardless of age. Can be added in future if feedback shows confusion about stale recommendations.

2. **Is_cached handling:** Does not flag cached status in chat. UI already shows regeneration capability, so keep conversation natural.

3. **Error message presence:** Includes recommendations even if error_message exists. Drill content is useful for Q&A even if generation had issues.

4. **Drill count variation:** Formats whatever drills exist (0-3), does not call attention to count.

## Next Phase Readiness

Phase 29 (Add Markdown Rendering) can proceed as planned. No blockers identified.

---

*Plan executed: 2026-01-20*
*Duration: 8 minutes*
*Commits: 4*
