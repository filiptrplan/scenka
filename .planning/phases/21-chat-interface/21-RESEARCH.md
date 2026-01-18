# Phase 21: Chat Interface - Research

**Researched:** 2026-01-18
**Domain:** React Chat Interface with SSE Streaming, Supabase Edge Functions
**Confidence:** HIGH

## Summary

This research covers implementing a free-form chat interface with streaming AI responses for climbing coaching. The existing infrastructure includes coach message tables, TanStack Query hooks, and an Edge Function pattern for OpenAI API calls via OpenRouter. The implementation requires:

1. **SSE Streaming** from a new Supabase Edge Function using Deno's ReadableStream API
2. **@microsoft/fetch-event-source** library for client-side SSE handling (better API than native EventSource)
3. **React chat UI** with message bubbles, typing indicators, and mobile optimization
4. **Pattern context injection** using existing extractPatterns() function
5. **Error handling** with graceful fallbacks and retry logic

The project uses React 18, TypeScript, Tailwind CSS, shadcn/ui components, TanStack Query, and Supabase. All required database tables and infrastructure are already in place from Phase 18.

**Primary recommendation:** Create a new Edge Function for chat streaming and use @microsoft/fetch-event-source with a React component featuring message bubbles, auto-scroll, and typing indicator.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @microsoft/fetch-event-source | ^1.x | SSE client with fetch API | Better API than native EventSource, supports POST with auth headers |
| OpenAI SDK | 4.x | AI chat completion streaming | Already in use via openrouter-coach Edge Function, supports stream: true |
| Deno | latest | Edge Function runtime | Supabase Edge Functions use Deno, supports ReadableStream for SSE |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-scroll-area | ^1.2.10 | Scrollable message container | Auto-scroll to bottom on new messages, smooth scrolling |
| lucide-react | ^0.562.0 | Icons (Send, Loader2, ArrowUp) | Send button icon, typing indicator loader |
| date-fns | ^4.1.0 | Message timestamps | Format relative times (e.g., "2 min ago") |
| TanStack Query | ^5.90.16 | State management | useCoachMessages, useCreateCoachMessage already exist |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @microsoft/fetch-event-source | Native EventSource | EventSource doesn't support POST with auth headers; fetch-event-source does |
| New Edge Function | Extend openrouter-coach | Better to separate concerns: one for recommendations, one for chat |

**Installation:**
```bash
pnpm add @microsoft/fetch-event-source
# Note: OpenAI SDK, TanStack Query, and Radix UI already installed
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── features/
│       ├── coach-page.tsx      # Existing coach page
│       └── coach-chat-page.tsx  # NEW: Chat interface component
├── hooks/
│   └── useCoachMessages.ts     # Existing: message state management
├── services/
│   ├── coach.ts                # Existing: recommendation generation
│   └── coach-chat.ts           # NEW: chat streaming service
└── types/
    └── index.ts                # Existing: PatternAnalysis types
supabase/functions/
├── openrouter-coach/          # Existing: recommendations
└── openrouter-coach-chat/     # NEW: chat streaming
```

### Pattern 1: SSE Streaming from Supabase Edge Function

**What:** Use Deno's ReadableStream to stream OpenAI responses with Server-Sent Events

**When to use:** When returning streaming responses from Edge Functions

**Example:**
```typescript
// Source: Deno HTTP Server APIs docs
// supabase/functions/openrouter-coach-chat/index.ts

Deno.serve(async (req: Request) => {
  // ... auth validation ...

  const body = await req.json()

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = await openai.chat.completions.create({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: chatSystemPrompt },
            { role: 'user', content: body.message },
          ],
          stream: true,
        })

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            // Send SSE format: "data: <content>\n\n"
            controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
          }
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
    cancel() {
      // Clean up on client disconnect
      console.log('Client disconnected from chat stream')
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    },
  })
})
```

### Pattern 2: Client-Side SSE with @microsoft/fetch-event-source

**What:** Use fetchEventSource for streaming chat responses with auth headers

**When to use:** When consuming SSE endpoints with POST requests and JWT auth

