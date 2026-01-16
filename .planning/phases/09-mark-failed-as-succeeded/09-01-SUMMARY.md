# Phase 09, Plan 01 - Mark Failed as Succeeded

**Status:** Complete
**Date:** 2026-01-16
**Tasks:** 2/2 completed

## Summary

Implemented "Mark as Sent" functionality to allow users to mark previously failed climbs as succeeded, tracking redemption rate. Created reusable ClimbCard component with conditional "Mark as Sent" button for failed climbs, integrated into Dashboard climb list.

## Tasks Completed

### Task 1: Create ClimbCard component
**File:** `/home/filip/Repos/scenka/src/components/features/climb-card.tsx`

Created new reusable ClimbCard component that:
- Renders all climb details (grade, location, style, awkwardness, notes, hold color, outcome badge)
- Displays "Mark as Sent" button only when `climb.outcome === 'Fail'`
- Uses existing `useUpdateClimb()` hook for mutation with automatic cache invalidation
- Updates outcome to 'Sent' and clears `failure_reasons` array on click
- Passes `onEditClick` and `onDeleteClick` props to maintain existing functionality
- Exported from `src/components/features/index.ts`

**Key implementation details:**
- Used `useUpdateClimb()` hook from existing codebase (no custom mutation)
- Button styled with emerald-500 theme colors to indicate success action
- Loading state: "Updating..." text during mutation
- Cache invalidates automatically via `useUpdateClimb()`'s `onSuccess` callback

### Task 2: Integrate ClimbCard into Dashboard
**File:** `/home/filip/Repos/scenka/src/App.tsx`

Replaced inline climb rendering in Dashboard function with ClimbCard component:
- Imported ClimbCard from `@/components/features`
- Removed 150+ lines of inline JSX code
- Cleaned up unused imports: `formatDistanceToNow` from date-fns, `MapPin`, `TrendingDown`, `TrendingUp`, `Flame`, `Edit`, `Trash2` from lucide-react, `Badge`, `COLOR_CIRCUIT`, `HoldColor`
- Removed unused constants: `HOLD_COLOR_MAP`, `gradeScaleLabels`
- Maintained existing `ClimbActionsContext` with `onEditClick` and `onDeleteClick` handlers
- Dashboard now renders `<ClimbCard climb={climb} onEditClick={onEditClick} onDeleteClick={onDeleteClick} />` for each climb

**Benefits:**
- Better code organization: climb display logic isolated in reusable component
- Reduced Dashboard complexity from 250+ lines to ~70 lines
- Follows codebase patterns from RESEARCH.md
- Maintains all existing functionality (edit, delete, climb list display)
- Adds new "Mark as Sent" functionality without breaking changes

## Files Modified

1. **`src/components/features/climb-card.tsx`** (new file, 209 lines)
   - Created ClimbCard component with all climb display logic
   - Added "Mark as Sent" button for failed climbs
   - Uses useUpdateClimb() hook for mutations

2. **`src/App.tsx`** (modified, -182 lines)
   - Integrated ClimbCard into Dashboard
   - Removed inline climb rendering code
   - Cleaned up unused imports and constants

3. **`src/components/features/index.ts`** (modified, +1 line)
   - Exported ClimbCard component

## Verification

- [x] `pnpm typecheck` passes with no TypeScript errors
- [x] `pnpm build` succeeds without errors
- [x] ClimbCard component exports successfully
- [x] Dashboard renders climbs using ClimbCard
- [x] "Mark as Sent" button appears for failed climbs
- [x] "Mark as Sent" button is hidden for Sent climbs
- [x] Edit and Delete buttons still work

## Decisions Made

1. **Use existing `useUpdateClimb()` hook**: No custom mutation logic needed - follows codebase patterns from RESEARCH.md
2. **Clear `failure_reasons` on Sent**: When marking a climb as sent, clears the failure_reasons array to prevent analytics pollution
3. **Button only for failed climbs**: Conditional rendering (`climb.outcome === 'Fail'`) hides button for already-sent climbs
4. **Maintain existing context**: No changes to `ClimbActionsContext` - kept `onEditClick` and `onDeleteClick` handlers
5. **Emerald-500 theme**: Used emerald-500 colors for "Mark as Sent" button to indicate success action, distinct from red-500 for failures

## Integration Points

- `useUpdateClimb()` hook: Provides mutation with automatic cache invalidation
- `updateClimb()` service: Handles offline queue and Supabase `.update().select()` pattern
- `ClimbActionsContext`: Provides edit/delete handlers to ClimbCard
- `COLOR_CIRCUIT` lib: Provides color circuit grade display (copied to ClimbCard)
- `HOLD_COLOR_MAP`: Provides hold color display (copied to ClimbCard)

## Next Steps

Phase 10: Completed Climbs Analytics - graph tracking redemption stats for how many failed climbs are eventually completed. This phase will leverage the redemption data tracked by Phase 09's "Mark as Sent" feature.

## Commits

- `711d956`: feat(09): create ClimbCard component with Mark as Sent button
- `34e8cd9`: feat(09): integrate ClimbCard into Dashboard
