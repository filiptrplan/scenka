# Phase 23: Refocus Coach on Technique - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Review and modify the AI coach system to focus exclusively on technique and technique drills, removing strength training emphasis. This affects the LLM system prompt, pattern analysis, and drill generation. New capabilities (e.g., adding new analysis features) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### System prompt changes

**Constraint type:** Soft constraint — avoid strength/power recommendations, but allow minor strength elements if they support technique (e.g., body tension drills)

**Exception handling:** If failure reason isn't EXACTLY "failed because can't crimp small crimps" then refocus on technique

**Technique emphasis:** Movement quality focus — emphasize movement quality, body positioning, footwork, timing, and efficiency

**Strength failure response:** Reframe as technique — explain why technique should be prioritized first, then explain + provide technique alternatives (e.g., when pumped, focus on efficient movement and resting technique)

**Reframing philosophy:** When strength issues arise, reframe them as technique gaps (e.g., "your feet aren't supporting your hands") and provide concrete technique drills to address the root cause

### Technique drill types

**Drill categories:** All categories — movement drills (silent feet, straight arms, body tension), positioning drills (flagging, drop-knees, back-steps), efficiency drills (rest positions, clipping sequence), footwork drills (precision, smear usage, heel/toe hooks), body positioning drills (center of gravity, hip turns, momentum), reading drills (beta visualization, sequence planning)

**Strength handling:** Map strength failures to technique — pumped → explain efficient movement, finger strength → explain crimping technique, power → explain momentum and body positioning

**Drill specificity:** Balanced — mix of specific drills for current level and broader technique concepts for long-term development

**Success criteria:** Measurable outcomes — each drill should have clear measurable outcome (e.g., "Complete 10 routes with feet silent") so users can track progress

### Pattern analysis adjustments

**Individual climb data:** Keep aggregated patterns but include the last 30 climbs for context — aggregated patterns for overview, individual climb details for specific technique breakdowns

**Pattern extraction strategy:** Just give the LLM the raw climb data including the notes, terrain type, climb type and failure reasons. Also the date. Let the LLM identify patterns itself.

**Data scope:** Aggregated + raw — send both aggregated patterns (current approach) AND raw climb data for context. LLM can reference either.

**Time patterns:** Include dates — LLM should be able to see progression over time and recent trends from the last 30 climbs with dates

**Climb data fields:** Send last 30 climbs with grade, style, outcome, failure reason, notes, awkwardness, terrain type, climb type, and date

### User mindset reframing

**Initial philosophy explanation:** Direct reframing — "Strength issues = technique in disguise. If you can't hold that crimp, it's about body position, not finger strength."

**Reframing frequency:** Weekly only — explain the philosophy once in the weekly focus statement, then focus on drills in individual recommendations

**Reframing examples:** Flexible approach — mix specific examples and general principles depending on the user's data

**User pushback handling:** Allow pushback — acknowledge user disagreement and explain further if they question the reframing (e.g., "No, I really am weak!")

### Claude's Discretion

- Exact wording of system prompt while meeting all constraints
- How to structure raw climb data in the prompt
- Balance of aggregated vs individual data in each API call
- Specific examples for each strength→technique mapping
- Tone and style of weekly focus statement

</decisions>

<specifics>
## Specific Ideas

- Include climbing-specific reframing: pumped → energy conservation drills (silent feet, straight arms, deadpoint efficiency)
- Core failure → body tension and centering drills
- Finger strength failure → crimping technique explanation with body position focus
- Each drill must have measurable outcomes for user progress tracking

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-refocus-coach-on-technique*
*Context gathered: 2026-01-18*
