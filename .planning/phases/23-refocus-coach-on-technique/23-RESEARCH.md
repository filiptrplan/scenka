# Phase 23: Refocus Coach on Technique - Research

**Researched:** 2026-01-19
**Domain:** LLM Coaching System + Edge Functions + Pattern Analysis
**Confidence:** HIGH

## Summary

This phase requires modifying the AI coach system to focus exclusively on technique and technique drills, removing strength training emphasis. The current implementation has strength-focused terminology in the system prompt and only sends aggregated pattern data to the LLM.

**Primary recommendation:** Modify the system prompt in the Edge Function to focus on technique, add last 30 climbs (anonymized) to the LLM input, and ensure strength failures are reframed as technique issues.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions | Latest | Serverless AI integration | Already in use, handles auth via JWT |
| OpenAI SDK (via Deno) | v4 | LLM API calls (OpenRouter) | Already in use, supports baseURL override for OpenRouter |
| Google Gemini 2.5 Pro | - | LLM model | Currently used, strong reasoning |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query | Latest | Server state management | Already integrated for coach recommendations |
| Supabase JS Client | v2 | Database operations | Already in use for pattern extraction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Functions | Direct OpenAI API calls | Edge Functions maintain auth security, reuse existing infrastructure |
| System prompt only | RAG with retrieved drills | System prompt is simpler and sufficient for this scope |

**Installation:**
No new installations required - using existing stack.

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
├── openrouter-coach/
│   └── index.ts              # Main Edge Function (system prompt here)
├── _shared/
│   ├── system-prompt.ts       # Could extract prompt for reusability
│   └── cors.ts               # CORS headers (already exists)
└── openrouter-chat/
    └── index.ts              # Chat endpoint (separate from coach)

src/
├── services/
│   ├── coach.ts              # Frontend coach service (calls Edge Function)
│   └── patterns.ts           # Pattern extraction (currently aggregated only)
├── lib/
│   └── coachUtils.ts          # Anonymization utilities (already exists)
└── types/
    └── index.ts              # Type definitions (AnonymizedClimb exists)
