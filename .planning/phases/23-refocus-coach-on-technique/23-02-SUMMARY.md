---
phase: 23-refocus-coach-on-technique
plan: 02
type: execute
wave: 1
autonomous: true
depends_on: []
tags:
  - Edge Function
  - system prompt
  - technique coaching
  - drill schema
  - validation
  - climbing coach
  - OpenRouter API
---

# Phase 23 Plan 02: Refocus Coach on Technique Summary

**One-liner:** Updated Edge Function system prompt to focus on technique coaching with strength-to-technique reframing, and added measurable_outcome field validation to drill schema for progress tracking.

## Deliverables

### Files Modified

| File | Description |
|------|-------------|
| `supabase/functions/openrouter-coach/index.ts` | Updated system prompt and added measurable_outcome validation |

### Key Changes

**System Prompt Refactoring:**
- Replaced strength-focused coaching philosophy with technique-first approach
- Added core philosophy: "most 'strength' failures are actually technique gaps"
- Replaced strength terminology (hangboard, campus board, antagonistic training, periodization) with technique drills:
  - Movement drills (silent feet, straight arms, body tension)
  - Positioning drills (flagging, drop-knees, back-steps)
  - Efficiency drills (rest positions, clipping sequence)
  - Footwork drills (precision, smear usage, heel/toe hooks)
  - Body positioning drills (center of gravity, hip turns, momentum)

**Strength-to-Technique Reframing:**
- Pumped: Explain efficient movement and resting technique to conserve energy
- Finger Strength: Explain crimping technique with proper body position to reduce load
- Core: Explain body tension drills to improve center of gravity control
- Power: Explain momentum and body positioning drills for dynamic movement

**Drill Schema Enhancement:**
- Added `measurable_outcome` field to drill objects
- Enforces minimum 10 character length for measurable outcomes
- Ensures all drills have concrete, measurable criteria for progress tracking
- Examples: "Complete 10 routes with feet silent", "Perform 20 flagging drills without repositioning"

## Architecture

### System Prompt Structure

```
You are an expert climbing coach specializing in bouldering and sport climbing technique.
Your core philosophy: most 'strength' failures are actually technique gaps.

[JSON structure requirements]

Each drill must have:
- name: Technique-focused drill name
- description: Educational explanation
- sets: Number of sets
- reps: Repetition count or duration
- rest: Rest period between sets
- measurable_outcome: Concrete, measurable outcome for tracking progress

[Technique drill categories]
[Strength-to-technique reframing guidance]
```

### Validation Flow

```
LLM Response
  ↓
cleanResponse() - Remove markdown code blocks
  ↓
JSON.parse() - Parse to object
  ↓
validateResponse() - Validate structure
  ├─ weekly_focus: non-empty string
  ├─ drills: array of 1-3 objects
  │   └─ For each drill:
  │       ├─ name: non-empty string
  │       ├─ description: min 20 chars
  │       ├─ sets: integer 1-10
  │       ├─ reps: non-empty string
  │       ├─ rest: non-empty string
  │       └─ measurable_outcome: min 10 chars (NEW)
  ↓
Store validated response in coach_recommendations
```

## Dependencies

### Required

- Phase 20: LLM Integration (openrouter-coach Edge Function)
- Phase 18: Coach Tables (coach_recommendations schema)
- Phase 18: Pattern Analysis (data structure for patterns_data)

### Provides

- Technique-focused system prompt for climbing coach recommendations
- Measurable outcome validation for drill progress tracking
- Foundation for Phase 23-01: Review pattern analysis data passed to coach

## Technical Decisions

### 1. Technique-First Coaching Philosophy

**Reasoning:**
- Most climbers blame strength when technique is the real issue
- Technique improvements provide better long-term gains than strength training
- Reduces risk of injury from overtraining on hangboards/campus boards
- Aligns with the app's focus on logging "significant" climbs (technique failures, not just strength)

### 2. Specific Strength-to-Technique Reframing

**Reasoning:**
- Provides concrete guidance for the LLM to interpret failure patterns
- Helps users understand the connection between perceived strength deficits and technique gaps
- Enables more targeted drill recommendations that address root causes
- Examples given for the 4 most common "strength" failure reasons in the app

### 3. Measurable Outcomes Required

**Reasoning:**
- Users need concrete criteria to track drill progress
- "Do some climbing drills" is too vague - "Complete 10 routes with silent feet" is actionable
- Enables future features like progress tracking and drill completion tracking
- Minimum 10 characters ensures meaningful outcomes, not just "better climbing"

### 4. No Schema Migration Required

**Reasoning:**
- The coach_recommendations table uses JSONB for content storage (Phase 18-01 decision)
- Adding measurable_outcome field is purely a validation change
- Existing stored recommendations can coexist - new recommendations will have the field
- No database migration needed, only Edge Function deployment

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Success Criteria Verification

- [x] System prompt focuses on technique (not strength)
- [x] Strength failures are reframed as technique gaps (pumped, finger strength, core, power)
- [x] Drill terminology examples are technique-focused (movement, positioning, efficiency, footwork, body positioning)
- [x] measurable_outcome field is validated (non-empty string, min 10 chars)
- [x] Existing validation for other drill fields remains intact (name, description, sets, reps, rest)
- [x] Edge Function can be deployed (no syntax errors, Deno runtime compatible)

## Next Phase Readiness

### Ready For:
- Phase 23-01: Review pattern analysis data passed to coach - verify strength failure reasons are being properly analyzed
- Phase 23-03: (if added) UI updates to display measurable outcomes in drill recommendations

### Considerations:
- User must run `npx supabase functions deploy openrouter-coach` to deploy updated Edge Function
- Existing cached recommendations won't have measurable_outcome field until they regenerate
- New drill recommendations will include measurable_outcome field with concrete criteria

### Blockers:
None identified. Implementation is complete and follows established patterns.

## Metrics

- **Duration:** 2 minutes
- **Files Modified:** 1
- **Lines Changed:** +24, -8
- **Tests Verified:** N/A (manual verification required during deployment)
- **Commits:** 2

---

**Phase:** 23 of 23 (Refocus Coach on Technique)
**Plan:** 02 of 2
**Status:** Complete
**Completed:** 2026-01-19
