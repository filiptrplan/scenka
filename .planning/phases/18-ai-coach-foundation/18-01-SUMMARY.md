---
phase: 18-ai-coach-foundation
plan: 01
subsystem: database
tags: [postgresql, rls, jsonb, typescript, supabase, migrations]

# Dependency graph
requires:
  - phase: 01-04-foundation
    provides: climbs table, profiles table, migration patterns
  - phase: 05-17-v1.1-features
    provides: established codebase patterns, existing RLS policies
provides:
  - Database tables for AI Coach features (coach_recommendations, coach_messages, coach_api_usage)
  - RLS policies for user data isolation
  - Performance indexes on user_id, date columns, and JSONB columns
  - TypeScript types matching database schema
affects: [18-02-pattern-analysis, 18-03-coach-service, 18-04-hooks, 18-05-privacy-safeguards]

# Tech tracking
tech-stack:
  added: []
  patterns:
  - JSONB for flexible data storage with separate indexed columns for performance
  - RLS policies using auth.uid() for user isolation
  - GIN indexes with jsonb_path_ops for JSONB column queries

key-files:
  created:
  - supabase/migrations/20260117_create_coach_tables.sql
  modified:
  - src/types/index.ts (coach_recommendations, coach_messages, coach_api_usage types)

key-decisions:
  - "Used JSONB for recommendation content to support schema evolution"
  - "Added separate columns (generation_date, time_window_start) for frequently queried fields"
  - "Created GIN indexes on JSONB columns using jsonb_path_ops operator class"
  - "Followed existing climbs table migration pattern for consistency"

patterns-established:
  - "Coach table migration pattern: CREATE TABLE, ENABLE RLS, CREATE POLICIES, CREATE INDEXES (single column, composite, GIN on JSONB)"
  - "TypeScript Database interface: Row/Insert/Update for each table matching SQL schema"

# Metrics
duration: 9min
completed: 2026-01-17
---

# Phase 18, Plan 01: Database Schema for AI Coach Summary

**Three database tables (coach_recommendations, coach_messages, coach_api_usage) with RLS policies, JSONB content fields, and performance indexes**

## Performance

- **Duration:** 9 minutes
- **Started:** 2026-01-17T20:52:36Z
- **Completed:** 2026-01-17T21:01:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created database migration for coach tables following existing climbs table pattern
- Added RLS policies on all tables using auth.uid() for user data isolation
- Created performance indexes on user_id, date columns, and JSONB columns
- TypeScript types for coach tables defined matching database schema

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migration for coach tables** - `6a418e0` (feat)
2. **Task 2: Add TypeScript types for coach tables** - `00a9375` (feat)

**Note:** Task 2 types were added in a previous commit (00a9375) before this plan execution.

## Files Created/Modified

- `supabase/migrations/20260117_create_coach_tables.sql` - Database migration creating coach_recommendations, coach_messages, and coach_api_usage tables with RLS policies and indexes
- `src/types/index.ts` - Added coach_recommendations, coach_messages, and coach_api_usage types to Database interface (Row/Insert/Update)

## Decisions Made

- Used JSONB for recommendation content to support flexible schema evolution as LLM response structure may change
- Added separate columns (generation_date, time_window_start) for frequently queried fields to avoid JSONB performance penalty
- Created GIN indexes on JSONB columns using jsonb_path_ops operator class for efficient containment queries
- Followed existing climbs table migration pattern for consistency across the codebase

## Deviations from Plan

### Task 2 Type Definitions Already Exists

**Task overlap: TypeScript types were added in a previous commit**
- **Found during:** Task 2 execution
- **Issue:** coach_recommendations, coach_messages, and coach_api_usage types already existed in src/types/index.ts from commit 00a9375
- **Resolution:** Verified types match plan specification exactly, no changes needed
- **Files modified:** None (types already correct)
- **Committed in:** 00a9375 (feat: add pattern analysis types)

### Task 3 Supabase CLI Authentication Required

**Authentication gate: Cannot run npx supabase commands without Supabase CLI login**
- **Found during:** Task 3 (Generate Supabase types from migration)
- **Issue:** Running `npx supabase db push` requires authenticated Supabase CLI (SUPABASE_ACCESS_TOKEN)
- **User setup required:** Run `npx supabase login` to authenticate before applying migration
- **Workaround:** Manual TypeScript types already exist and match schema exactly
- **Files modified:** None (migration file created but not applied)

---

**Total deviations:** 2 (1 task overlap, 1 authentication gate)
**Impact on plan:** Task 2 types were already correct. Task 3 requires user authentication to apply migration. Database schema is ready for deployment after user runs `npx supabase login` and `npx supabase db push`.

## Issues Encountered

- Supabase CLI not authenticated - unable to apply migration or generate Supabase types automatically
- Manual verification performed instead: checked migration syntax, verified TypeScript types match schema

## User Setup Required

**Supabase CLI authentication required.** To complete database setup:

1. Run `npx supabase login` to authenticate with Supabase CLI
2. Run `npx supabase db push` to apply the migration
3. Optionally run `npx supabase gen types typescript --local --schema public > src/types/supabase-generated.ts` to generate types (manual types already exist)

**Migration file created:** `supabase/migrations/20260117_create_coach_tables.sql`

## Next Phase Readiness

- Database schema complete and ready for deployment (pending Supabase CLI authentication)
- TypeScript types in place for type-safe database operations
- Pattern analysis service (18-02) can now query coach tables using existing Supabase client
- Coach service layer (18-03) has database foundation for storing recommendations, messages, and API usage
- Privacy safeguards (18-05) can leverage existing RLS policies for user data isolation

**Blockers:**
- User must authenticate Supabase CLI and run `npx supabase db push` to apply migration before coach features can be tested

---

*Phase: 18-ai-coach-foundation*
*Plan: 01*
*Completed: 2026-01-17*
