# Phase 20: LLM Integration - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Edge Function implementation that connects the existing coach recommendation system to OpenRouter's LLM API to generate personalized climbing training content (weekly focus statement and 3 drills). This phase handles server-side prompt construction, API calls, response validation, and error handling. Phase 21 will build the interactive chat interface.

</domain>

<decisions>
## Implementation Decisions

### Prompt Engineering Approach
- Use **template-based** prompts with pre-written templates and data slots filled by user data
- Send **full context** to the LLM: failure patterns, style weaknesses, climbing frequency, profile preferences
- Use **balanced temperature** (0.5-0.7) for a balance of creativity and reliability
- Use **separate system prompt** — leverage the special system role that most LLM models support

### Prompt Structure & Content
- LLM should return **JSON schema** with structured output for parsing
- Use **technical climbing terminology** (drill names, periodization, antagonist training, campus board protocols)
- For drills specifically: explain what the drill is (educational value)
- **Weakness-based coaching philosophy** — emphasize addressing weaknesses identified in user's data

### Output Validation
- Require **complete JSON schema**: focus_statement, drills[] (each with title + description), target_grade, difficulty_level, estimated_time per drill
- Validate **JSON structure** (field presence, types)
- On invalid JSON or missing fields: **retry a couple of times**, then report error

### Claude's Discretion
- Specific model choice within OpenRouter
- Exact number of retry attempts (2-3 likely)
- Error message wording for user
- Whether to log validation failures for debugging
- Token limit handling for large context

</decisions>

<specifics>
## Specific Ideas

- "Definitely send system as separate as most models have a special system role."
- "Technical but for example for drills should explain what the drill is."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-llm-integration*
*Context gathered: 2026-01-17*
