# Architecture Patterns

**Domain:** AI Coach for Climbing PWA
**Researched:** 2026-01-17
**Confidence:** HIGH

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React App (PWA)                       │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CoachPage   │  │ ChatInterface│  │ Recommendations│     │
│  │ (Tabs)      │  │              │  │ Display       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Hooks Layer (TanStack Query)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │useRecommend  │  │useChat       │  │usePatternAgg │     │
│  │ations        │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Services Layer                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ coach.ts     │  │ patterns.ts  │  │ climbs.ts    │     │
│  │ (LLM calls)  │  │ (aggregation)│  │ (existing)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  External APIs                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │OpenRouter   │  │Supabase      │  │Supabase      │     │
│  │(via Edge)   │  │PostgreSQL    │  │Auth          │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **CoachPage** | Main coach page with tabs (Recommendations, Chat) | RecommendationsDisplay, ChatInterface, TanStack Query |
| **RecommendationsDisplay** | Shows weekly focus + 3 drills + pattern analysis | useRecommendations, PatternAnalysis |
| **ChatInterface** | Free-form chat with message history | useChat, usePatternAgg |
| **PatternAnalysis** | Displays pre-processed climbing patterns (3 sections) | usePatternAgg (for aggregated data) |
| **useRecommendations** | Fetch/refresh recommendations from DB/API | coach service (get/generate) |
| **useChat** | Manage chat messages, send/receive | coach service (sendMessage) |
| **usePatternAgg** | Aggregate climbs into pattern summary | climbs service, existing analytics logic |
| **coach service** | LLM API calls, recommendation storage | Supabase Edge Function, DB tables |
| **patterns service** | Pattern aggregation logic (extracted from charts) | climbs table, returns structured data |
| **OpenRouter Edge Function** | Secure LLM API proxy, prompt engineering | OpenRouter API, env vars |

## Data Flow

### 1. Recommendations Flow

```
User taps "Refresh" button
    │
    ▼
useRecommendations.refreshRecommendations()
    │
    ▼
coach.generateRecommendations(patterns)
    │
    ▼
[Pattern Aggregation]
    ├── Fetch all user climbs (via useClimbs)
    ├── Aggregate: Failure Patterns
    ├── Aggregate: Style Weaknesses
    └── Aggregate: Climbing Frequency
    │
    ▼
[LLM Prompt Construction]
    ├── Inject failure patterns
    ├── Inject style weaknesses
    ├── Inject climbing frequency
    └── Add climbing knowledge context
    │
    ▼
[Supabase Edge Function]
    ├── Secure API call to OpenRouter
    ├── Model: openai/gpt-5.1
    └── Response: { focus, drills: [...] }
    │
    ▼
[Store to DB]
    ├── Insert into coach_recommendations
    ├── user_id, created_at, focus, drills, patterns
    └── Return saved recommendation
    │
    ▼
[TanStack Query Cache Update]
    ├── Invalidate queries
    └── Re-fetch coach recommendations
    │
    ▼
UI Updates (show new recommendations)
```

### 2. Chat Flow

```
User sends message: "How do I improve dynos?"
    │
    ▼
ChatInterface.onSend(message)
    │
    ▼
useChat.sendMessage(message)
    │
    ├── Optimistic update: Add message to cache immediately
    │
    ▼
coach.sendMessage(message, history, patterns)
    │
    ├── Fetch message history (last 10-20 from DB)
    ├── Fetch pattern summary (from patterns service)
    └── Construct prompt with context:
    │   ├── User message
    │   ├── Conversation history
    │   └── Climbing patterns (Failure Patterns, Style Weaknesses, Frequency)
    │
    ▼
[Supabase Edge Function]
    ├── OpenRouter API call
    └── Response: { role: "assistant", content: "..." }
    │
    ▼
[Store to DB]
    ├── Insert user message into coach_messages
    ├── Insert assistant message into coach_messages
    └── Return both messages
    │
    ▼
[TanStack Query Cache Update]
    ├── Invalidate message queries
    └── Re-fetch messages
    │
    ▼
UI Updates (show conversation)
```

## Database Schema

### coach_recommendations table

