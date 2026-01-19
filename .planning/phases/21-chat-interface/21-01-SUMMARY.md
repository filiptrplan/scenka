---
phase: 21-chat-interface
plan: 01
type: execute
wave: 1
autonomous: true
depends_on: []
tags:
  - Edge Function
  - SSE streaming
  - JWT authentication
  - OpenRouter API
  - OpenAI SDK
  - Server-Sent Events
  - chat interface
  - climbing coach
---

# Phase 21 Plan 01: SSE Streaming Edge Function Summary

**One-liner:** SSE streaming Edge Function with JWT auth, message history context, and climbing-specific system prompt for real-time chat responses.

## Deliverables

### Files Created

| File | Description |
|------|-------------|
| `supabase/functions/openrouter-chat/index.ts` | SSE streaming Edge Function with OpenAI SDK |
| `supabase/functions/_shared/system-prompt.ts` | Climbing coach system prompt module |

### Key Features

**SSE Streaming Implementation:**
- ReadableStream with TextEncoder for real-time response streaming
- SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Chunk format: `data: {"content":"..."}\n\n`
- `data: [DONE]\n\n` signal when streaming completes
- Error handling with graceful stream closure

**Authentication & Authorization:**
- JWT token validation via Supabase `auth.getUser(token)` pattern
- Authorization header parsing (`Bearer <token>`)
- User ID extraction from validated token
- 401/403 status codes for invalid/expired tokens or ID mismatch

**Message History & Context:**
- Fetches last 20 messages from `coach_messages` table for conversation context
- Messages ordered chronologically (desc limit 20, then reverse)
- Both user and assistant messages included in LLM prompt
- User message stored before LLM call, assistant message stored after

**Climbing-Specific System Prompt:**
- Role: Expert climbing coach specializing in bouldering and sport climbing
- Context injection from `patterns_data` (failure patterns, style weaknesses, climbing frequency)
- Technical terminology: beta, crimp, sloper, overhang, slab, send, flash, project, campus board, hangboard
- Concise, helpful response style with clarifying questions when needed

**OpenAI SDK Integration:**
- Base URL: `https://openrouter.ai/api/v1`
- Model: `google/gemini-2.5-pro`
- Streaming enabled: `stream: true`
- Error handling with user-friendly messages
- CORS headers for cross-origin requests

## Architecture

### Request Flow

```
Client Request
  ├─ Authorization: Bearer <JWT>
  ├─ Body: { message: "...", patterns_data: {...} }
  ↓
Edge Function Handler
  ├─ Validate JWT token (Supabase auth.getUser)
  ├─ Parse and validate message (non-empty, max 5000 chars)
  ├─ Store user message in coach_messages
  ├─ Fetch last 20 messages (conversation context)
  ├─ Build LLM messages: system prompt + history + user message
  ↓
SSE Stream
  ├─ OpenAI chat.completions.create({ stream: true })
  ├─ For await...of over response chunks
  ├─ Stream each chunk via SSE format
  ├─ Store assistant message in coach_messages
  ├─ Send [DONE] signal
  ↓
Client receives real-time streaming response
```

### Data Flow

**Input:**
```json
{
  "message": "How can I improve my crimp strength?",
  "patterns_data": {
    "failure_patterns": {
      "most_common_failure_reasons": [
        { "reason": "Pumped", "count": 15, "percentage": 40 }
      ]
    },
    "style_weaknesses": {
      "struggling_styles": [
        { "style": "Crimp", "fail_rate": 0.45, "fail_count": 20, "total_attempts": 44 }
      ]
    },
    "climbing_frequency": {
      "climbs_per_month": 30,
      "avg_climbs_per_session": 4
    }
  }
}
```

**Output (SSE chunks):**
```
data: {"content":"To improve"}
data: {"content":" crimp"}
data: {"content":" strength"}
...
data: [DONE]
```

### System Prompt Template

```
You are an expert climbing coach specializing in bouldering and sport climbing...
[Technical terminology definitions]

User Profile (based on pattern analysis):
- Struggles with: pumped (40%), finger strength (25%)
- Weaknesses in styles: Crimp (45% fail rate), Overhang (35% fail rate)
- Climbing frequency: 30 climbs/month
- Avg per session: 4 climbs

Provide helpful, concise answers. Ask clarifying questions if needed...
```

## Dependencies

### Required

- Phase 20: LLM Integration (Edge Function patterns, CORS headers)
- Phase 18: Coach Tables (coach_messages schema with RLS)
- Phase 18: Pattern Analysis (data structure for patterns_data)

### Provides

- SSE streaming capability for Phase 21-02 (React Chat Interface)
- Authentication pattern for subsequent Edge Functions
- System prompt module reuse for coach recommendations

## Technical Decisions

### 1. SSE vs WebSocket Chosen

**Reasoning:**
- SSE is simpler for one-way streaming (server → client)
- Built-in reconnection support in browsers
- HTTP-based (works through firewalls/proxies)
- Lower overhead than WebSocket for this use case

### 2. Message History Limit of 20

**Reasoning:**
- Balances context relevance with token usage
- Provides enough conversation history for coherent responses
- Keeps API costs manageable (context window ~10k tokens)
- Consistent with existing client-side limit in useCoachMessages hook

### 3. Store Messages During Streaming

**Reasoning:**
- User message stored immediately (before LLM call) - ensures persistence even if streaming fails
- Assistant message stored after streaming completes - ensures full content captured
- Non-blocking on storage errors - streaming continues even if database write fails
- Full conversation history maintained for future context

### 4. System Prompt in Shared Module

**Reasoning:**
- Reusability across Edge Functions (chat, recommendations, etc.)
- Centralized maintenance of coaching persona
- Type-safe pattern analysis context injection
- Easier testing and iteration on prompt engineering

### 5. Model Selection: google/gemini-2.5-pro

**Reasoning:**
- Consistent with Phase 20 openrouter-coach implementation
- High-quality responses with climbing-specific knowledge
- Cost-effective pricing via OpenRouter
- Fast streaming latency for real-time chat experience

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Success Criteria Verification

- [x] Edge Function created at supabase/functions/openrouter-chat/index.ts
- [x] SSE streaming implemented with proper headers (Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive)
- [x] JWT authentication via Supabase auth.getUser() pattern
- [x] Message history context (last 20 messages) fetched and included in LLM prompt
- [x] SSE chunks streamed in format: `data: {"content":"..."}\n\n`
- [x] [DONE] signal sent when streaming completes
- [x] System prompt module created with climbing expertise and context injection
- [x] User/assistant messages stored in coach_messages table
- [x] Error handling with graceful stream closure and user-friendly messages
- [x] CORS headers properly configured

## Next Phase Readiness

### Ready For:
- Phase 21-02: React Chat Interface - SSE consumer component
- Phase 21-03: Chat Message Persistence - database operations (already integrated)

### Considerations:
- User must run `npx supabase functions deploy openrouter-chat` after deployment
- OPENROUTER_API_KEY must be configured in Supabase Dashboard (already set for Phase 20)
- Testing will require valid JWT token from authenticated user session

### Blockers:
None identified. Implementation is complete and follows established patterns from Phase 20.

## Metrics

- **Duration:** 1 minute
- **Files Created:** 2
- **Lines Added:** 332
- **Tests Verified:** N/A (manual verification during Phase 21-02)
- **Commits:** 1

---

**Phase:** 21 of 21 (Chat Interface)
**Plan:** 01 of 5
**Status:** Complete
**Completed:** 2026-01-19
