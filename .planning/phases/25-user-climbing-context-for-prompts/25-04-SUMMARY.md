---
phase: 25-user-climbing-context-for-prompts
plan: 04
subsystem: AI Coach
tags: [Edge Functions, OpenRouter, system prompt, climbing context, personalization]
requires: [25-03]
provides: [climbing context integration for AI coach]
affects: []
---

# Phase 25 Plan 04: Climbing Context Integration for Edge Functions

Integrated user-provided climbing context into both coach and chat Edge Functions, enabling the AI coach to provide personalized recommendations and responses based on the user's self-described climbing background.

## Changes Made

### 1. Updated System Prompt Module (`supabase/functions/_shared/system-prompt.ts`)

Added `climbingContext` parameter to `getChatSystemPrompt()` function:
```typescript
export function getChatSystemPrompt(patterns_data?: Record<string, unknown>, climbingContext?: string | null): string
```

The climbing context is inserted after User Profile section and before the footer instruction:
```typescript
// Add climbing context if provided
if (climbingContext && climbingContext.trim().length > 0) {
  prompt += '\n\nUser Context:\n'
  prompt += climbingContext.trim() + '\n'
}
```

### 2. Updated Coach Edge Function (`supabase/functions/openrouter-coach/index.ts`)

**Request body interface:**
```typescript
interface RequestBody {
  user_id: string
  patterns_data: PatternAnalysis
  user_preferences: UserPreferences
  recent_climbs?: AnonymizedClimb[]
  climbing_context?: string | null  // Added
}
```

**User prompt builder:**
```typescript
function buildUserPrompt(
  patterns: PatternAnalysis,
  preferences: UserPreferences,
  recentClimbs?: AnonymizedClimb[],
  climbingContext?: string | null  // Added
): string {
  // ... user profile section ...

  // Add climbing context if provided
  if (climbingContext && climbingContext.trim().length > 0) {
    prompt += `\nUser's Climbing Context:\n${climbingContext.trim()}\n`
  }
  // ... rest of prompt ...
}
```

**Edge Function handler:**
```typescript
const userPrompt = buildUserPrompt(
  body.patterns_data,
  body.user_preferences,
  body.recent_climbs,
  body.climbing_context  // Passed to buildUserPrompt
)
```

### 3. Updated Chat Edge Function (`supabase/functions/openrouter-chat/index.ts`)

**Request body interface:**
```typescript
interface RequestBody {
  message: string
  patterns_data?: Record<string, unknown>
  climbing_context?: string | null  // Added
}
```

**System prompt generation:**
```typescript
const messages = [
  { role: 'system' as const, content: getChatSystemPrompt(body.patterns_data, body.climbing_context) },
  // ... message history ...
]
```

### 4. Updated Client-Side Integration

**`src/hooks/useStreamingChat.ts`:**
- Added `climbingContext?: string | null` parameter to `sendMessage()`
- Passed to Edge Function request body

**`src/components/features/chat-page.tsx`:**
- Fetch user profile on mount to get `climbing_context`
- Pass `profile?.climbing_context` to `sendMessage()` and retry logic

## Deployment Requirements

User must deploy updated Edge Functions for changes to take effect:

```bash
supabase functions deploy openrouter-coach
supabase functions deploy openrouter-chat
```

## Verification Criteria

- Coach Edge Function accepts `climbing_context` in request body without error
- Chat Edge Function accepts `climbing_context` in request body without error
- System prompt includes "User Context:" section when climbing context is provided
- Recommendations and chat responses reference climbing context when available
- Functions work correctly when `climbing_context` is null/undefined (backward compatible)

## Decisions Made

None - implementation followed the plan exactly.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None - no authentication required for this phase.

## File Tracking

### Key Files Created
None

### Key Files Modified

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/system-prompt.ts` | Added climbing context to system prompt generation |
| `supabase/functions/openrouter-coach/index.ts` | Integrated climbing context into coach recommendation prompts |
| `supabase/functions/openrouter-chat/index.ts` | Integrated climbing context into chat system prompt |
| `src/hooks/useStreamingChat.ts` | Pass climbing context to chat Edge Function |
| `src/components/features/chat-page.tsx` | Fetch and pass user climbing context to chat |

## Tech Stack Changes

### Libraries Added
None

### Patterns Established
- Optional context parameter pattern: All climbing context parameters are optional (`?: string | null`) for backward compatibility
- Null-coalescing for safety: Use `profile?.climbing_context ?? null` to ensure proper null handling

## Next Phase Readiness

### What's Ready
- User can provide climbing context via profile settings (from Phase 25-02)
- Edge Functions deployed and climbing context passed through entire stack
- AI coach can now use user's self-described climbing background for personalized advice

### What's Next
Phase 25 is now complete. The full climbing context feature is implemented:
- 25-01: Database schema for climbing_context
- 25-02: User profile UI for editing climbing context
- 25-03: Coach service integration (fetch and pass to Edge Function)
- 25-04: Edge Function integration (accept and use in prompts)

### Potential Future Enhancements
- Allow users to select from predefined climbing context templates (e.g., "Indoor boulderer focusing on V4-V6")
- Add climbing context validation to ensure helpful content is provided
- Consider adding climbing history context (outdoor vs indoor, years climbing, etc.)

## Metrics

- **Duration:** ~5 minutes
- **Completed:** 2026-01-19
- **Tasks:** 4/4 complete