**Example:**
```typescript
// Source: @microsoft/fetch-event-source GitHub
// src/services/coach-chat.ts

import { fetchEventSource } from '@microsoft/fetch-event-source'
import { supabase } from '@/lib/supabase'

interface ChatStreamOptions {
  message: string
  patterns: PatternAnalysis
  onChunk: (chunk: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

export async function streamChatResponse({
  message,
  patterns,
  onChunk,
  onComplete,
  onError,
}: ChatStreamOptions) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  await fetchEventSource(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-coach-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message,
        patterns_data: patterns,
      }),
      onopen(response) {
        if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
          return // Connection successful
        }
        throw new Error(`Unexpected response: ${response.status}`)
      },
      onmessage(ev) {
        const data = JSON.parse(ev.data)
        if (data.content) {
          onChunk(data.content)
        }
      },
      onclose() {
        onComplete()
      },
      onerror(err) {
        onError(err)
        throw err // Will trigger retry
      },
    }
  )
}
```

### Pattern 3: React Chat UI with Message Bubbles

**What:** Chat interface with user/assistant message bubbles, auto-scroll, typing indicator

**When to use:** Building chat interfaces with streaming responses

**Example:**
```typescript
// src/components/features/coach-chat-page.tsx

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form-label'
import { useCoachMessages, useCreateCoachMessage } from '@/hooks/useCoachMessages'
import { usePatternAnalysis } from '@/hooks/useCoach'
import { streamChatResponse } from '@/services/coach-chat'

export function CoachChatPage() {
  const navigate = useNavigate()
  const { data: messages = [] } = useCoachMessages()
  const createMessage = useCreateCoachMessage()
  const { data: patterns } = usePatternAnalysis()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    // Optimistically add user message
    createMessage.mutate({
      role: 'user',
      content: userMessage,
      context: {},
    })

    try {
      await streamChatResponse({
        message: userMessage,
        patterns: patterns || getEmptyPatterns(),
        onChunk: (chunk) => {
          setStreamingContent((prev) => prev + chunk)
        },
        onComplete: () => {
          createMessage.mutate({
            role: 'assistant',
            content: streamingContent,
            context: { patterns_data: patterns },
          })
          setStreamingContent('')
          setIsStreaming(false)
        },
        onError: (err) => {
          console.error('Chat stream error:', err)
          createMessage.mutate({
            role: 'assistant',
            content: 'Sorry, I had trouble generating a response. Please try again.',
            context: { error: err.message },
          })
          setStreamingContent('')
          setIsStreaming(false)
        },
      })
    } catch (error) {
      console.error('Failed to start chat stream:', error)
      createMessage.mutate({
        role: 'assistant',
        content: 'Failed to connect to the coach. Please check your connection and try again.',
        context: { error: (error as Error).message },
      })
      setIsStreaming(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/coach')}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Chat</h1>
            <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
              Ask your climbing coach
            </p>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="h-[60vh] pr-4">
          <div ref={scrollRef} className="space-y-4">
            {/* Existing messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-white/[0.1] text-[#f5f5f5]'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming assistant message */}
            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-white/[0.1] text-[#f5f5f5]">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {streamingContent}
                  </p>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 px-4 py-3 bg-white/[0.1] rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs text-[#888]">Coach is typing...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Ask about training, beta, or technique..."
            disabled={isStreaming}
            className="flex-1 h-12 text-base"
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming}
            size="lg"
            className="h-12 px-6 bg-white text-black hover:bg-white/90"
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Pattern 4: Pattern Context Injection

**What:** Inject pre-processed climbing patterns into chat prompts for context-aware responses

**When to use:** When the coach needs to provide personalized advice based on user's climbing data

**Example:**
```typescript
// Edge Function system prompt with patterns
const chatSystemPrompt = `You are an expert climbing coach specializing in bouldering and sport climbing. You provide personalized advice based on the user's climbing patterns.

Context:
- The user struggles with these failure reasons: ${patterns.failure_patterns.most_common_failure_reasons.map(f => f.reason).join(', ')}
- They struggle with these styles: ${patterns.style_weaknesses.struggling_styles.map(s => s.style).join(', ')}
- They climb ~${patterns.climbing_frequency.avg_climbs_per_session} climbs per session
- They have ${patterns.recent_successes.redemption_count} recent redemptions

When giving advice:
1. Reference their specific weaknesses when relevant
2. Use climbing terminology (beta, send, project, crimp, sloper, hangboard, campus board)
3. Be concise and actionable
4. Ask clarifying questions if needed`

