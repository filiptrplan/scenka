---
phase: 23-refocus-coach-on-technique
plan: 07
type: execute
wave: 3
autonomous: true
depends_on: [23-01, 23-02, 23-03, 23-04, 23-05]
gap_closure: true
tags:
  - edge function
  - LLM integration
  - prompt engineering
  - technique coaching
  - example guidance
---

# Phase 23 Plan 07: Technique-Focused Example Output Summary

**One-liner:** Updated Edge Function example output to demonstrate technique-first coaching philosophy with "Silent Feet Ladder" drill instead of strength-focused hangboard protocol.

## Deliverables

### Files Modified

| File | Description |
|------|-------------|
| `supabase/functions/openrouter-coach/index.ts` | Updated example output to technique-focused drill |

### Key Changes

**1. Updated weekly_focus:**
```typescript
// Old: "Focus on improving finger strength through structured hangboard training to address your 40% failure rate on crimp-style holds"
// New: "Develop precise footwork and body positioning to address 35% failure rate on technical slab climbs"
```

**2. Updated drill name:**
```typescript
// Old: "7-3-5-3 Hangboard Protocol"
// New: "Silent Feet Ladder"
```

**3. Updated drill description:**
```typescript
// Old: "A progressive hangboard protocol that builds contact strength by alternating between 7-second, 3-second, 5-second, and 3-second hangs with 90-second rests. Targets the half-crimp and open-hand grip positions critical for bouldering."
// New: "Climb 10 easy routes focusing entirely on silent foot placements. Each foot must land without making any sound on the holds. If you hear a foot slap, that route doesn't count. This builds deliberate movement patterns and weight transfer awareness."
```

**4. Added measurable_outcome field:**
```typescript
// Old: field was missing
// New: "Complete 10 routes with 100% silent foot placements"
```

**5. Updated drill parameters:**
- sets: 4 → 5
- reps: "6-8 reps per hold" → "1 route per set"
- rest: "90s" → "2 minutes"

## Architecture

### Prompt Guidance Pattern

```
buildUserPrompt (around lines 206-218)
  ↓
Example output format section
  ↓
{
  "weekly_focus": [technique-focused, addresses specific failure patterns]
  "drills": [
    {
      "name": [movement/positioning/efficiency drill],
      "description": [educational explanation + specific weakness connection],
      "sets": [number],
      "reps": [format appropriate to drill type],
      "rest": [appropriate recovery time],
      "measurable_outcome": [concrete progress metric]
    }
  ]
}
  ↓
LLM generates technique recommendations aligned with example
```

### Terminology Shift

| Old (Strength) | New (Technique) |
|----------------|-----------------|
| hangboard, campus board | silent feet, flagging, drop-knees |
| contact strength, power | body positioning, weight transfer |
| grip positions | movement patterns, center of gravity |
| finger strength | footwork precision, body tension |
| half-crimp, open-hand | slab, overhang, body positioning |

## Dependencies

### Required

- Phase 23-02: Refactored system prompt to technique-first philosophy
- Phase 23-02: Added strength-to-technique reframing in system prompt
- Phase 23-02: Added measurable_outcome field validation to drill schema

### Provides

- Consistent guidance between system prompt and example output
- LLM receives aligned signals on technique emphasis
- Example demonstrates measurable_outcome requirement
- Completes gap closure on prompt-example alignment

## Technical Decisions

### 1. Silent Feet Drill Choice

**Reasoning:**
- Universally applicable to all climbing disciplines (bouldering, sport, trad)
- Directly measurable (silent vs. audible foot placements)
- Teaches deliberate movement and weight transfer
- Addresses technique gap, not strength
- Easy to understand for all ability levels

### 2. Technical Slab Example

**Reasoning:**
- Slab climbing is inherently technique-dependent
- Failure patterns on slab are almost always body positioning/footwork
- Contrasts with overhang (strength) to emphasize technique philosophy
- Demonstrates how "weaknesses" connect to specific drill focus

### 3. Added measurable_outcome Field

**Reasoning:**
- Old example was missing this field (validation added in 23-02)
- Ensures example matches schema validation requirements
- Demonstrates concrete progress tracking expectation
- Prevents LLM from omitting this critical field

### 4. Single Drill Example

**Reasoning:**
- System prompt requests "3 specific training drills"
- Example shows one drill to save token space while demonstrating structure
- LLM understands pluralization from context
- Reduces prompt length while maintaining clarity

## Gap Closure

### Issue Identified

The example output in buildUserPrompt contradicted the system prompt's technique-first philosophy:

**System prompt (line 30-31):**
```
Your core philosophy: most 'strength' failures are actually technique gaps.
```

**Old example (line 208-212):**
```typescript
"weekly_focus": "Focus on improving finger strength through structured hangboard training..."
"drills": [{
  "name": "7-3-5-3 Hangboard Protocol",
  "description": "...builds contact strength..."
}]
```

### Solution Implemented

Updated example to demonstrate technique-first approach:

**New example (line 208-216):**
```typescript
"weekly_focus": "Develop precise footwork and body positioning..."
"drills": [{
  "name": "Silent Feet Ladder",
  "description": "...builds deliberate movement patterns and weight transfer awareness."
}]
```

### Alignment Verification

| Aspect | System Prompt | Example | Aligned? |
|--------|---------------|---------|----------|
| Philosophy | technique-first | technique-first | Yes |
| Terminology | movement/positioning/efficiency | silent feet, movement patterns | Yes |
| Strength reframing | Pumped → efficiency | footwork/positioning focus | Yes |
| Measurable outcome | required | included | Yes |

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Success Criteria Verification

- [x] Example drill is technique-focused (Silent Feet, not hangboard/campus)
- [x] Example weekly_focus emphasizes technique over strength
- [x] Example includes measurable_outcome field (was missing before)
- [x] JSON structure remains valid
- [x] No other sections of buildUserPrompt modified

## Next Phase Readiness

### Ready For:
- Edge Function deployment: `npx supabase functions deploy openrouter-coach`
- Testing updated example output with real user data
- Phase 23 verification: Review all changes against coaching philosophy

### Considerations:
- Example change may slightly affect LLM output style (more technique-focused)
- Users will see technique-oriented recommendations post-deployment
- Previous cached recommendations remain unchanged until regeneration

### Blockers:
- **Edge Function deployment:** User must run `npx supabase functions deploy openrouter-coach`
- **OpenRouter API key:** Must be configured in Supabase Dashboard for Edge Function

## Metrics

- **Duration:** 2 minutes
- **Files Modified:** 1
- **Lines Changed:** 7 (6 replacements, 1 addition)
- **Commits:** 1

---

**Phase:** 23 of 23 (Refocus Coach on Technique)
**Plan:** 07 of 5 (gap closure)
**Status:** Complete
**Completed:** 2026-01-19
