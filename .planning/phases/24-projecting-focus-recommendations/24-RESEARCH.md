# Phase 24: Projecting Focus Recommendations - Research

**Researched:** 2026-01-19
**Domain:** AI Coach - Climbing Project Selection Guidance
**Confidence:** HIGH

## Summary

This phase adds a "Projecting Focus" section to the coach recommendations tab that provides guidance on how users should select boulders to project on each week. This is project selection guidance (e.g., "focus on crimpy overhangs or tensiony overhangs"), not specific boulder recommendations.

The implementation requires:
1. Extending the Edge Function response to include `projecting_focus` field
2. Updating the system prompt to generate 3-4 project focus areas
3. Modifying the coach-page UI to display the new section below drills
4. Updating TypeScript types for the new response structure

The guidance should be based primarily on style weaknesses (e.g., if user struggles with "Sloper", recommend focusing on "sloper problems" or "sloper overhangs"), with qualitative grade guidance (e.g., "slightly above your max grade"), and mindful of gym limitations (all gyms set crimpy overhangs, not all set dynos with toe hooks).

**Primary recommendation:** Extend existing coach Edge Function to add `projecting_focus` array to response, modify system prompt to generate this guidance based on style weaknesses, and add new UI section in coach-page.tsx.

## Standard Stack

The coach recommendations system uses an existing, established stack:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions | Current | Server-side AI processing | Already deployed with OpenRouter integration |
| OpenRouter API | - | LLM API for coaching content | Existing integration with rate limiting and usage tracking |
| TypeScript | 5.8.3 | Type safety | Strict mode enabled across codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query | Latest | Data fetching and caching | Already used for coach recommendations |
| shadcn/ui FormSection | - | Card styling for sections | Consistent with existing UI pattern |
| Lucide React | Latest | Icons | Already in use for UI elements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Function | Client-side OpenRouter API | Edge Function provides better security (API keys hidden), rate limiting, and usage tracking |

**Installation:**
No new packages required - all dependencies already installed.

## Architecture Patterns

### Current System Architecture
```
User Action (click regenerate)
  → useGenerateRecommendations hook
    → coach.generateRecommendations()
      → extractPatterns() (client-side analysis)
      → extractRecentClimbs() (client-side, last 30 climbs)
        → anonymizeClimbsForAI() (remove PII)
      → openrouter-coach Edge Function (Supabase)
        → OpenRouter API call
        → Validate response structure
        → Store in coach_recommendations table
        → Track usage in coach_api_usage table
      → Returns { weekly_focus, drills }
    → TanStack Query caches result
  → coach-page.tsx displays
```

### Recommended Extension for Projecting Focus

Add `projecting_focus` field to the response structure:

```typescript
interface GenerateRecommendationsResponse {
  weekly_focus: string
  drills: Array<{
    name: string
    description: string
    sets: number
    reps: string
    rest: string
    measurable_outcome: string
  }>
  projecting_focus: Array<{
    focus_area: string
    description: string
    grade_guidance: string
    rationale: string
  }>
}
```

### Pattern 1: Edge Function Response Extension
**What:** Add new field to existing Edge Function response
**When to use:** Extending AI-generated content while maintaining backward compatibility
**Example:**
```typescript
// In openrouter-coach/index.ts - system prompt
const systemPrompt = `...
Return valid JSON with the following structure:
- weekly_focus: A concise statement (1-2 sentences) addressing the user's primary weaknesses
- drills: An array of 3 training drills
- projecting_focus: An array of 3-4 project focus areas

Each projecting focus item must have:
- focus_area: A concise description of the type of climbs to focus on (e.g., "Crimpy Overhangs", "Tensiony Slabs", "Pinchy Overhangs")
- description: Why this focus area addresses the user's weaknesses and what it will help improve
- grade_guidance: Qualitative guidance on difficulty level (e.g., "slightly above your max grade", "within one letter grade of your hardest send")
- rationale: How this focus area connects to the user's specific weakness data and climbing goals