// Combine message history with new user message
const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
  { role: 'system', content: chatSystemPrompt },
  ...messageHistory.map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: body.message },
]
```

### Anti-Patterns to Avoid

- **Using native EventSource:** Doesn't support POST with auth headers; use @microsoft/fetch-event-source
- **Non-streaming responses:** Creates poor UX with long waits; use stream: true for real-time feedback
- **Ignoring mobile touch targets:** Use h-12 (48px) minimum for buttons/inputs
- **Missing typing indicator:** Users won't know if the system is working; show loader immediately on send
- **No auto-scroll:** Users lose context when new messages arrive; scroll to bottom on updates
- **Sending full message history:** Only send last 10-20 messages (database query already limits to 20)
- **No error boundaries:** SSE failures should show helpful fallback messages, not crash UI

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom event parsing | @microsoft/fetch-event-source | Handles reconnection, auth headers, error recovery |
| Auto-scroll | Manual scrollIntoView | useEffect with scrollTop = scrollHeight | Simpler, more reliable with React state |
| Typing indicator | Custom animation | lucide-react Loader2 + animate-spin | Standard, accessible, matches existing UI |
| Pattern extraction | Manual data aggregation | extractPatterns() from patterns.ts | Already tested, handles edge cases |

**Key insight:** SSE has subtle complexity around connection handling, reconnection, and error recovery. The fetch-event-source library handles these edge cases properly, whereas custom implementations often fail on network hiccups, CORS issues, or auth token expiration.

## Common Pitfalls

### Pitfall 1: SSE Connection Drops Mid-Stream

**What goes wrong:** Client disconnects or network hiccups cause stream to stop without error handling

**Why it happens:** ReadableStream cancel() not called properly, or client doesn't handle onerror

**How to avoid:**
- Implement cancel() in ReadableStream start() to clean up resources
- Handle onerror callback in fetchEventSource to show fallback message
- Set reasonable retry limits (don't retry indefinitely on auth errors)

**Warning signs:** Messages freeze mid-word, no completion callback fired, no error shown to user

### Pitfall 2: Message History Not Limited

**What goes wrong:** Sending 100+ messages to AI causes token bloat and slower responses

**Why it happens:** Not limiting message history before sending to API

**How to avoid:**
- Database query already limits to 20 messages (useCoachMessages hook)
- On Edge Function side, slice to last 10-15 messages if needed
- Consider token budgeting (older messages trimmed first)

**Warning signs:** Response times increase over time, API costs spike, hitting token limits

### Pitfall 3: Mobile Input Issues

**What goes wrong:** Input field too small, keyboard covers content, hard to tap send button

**Why it happens:** Not following 44px+ touch target rule, not handling viewport height on mobile

**How to avoid:**
- Use h-12 (48px) for input and send button
- Reserve space for keyboard with pb-24 padding (already in App.tsx)
- Test on actual mobile device, not just dev tools

**Warning signs:** Users report "can't tap send" or "keyboard hides messages"

### Pitfall 4: Pattern Data Not Sanitized

**What goes wrong:** PII or sensitive data sent to external API via patterns

**Why it happens:** Not using anonymizeClimbsForAI() or validateAnonymizedData()

**How to avoid:**
- Use existing extractPatterns() which processes sanitized climb data
- Validate patterns before sending: validateAnonymizedData(patterns)
- Never include raw climb data in context

**Warning signs:** Location names in chat responses, user references in AI output

### Pitfall 5: No Graceful Error Handling

**What goes wrong:** SSE errors show cryptic technical messages or freeze UI

**Why it happens:** Assuming stream never fails, not implementing fallbacks

**How to avoid:**
- Always show user-friendly error message: "Sorry, I had trouble..."
- Retry once for transient errors, then give up
- Store failed attempt in coach_messages with error context
- Use error boundaries in React to prevent full app crash

**Warning signs:** Console errors visible to users, blank screen on failure

### Pitfall 6: Streaming Content Not Saved

**What goes wrong:** User refreshes page mid-stream and loses assistant response

**Why it happens:** Only saving to database after stream completes

**How to avoid:**
- Save to database in onComplete callback (current pattern)
- Consider debounced saves for very long responses (not needed for this phase)
- Show clear loading state so users don't refresh

**Warning signs:** Message appears in UI but not in message list after reload

## Code Examples

Verified patterns from official sources:

### Edge Function SSE Response Structure

```typescript
// Source: Deno HTTP Server APIs
const stream = new ReadableStream({
  async start(controller) {
    // Write chunks with controller.enqueue()
    controller.enqueue("data: {\"content\":\"Hello\"}\n\n")
    // Close when done
    controller.close()
  },
  cancel() {
    // Client disconnected - clean up
  }
})

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
})
```

### fetchEventSource Usage

```typescript
// Source: @microsoft/fetch-event-source GitHub
await fetchEventSource('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Hello' }),
  onmessage(ev) {
    console.log(ev.data) // "data: {\"content\":\"Hi\"}"
  },
  onclose() {
    console.log('Stream closed')
  },
  onerror(err) {
    console.error(err)
    throw err // Triggers retry
  },
})
```

### Auto-Scroll Pattern

```typescript
// Source: React useEffect documentation
const scrollRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }
}, [messages, streamingContent]) // Re-scroll on new content
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Non-streaming HTTP requests | SSE streaming | 2023+ | Better UX, real-time feedback |
| Native EventSource | @microsoft/fetch-event-source | 2024+ | POST support, auth headers, error handling |
| Manual auto-scroll | useEffect with scrollTop | Always | Simpler, more reliable |
| Custom typing animation | lucide-react Loader2 | Always | Consistent with app design, accessible |