```sql
CREATE TABLE public.coach_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  focus TEXT NOT NULL,              -- Weekly focus area (e.g., "Dynamic Movement")
  drills JSONB NOT NULL,            -- Array of 3 drill objects
                                    -- [{ title, description, duration }]
  patterns JSONB NOT NULL,          -- Pre-processed pattern summary
                                    -- { failurePatterns, styleWeaknesses, frequency }
);

-- RLS Policies
CREATE POLICY "Users can view own recommendations"
  ON public.coach_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.coach_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON public.coach_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX coach_recommendations_user_id_idx
  ON public.coach_recommendations(user_id);
CREATE INDEX coach_recommendations_created_at_idx
  ON public.coach_recommendations(created_at DESC);
```

### coach_messages table

```sql
CREATE TABLE public.coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context JSONB DEFAULT '{}',    -- Optional: patterns snapshot at time of message
);

-- RLS Policies
CREATE POLICY "Users can view own messages"
  ON public.coach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.coach_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX coach_messages_user_id_idx
  ON public.coach_messages(user_id);
CREATE INDEX coach_messages_created_at_idx
  ON public.coach_messages(created_at DESC);
```

## Patterns to Follow

### Pattern 1: Service Layer Separation

**What:** Separate data fetching/logic from UI components
**When:** Always - follows existing architecture

**Example:**
```typescript
// src/services/coach.ts
export async function generateRecommendations(
  patterns: PatternSummary
): Promise<Recommendation> {
  const response = await supabase.functions.invoke('openrouter-coach', {
    body: { type: 'recommendations', patterns },
  })
  // Save to DB
  return response.data
}

// src/hooks/useCoach.ts
export function useRecommendations() {
  return useQuery({
    queryKey: coachKeys.recommendations(),
    queryFn: getRecommendations,
  })
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient()
  const { data: patterns } = usePatternAgg()

  return useMutation({
    mutationFn: () => generateRecommendations(patterns),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.recommendations() })
    },
  })
}
```

### Pattern 2: Pattern Aggregation Extraction

**What:** Extract pattern aggregation logic from charts-page.tsx into reusable service
**When:** Need to reuse analytics data for AI coach

**Example:**
```typescript
// src/services/patterns.ts
export async function aggregatePatterns(
  climbs: Climb[]
): Promise<PatternSummary> {
  const failurePatterns = aggregateFailurePatterns(climbs)
  const styleWeaknesses = aggregateStyleWeaknesses(climbs)
  const climbingFrequency = aggregateClimbingFrequency(climbs)

  return {
    failurePatterns,
    styleWeaknesses,
    climbingFrequency,
  }
}

function aggregateFailurePatterns(climbs: Climb[]): FailurePatterns {
  const reasonCount = new Map<FailureReason, number>()
  climbs.forEach((climb) => {
    if (climb.outcome === 'Fail') {
      climb.failure_reasons.forEach((reason) => {
        reasonCount.set(reason, (reasonCount.get(reason) ?? 0) + 1)
      })
    }
  })
  // ... convert to structured format
}
```

### Pattern 3: TanStack Query for Chat Messages

**What:** Use TanStack Query for chat message caching with optimistic updates
**When:** Implementing chat interface

**Example:**
```typescript
// src/hooks/useCoach.ts
export function useChatMessages() {
  return useQuery({
    queryKey: coachKeys.messages(),
    queryFn: getMessages,
    staleTime: 0, // Always refetch for chat
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: coachKeys.messages() })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<CoachMessage[]>(
        coachKeys.messages()
      )

      // Optimistically update to the new value
      queryClient.setQueryData<CoachMessage[]>(
        coachKeys.messages(),
        (old = []) => [
          ...old,
          { ...newMessage, id: 'temp-id', created_at: new Date().toISOString() },
        ]
      )

      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(coachKeys.messages(), context?.previousMessages)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.messages() })
    },
  })
}
```

### Pattern 4: Supabase Edge Function for LLM API

**What:** Secure LLM API calls via Supabase Edge Function
**When:** Any LLM API integration (security requirement)