Guidelines for projecting focus:
1. Base recommendations primarily on style weaknesses (e.g., if struggling with Sloper, recommend "Sloper problems" or "Sloper overhangs")
2. Be mindful of gym limitations - recommend styles that most gyms set (e.g., crimpy overhangs are common; dynos with toe hooks are rare)
3. Provide qualitative grade guidance only (e.g., "slightly above max grade") - not specific grade ranges
4. Keep focus areas broad but add details (e.g., "crimpy overhangs" not just "overhangs")
5. Include 3-4 focus areas to give users options
...`

// In validateResponse function - add validation
function validateResponse(content: string): object {
  const cleaned = cleanResponse(content)
  let parsed: any

  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error('Invalid JSON in response')
  }

  // Validate weekly_focus
  if (!parsed.weekly_focus || typeof parsed.weekly_focus !== 'string') {
    throw new Error('Missing or invalid field: weekly_focus')
  }

  // Validate drills array
  if (!Array.isArray(parsed.drills)) {
    throw new Error('Missing or invalid field: drills (must be an array)')
  }

  // Validate projecting_focus array (NEW)
  if (!Array.isArray(parsed.projecting_focus)) {
    throw new Error('Missing or invalid field: projecting_focus (must be an array)')
  }

  if (parsed.projecting_focus.length < 3 || parsed.projecting_focus.length > 4) {
    throw new Error('Field projecting_focus must contain 3-4 items')
  }

  // Validate each projecting_focus item
  parsed.projecting_focus.forEach((item: any, index: number) => {
    const itemNum = index + 1

    if (!item.focus_area || typeof item.focus_area !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: focus_area`)
    }
    if (item.focus_area.trim().length === 0) {
      throw new Error(`Projecting focus ${itemNum}: Field focus_area cannot be empty`)
    }

    if (!item.description || typeof item.description !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: description`)
    }
    if (item.description.trim().length < 20) {
      throw new Error(`Projecting focus ${itemNum}: Field description must be at least 20 characters`)
    }

    if (!item.grade_guidance || typeof item.grade_guidance !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: grade_guidance`)
    }

    if (!item.rationale || typeof item.rationale !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: rationale`)
    }
    if (item.rationale.trim().length < 15) {
      throw new Error(`Projecting focus ${itemNum}: Field rationale must be at least 15 characters`)
    }
  })

  return parsed
}
```

### Pattern 2: Client-Side Type Updates
**What:** Update TypeScript interfaces to match new response structure
**When to use:** Adding new fields to API responses
**Example:**
```typescript
// In src/services/coach.ts
export interface ProjectingFocus {
  focus_area: string
  description: string
  grade_guidance: string
  rationale: string
}

export interface GenerateRecommendationsResponse {
  weekly_focus: string
  drills: Array<{
    name: string
    description: string
    sets: number
    reps: string
    rest: string
    measurable_outcome: string
  }>
  projecting_focus: ProjectingFocus[]
}
```

### Pattern 3: UI Section Addition
**What:** Add new section to existing page component
**When to use:** Displaying new AI-generated content in existing coach recommendations tab
**Example:**
```typescript
// In src/components/features/coach-page.tsx
{/* Projecting Focus Section - NEW */}
<section>
  <div className="flex items-center gap-4 mb-6">
    <div className="h-1 flex-1 bg-purple-500" />
    <h2 className="text-3xl font-black tracking-tighter uppercase">Projecting Focus</h2>
    <div className="h-1 flex-1 bg-purple-500" />
  </div>

  {((recommendations.content as any)?.projecting_focus || []).length === 0 ? (
    <FormSection>
      <p className="text-center text-[#888]">No projecting focus available</p>
    </FormSection>
  ) : (
    ((recommendations.content as any)?.projecting_focus || []).map(
      (focus: any, index: number) => (
        <FormSection key={index} className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-black uppercase">{focus.focus_area || 'Focus Area'}</h3>
            <Badge
              variant="outline"
              className="text-xs font-mono border-white/20 text-[#ccc]"
            >
              {focus.grade_guidance || 'No grade guidance'}
            </Badge>
          </div>
          <p className="text-sm text-[#bbb] leading-relaxed mb-3">
            {focus.description || 'No description available'}
          </p>
          <p className="text-xs text-purple-400/80 leading-relaxed font-mono">
            Why: {focus.rationale || 'No rationale provided'}
          </p>
        </FormSection>
      )
    )
  )}
</section>
```

### Anti-Patterns to Avoid
- **Hardcoding gym-specific routes:** This is guidance on style/type of climbs, not specific routes. Users will interpret based on their gym's setting.
- **Specific grade ranges:** Keep grade guidance qualitative (e.g., "slightly above max grade") to account for different grade scales and user progression.
- **Assuming all gyms set everything:** Be mindful that not all gyms set niche styles like "dynos with toe hooks". Focus on widely available styles (crimpy overhangs, tensiony slabs).
- **Making this drill-aware:** CONTEXT.md explicitly states no need to consider drilling focus in project guidance - this is independent.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API validation logic | Custom validation regex | Edge Function's existing `validateResponse` function | Already has retry logic, error handling, and structured validation |
| Response type definitions | Manual type creation | Extend existing TypeScript interfaces | Maintains consistency with existing types |
| UI section styling | Custom CSS classes | `FormSection` component from shadcn/ui | Consistent styling with Weekly Focus and Drills sections |
| Error handling for missing fields | try-catch in UI | Existing TanStack Query error handling in `useGenerateRecommendations` | Already handles API failures, rate limits, and cached fallbacks |

**Key insight:** The coach recommendations system already has robust infrastructure for AI-generated content, validation, error handling, and UI display. Extend this existing system rather than building parallel logic.

## Common Pitfalls

### Pitfall 1: Breaking backward compatibility with existing recommendations
**What goes wrong:** Old recommendations in database don't have `projecting_focus` field, causing UI crashes when rendering.
**Why it happens:** Adding new field to response structure without handling missing field in existing records.
**How to avoid:**
- Use optional chaining in UI: `(recommendations.content as any)?.projecting_focus || []`
- Provide empty array fallback when field is missing
- Test with existing cached recommendations
**Warning signs:** TypeError when accessing `map` on undefined, empty screen in Recommendations tab

### Pitfall 2: LLM generates specific grade ranges instead of qualitative guidance
**What goes wrong:** AI returns "Focus on V5-V7 crimpy overhangs" instead of "Slightly above your max grade".
**Why it happens:** Prompt doesn't explicitly forbid specific grades, LLM defaults to specific examples.
**How to avoid:**
- Add explicit instruction in system prompt: "Provide qualitative grade guidance only (e.g., 'slightly above max grade') - not specific grade ranges"
- Validate response doesn't contain grade patterns (optional: add regex check)
**Warning signs:** Grade ranges like "V5-V7", "7a-7b", "Font 6a-6b" appear in `grade_guidance` field

### Pitfall 3: Recommending gym-styles that don't exist
**What goes wrong:** AI recommends "Focus on dynos with toe hooks" but user's gym never sets these.
**Why it happens:** LLM doesn't understand gym setting limitations, generates niche styles.
**How to avoid:**
- Add explicit guidance in system prompt: "Be mindful of gym limitations - recommend styles that most gyms set (e.g., crimpy overhangs are common; dynos with toe hooks are rare)"
- Provide examples of common vs rare styles in prompt
**Warning signs:** User feedback that recommendations don't apply to their gym, niche style combinations

### Pitfall 4: Forgetting to update type definitions
**What goes wrong:** TypeScript errors when accessing new `projecting_focus` field, or type mismatches between Edge Function and client.
**Why it happens:** Adding field to Edge Function response without updating TypeScript interfaces.
**How to avoid:**
- Update `GenerateRecommendationsResponse` interface in `src/services/coach.ts`
- Add `ProjectingFocus` interface definition
- Run `pnpm typecheck` to verify no type errors
**Warning signs:** TypeScript errors on `recommendations.content.projecting_focus`, red squigglies in IDE

### Pitfall 5: Making drill-aware recommendations (outside scope)
**What goes wrong:** AI connects project focus to current drills, e.g., "Since you're doing silent feet drills, focus on slab projects".
**Why it happens:** Prompt doesn't explicitly separate drills and projecting focus concerns.
**How to avoid:**
- CONTEXT.md states: "No need to consider drilling focus in project guidance"
- Keep prompts independent - drill recommendations are for training exercises, project focus is for boulder selection
**Warning signs:** Projecting focus descriptions reference drills, overlap with weekly focus

## Code Examples

Verified patterns from official sources:

### Edge Function System Prompt Extension
```typescript
// Source: Existing openrouter-coach/index.ts system prompt (supabase/functions/openrouter-coach/index.ts)
// Add to existing systemPrompt string:

...
- projecting_focus: An array of 3-4 project focus areas

Each projecting focus item must have:
- focus_area: A concise description of the type of climbs to focus on (e.g., "Crimpy Overhangs", "Tensiony Slabs", "Pinchy Overhangs")
- description: Why this focus area addresses the user's weaknesses and what it will help improve
- grade_guidance: Qualitative guidance on difficulty level (e.g., "slightly above your max grade", "within one letter grade of your hardest send")
- rationale: How this focus area connects to the user's specific weakness data and climbing goals

Guidelines for projecting focus:
1. Base recommendations primarily on style weaknesses (e.g., if struggling with Sloper, recommend "Sloper problems" or "Sloper overhangs")
2. Be mindful of gym limitations - recommend styles that most gyms set (e.g., crimpy overhangs are common; dynos with toe hooks are rare)
3. Provide qualitative grade guidance only (e.g., "slightly above max grade") - not specific grade ranges
4. Keep focus areas broad but add details (e.g., "crimpy overhangs" not just "overhangs")
5. Include 3-4 focus areas to give users options
...
```

### User Prompt Addition
```typescript
// Source: Existing buildUserPrompt function in openrouter-coach/index.ts
// Add to existing prompt after "Example output format":

...
Based on this data, provide:
1. A weekly focus statement addressing the user's primary weaknesses
2. 3 specific training drills with educational explanations
3. 3-4 projecting focus areas for project selection this week

Example output format:
{
  "weekly_focus": "Develop precise footwork and body positioning to address 35% failure rate on technical slab climbs",
  "drills": [
    {
      "name": "Silent Feet Ladder",
      "description": "Climb 10 easy routes focusing entirely on silent foot placements...",
      "sets": 5,
      "reps": "1 route per set",
      "rest": "2 minutes",
      "measurable_outcome": "Complete 10 routes with 100% silent foot placements"
    }
  ],
  "projecting_focus": [
    {
      "focus_area": "Crimpy Overhangs",
      "description": "Your 40% failure rate on crimp holds suggests you need more time on crimpy terrain. Overhangs will test your tension and body positioning on crimps.",
      "grade_guidance": "Focus on problems slightly above your max grade - challenging but realistic for a week of projecting",
      "rationale": "Builds finger strength on crimps while developing body tension skills for steep terrain"
    }
  ]
}
...
```

### UI Section Rendering Pattern
```typescript
// Source: Existing coach-page.tsx (src/components/features/coach-page.tsx)
// Follow the exact pattern used for Weekly Focus and Drills sections:

{/* Projecting Focus Section */}
<section>
  <div className="flex items-center gap-4 mb-6">
    <div className="h-1 flex-1 bg-purple-500" />  {/* Use different color */}
    <h2 className="text-3xl font-black tracking-tighter uppercase">Projecting Focus</h2>
    <div className="h-1 flex-1 bg-purple-500" />
  </div>

  {((recommendations.content as any)?.projecting_focus || []).length === 0 ? (
    <FormSection>
      <p className="text-center text-[#888]">No projecting focus available</p>
    </FormSection>
  ) : (
    ((recommendations.content as any)?.projecting_focus || []).map(
      (focus: any, index: number) => (
        <FormSection key={index} className="mb-4">
          {/* Content here */}
        </FormSection>
      )
    )
  )}
</section>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | This is new feature | Phase 24 | Adds project selection guidance to AI Coach |

**Best practices from climbing training research:**

Based on research from climbing training resources [sources at end of document]:

1. **Anti-style training**: Focus on weaknesses (anti-style) to address gaps - "70% on weaknesses, 30% on strengths" approach
2. **Project selection**: Choose within 1-2 grades of hardest send for realistic progression
3. **Style vs Anti-style decision**: Balance between challenging weaknesses and maintaining motivation with strength-based climbs
4. **Gym setting awareness**: Not all gyms set all styles - focus on commonly available styles (crimpy overhangs, tensiony slabs)

**Current LLM capability:** OpenRouter models can understand climbing terminology, style weaknesses, and generate contextual project selection guidance based on pattern data.

## Open Questions

None - all design decisions are specified in CONTEXT.md (locked decisions) and the research is complete.

## Sources

### Primary (HIGH confidence)
- **supabase/functions/openrouter-coach/index.ts** - Existing Edge Function with system prompt, validation, response structure
- **src/services/coach.ts** - Current API service layer and type definitions
- **src/components/features/coach-page.tsx** - Existing UI patterns for displaying recommendations
- **src/services/patterns.ts** - Pattern analysis implementation (style weaknesses, failure patterns)
- **src/lib/coachUtils.ts** - Anonymization and data preparation for LLM
- **.planning/phases/24-projecting-focus-recommendations/24-CONTEXT.md** - Phase decisions and requirements (locked)

### Secondary (MEDIUM confidence)
- [ATTACKtics: Projecting, Part I: Picking The Project](https://www.powercompanyclimbing.com/blog/2013/03/attacktics-projecting-part-1-picking.html) - Style vs anti-style, duration considerations, grade proximity guidance
- [Projecting 101 - 6 Tips to Sending Your Project!](https://trainingforclimbing.com/projecting-101-6-tips-to-sending-your-project/) - Best practices for projecting, pick right route within one grade
- [From Avoidance to Mastery: Training My Climbing Antistyle](https://trainingforclimbing.com/from-avoidance-to-mastery-training-my-climbing-antistyle/) - 70/30 split for weakness vs strength training
- [Perspectives on Comp Style Routesetting in Indoor Climbing Gyms](https://www.cwapro.org/blog/perspectives-on-comp-style-routesetting-in-indoor-climbing-gyms) - Gym setting limitations, common vs niche styles

### Tertiary (LOW confidence)
- [Routesetting Trends 2025](https://climbingbusinessjournal.com/routesetting-trends-2025/) - Gym routesetting trends (general industry context)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components are existing, verified from codebase
- Architecture: HIGH - Based on existing Edge Function and UI patterns, verified from code
- Pitfalls: HIGH - Based on known TypeScript/AI integration issues, verified from climbing research
- Climbing domain knowledge: MEDIUM - Verified from multiple authoritative climbing training sources

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain, no major changes expected in existing system)