```

### Pattern 1: System Prompt in Edge Function
**What:** System prompt embedded in Edge Function, sets LLM behavior for all requests
**When to use:** When behavior needs to be consistent for all users/requests
**Example:**
```typescript
// Source: /workspace/supabase/functions/openrouter-coach/index.ts lines 30-49
const systemPrompt = `You are an expert climbing coach specializing in bouldering and sport climbing. Your approach is weakness-based coaching - identify the user's primary weaknesses and target them with specific, actionable training.

Return valid JSON with the following structure:
- weekly_focus: A concise statement (1-2 sentences) addressing the user's primary weaknesses
- drills: An array of 3 training drills

Each drill must have:
- name: Drill name using climbing-specific terminology
- description: Educational explanation of what the drill is and why it's beneficial
- sets: Number of sets
- reps: Repetition count or duration
- rest: Rest period between sets`
```

### Pattern 2: Aggregated Pattern Data
**What:** Pre-process climbing data into patterns before sending to LLM
**When to use:** When you want to reduce token usage and provide structured insights
**Example:**
```typescript
// Source: /workspace/src/services/patterns.ts lines 25-30
return {
  failure_patterns: extractFailurePatterns(climbs),
  style_weaknesses: extractStyleWeaknesses(climbs),
  climbing_frequency: extractClimbingFrequency(climbs),
  recent_successes: extractRecentSuccesses(climbs),
}
```

### Anti-Patterns to Avoid
- **Modifying patterns.ts output structure:** This is shared with the UI (coach-page.tsx displays patterns directly), so changes would require UI updates
- **Passing user_id to LLM:** Always use `anonymizeClimbsForAI()` to remove PII before external API calls
- **Skipping JWT auth:** Edge Function validates JWT from Authorization header, don't bypass this

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prompt construction with raw strings | Manual string concatenation | Template literals with structured sections | Easier to maintain and modify |
| PII filtering logic | Custom regex patterns | Use existing `anonymizeClimbsForAI()` | Already tested and validated |
| Raw climb data fetching | New query logic | Reuse existing patterns.ts query structure | Maintain consistency with existing code |

**Key insight:** The `AnonymizedClimb` type and `anonymizeClimbsForAI()` function already exist in `/workspace/src/lib/coachUtils.ts` - they're just not being used in the coach flow yet.

## Common Pitfalls

### Pitfall 1: System Prompt Constraints Too Strong
**What goes wrong:** If constraints are too strict ("NEVER mention strength"), LLM may fail to provide helpful responses for valid technique-adjacent topics like body tension drills.
**Why it happens:** LLMs interpret absolute constraints literally and may refuse reasonable requests.
**How to avoid:** Use soft constraints ("prioritize technique," "focus on movement quality") rather than absolute prohibitions.
**Warning signs:** LLM returns drills that don't address the user's actual failure patterns.

### Pitfall 2: Breaking Pattern UI
**What goes wrong:** Modifying `patterns.ts` return structure breaks the patterns tab in coach-page.tsx which displays this data directly.
**Why it happens:** Pattern analysis is used in two places: sent to LLM and displayed to user.
**How to avoid:** Keep `extractPatterns()` output structure unchanged, add raw climbs as a separate field.
**Warning signs:** Pattern Analysis tab shows empty or malformed data.

### Pitfall 3: PII in LLM Input
**What goes wrong:** Passing raw climbs without anonymization includes user_id, created_at, notes, or specific location names.
**Why it happens:** Direct database query returns all fields, easy to forget filtering.
**How to avoid:** Always run climbs through `anonymizeClimbsForAI()` before adding to LLM input.
**Warning signs:** User IDs or specific gym names appear in LLM responses.

### Pitfall 4: Prompt Token Bloat
**What goes wrong:** Adding all 100 climbs (or more) to the prompt makes it expensive and may hit context limits.
**Why it happens:** Raw climb data is verbose, and 100 climbs × 10 fields = 1000+ tokens just for data.
**How to avoid:** Limit to 30 climbs as specified in decisions, structure as compact JSON.
**Warning signs:** API costs spike, requests start failing with context length errors.

## Code Examples

### Current System Prompt (Needs Modification)
```typescript
// Source: /workspace/supabase/functions/openrouter-coach/index.ts lines 30-49
const systemPrompt = `You are an expert climbing coach specializing in bouldering and sport climbing. Your approach is weakness-based coaching - identify the user's primary weaknesses and target them with specific, actionable training.

Return valid JSON with the following structure:
- weekly_focus: A concise statement (1-2 sentences) addressing the user's primary weaknesses and the training focus for this week
- drills: An array of 3 training drills

Each drill must have:
- name: Drill name using climbing-specific terminology (e.g., "7-3-5-3 Hangboard Protocol", "Campus Board Ladders", "Antagonist Training")
- description: A detailed educational explanation of what the drill is and why it's beneficial for the user's specific weaknesses
- sets: Number of sets (e.g., 4)
- reps: Repetition count or duration (e.g., "6-8 reps per hold" or "3-5 min")
- rest: Rest period between sets (e.g., "90s")

Use technical climbing terminology throughout:
- Hangboard protocols (8-12s hangs, half-crimp, open-hand)
- Campus board (power, dynamic movement, ladders)
- Antagonistic training (push muscles, tendon health)
- Periodization (strength, power, endurance phases)
- Contact strength, finger strength, core power
- For drills: explain what each drill is and why it's beneficial for the user`
```

### Current User Prompt Builder (Needs Extension)
```typescript
// Source: /workspace/supabase/functions/openrouter-coach/index.ts lines 124-192
function buildUserPrompt(patterns: PatternAnalysis, preferences: UserPreferences): string {
  const { failure_patterns, style_weaknesses, climbing_frequency, recent_successes } = patterns

  let prompt = `User Profile:
- Preferred discipline: ${preferences.preferred_discipline}
- Preferred grade scale: ${preferences.preferred_grade_scale}

`

  // Add failure patterns
  prompt += `Failure Patterns:
`
  if (failure_patterns.most_common_failure_reasons.length > 0) {
    failure_patterns.most_common_failure_reasons.forEach((fp) => {
      prompt += `- ${fp.reason}: ${fp.count} failures (${fp.percentage}%)\n`
    })
  } else {
    prompt += `- No failure data available\n`
  }

  // ... rest of function builds style weaknesses, frequency, successes

  return prompt
}
```

### Existing Anonymization Function (Ready to Use)
```typescript
// Source: /workspace/src/lib/coachUtils.ts lines 7-18
export function anonymizeClimbsForAI(climbs: Climb[]): AnonymizedClimb[] {
  return climbs.map((climb): AnonymizedClimb => ({
    location: sanitizeLocation(climb.location),
    grade_scale: climb.grade_scale,
    grade_value: climb.grade_value,
    climb_type: climb.climb_type,
    style: climb.style,
    outcome: climb.outcome,
    awkwardness: climb.awkwardness,
    failure_reasons: climb.failure_reasons,
  }))
}
```

### Pattern Analysis Query (Reference for Raw Climb Fetching)
```typescript
// Source: /workspace/src/services/patterns.ts lines 10-15
const { data: climbs, error } = await supabase
  .from('climbs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(100) // Last 100 climbs for analysis
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| System prompt focuses on strength training | System prompt should focus on technique | Phase 23 | Drills become technique-focused |
| Aggregated patterns only | Aggregated + raw climb data | Phase 23 | LLM can identify patterns itself |
| Strength recommendations for "Pumped" failures | Technique reframing (energy conservation) | Phase 23 | Addresses root cause |

**Deprecated/outdated:**
- None - stack is current and appropriate

## Open Questions

1. **How to structure raw climb data in the prompt**
   - What we know: Need to add last 30 climbs, use existing `anonymizeClimbsForAI()`
   - What's unclear: Exact prompt structure - should it be a separate section, integrated with patterns, or a new JSON object in the user prompt
   - Recommendation: Add as "Recent Climb History" section with compact JSON format

2. **Exact system prompt wording for technique focus**
   - What we know: Avoid strength terminology, emphasize movement quality, allow technique-adjacent strength elements like body tension
   - What's unclear: How to phrase the strength→technique reframing philosophy without being too preachy
   - Recommendation: Use explicit examples in the prompt showing how to reframe "Pumped" and "Finger Strength" failures

3. **Drill outcome measurement format**
   - What we know: Each drill needs measurable outcomes
   - What's unclear: Should this be a new field in the drill JSON, integrated into description, or in a separate structure
   - Recommendation: Add a new `measurable_outcome` field to drill schema for clarity

## Sources

### Primary (HIGH confidence)
- `/workspace/supabase/functions/openrouter-coach/index.ts` - Current system prompt, user prompt builder, response validation
- `/workspace/src/services/patterns.ts` - Pattern extraction logic and data structure
- `/workspace/src/lib/coachUtils.ts` - Anonymization utilities (already implemented)
- `/workspace/src/types/index.ts` - Type definitions including `AnonymizedClimb`

### Secondary (MEDIUM confidence)
- `/workspace/src/services/coach.ts` - Coach service that calls Edge Function
- `/workspace/src/components/features/coach-page.tsx` - UI that displays recommendations and patterns

### Tertiary (LOW confidence)
- Web search attempts failed (API errors), so guidance on LLM system prompt best practices is based on training knowledge rather than current sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified by reading codebase
- Architecture: HIGH - Verified by reading implementation
- Pitfalls: HIGH - Identified from code structure analysis
- System prompt best practices: MEDIUM - Based on training knowledge, current sources unavailable

**Research date:** 2026-01-19
**Valid until:** 30 days (stack is stable, no major dependencies on external libraries that change frequently)