**Example:**
```typescript
// supabase/functions/openrouter-coach/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
const MODEL = 'openai/gpt-5.1'

serve(async (req) => {
  const { type, patterns, message, history } = await req.json()

  if (type === 'recommendations') {
    const prompt = buildRecommendationsPrompt(patterns)
    const response = await callOpenRouter([{ role: 'user', content: prompt }])

    const recommendation = parseRecommendation(response)
    return new Response(JSON.stringify(recommendation), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (type === 'chat') {
    const prompt = buildChatPrompt(message, history, patterns)
    const response = await callOpenRouter(prompt)

    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: response,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

async function callOpenRouter(messages: Message[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://scenka.app',
      'X-Title': 'Scenka Climbing Coach',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1000,
    }),
  })

  const data = await res.json()
  return data.choices[0].message.content
}
```

### Pattern 5: Offline-First for Recommendations

**What:** Persist recommendations to DB so they work offline
**When:** Recommendations feature

**Rationale:** Recommendations are saved to database, so they can be viewed even when offline. Chat requires online for new messages but can show cached history offline.

**Example:**
```typescript
// Coach recommendations are persisted in coach_recommendations table
// TanStack Query caches them, so they're available offline
export function useRecommendations() {
  return useQuery({
    queryKey: coachKeys.recommendations(),
    queryFn: getRecommendations,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: Infinity, // Never garbage collect (keep offline)
  })
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side API Keys

**What:** Calling OpenRouter directly from React components with API key in env
**Why bad:**
- Exposes API key in client bundle (inspectable)
- Violates security best practices
- OpenRouter FAQ recommends server-side storage for production use

**Instead:**
- Use Supabase Edge Function to proxy requests
- Store API key in Supabase project secrets
- Only function-to-function communication

### Anti-Pattern 2: LLM Request Queuing for Offline

**What:** Queueing LLM API requests to offlineQueue when offline
**Why bad:**
- Unexpected API costs when sync happens
- User didn't initiate these requests
- Violates user control principle (manual refresh only)

**Instead:**
- Only persist recommendations (manual trigger)
- Don't queue chat messages when offline
- Show error: "Chat requires internet connection"

### Anti-Pattern 3: LLM Logic in Components

**What:** Putting prompt construction, API calls, and response parsing in React components
**Why bad:**
- Violates separation of concerns
- Hard to test
- Reusable logic locked in UI layer

**Instead:**
- All LLM logic in services layer
- Components use hooks that call services
- Clear boundaries: UI → Hooks → Services → External APIs

### Anti-Pattern 4: Bypassing TanStack Query

**What:** Making API calls directly in useEffect or event handlers
**Why bad:**
- Breaks existing architecture patterns
- No caching, loading states, or error handling
- Doesn't work with offline queue pattern

**Instead:**
- Always use TanStack Query for server state
- Follow existing service/hook pattern from climbs.ts/useClimbs.ts

### Anti-Pattern 5: Unlimited Chat History

**What:** Storing all chat messages forever
**Why bad:**
- Bloats database
- Increases LLM token costs (more context)
- Privacy concerns (old climbing data)

**Instead:**
- Limit to 10-20 most recent messages
- Provide "Clear Conversation" button
- Auto-prune when exceeding limit

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 100K users |
|---------|--------------|--------------|---------------|
| **Database size** | Fine (PostgreSQL) | Fine (add indexes) | Need partitioning by user_id |
| **Recommendations storage** | Fine (1 per user) | Fine (10K rows) | Archive old recommendations (> 90 days) |
| **Chat messages** | Fine (10-20 per user) | Fine (200K rows) | Auto-delete messages after 30 days |
| **API costs (OpenRouter)** | Low (free tier) | Medium ($10-50/mo) | High (need tiered limits) |
| **Edge Function calls** | Fine (Supabase free) | Fine (Pro tier) | Need rate limiting |

**Mitigation strategies for scale:**
1. Add `created_at` index on coach_recommendations and coach_messages
2. Implement auto-archiving for old recommendations (> 90 days)
3. Add rate limiting to Edge Function (max 100 requests/user/hour)
4. Cache pattern summaries for 1 hour to reduce aggregation compute
5. Consider adding Redis for high-scale caching (if needed)

## Build Order Dependencies

```
Phase 1: Foundation (Database + Services)
├── Create coach_recommendations table
├── Create coach_messages table
├── Create coach service (get/save recommendations)
├── Create patterns service (aggregate from climbs)
└── Create useCoach hooks
    └── Depends on: Database tables, coach service, patterns service

