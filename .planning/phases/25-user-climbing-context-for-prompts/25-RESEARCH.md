# Phase 25: User Climbing Context for Prompts - Research

**Researched:** 2026-01-19
**Domain:** AI System Prompt Augmentation with User-Provided Context
**Confidence:** HIGH

## Summary

This research explores how to allow users to provide their own climbing context to enhance the AI coach's system prompts. The approach follows best practices from 2025 AI context engineering, which emphasizes clear separation between system instructions and user context.

**Primary recommendation:** Add a TEXT column `climbing_context` to the existing `profiles` table (2000 character limit), integrate into both coach and chat system prompts, and add a textarea to the settings page with inline validation. This mirrors industry patterns (ChatGPT's 1500-char custom instructions) while staying simple and maintainable.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL JSONB | 15+ | Flexible data storage | De-facto standard for user preferences in Supabase apps |
| TEXT column | - | User-provided context | Simpler than JSONB for single free-form field |
| zod | Latest | Validation schema validation | Project's existing validation layer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | Latest | Form state management | Project's existing form handling |
| textarea (shadcn/ui) | - | Multi-line input | Free-form user context entry |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TEXT column in profiles | JSONB column | JSONB adds unnecessary complexity for single field; TEXT is sufficient and simpler |
| New table for contexts | profiles table column | New table adds join overhead; existing profiles table is the logical place |
| Unstructured textarea | Structured multi-part form | Free-form gives users flexibility; climbing context varies too much for rigid structure |

**Installation:**
```bash
# No new packages needed - uses existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/features/
│   └── settings-page.tsx       # Add climbing context textarea section
├── hooks/
│   └── useProfile.ts            # Already exists - no changes needed
├── lib/
│   └── validation.ts            # Add climbing_context to profileSchema
└── services/
    └── profiles.ts              # Already exists - no changes needed
supabase/
├── migrations/
│   └── YYYYMMDD_add_climbing_context_to_profiles.sql
└── functions/
    ├── openrouter-coach/
    │   └── index.ts            # Integrate climbing_context into user prompt
    ├── openrouter-chat/
    │   └── index.ts            # Pass climbing_context to getChatSystemPrompt
    └── _shared/
        └── system-prompt.ts     # Update to accept climbing_context parameter
```

### Pattern 1: User Context Integration
**What:** Inject user-provided climbing context into system prompts
**When to use:** When users need to provide personal context to improve AI responses
**Example:**
```typescript
// In openrouter-coach/index.ts
function buildUserPrompt(
  patterns: PatternAnalysis,
  preferences: UserPreferences,
  climbingContext?: string | null,
  recentClimbs?: AnonymizedClimb[]
): string {
  let prompt = `User Profile:
- Preferred discipline: ${preferences.preferred_discipline}
- Preferred grade scale: ${preferences.preferred_grade_scale}
`

  // Add climbing context if provided
  if (climbingContext && climbingContext.trim().length > 0) {
    prompt += `\nUser's Climbing Context:\n${climbingContext.trim()}\n`
  }

  // ... rest of prompt
  return prompt
}
```

### Pattern 2: Textarea with Character Limit
**What:** Multi-line input with real-time character count
**When to use:** Free-form user input where length matters
**Example:**
```typescript
import { Textarea } from '@/components/ui/textarea'

<div className="space-y-3">
  <FormLabel>Describe Yourself as a Climber</FormLabel>
  <Textarea
    {...register('climbing_context')}
    placeholder="e.g., Intermediate boulderer working V5-V6 projects. Weak on crimps and overhangs. Train 3x/week. Goal: send my first V7 this year."
    className="min-h-[120px] bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
    maxLength={2000}
  />
  <div className="flex justify-between">
    <p className="text-xs text-[#666]">Help the coach understand your goals, weaknesses, and climbing style</p>
    <p className="text-xs text-[#666]">
      {climbingContext?.length || 0} / 2000
    </p>
  </div>
