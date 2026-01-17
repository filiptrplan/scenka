# Technology Stack

**Project:** Scenka v2.0 - AI Coach
**Researched:** 2025-01-17

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^18.3.1 | UI framework | Already in project, PWA-ready |
| TypeScript | ^5.6.2 | Type safety | Already in project, strict mode |
| Vite | ^6.0.1 | Build tool | Already in project, fast dev server |

### AI Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| OpenRouter API | Latest | LLM provider access | Unified API for openai/gpt-5.1, no servers needed, pay-per-use fits solo dev |
| @microsoft/fetch-event-source | ^3.x | SSE streaming for chat responses | Better than native EventSource for POST requests with headers, supports AbortController for cancellation |
| fetch-event-source alternative | react-fetch-event-source | React-friendly streaming | Alternative if @microsoft version has issues, provides better React integration |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL (Supabase) | Latest | Persistent storage | Already in project, RLS for security, JSONB for flexible AI data |
| pg_cron (Supabase extension) | Latest | Weekly recommendation scheduling | Built into Supabase, no external services needed for scheduled jobs |

### UI Components
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | Latest | UI primitives | Already in project, use Card, ScrollArea, Avatar, Input, Button for chat |
| lucide-react | ^0.562.0 | Icons | Already in project |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.90.16 | Server state management | Already in project, use for chat history, recommendations, optimistic updates |
| date-fns | ^4.1.0 | Date manipulation | Already in project, use for weekly recommendations timestamps |
| sonner | ^2.0.7 | Toast notifications | Already in project, use for AI API errors |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Streaming Library** | @microsoft/fetch-event-source | assistant-ui | assistant-ui is too heavyweight for custom needs, introduces dependencies, shadcn/ui components are sufficient |
| **Streaming Library** | @microsoft/fetch-event-source | Vercel AI SDK | Vercel AI SDK is server-side focused, requires Next.js edge runtime, incompatible with client-side Vite PWA |
| **Streaming Library** | @microsoft/fetch-event-source | native EventSource | Native EventSource doesn't support POST with headers (can't send API keys), no body support for chat messages |
| **AI Provider** | OpenRouter | OpenAI direct API | OpenRouter provides unified API, allows model switching, no separate billing setup, matches "no backend servers" constraint |
| **Chat UI** | Custom with shadcn/ui | shadcn.io/ai Elements | AI Elements tied to Vercel AI SDK, designed for Next.js, overkill for simple chat interface |
| **Recommendations Storage** | PostgreSQL JSONB | Redis Cache | Redis requires additional service, Supabase free tier doesn't include Redis, JSONB sufficient for this use case |
| **Weekly Scheduling** | pg_cron (Supabase) | Edge Functions Cron | pg_cron is built-in, simpler for database operations, no need for separate functions |

## Detailed Technology Decisions

### 1. OpenRouter API (HIGH confidence)

**Why OpenRouter:**
- Single API endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model selection: `model: "openai/gpt-5.1"`
- Streaming support: Set `stream: true` in request
- Authentication: `Authorization: Bearer <OPENROUTER_API_KEY>`
- Pricing: $1.25/M input tokens, $10/M output tokens for gpt-5.1
- Context window: 400,000 tokens
- No rate limits on paid models (pay-per-use)

**Key capabilities:**
- Server-Sent Events (SSE) streaming for real-time responses
- OpenAI-compatible API format
- Model switching via simple string change
- Rate limit checking via `GET https://openrouter.ai/api/v1/key`

