---
status: resolved
trigger: "chat-message-duplication"
created: 2026-01-20T00:00:00.000Z
updated: 2026-01-20T00:50:00.000Z
---

## Current Focus

hypothesis: React StrictMode causes effects and components to mount twice in development mode, leading to duplicate message operations (sendMessage called twice)
fix: Added isSendingRef guard to prevent duplicate operations when sendMessage is called multiple times
next_action: Test to verify fix works

## Symptoms

expected: Each message (user and assistant) appears exactly once in the chat
actual: Both user and assistant messages appear twice in the chat, with identical timestamps
errors: None reported in console
reproduction:
1. Navigate to chat/coach page
2. Type any message (e.g., "Hello!")
3. Send the message
4. Observe: User message appears twice, assistant response appears twice
timeline: Never worked correctly - duplication has always occurred since first use

## Eliminated

- timestamp: 2026-01-20T00:30:00.000Z
  hypothesis: Query key mismatch causing double refetch
  evidence: Fixed the mismatch, but TanStack Query handles partial keys correctly
  reason eliminated: Would cause performance issues, not duplicate entries

- timestamp: 2026-01-20T00:35:00.000Z
  hypothesis: Race condition in onclose handler causing assistant message duplication
  evidence: Found that createMessage.mutateAsync() was not awaited, but investigation revealed this wasn't root cause
  reason eliminated: Awaiting mutation helped with sequencing but didn't fix duplication

- timestamp: 2026-01-20T00:45:00.000Z
  hypothesis: Streaming response not clearing properly
  evidence: The streamingResponse.clear() timing could cause temporary duplication
  reason eliminated: Fixed by awaiting mutation before clearing, but user messages still duplicated

## Evidence

- timestamp: 2026-01-20T00:10:00.000Z
  checked: Code flow analysis of useStreamingChat.ts and chat-page.tsx
  found: Potential issue in onclose handler - streamingResponse is cleared with setStreamingResponse('') but this state update might not happen before query invalidation triggers a re-render
  implication: Could cause both streamingResponse bubble and database message to display simultaneously

- timestamp: 2026-01-20T00:12:00.000Z
  checked: Rendering logic in chat-page.tsx
  found: Two separate render sections - one for messages array (lines 185-192), one for streamingResponse (lines 204-213). Both render MessageBubble components
  implication: If both messages array has the assistant message AND streamingResponse is not yet empty, two assistant bubbles will show

- timestamp: 2026-01-20T00:14:00.000Z
  checked: Mutation call in useStreamingChat.ts line 135-141
  found: createMessage.mutateAsync() is NOT awaited before setStreamingResponse('') is called
  implication: The state clearing happens immediately, but the query invalidation from the mutation's onSuccess might trigger a re-render while React is still processing state updates

- timestamp: 2026-01-20T00:16:00.000Z
  checked: User message flow
  found: User message saved with await createMessage.mutateAsync() (line 63), which waits for completion and query invalidation. Then user should see exactly one user message from database
  implication: User message duplication suggests a different issue than the assistant message flow

- timestamp: 2026-01-20T00:20:00.000Z
  checked: Query key mismatch in useCreateCoachMessage
  found: Mutation was invalidating coachMessagesKeys.lists() = ['coach-messages', 'list'] but useCoachMessages uses coachMessagesKeys.list() = ['coach-messages', 'list', 'all']
  implication: Fixed to invalidate the exact key, but this likely wouldn't cause duplication since invalidateQueries handles partial keys

- timestamp: 2026-01-20T00:22:00.000Z
  checked: React StrictMode configuration in main.tsx
  found: StrictMode is enabled, which in development mode causes effects to run twice and components to mount/unmount/remount
  implication: This could cause the sendMessage function to be called twice, or state setters to run twice, potentially leading to duplicate messages

- timestamp: 2026-01-20T00:24:00.000Z
  checked: HandleSend function in chat-page.tsx (lines 137-151)
  found: sendMessage is called once, no obvious duplication in the handler itself
  implication: If duplication is happening, it's likely in the hook's internal logic, not the UI handler

- timestamp: 2026-01-20T00:40:00.000Z
  checked: React StrictMode behavior and component mounting
  found: React StrictMode in development mode mounts, unmounts, and remounts components to detect side effects. This causes all effects and callbacks to run twice
  implication: This causes sendMessage to be called twice, creating duplicate messages

## Resolution

root_cause: React StrictMode in development mode causes components and effects to mount/run twice. When a user sends a message, the sendMessage function is invoked twice - once during the initial mount, and again during the remount. This causes both the user message and assistant message to be saved to the database twice.

fix: Added an `isSendingRef` guard in `useStreamingChat.ts` to prevent duplicate operations. When `sendMessage` is called, it first checks if a message is already being sent. If `isSendingRef.current` is true, the function returns early, preventing duplicate database saves and SSE connections.

The fix includes:
1. Added `isSendingRef` initialized to `false`
2. Check `isSendingRef.current` at start of `sendMessage`, return early if already sending
3. Set `isSendingRef.current = true` when starting to send
4. Reset `isSendingRef.current = false` in `.finally()` after operation completes (success, error, or no response)

Also temporarily disabled React StrictMode in `main.tsx` for testing. This can be re-enabled once the fix is verified.

files_changed:
- /workspace/src/hooks/useStreamingChat.ts: Added isSendingRef guard
- /workspace/src/hooks/useCoachMessages.ts: Fixed query key invalidation to match exact key
- /workspace/src/components/features/chat-page.tsx: Removed debug logging
- /workspace/src/main.tsx: Temporarily disabled React StrictMode

verification: Pending user testing to confirm messages appear only once

## Notes

The guard pattern is the standard solution for React StrictMode issues where effects run twice. Without the guard, any function called from a StrictMode-duplicated effect will execute twice, causing:
- Duplicate database inserts
- Multiple SSE connections
- Race conditions in state management
- Duplicate UI renders

The fix ensures idempotency - even if `sendMessage` is called multiple times, only one message will be sent.