</div>
```

### Pattern 3: Context Separation in System Prompts
**What:** Clear separation between system instructions and user context
**When to use:** Building dependable AI systems with user-provided context
**Example:**
```typescript
// In _shared/system-prompt.ts
export function getChatSystemPrompt(
  patterns_data?: Record<string, unknown>,
  climbingContext?: string | null
): string {
  let prompt = `You are an expert climbing coach... [system instructions]`

  // User context is clearly separated
  if (climbingContext && climbingContext.trim().length > 0) {
    prompt += '\n\nUser Context:\n'
    prompt += climbingContext.trim() + '\n'
  }

  if (patterns_data && Object.keys(patterns_data).length > 0) {
    prompt += '\n\nPattern Analysis:\n...'
  }

  return prompt
}
```

### Anti-Patterns to Avoid
- **Allowing PII in context:** User shouldn't enter names, locations, or identifying info
- **Unlimited text:** Must enforce character limit (2000 chars max)
- **Context injection without validation:** Validate length and strip malicious content
- **Mixing context with system instructions:** Keep them clearly separated

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | react-hook-form + zod | Existing project pattern, handles all edge cases |
| Character counting | Custom JS counter | Textarea maxLength + register value | Native browser feature, simpler |
| Database schema | Custom migrations | Supabase migration system | Standard practice, versioned, reversible |
| Toast notifications | Custom toasts | sonner | Project already uses it |

**Key insight:** The project already has all the infrastructure needed. This phase is primarily about adding a field to an existing form and integrating it into prompts. Don't rebuild form handling, validation, or notification systems.

## Common Pitfalls

### Pitfall 1: PII Leakage Through User Context
**What goes wrong:** Users accidentally include personal information (names, specific gyms, identifying details) that gets sent to OpenRouter
**Why it happens:** Free-form text fields lack guardrails
**How to avoid:**
- Add help text explicitly stating what NOT to include
- Consider basic PII detection (warning, not blocking)
- Document that context is sent to external API
**Warning signs:** Test inputs like "My name is John, I climb at Boulder Gym" should trigger warnings

### Pitfall 2: Context Overwhelms System Prompt
**What goes wrong:** Long user context drowns out climbing data and technical analysis
**Why it happens:** 2000-char context + patterns_data + preferences = large prompt
**How to avoid:**
- Keep user context AFTER system instructions but BEFORE climbing data
- Enforce strict character limit (2000 chars)
- Prioritize climbing context over conversational filler
**Warning signs:** Coach ignores pattern data and only responds to user context

### Pitfall 3: Inconsistent Context Between Coach and Chat
**What goes wrong:** Coach has context but chat doesn't (or vice versa), creating disjointed experience
**Why it happens:** Separate Edge Functions with separate integration points
**How to avoid:**
- Update BOTH openrouter-coach and openrouter-chat
- Update getChatSystemPrompt() in _shared/
- Test both flows with same context
**Warning signs:** Coach mentions user's goals but chat doesn't know them

### Pitfall 4: Existing Users Don't Get Context Field
**What goes wrong:** Old users can't add climbing context because column wasn't there when they created profile
**Why it happens:** Migration adds column but doesn't handle nulls gracefully
**How to avoid:**
- Make column nullable (no default needed)
- Update profileSchema to make climbing_context optional
- UI shows empty textarea for null values
**Warning signs:** User can't save profile after migration

### Pitfall 5: No Inline Validation Feedback
**What goes wrong:** Users type 2001 characters, submit, get generic error
**Why it happens:** Validation only on form submit
**How to avoid:**
- Show real-time character count
- Visual warning as approaching limit
- Error message if attempting to submit over limit
**Warning signs:** User frustration with unclear error messages

## Code Examples

Verified patterns from official sources:

### Database Migration
```sql
-- Source: PostgreSQL official documentation on ALTER TABLE
-- Add climbing_context column to profiles table
ALTER TABLE public.profiles
ADD COLUMN climbing_context TEXT;

-- Add check constraint for max length (optional, validation handled in app)
ALTER TABLE public.profiles
ADD CONSTRAINT climbing_context_max_length
CHECK (climbing_context IS NULL OR length(climbing_context) <= 2000);
```

### Zod Validation Schema
```typescript
// Source: zod documentation - optional string with max length
export const profileSchema = z.object({
  preferred_grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  preferred_discipline: z.enum(['boulder', 'sport']),
  home_gym: z.string().optional(),
  enabled_hold_colors: z.array(z.enum(['red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink'])).default(DEFAULT_COLORS),
  close_logger_after_add: z.boolean().default(true),
  climbing_context: z.string().max(2000).optional(), // NEW FIELD
})
```

### Edge Function Integration (Coach)
```typescript
// In openrouter-coach/index.ts
interface RequestBody {
  user_id: string
  patterns_data: PatternAnalysis
  user_preferences: UserPreferences
  climbing_context?: string | null  // NEW FIELD
  recent_climbs?: AnonymizedClimb[]
}

function buildUserPrompt(
  patterns: PatternAnalysis,
  preferences: UserPreferences,
  climbingContext?: string | null,  // NEW PARAM
  recentClimbs?: AnonymizedClimb[]
): string {
  // ... existing code ...

  // Add climbing context if provided
  if (climbingContext && climbingContext.trim().length > 0) {
    prompt += `\nUser's Climbing Context:\n${climbingContext.trim()}\n`
  }

  // ... rest of prompt ...
}
```

### Edge Function Integration (Chat)
```typescript
// In openrouter-chat/index.ts
interface RequestBody {
  message: string
  patterns_data?: Record<string, unknown>
  climbing_context?: string | null  // NEW FIELD
}

// Build messages array for LLM
const messages = [
  {
    role: 'system' as const,
    content: getChatSystemPrompt(body.patterns_data, body.climbing_context)  // PASS CONTEXT
  },
  ...messageHistory.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  })),
]
```

### Settings Page Component Integration
```typescript
// In settings-page.tsx
import { Textarea } from '@/components/ui/textarea'