**Sources:**
- [OpenRouter Quickstart Guide](https://openrouter.ai/docs/quickstart) - HIGH confidence (official docs)
- [OpenRouter Streaming API](https://openrouter.ai/docs/api/reference/streaming) - HIGH confidence (official docs)
- [GPT-5.1 Model Page](https://openrouter.ai/openai/gpt-5.1) - HIGH confidence (official docs)

### 2. @microsoft/fetch-event-source (MEDIUM confidence)

**Why this library:**
- Combines fetch API and EventSource capabilities
- Supports POST requests with headers (crucial for API key auth)
- Supports AbortController for request cancellation
- Better retry logic than native EventSource
- TypeScript support

**Usage pattern:**
```typescript
import { fetchEventSource } from '@microsoft/fetch-event-source'

await fetchEventSource('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-5.1',
    messages: [...],
    stream: true,
  }),
  onmessage(msg) {
    // Parse "data: " prefixed SSE chunks
    // Update UI with streaming text
  },
  onerror(err) {
    // Handle API errors gracefully
  },
  signal: abortController.signal, // For cancellation
})
```

**Alternative if issues arise:**
- `react-fetch-event-source` - More React-friendly API
- Custom fetch implementation with ReadableStream

**Sources:**
- [Microsoft fetch-event-source](https://github.com/Azure/fetch-event-source) - MEDIUM confidence (GitHub repo, widely used)
- [Streaming SSE tutorial](https://blog.logrocket.com/using-fetch-event-source-server-sent-events-react/) - MEDIUM confidence (tutorial verification)

### 3. Database Schema (HIGH confidence)

**Chat messages table:**
```sql
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For tokens, model, etc.
);

CREATE INDEX idx_ai_chat_messages_user_created
  ON ai_chat_messages(user_id, created_at DESC);

-- RLS: Users can only see their own messages
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages"
  ON ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);
```

**Weekly recommendations table:**
```sql
CREATE TABLE ai_weekly_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  focus_area TEXT NOT NULL,
  drills JSONB NOT NULL, -- Array of drill objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_ai_weekly_recommendations_user_week
  ON ai_weekly_recommendations(user_id, week_start_date DESC);

-- RLS: Users can only view own recommendations
ALTER TABLE ai_weekly_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations"
  ON ai_weekly_recommendations FOR SELECT
  USING (auth.uid() = user_id);
```

**Why this structure:**
- Separate tables for chat vs recommendations (different access patterns)
- TEXT for content (faster queries, indexed)
- JSONB for flexible structured data (drills, metadata)
- RLS policies for security (auth.uid() = user_id)
- Composite indexes for common query patterns

**Sources:**
- [Supabase RLS policies](https://supabase.com/docs/guides/database/extensions/pg_cron) - HIGH confidence (official docs)
- Supabase migrations in project - HIGH confidence (existing patterns)

### 4. pg_cron for Weekly Recommendations (HIGH confidence)

**Why pg_cron:**
- Built into Supabase free tier
- No external services needed
- Database-native scheduling
- Simple cron syntax: `'0 9 * * 1'` (Monday at 9 AM)

**Setup pattern:**
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly recommendation generation
SELECT cron.schedule(
  'generate-weekly-recommendations',
  '0 9 * * 1', -- Every Monday at 9 AM
  $$
  SELECT generate_weekly_recommendations(user_id)
  FROM auth.users
  WHERE last_login > NOW() - INTERVAL '7 days'
  $$
);

-- Function to generate recommendations
CREATE OR REPLACE FUNCTION generate_weekly_recommendations(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_week_start_date DATE;
  v_analysis JSONB;
  v_recommendation_id UUID;
BEGIN
  v_week_start_date := date_trunc('week', CURRENT_DATE);

  -- Analyze user's climbing patterns
  v_analysis := analyze_climbing_patterns(p_user_id);

  -- Insert recommendation
  INSERT INTO ai_weekly_recommendations (user_id, week_start_date, focus_area, drills)
  VALUES (
    p_user_id,
    v_week_start_date,
    v_analysis->>'focus_area',
    v_analysis->'drills'
  )
  ON CONFLICT (user_id, week_start_date)
  DO UPDATE SET
    focus_area = EXCLUDED.focus_area,
    drills = EXCLUDED.drills;

  RETURN v_recommendation_id;
END;
$$ LANGUAGE plpgsql;
```

**Sources:**
- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron) - HIGH confidence (official docs)
- [Supabase Cron blog](https://supabase.com/blog/supabase-cron) - MEDIUM confidence (official blog)

### 5. UI Components with shadcn/ui (HIGH confidence)

**Why custom over pre-built chat libraries:**
- Full control over styling and behavior
- Leverages existing shadcn/ui components
- No additional dependencies
- Mobile-first design already established

**Components to use:**
- `Card` - Message bubbles
- `ScrollArea` - Chat message list with auto-scroll
- `Avatar` - User/assistant avatars
- `Input` - Message input field
- `Button` - Send button
- `Separator` - Visual separation

**Example structure:**
```tsx
<Card className="flex gap-3">
  <Avatar>
    <AvatarImage src="/assistant-avatar.png" />
  </Avatar>
  <div className="flex-1">
    <ScrollArea className="h-96">
      {messages.map(msg => (
        <Card key={msg.id}>
          {msg.content}
        </Card>
      ))}
    </ScrollArea>
    <form onSubmit={handleSubmit}>
      <Input placeholder="Ask your climbing coach..." />
      <Button type="submit">Send</Button>
    </form>
  </div>
</Card>
```

**Sources:**
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - HIGH confidence (official docs)
- [Shadcn Scroll Area](https://www.shadcn.io/ui/scroll-area) - MEDIUM confidence (community examples)

### 6. Streaming Response Handling (MEDIUM confidence)

**Typewriter effect implementation:**
```typescript
// Custom hook for streaming text
function useStreamingText() {
  const [text, setText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const updateText = (chunk: string) => {
    setText(prev => prev + chunk)
  }

  const reset = () => {
    setText('')
    setIsComplete(false)
  }

  const complete = () => {
    setIsComplete(true)
  }

  return { text, isComplete, updateText, reset, complete }
}
```

**SSE parsing:**
```typescript
function parseSSEChunk(line: string): string | null {
  if (!line.startsWith('data: ')) return null

  const data = line.slice(6) // Remove "data: " prefix

  try {
    const parsed = JSON.parse(data)
    return parsed.choices[0]?.delta?.content || null
  } catch {
    return null
  }
}
```

**Sources:**
- [GetStream AI integrations docs](https://getstream.io/chat/docs/sdk/react/guides/ai-integrations/) - MEDIUM confidence (documentation verification)
- [Streaming text with TypeIt](https://macarthur.me/posts/streaming-text-with-typeit) - LOW confidence (blog post, not verified)

## Installation

```bash
# Core AI streaming library
pnpm add @microsoft/fetch-event-source

# Types if needed (usually included)
pnpm add -D @types/node
```

## Database Setup

```bash
# Enable pg_cron extension (via Supabase dashboard or SQL)
npx supabase db push --schema public

# Or via SQL Editor in Supabase dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Configuration

**Environment variables:**
```bash
# OpenRouter API key
VITE_OPENROUTER_API_KEY=sk-or-...

# Supabase (existing)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**API service pattern:**
```typescript
// src/services/openrouter.ts
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function generateChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<AsyncIterable<string>> {
  // Implementation with fetchEventSource
}
```

## Cost Considerations

**OpenRouter gpt-5.1 pricing:**
- Input: $1.25 per 1M tokens
- Output: $10 per 1M tokens

**Estimated weekly usage:**
- Chat: ~1K tokens/day × 7 days = ~7K tokens/week
- Recommendations: ~3K tokens/week (analysis + generation)
- Total: ~10K tokens/week
- Cost: ~$0.01/week (well within free tier or negligible paid tier)

**Sources:**
- [OpenRouter Pricing](https://openrouter.ai/pricing) - HIGH confidence (official docs)
- [OpenAI GPT-5.1 pricing](https://platform.openai.com/docs/pricing) - MEDIUM confidence (verified against OpenRouter)

## Security Considerations

1. **API Key Storage:** Use environment variable (VITE_OPENROUTER_API_KEY), client-side only acceptable for this use case since it's a personal app
2. **RLS Policies:** Ensure all AI data tables have proper RLS (auth.uid() = user_id)
3. **Input Validation:** Sanitize user input before sending to AI (prevent prompt injection)
4. **Error Handling:** Never expose raw API errors to users, use sonner for user-friendly messages
5. **Rate Limiting:** Implement client-side rate limiting to prevent excessive API calls

**Sources:**
- [OpenRouter Error Handling](https://openrouter.ai/docs/api/reference/errors-and-debugging) - HIGH confidence (official docs)
- [OpenRouter Rate Limits](https://openrouter.ai/docs/api/reference/limits) - HIGH confidence (official docs)

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **Vercel AI SDK** | Requires Next.js edge runtime, incompatible with Vite client-side PWA, server-side focused |
| **assistant-ui** | Heavyweight library, introduces dependencies, shadcn/ui sufficient for this use case, less control |
| **Redis Cache** | Supabase free tier doesn't include Redis, adds complexity, PostgreSQL JSONB sufficient |
| **External cron services** | pg_cron built into Supabase, no additional services needed, database-native |
| **native EventSource** | Doesn't support POST with headers, can't send API keys, no body support |
| **WebSocket** | Overkill for request/response chat, SSE is simpler and more appropriate |
| **Separate backend server** | Violates "no backend servers" constraint, adds deployment complexity, Solo dev constraint |

## Development Workflow

1. **Implement API service:** Create `src/services/openrouter.ts` with fetchEventSource
2. **Create database tables:** Add migrations for ai_chat_messages and ai_weekly_recommendations
3. **Build chat UI:** Custom components with shadcn/ui primitives
4. **Implement streaming:** Add useStreamingText hook and SSE parsing
5. **Add recommendations:** Build pg_cron job and analysis function
6. **Integrate with existing analytics:** Pull failure patterns, style weaknesses from current data
7. **Test offline behavior:** Ensure graceful degradation when OpenRouter unavailable

## Testing Strategy

1. **Mock OpenRouter API:** Use Vitest to mock fetchEventSource responses
2. **Test SSE parsing:** Verify chunk parsing logic
3. **Database tests:** Test RLS policies and recommendation generation
4. **E2E tests:** Verify chat flow from UI to API
5. **Error scenarios:** Test rate limits, timeouts, network failures

## Migration from Existing Stack

**Zero breaking changes:** All additions are new libraries and tables, existing functionality untouched.

**Phased rollout:**
1. Phase 1: Chat UI + OpenRouter integration (no persistence yet)
2. Phase 2: Add database tables and persistence
3. Phase 3: Implement weekly recommendations with pg_cron
4. Phase 4: Integrate with existing climbing analytics

## Sources Summary

### HIGH Confidence (Official Documentation)
- [OpenRouter Quickstart Guide](https://openrouter.ai/docs/quickstart)
- [OpenRouter Streaming API](https://openrouter.ai/docs/api/reference/streaming)
- [GPT-5.1 Model Page](https://openrouter.ai/openai/gpt-5.1)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [OpenRouter Error Handling](https://openrouter.ai/docs/api/reference/errors-and-debugging)
- [OpenRouter Rate Limits](https://openrouter.ai/docs/api/reference/limits)
- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [OpenAI GPT-5.1 pricing](https://platform.openai.com/docs/pricing)

### MEDIUM Confidence (Verified with Multiple Sources)
- [Microsoft fetch-event-source](https://github.com/Azure/fetch-event-source)
- [Streaming SSE tutorial](https://blog.logrocket.com/using-fetch-event-source-server-sent-events-react/)
- [Supabase Cron blog](https://supabase.com/blog/supabase-cron)
- [GetStream AI integrations docs](https://getstream.io/chat/docs/sdk/react/guides/ai-integrations/)
- [Shadcn Scroll Area](https://www.shadcn.io/ui/scroll-area)
- [OpenRouter Vercel AI SDK Integration](https://openrouter.ai/docs/guides/community/vercel-ai-sdk)
- [assistant-ui library](https://assistant-ui.com/)

### LOW Confidence (WebSearch Only)
- [Streaming text with TypeIt](https://macarthur.me/posts/streaming-text-with-typeit)
- Various tutorial blogs and community posts
- AI coaching patterns (no direct technical verification)
