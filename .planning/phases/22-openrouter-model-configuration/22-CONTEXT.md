# Phase 22: OpenRouter Model Configuration - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the OpenRouter model selection configurable via environment variables instead of hardcoding it. Both chat (openrouter-chat) and recommendations (openrouter-coach) Edge Functions should use the configured model. Enable include_usage parameter for accurate cost tracking.

</domain>

<decisions>
## Implementation Decisions

### Environment variable design
- Single shared env var: `OPENROUTER_MODEL` used by both chat and recommendations Edge Functions
- Only model ID is configurable - temperature, max_tokens, etc. remain hardcoded
- Edge Functions read env var directly using `Deno.env.get('OPENROUTER_MODEL')`

### Cost tracking with include_usage
- Always enable `include_usage: true` in all OpenRouter API calls
- Use `usage.cost` field directly from OpenRouter response for cost_usd (not calculate ourselves)
- Store only core fields in coach_api_usage: prompt_tokens, completion_tokens, total_tokens, cost_usd
- Do NOT store additional details like cached_tokens, reasoning_tokens, cost_details
- coach_api_usage table already has `model` column - use it to store the configured model ID

### Claude's Discretion
- How to handle missing OPENROUTER_MODEL env var (fail fast or default)
- Whether to validate model ID at startup vs just pass through
- How to use the usage data from SSE streaming responses (need to collect/aggregate)

</decisions>

<specifics>
## Specific Ideas

- OpenRouter include_usage sample response shows cost in format: `{ usage: { cost: 0.95, prompt_tokens: 194, completion_tokens: 2, total_tokens: 196 } }`
- Use that cost field directly, don't recalculate
- coach_api_usage table already exists with model column

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-openrouter-model-configuration*
*Context gathered: 2026-01-19*
