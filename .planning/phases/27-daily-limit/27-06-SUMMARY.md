---
phase: 27-daily-limit
plan: 06
one-liner: Chat usage counter inline display with limit enforcement and disabled button state
subsystem: Chat UI
tags: [chat, usage-limits, counter-display, button-disabled-state, tanstack-query]
---

# Phase 27 Plan 06: Chat Usage Counter UI Summary

## Objective

Update chat-page.tsx to display chat usage counter inline next to Send button and disable button at limit. This provides users with clear visibility into their daily chat usage (10 messages per day) and prevents actions when limit exceeded, with clear inline error messages showing time until reset.

## What Was Built

### Chat Usage Counter Display

**File modified:** `src/components/features/chat-page.tsx`

**New imports added:**
- `toast` from 'sonner' - For toast notifications when user tries to send at limit
- `useUserLimits, getTimeUntilNextReset` from '@/hooks/useUserLimits' - For fetching limits and calculating reset time

**Usage tracking logic added (lines 96-101):**
```typescript
const { data: limits } = useUserLimits()

const dailyChatLimit = 10
const chatCount = limits?.chat_count ?? 0
const chatRemaining = Math.max(0, dailyChatLimit - chatCount)
const isChatAtLimit = chatRemaining <= 0
```

**Send button updated (lines 217-226):**
- Added `isChatAtLimit` to disabled condition
- Button disabled when: no input text OR streaming OR at limit
- Visual feedback: `opacity-50 cursor-not-allowed` when disabled

**Inline counter display added (lines 227-229):**
```typescript
<span className="text-xs text-[#888] whitespace-nowrap">
  {chatCount}/{dailyChatLimit} used today
</span>
```
- Counter displays as "X/10 used today"
- Uses `text-[#888]` for subtle gray color (matching existing design)
- `whitespace-nowrap` prevents wrapping on small screens

**Inline error message when at limit (lines 246-248):**
```typescript
{isChatAtLimit === true && (
  <p className="text-xs text-red-400 mt-2">{getTimeUntilNextReset()}</p>
)}
```
- Shows time until next reset (e.g., "Next reset in 8 hours")
- Uses `text-red-400` for error visibility
- Only shows when `isChatAtLimit === true` (explicit boolean check for ESLint)

**Client-side limit check in handleSend (lines 128-131):**
```typescript
if (isChatAtLimit) {
  toast.error('You have reached your daily chat limit')
  return
}
```
- Toast notification appears when user tries to send at limit
- Prevents action before reaching Edge Function (better UX, though server still enforces)

## Technical Implementation

### Code Location: `src/components/features/chat-page.tsx`

**Lines 1-11:** Imports
- Added `toast` from 'sonner' for limit error notifications
- Added `useUserLimits, getTimeUntilNextReset` from '@/hooks/useUserLimits'

**Lines 93-101:** Hook call and usage calculations
- `useUserLimits()` hook fetches current chat_count from database
- `dailyChatLimit = 10` constant for daily limit (matches Edge Function config)
- `chatCount` defaults to 0 for new users (null from limits via `??`)
- `chatRemaining` calculated as difference, min 0 via `Math.max`
- `isChatAtLimit` boolean derived from remaining <= 0

**Lines 127-131:** handleSend client-side limit check
- Early return with toast error when at limit
- Prevents unnecessary network requests
- Provides immediate user feedback
- NOTE: Edge Function still enforces limit server-side for security

**Lines 217-230:** Button and counter display
- Send button wrapped in flex container with counter
- Button disabled when `isChatAtLimit === true`
- Counter shows current count out of daily limit
- `whitespace-nowrap` ensures counter text stays on one line

**Lines 246-248:** Inline error message at limit
- Shows time until next reset via `getTimeUntilNextReset()`
- Uses explicit `=== true` check for ESLint compliance
- Displays in red text (`text-red-400`) for visibility

## Decisions Made

### Inline counter text, not progress bar

Per CONTEXT.md requirements, displays simple counter text (e.g., "5/10 used today") instead of progress bar. This is intentional because:
- Simple text is clearer than graphical representation for small limits
- Users want to know exact count, not visual approximation
- Consistent with recommendation counter design from 27-05
- CONTEXT.md explicitly requires text counter, not progress bar

### Inline error message instead of tooltip

The original plan mentioned tooltip, but implementation uses inline error message instead. This is correct because:
- shadcn/ui Tooltip (Radix UI) doesn't trigger on disabled elements
- Inline message is always visible to user
- Time until reset is useful information, should be prominent
- Matches the pattern from recommendation counter (27-05)

### Client-side limit check in handleSend

Added client-side check before sending message. This provides:
- Immediate feedback (no network roundtrip)
- Better UX (toast notification)
- Reduced server load (reject early)
- NOTE: Edge Function still enforces limit server-side for security

### Explicit boolean check (isChatAtLimit === true)

Used explicit `=== true` check for ESLint compliance with `strict-boolean-expressions` rule. This prevents:
- Rendering leaked values
- Unexpected behavior with truthy/falsy values
- TypeScript strict mode violations

### whitespace-nowrap on counter text