**Deprecated/outdated:**
- WebSocket for chat: Overkill for one-way streaming, SSE is simpler
- Native EventSource: Doesn't support POST with auth headers
- setTimeout polling: Inefficient, adds latency

## Open Questions

Things that couldn't be fully resolved:

1. **Exact token budgeting for context**
   - What we know: Limit to 20 messages (database query), OpenRouter supports 100k+ context
   - What's unclear: Should we trim older messages if approaching token limits?
   - Recommendation: Use 20 messages (existing limit), implement token counting in Phase 22 if needed

2. **Typing indicator animation style**
   - What we know: Loader2 with animate-spin works
   - What's unclear: Should we use dots animation (...) instead?
   - Recommendation: Start with Loader2, can iterate based on user feedback

3. **Message grouping by date**
   - What we know: Messages have created_at timestamp
   - What's unclear: Should we show date separators in chat UI?
   - Recommendation: Skip for MVP (CHAT-01 to CHAT-07), consider in Phase 22 if users request

## Sources

### Primary (HIGH confidence)
- [@microsoft/fetch-event-source GitHub](https://github.com/Azure/fetch-event-source) - API usage, onmessage/onerror/onopen callbacks
- [Deno HTTP Server APIs](https://docs.deno.com/runtime/manual/runtime/http_server_apis) - ReadableStream with start()/cancel(), streaming response headers
- [OpenAI Node.js Library GitHub](https://github.com/openai/openai-node) - Streaming with `stream: true`, for-await pattern
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions) - SSE support mentioned, Web Stream examples
- Codebase analysis:
  - /workspace/supabase/functions/openrouter-coach/index.ts - Existing Edge Function pattern with OpenAI SDK
  - /workspace/src/hooks/useCoachMessages.ts - Message state management, 20 message limit
  - /workspace/src/services/patterns.ts - Pattern extraction for context injection
  - /workspace/src/components/features/coach-page.tsx - Entry point button to /coach/chat

### Secondary (MEDIUM confidence)
- Project dependencies: @radix-ui/react-scroll-area, lucide-react, TanStack Query usage patterns
- shadcn/ui component patterns from existing code (Input, Button, ScrollArea)
- Mobile-first design from existing pages (44px+ targets, dark theme)

### Tertiary (LOW confidence)
- N/A - All findings verified through codebase analysis or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified through official docs and codebase analysis
- Architecture: HIGH - Verified through Deno and fetch-event-source official sources
- Pitfalls: HIGH - Based on common SSE patterns and codebase context

**Research date:** 2026-01-18
**Valid until:** 30 days (libraries are stable, patterns are well-established)