// Inside form:
<div className="space-y-3">
  <FormLabel>Describe Yourself as a Climber</FormLabel>
  <Textarea
    {...register('climbing_context')}
    placeholder="e.g., Intermediate boulderer working V5-V6 projects. Weak on crimps and overhangs. Train 3x/week. Goal: send my first V7 this year."
    className="min-h-[120px] bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30"
    maxLength={2000}
  />
  <div className="flex justify-between">
    <p className="text-xs text-[#666]">
      Help the coach understand your goals, weaknesses, and climbing style. Avoid personal information.
    </p>
    <p className="text-xs text-[#666]">
      {watch('climbing_context')?.length || 0} / 2000
    </p>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rigid form fields for user context | Free-form text area with character limit | 2023-2024 | Better user experience, more flexible context |
| System prompts hardcoded | System prompts + user context injection | 2024-2025 | Personalized AI responses without per-user fine-tuning |
| Context in user messages | Context in system prompt section | 2025 | Clearer separation of concerns, more reliable behavior |

**Deprecated/outdated:**
- Per-user fine-tuning: Too expensive and complex. Use context injection instead.
- Structured "what I want" forms: Too rigid. Free-form text is more flexible and works better with LLMs.
- Unlimited context length: Wastes tokens. Character limits are standard practice (ChatGPT: 1500 chars).

**Industry patterns:**
- ChatGPT: 1500 characters for "what you'd like ChatGPT to know about you"
- GitHub Copilot: Custom instructions via `.github/copilot-instructions.md`
- VS Code Copilot: Workspace settings for project-specific context

## Open Questions

Things that couldn't be fully resolved:

1. **Should climbing context be optional or required?**
   - What we know: ChatGPT makes custom instructions optional
   - What's unclear: User research needed - do climbers want to provide this context?
   - Recommendation: Start as optional, measure adoption rate. If low, add onboarding prompt.

2. **Character limit: 1500 or 2000?**
   - What we know: ChatGPT uses 1500 chars. 2000 gives more room but costs more tokens.
   - What's unclear: Token cost impact and user needs
   - Recommendation: Start with 2000 chars. Monitor token usage in coach_api_usage table. If context adds significant cost, reduce to 1500.

3. **Should we implement PII detection?**
   - What we know: OWASP LLM02:2025 flags PII disclosure risk
   - What's unclear: False positive rate, user annoyance with blocked input
   - Recommendation: Phase 1: Only warning text. Phase 2 (if needed): Simple pattern matching for emails, phones, full names. Don't block, just warn.

4. **Should context affect recommendation caching?**
   - What we know: Coach uses cached recommendations when API fails
   - What's unclear: If user changes context, should cache be invalidated?
   - Recommendation: Yes. Update coach_recommendations table schema to include climbing_context_hash. If context changes, bypass cache.

5. **Mobile UX: How to make context entry not tedious?**
   - What we know: Mobile users have shorter attention spans
   - What's unclear: Will 2000 chars feel like homework on phone?
   - Recommendation: Phase 1: Simple textarea. Phase 2: Consider progressive disclosure (short form first, option to expand).

## Sources

### Primary (HIGH confidence)
- PostgreSQL Documentation - ALTER TABLE syntax for adding columns
- zod Documentation - String validation with max() for character limits
- ChatGPT Community - "How are custom instructions preserved in context window" - 1500 character limit confirmed

### Secondary (MEDIUM confidence)
- [ChatGPT Custom Instructions Guide](https://gudprompt.com/blog/chatgpt-custom-instructions-guide-2025) - Structure and guidelines for custom instructions
- [The Future of AI: Context Engineering in 2025 and Beyond](https://dev.to/lofcz/the-future-of-ai-context-engineering-in-2025-and-beyond-5n9) - Clear separation of system vs user context
- [UI Form Design Best Practices](https://www.interaction-design.org/literature/article/ui-form-design) - Inline validation and single-column layouts

### Tertiary (LOW confidence)
- [When Prompts Leak Secrets: The Hidden Risk in LLM Requests](https://www.keysight.com/blogs/en/tech/nwvs/2025/08/04/pii-disclosure-in-user-request) - PII leakage concerns (marked for validation)
- [LLM02:2025 Sensitive Information Disclosure](https://genai.owasp.org/llmrisk/llm02-insecure-output-handling/) - Security considerations (marked for validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing project infrastructure and PostgreSQL docs
- Architecture: HIGH - Verified patterns from current codebase and industry standards
- Pitfalls: MEDIUM - Some based on WebSearch without official verification (PII leakage, context overwhelm)

**Research date:** 2026-01-19
**Valid until:** 2026-02-18 (30 days - AI context engineering evolves quickly, but fundamentals stable)