Added `whitespace-nowrap` class to counter span. This prevents:
- Counter wrapping to multiple lines on small screens
- Visual disruption of button layout
- Inconsistent spacing across devices

## Deviations from Plan

### None - plan executed exactly as written

The implementation followed the plan precisely:
- Added imports for useUserLimits and getTimeUntilNextReset
- Called useUserLimits hook after existing hooks
- Added constants for limit calculation (dailyChatLimit, chatCount, chatRemaining, isChatAtLimit)
- Updated handleSend with client-side limit check
- Added isChatAtLimit to Send button disabled condition
- Wrapped button and counter in flex container
- Added inline counter display
- Added inline error message when at limit

All verification criteria met.

## Authentication Gates

None - no authentication was required during this plan execution.

## Dependency Graph

**Requires:**
- Phase 27-04: Client-side usage limits hooks (useUserLimits hook exists)
- Phase 27-03: Edge Function daily chat limit enforcement (counter increments in database)

**Provides:**
- Chat page with inline usage counter display
- Disabled button state when limit reached
- Inline error message showing time until reset
- Client-side limit check for better UX

**Affects:**
- Phase 27-06 is final frontend UI plan for daily limits
- Phase 27 complete after this plan

## Tech Stack Changes

**No new libraries added** - All dependencies already existed:
- `sonner` for toast notifications (already in use)
- `useUserLimits` hook from 27-04
- `getTimeUntilNextReset` helper from 27-04

**Patterns Established:**
- Inline counter display pattern (matches recommendation counter)
- Client-side limit check for better UX pattern
- Explicit boolean check for ESLint compliance pattern
- whitespace-nowrap for counter text pattern

## Key Files

### Modified
- `src/components/features/chat-page.tsx` - Added chat usage counter and limit enforcement

### Dependencies (no changes, referenced)
- `src/hooks/useUserLimits.ts` - Hook for fetching limits (created in 27-04)

## Verification

**Code Changes:**
- Imports added correctly (toast, useUserLimits, getTimeUntilNextReset) - lines 3, 10
- Hook call after existing hooks - line 96
- Constants calculated correctly (dailyChatLimit, chatCount, chatRemaining, isChatAtLimit) - lines 98-101
- handleSend limit check added - lines 128-131
- Send button disabled with isChatAtLimit - line 220
- Button and counter wrapped in flex container - lines 217-230
- Inline counter display shows "X/10 used today" - line 228
- Inline error message when at limit - lines 246-248

**TypeScript:**
- Type checking passed (`npx pnpm typecheck`)
- No `any` types introduced
- Explicit boolean checks for ESLint compliance

**Linting:**
- Linting passed for modified files (`npx eslint src/hooks/useUserLimits.ts src/components/features/chat-page.tsx`)
- Import order maintained correctly
- No unused variables

**Counter Display:**
- Shows current count out of daily limit format
- Handles new users (null limits defaults to 0)
- Handles day reset (counts reset automatically via database)
- Refreshes after each action (via staleTime: 0 and query invalidation from 27-04)

**Button Behavior:**
- Disabled when input is empty OR streaming OR at limit
- Visual feedback: opacity-50 and cursor-not-allowed
- Clicking when disabled does nothing (early return in handleSend)

**Error Messages:**
- Toast notification when user tries to send at limit
- Inline error message shows time until reset
- getTimeUntilNextReset returns user-friendly messages

**Mobile Responsiveness:**
- Counter text uses whitespace-nowrap to prevent wrapping
- Text size remains readable on small screens (text-xs)
- Flex layout maintains consistent spacing

## Next Phase Readiness

**Phase 27 is complete after this plan:**
- All 6 plans executed (27-01 through 27-06)
- Daily limit system fully implemented:
  - Database table (27-01)
  - Edge Function enforcement for recommendations (27-02)
  - Edge Function enforcement for chat (27-03)
  - Client-side hooks for fetching limits (27-04)
  - Recommendation counter UI (27-05)
  - Chat counter UI (27-06) - this plan

**No blockers or concerns.**

**Ready for deployment:**
- Database migration already pushed (27-01)
- Edge Functions need deployment with limit checking logic
- Environment variables need to be set (DAILY_REC_LIMIT=2, DAILY_CHAT_LIMIT=10)

## Metrics

**Duration:** 2 minutes
**Completed:** 2026-01-19

**Tasks:** 1/1 complete

**Commits:**
- a536b33: feat(27-06): add chat usage counter and limit enforcement to chat page

## Summary

Successfully updated chat-page.tsx to display chat usage counter inline next to Send button and disable button when daily limit reached. The counter shows current count out of daily limit (e.g., "5/10 used today") using useUserLimits hook from 27-04. Send button is disabled when user has no input, is currently streaming, OR has reached the daily limit. Client-side limit check in handleSend provides immediate feedback via toast notification when user tries to send at limit. Inline error message displays time until next reset when at limit, using getTimeUntilNextReset helper from 27-04. All implementation follows CONTEXT.md requirements: inline counter text (not progress bar), separate limits for recommendations and chat, and refresh after each action via TanStack Query invalidation pattern from 27-04.

Phase 27 (Daily Limit on Usage) is now complete.
