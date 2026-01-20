# Phase 28: Rework Chat System Prompt and Data Context - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance chatbot's system prompt and data context to (1) improve response quality/relevance and (2) integrate latest recommendations so users can discuss and ask questions about their current weekly focus, drills, and projecting focus areas.

</domain>

<decisions>
## Implementation Decisions

### System prompt strategy
- **Role:** Conversational climbing coach with deep knowledge — friendly but authoritative
- **Primary purpose:** Clarify things from drills and recommendations page or ask about alternatives
- **Recommendation integration:** Reactive to user questions only — chatbot does not proactively reference recommendations unless user specifically asks about them
- **User profile usage:** Contextual references only — only reference user climbing context and preferences when directly relevant to the question being asked
- **Directiveness:** Answer-focused, user drives flow — let the user determine conversation direction, answer questions thoroughly without forcing next steps

### Chatbot behavior with recommendations
- **Reference style:** Concept-first, drill names secondary — explain technique concepts first, only mention specific drill names as secondary identifiers if relevant
- **Acknowledgment:** Explicitly tie to recommendation page — use phrases like "As I mentioned in your weekly drill..." or reference the recommendations page directly when discussing drills/focus areas
- **Drill response structure:** Drill explanation + alternatives — explain the drill briefly, then offer alternative approaches or variations to give the user options
- **Mismatched drill handling:** Offer alternatives, no regeneration suggestion — when user says a drill doesn't work for them, suggest alternative drills or approaches, do not suggest regenerating recommendations

### Data context passed to chatbot
- **Recommendation content:** Full recommendation content — pass the complete recommendation object including weekly focus statement, all 3 drills (full descriptions), projecting focus areas, generation date, and any other fields
- **Missing data handling:** Include only if available — only include recommendations and user profile data (climbing context, preferences) in the prompt if they exist; if missing, the system prompt should handle gracefully without errors
- **Data format:** Optimized for LLM consumption — restructure recommendation data into a simplified, LLM-friendly format with clear labels and organization rather than raw database JSON
- **Data structure:** One unified recommendations block — all recommendation data in a single structured section within the system prompt for clarity and easy reference

### Claude's Discretion
- Exact LLM-friendly format structure and labels
- How to format projecting focus areas within the unified block
- Specific wording of system prompt instructions
- Token optimization strategies if needed

</decisions>

<specifics>
## Specific Ideas

- Primary purpose is clarification and alternatives — users are coming from recommendations page with questions
- Explicit acknowledgment of recommendations page creates continuity between the two features
- "Concept-first" approach means teaching the underlying technique rather than just explaining the drill

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 28-rework-chat-system-prompt-and-data-context*
*Context gathered: 2026-01-19*
