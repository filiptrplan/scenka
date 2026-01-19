---
phase: 27-daily-limit
plan: 01
one-liner: User limits table with atomic RPC increment functions for daily usage tracking
subsystem: Database
tags: [postgresql, rls, rpc, daily-limits]
---

# Phase 27 Plan 01: Database Foundation for Daily Limits Summary

## Objective

Create database foundation for daily usage limits with user_limits table, RLS policies, and atomic counter increment functions. This enables Edge Functions to track daily usage (recommendations and chat) with automatic UTC midnight reset.

## What Was Built

### Database Schema

**Table: `user_limits`**
- `user_id` (UUID, PRIMARY KEY) - References profiles.id with CASCADE DELETE
- `rec_count` (INTEGER, DEFAULT 0, CHECK >= 0) - Daily recommendation counter
- `chat_count` (INTEGER, DEFAULT 0, CHECK >= 0) - Daily chat message counter
- `limit_date` (DATE, DEFAULT CURRENT_DATE) - Date for counter reset tracking
- `updated_at` (TIMESTAMPTZ, DEFAULT now()) - Timestamp of last update

**RLS Policy: "Users can view own limits"**
- SELECT only, restricts access to user's own limits (auth.uid() = user_id)
- No INSERT/UPDATE policies (Edge Functions use service role key via RPC)

**Index: `user_limits_limit_date_idx`**
- Optimizes queries for daily reset operations

### RPC Functions

**Function: `public.increment_rec_count(p_user_id UUID)`**
- Atomically increments rec_count with UTC midnight reset
- INSERT with defaults (rec_count=1) if no record exists
- ON CONFLICT: Increment existing counter, reset to 1 if new day
- Language: plpgsql

**Function: `public.increment_chat_count(p_user_id UUID)`**
- Atomically increments chat_count with UTC midnight reset
- INSERT with defaults (chat_count=1) if no record exists
- ON CONFLICT: Increment existing counter, reset to 1 if new day
- Language: plpgsql

**Permissions:**
- GRANT EXECUTE on both functions to authenticated users (for Edge Function calls)

## Key Decisions Made

### Separate columns vs JSONB
Used separate `rec_count` and `chat_count` columns instead of JSONB storage as specified in CONTEXT.md. This provides:
- Simpler queries (no JSONB path extraction)
- Check constraints at database level (cannot go below 0)
- Better performance for atomic increments
- Clearer schema semantics

### Atomic reset and increment pattern
The CASE statement in both functions handles reset and increment in one atomic operation:
```sql
rec_count = CASE
  WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
  ELSE user_limits.rec_count + 1                       -- Increment
END
```
This ensures thread-safe daily reset without race conditions.

### RLS policy design
Only SELECT policy for authenticated users (view own limits). No INSERT/UPDATE policies because Edge Functions call RPC functions which run with elevated permissions. This prevents clients from directly modifying counters.

### UTC date handling
Used PostgreSQL's `CURRENT_DATE` function which returns UTC date on Supabase servers. No explicit timezone handling needed.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

1. Task 1: Supabase CLI authentication required
   - Paused for `supabase login`
   - User confirmed migration applied via `npx supabase db push`
   - User confirmed environment variables set (DAILY_REC_LIMIT=2, DAILY_CHAT_LIMIT=10)
   - Resumed and completed successfully

## Dependency Graph

**Requires:**
- Phase 18: Coach tables (profiles table referenced by CASCADE DELETE)
- Phase 26: README update (documentation baseline)

**Provides:**
- Database foundation for daily usage limits tracking
- Atomic counter increment functions for Edge Functions

**Affects:**
- Phase 27-02: Edge Function integration (coach and chat functions will call RPCs)
- Phase 27-03: UI feedback for limit enforcement

## Tech Stack Changes

**Added:**
- PostgreSQL user_limits table with RLS
- PostgreSQL RPC functions (increment_rec_count, increment_chat_count)
- Database indexes for performance

**Patterns Established:**
- Atomic counter increment with daily reset pattern
- RLS policy pattern for user-scoped data (view only, no direct modifications)
- Service role pattern for privileged operations (Edge Functions call RPCs)

## Key Files

### Created
- `supabase/migrations/20260119140000_create_user_limits.sql` - Migration file with table, RLS, and RPC functions

### Modified
- None in this task

## Verification

**Migration Applied:**
- Table exists with correct schema (user_id, rec_count, chat_count, limit_date, updated_at)
- RLS policy restricts SELECT to user's own limits
- Both RPC functions exist and are callable
- EXECUTE permissions granted to authenticated users

**Functional Testing:**
- User confirmed migration applied via `npx supabase db push`
- User confirmed environment variables set for daily limits

## Next Phase Readiness

**Ready for Phase 27-02 (Edge Function Integration):**
- Database tables and RPC functions are in place
- Edge Functions can now call `supabase.rpc('increment_rec_count', { p_user_id })` and `supabase.rpc('increment_chat_count', { p_user_id })`
- Daily limit environment variables are configured (DAILY_REC_LIMIT=2, DAILY_CHAT_LIMIT=10)

**No blockers or concerns.**

## Metrics

**Duration:** 3 minutes
**Completed:** 2026-01-19

**Tasks:** 1/1 complete

## Summary

Successfully created database foundation for daily usage limits with atomic counter increment functions and RLS policies. The user_limits table provides per-user tracking of recommendations and chat messages with automatic UTC midnight reset. Separate columns (not JSONB) provide clean schema semantics and check constraints. RLS ensures users can only view their own limits while RPC functions enable atomic updates from Edge Functions.
