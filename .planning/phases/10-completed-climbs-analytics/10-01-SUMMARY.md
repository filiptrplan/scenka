# Phase 10, Plan 01 - Completed Climbs Analytics

**Status:** Complete
**Date:** 2026-01-16
**Tasks:** 4/4 completed

## Summary

Implemented redemption analytics tracking and visualization showing how many failed climbs are eventually completed. Created database migration for redemption tracking, updated ClimbCard to record redemption events, and added Redemption Rate chart to Analytics page.

## Tasks Completed

### Task 1: Create migration for redemption_at column
**File:** `/home/filip/Repos/scenka/supabase/migrations/20260116093714_add_redemption_at_column.sql`

Created Supabase migration to add `redemption_at TIMESTAMPTZ` nullable column to climbs table. This column tracks when a failed climb is marked as sent, enabling redemption rate analytics.

**Key implementation details:**
- Used proper naming convention with timestamp prefix (20260116093714)
- Nullable column (TIMESTAMPTZ) to support optional redemption tracking
- No RLS policy changes needed (column is not part of access control)
- Follows existing migration patterns from 20260105175622_create_climbs_table.sql

### Task 2: Update ClimbCard to record redemption timestamp
**File:** `/home/filip/Repos/scenka/src/components/features/climb-card.tsx`

Modified the "Mark as Sent" button handler to update redemption_at field when marking a failed climb as sent.

**Key implementation details:**
- Updated `handleMarkAsSent` function to include `redemption_at: new Date().toISOString()` in updates object
- Records current ISO timestamp when redemption occurs
- Uses existing `useUpdateClimb()` hook for mutation with automatic cache invalidation
- Ensures redemption data flows through to analytics charts

### Task 3: Add Redemption Rate chart to ChartsPage
**File:** `/home/filip/Repos/scenka/src/components/features/charts-page.tsx`

Added new Redemption Rate chart section to Analytics page showing redemption statistics by difficulty bucket.

**Key implementation details:**
- Created `redemptionRateData` useMemo hook that:
  - Groups climbs by difficulty bucket (using `getAllGradeBuckets` and `getDifficultyBucket`)
  - Calculates `total_sent` (climbs with outcome='Sent')
  - Calculates `redeems_sent` (climbs with outcome='Sent' AND redemption_at IS NOT NULL)
  - Computes `redemption_rate` as percentage for each bucket
  - Returns array with name, total_sent, redeems_sent, non_redeemed, redemption_rate
- Rendered as BarChart with two stacked bars:
  - Gray bar (gray-500): Sent (non-redeemed) - total_sent - redeems_sent
  - Teal bar (teal-500): Redeemed - redeems_sent
- Follows existing chart styling patterns:
  - Section header with teal-500 theme color lines: "REDEMPTION RATE"
  - ResponsiveContainer with height-80
  - BarChart with same margin and axis styling as existing charts
  - Tooltip with dark theme styling (backgroundColor: '#1a1a1a', border, fontFamily: 'monospace')
  - XAxis with bucket names (Beginner, Intermediate, Advanced, Expert)
  - YAxis with count values
  - Legend showing "Sent (non-redeemed)" and "Redeemed"
  - Subtitle: "Redemption rate by difficulty bucket"
- Added section after Style Distribution section, before footer
- Empty data case handled gracefully (shows chart with zero values)

### Task 4: Apply migration to database
**Files:** `/home/filip/Repos/scenka/src/lib/validation.ts`, `/home/filip/Repos/scenka/src/types/index.ts`, `/home/filip/Repos/scenka/src/lib/example-climbs.ts`, `/home/filip/Repos/scenka/src/types/supabase.ts`

Applied migration and regenerated TypeScript types to include redemption_at field.

**Key implementation details:**
- Ran `npx supabase db push` to apply migration to remote database
- Ran `npx supabase gen types typescript --linked` to regenerate TypeScript types from database
- Updated climb validation schema (`climbSchema`) to include optional `redemption_at: z.string().optional()`
- Updated custom types in `src/types/index.ts`:
  - Added `redemption_at: string | null` to climbs.Tables.Row
  - Added `redemption_at?: string | null` to climbs.Tables.Insert and climbs.Tables.Update
  - Updated Climb type to include redemption_at from TablesRow
- Added `redemption_at: null` to all example climbs in `src/lib/example-climbs.ts`
- TypeScript now compiles without errors
- Build succeeds without errors

## Files Modified

1. **`supabase/migrations/20260116093714_add_redemption_at_column.sql`** (new file, 2 lines)
   - Created migration for redemption_at column

2. **`src/components/features/climb-card.tsx`** (modified, +1 line)
   - Updated handleMarkAsSent to record redemption timestamp

3. **`src/components/features/charts-page.tsx`** (modified, +106 lines)
   - Added redemptionRateData useMemo hook
   - Added Redemption Rate chart section

4. **`src/lib/validation.ts`** (modified, +1 line)
   - Added redemption_at field to climbSchema

5. **`src/types/index.ts`** (modified, +3 lines)
   - Added redemption_at to climbs Row, Insert, and Update types

6. **`src/lib/example-climbs.ts`** (modified, +8 lines)
   - Added redemption_at: null to all example climbs

7. **`src/types/supabase.ts`** (regenerated)
   - Auto-generated types include redemption_at field

## Verification

- [x] Migration file created with proper structure
- [x] npx supabase db push applies migration successfully
- [x] npx supabase gen types typescript --local regenerates types
- [x] pnpm typecheck passes with no TypeScript errors
- [x] pnpm build succeeds without errors
- [x] ClimbCard updates redemption_at when marking as sent
- [x] Redemption Rate chart renders in Analytics page
- [x] Chart shows data by difficulty bucket
- [x] Teal-500 theme color used for redemption data

## Decisions Made

1. **Nullable redemption_at column**: Column is nullable to support optional redemption tracking - only set when a failed climb is marked as sent
2. **Stacked bar chart**: Used stacked bars to show both redemption count and total sends, providing visual comparison
3. **Teal-500 theme color**: Chose teal-500 for redemption data to distinguish from other analytics (rose-500 for failures, amber-500 for radar, purple-500 for styles)
4. **Difficulty bucket grouping**: Chart groups by difficulty bucket to show redemption patterns across grades - helps identify if climbers are redeeming projects at appropriate levels
5. **Optional validation field**: Added redemption_at as optional field in climbSchema to support both creating new climbs (no redemption) and updating existing climbs (with redemption)
6. **Migration to both local and remote**: Used --linked flag to apply migration to remote database, ensuring production and development schemas stay in sync

## Integration Points

- `redemption_at` column: Database field stores redemption timestamp
- `climbSchema`: Validation schema includes optional redemption_at for updates
- `useUpdateClimb()` hook: Handles mutation with redemption_at field through updateClimb service
- `updateClimb()` service: Handles offline queue and Supabase `.update().select()` pattern with redemption_at
- `getAllGradeBuckets()` and `getDifficultyBucket()`: Grade bucket utilities for grouping redemption data by difficulty
- `recharts` BarChart: Renders stacked bars with legend for redemption visualization

## Next Steps

Phase 11-12: README improvements (already completed in previous sessions) - create polished README with disclaimer, add logo and tasteful emojis. All phases in v1.1 milestone complete.

## Commits

- `befd605`: feat(10): create migration for redemption_at column
- `a7faa84`: feat(10): update ClimbCard to record redemption timestamp
- `d4efe93`: feat(10): add Redemption Rate chart to Analytics page
- `0b4b005`: feat(10): apply migration and update types
- `0015077`: docs(10): update STATE with Phase 10 completion