Phase 2: Coach Page + Recommendations UI
├── Create CoachPage component with tabs
├── Create RecommendationsDisplay component
├── Create PatternAnalysis component
├── Implement manual refresh button
└── Test with mock data (no LLM yet)
    └── Depends on: Phase 1

Phase 3: LLM Integration (Edge Function)
├── Create Supabase Edge Function (openrouter-coach)
├── Implement prompt templates for recommendations
├── Connect coach service to Edge Function
├── Add error handling (fallback to previous recommendations)
└── Test with real LLM responses
    └── Depends on: Phase 2 (UI ready to display)

Phase 4: Chat Interface
├── Create ChatInterface component
├── Implement message display (bubbles, scrolling)
├── Add input field with send button
├── Implement optimistic updates (TanStack Query)
├── Inject pattern context into prompts
└── Test conversation flow
    └── Depends on: Phase 3 (Edge Function ready), Phase 1 (chat tables)

Phase 5: Polish & Offline Support
├── Add loading states for LLM calls
├── Add error boundaries for API failures
├── Test offline behavior (recommendations work, chat shows error)
├── Add "Clear Conversation" button
└── Test on mobile (44px+ touch targets)
    └── Depends on: Phase 4 (chat working)
```

**Why this order:**
1. **Foundation first:** Database + services layer must exist before UI
2. **UI before LLM:** Can build and test UI with mock data, then plug in real API
3. **Recommendations before chat:** Simpler feature, validates LLM integration first
4. **Polish last:** Loading states, error handling, offline support need working features

## Integration with Existing Architecture

### Leverages Existing Patterns

| Existing Pattern | How AI Coach Uses It |
|------------------|---------------------|
| **Service layer** (climbs.ts) | Create coach.ts following same pattern |
| **Hooks layer** (useClimbs.ts) | Create useCoach.ts following same pattern |
| **TanStack Query** | Use for all coach data fetching and mutations |
| **Offline queue** | Recommendations persist (no queueing), chat shows error offline |
| **RLS policies** | Apply same user isolation to coach tables |
| **Indexing** | Add user_id + created_at indexes like climbs table |
| **Component structure** | Coach feature follows features/ directory pattern |

### New Patterns Introduced

1. **Pattern aggregation service:** Extracted from charts-page.tsx for reuse
2. **LLM prompt engineering:** Edge Function templates for recommendations/chat
3. **Optimistic chat updates:** New pattern not used elsewhere in app
4. **Context injection:** Injecting pattern summary into LLM prompts

### No Breaking Changes

- Existing tables unchanged
- Existing services unchanged (only read from climbs table)
- Existing hooks unchanged
- Existing components unchanged
- New route `/coach` added to navigation
- Database migrations are additive only

## Sources

- OpenRouter Quickstart Guide (HIGH confidence) - API authentication and request patterns
- OpenRouter FAQ (HIGH confidence) - Security recommendations, rate limits, cost management
- Supabase Edge Functions documentation (HIGH confidence) - Server-side functions, external API integration
- TanStack Query Optimistic Updates docs (HIGH confidence) - Optimistic UI patterns for chat
- Existing Scenka architecture (HIGH confidence) - Service/hook/component pattern from climbs.ts/useClimbs.ts
- TanStack Query caching patterns (MEDIUM confidence) - Chat message caching strategy from StackOverflow
- Building WhatsApp-like optimistic updates (MEDIUM confidence) - Chat application patterns with TanStack Query

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Overall Architecture | HIGH | Based on existing codebase patterns + verified docs |
| Service/Hook Pattern | HIGH | Directly observed in climbs.ts/useClimbs.ts |
| LLM Integration | HIGH | OpenRouter + Supabase Edge Functions docs verified |
| Database Schema | HIGH | Follows existing climbs table pattern |
| TanStack Query Usage | HIGH | Patterns from official docs + existing code |
| Chat Message Caching | MEDIUM | Based on TanStack docs, no direct examples |
| Offline Strategy | HIGH | Aligns with existing offlineQueue pattern |
| Scalability | MEDIUM | No actual usage data, theoretical projections |

---
*Architecture research for: AI Coach for Climbing PWA*
*Researched: 2026-01-17*
