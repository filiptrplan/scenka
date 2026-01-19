# Phase 24: Projecting Focus Recommendations - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

## Phase Boundary

Add "Projecting Focus" section to coach recommendations tab that provides guidance on how users should select boulders to project on each week. This is project selection guidance (e.g., "focus on dyno slabs or tensiony overhangs"), not specific boulder recommendations. Phase scope includes: data analysis for guidance, UI section below drills, AI integration to generate guidance content.

## Implementation Decisions

### Data to include
- Primary driver: User's style weaknesses (e.g., crimps, slopers, pinches)
- Scope: Gym-only recommendations (not crag-specific)
- Time window: Seasonal data (past few months, not all time)
- Guidance type: How to choose projects, not which specific boulders to climb
- Relationship to drills: Independent guidance — no need to consider current drilling focus
- Specificity: Broad in general but add some details (e.g., "crimpy overhangs" not just "overhangs")
- Gym awareness: Be mindful of limitations (not all gyms set dynos with toe hooks, but all set crimpy overhangs)

### UI integration
- Location: Section below "Weekly Focus" and "Drills" in Recommendations tab (not new tab)
- Visual style: Same styling as drills (cards/sections)
- Refresh: Regenerates automatically with other recommendations (no separate manual button)

### Content format
- Quantity: 3-4 project focus areas recommended
- Grade guidance: Qualitative only (e.g., "slightly above your max grade," not specific V5-V7 ranges)
- Gym limitations: General guidance only (don't explicitly mention "your gym doesn't set dynos")

### AI integration
- Endpoint: Add `projecting_focus` field to existing openrouter-coach response (same endpoint)
- Drill awareness: No need to consider drilling focus in project guidance
- Guidance philosophy: Training-focused (prioritize projects that address weaknesses and build skills)

### Claude's Discretion
- Exact wording and structure of project guidance sections
- How many details to include per focus area
- Visual spacing and layout within Recommendations tab
- Whether to include icons or visual indicators per focus area

## Specific Ideas

- "It should be broad in general but add some details. Be mindful of limitations of a specific gym. Not all gyms set dynos with toe hooks but all of them set crimpy overhangs."
- Same styling as existing drills section

## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 24-projecting-focus-recommendations*
*Context gathered: 2026-01-19*
