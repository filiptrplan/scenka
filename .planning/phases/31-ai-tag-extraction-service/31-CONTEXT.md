# Phase 31: AI Tag Extraction Service - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

## Phase Boundary

Backend service that asynchronously extracts tags from climb notes using AI, with cost tracking, rate limiting, and privacy protection. Never blocks save flow — runs after climb is persisted. Tag display and editing are in Phase 32.

---

## Implementation Decisions

### Tag extraction behavior
- Extract both style tags (movement patterns) AND failure reason tags from notes
- High confidence threshold: Only include tags if AI is 70%+ confident they match user intent
- Maximum tags: 3 styles max + 3 failure reasons max
- At least one failure reason must always be returned (styles can be skipped if unclear)
- Notes truncated to 1000 tokens before AI call to control cost while preserving essential information

### Error handling & recovery
- Retry 2 times on AI API failures (network error, timeout, rate limit)
- Retry delays: 1 second, then 2 seconds (exponential backoff pattern)
- If all retries fail: Show toast notification to user ("Tag extraction failed, you can add tags manually")
- For malformed AI responses (invalid JSON, wrong structure): Try 2 more times in Edge Function, then fail with toast
- Log all errors for debugging, no additional recovery for failed climbs

### Cost & quota enforcement
- Track cost from OpenRouter's usage.cost field AFTER successful API call (failures don't track cost)
- Check quota BEFORE calling AI — prevent API calls if at daily limit (50 climbs/day)
- Hard limit: Block tag extraction at 50 climbs, no partial or overage
- When quota reached: Toast notification + small form indicator showing X/50 used
- Toast message: "Daily quota reached — tags extracted tomorrow. Add manually in Settings."
- Quota resets at UTC midnight

### Model configuration
- Use separate model for tagging: OPENROUTER_TAG_MODEL env var (not shared with coach/chat)
- No default model — OPENROUTER_TAG_MODEL must be explicitly configured
- Temperature: 0.2 (low) for consistent, deterministic tag extraction
- Separate system prompt for tag extraction (not reusing coach prompt)
- Separate Edge Function for tag extraction (not sharing coach/chat function)

### Claude's Discretion
- Exact prompt structure and examples for tag extraction
- How to handle borderline confidence cases (69% vs 71%)
- Toast notification exact wording and timing
- Form indicator visual design and placement

---

## Specific Ideas

None — open to standard approaches for this backend service.

---

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 31-ai-tag-extraction-service*
*Context gathered: 2026-01-21*
