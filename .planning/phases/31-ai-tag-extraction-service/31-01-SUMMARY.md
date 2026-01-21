---
phase: 31-ai-tag-extraction-service
plan: 01
subsystem: database
tags: [postgresql, migration, rpc, rls, api-usage-tracking]

requires: [30-02]
provides: [tag_count column, increment_tag_count RPC function, tag_extraction_api_usage table, tags_extracted_at column]
affects: [31-02]

tech-stack:
  added: []
  patterns: [atomic-counter-with-reset, rls-with-service-role-edits, api-usage-tracking-table]

decisions:
  - Used atomic RPC function increment_tag_count() with UTC midnight reset pattern
  - tag_count column added as INTEGER NOT NULL DEFAULT 0 with CHECK constraint (>= 0)
  - No INSERT/UPDATE policies on tag_extraction_api_usage - Edge Functions use service role key
  - tags_extracted_at nullable column for deduplication - NULL indicates not yet extracted

file-changes:
  created:
    - supabase/migrations/20260121000001_add_tag_count.sql
    - supabase/migrations/20260121000002_create_tag_extraction_api_usage.sql
    - supabase/migrations/20260121000003_add_tags_extracted_at.sql
  modified: []

metrics:
  duration: 5m
  completed: 2026-01-21

---

# Phase 31 Plan 01: Database Migrations for AI Tag Extraction Summary

**Created database infrastructure for AI tag extraction tracking - quota enforcement, cost monitoring, and deduplication support.**

## What Was Built

Three database migrations establishing the data foundation for AI-powered tag extraction:

1. **tag_count column and increment_tag_count RPC** (`20260121000001_add_tag_count.sql`) - Daily quota tracking for tag extractions
2. **tag_extraction_api_usage table** (`20260121000002_create_tag_extraction_api_usage.sql`) - API usage tracking (tokens, costs, models)
3. **tags_extracted_at column** (`20260121000003_add_tags_extracted_at.sql`) - Deduplication tracking on climbs table

## Key Changes

### Migration 1: tag_count Column and RPC Function

**Added to user_limits table:**
```sql
ALTER TABLE public.user_limits
ADD COLUMN tag_count INTEGER NOT NULL DEFAULT 0 CHECK (tag_count >= 0);
```

**Created increment_tag_count() RPC function:**
- Input: `p_user_id UUID`
- Returns: `VOID`
- Atomic insert-or-update with UTC midnight reset
- Pattern: `INSERT ... ON CONFLICT (user_id) DO UPDATE`
- Reset logic: If `limit_date < CURRENT_DATE`, reset to 1; otherwise increment by 1
- Granted EXECUTE privilege to authenticated role

**Follows existing pattern from:**
- `increment_rec_count()` function (Phase 27-01)
- `increment_chat_count()` function (Phase 27-01)

### Migration 2: tag_extraction_api_usage Table

**Table schema:**
```sql
CREATE TABLE public.tag_extraction_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'openrouter-tag-extract',
  time_window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS and indexes:**
- RLS enabled with SELECT policy for users to view own usage
- No INSERT/UPDATE policies - Edge Functions use service role key
- Indexes on user_id, time_window_start, and composite user+time for performance

**Follows existing pattern from:**
- coach_api_usage table (Phase 18-01)

### Migration 3: tags_extracted_at Column

**Added to climbs table:**
```sql
ALTER TABLE public.climbs
ADD COLUMN tags_extracted_at TIMESTAMPTZ;
```

**Purpose:**
- Track when AI tags were last extracted for a climb
- Prevent duplicate extractions on same climb
- NULL indicates tags not yet extracted

## Technical Decisions

1. **Atomic counter with reset pattern**: Used `INSERT ... ON CONFLICT ... DO UPDATE` with CASE statement for date reset, same pattern as rec_count and chat_count from Phase 27-01

2. **No INSERT/UPDATE RLS policies**: Edge Functions use service role key for API usage tracking, not user-provided data (prevents quota manipulation)

3. **Composite index on user+time**: Added `tag_extraction_api_usage_user_time_idx` for efficient queries combining user filtering with time windows

4. **Nullable tags_extracted_at**: No default value, initially NULL for all existing climbs - extraction only runs on save or when explicitly triggered

## Deviations from Plan

None - plan executed exactly as written.

## Verification

**Note:** Supabase CLI not available in this environment to push migrations. Migration files are ready and must be pushed by user before proceeding to Phase 31-02.

**Verification to be completed by user:**
1. Run `npx supabase db push` to apply all three migrations
2. Verify `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_limits' AND column_name = 'tag_count';` returns integer type
3. Verify `SELECT proname FROM pg_proc WHERE proname = 'increment_tag_count';` returns one row
4. Verify `SELECT table_name FROM information_schema.tables WHERE table_name = 'tag_extraction_api_usage';` returns one row
5. Verify indexes exist on tag_extraction_api_usage (user_id, time_window_start, user_time)
6. Verify `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'climbs' AND column_name = 'tags_extracted_at';` returns timestamp with time zone

**File verification:**
- Migration 1 contains `ALTER TABLE public.user_limits ADD COLUMN tag_count` - VERIFIED
- Migration 2 contains `CREATE TABLE public.tag_extraction_api_usage` - VERIFIED
- Migration 3 contains `ALTER TABLE public.climbs ADD COLUMN tags_extracted_at` - VERIFIED

## Next Phase Readiness

**Completed:**
- Database migrations for quota enforcement (tag_count, increment_tag_count)
- API usage tracking table (tag_extraction_api_usage)
- Deduplication support (tags_extracted_at column)

**Ready for:**
- Phase 31-02: Edge Function can use increment_tag_count() RPC for quota checks
- Phase 31-02: Edge Function can track API usage to tag_extraction_api_usage table
- Phase 31-02: Edge Function can check tags_extracted_at to prevent duplicate extractions

**Action required:**
- User must run `npx supabase db push` to apply migrations before starting Phase 31-02

**No blockers identified** (pending migration push).
