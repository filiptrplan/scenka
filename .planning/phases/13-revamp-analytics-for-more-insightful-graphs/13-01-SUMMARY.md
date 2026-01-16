# Plan 01: Revamp Analytics for More Insightful Graphs

**Phase:** 13-revamp-analytics-for-more-insightful-graphs
**Completed:** 2026-01-16

---

## Objective

Revamp analytics dashboard to provide actionable training insights at a glance, transforming analytics from descriptive ("here's what you did") to prescriptive ("here's what you should do about it").

---

## Summary

The analytics dashboard has been revamped to focus on training priorities. The key insight is that climbers need immediate visibility into what to work on next, not just data visualization. Changes made:

### Changes Implemented

1. **Removed Style Distribution chart** - This chart showing all climbs by style was not useful for training decisions and created visual clutter.

2. **Created Training Priorities chart** - New chart positioned at the TOP of the dashboard as the most important insight:
   - Shows failure reasons sorted by frequency (most common first)
   - Orange-500 theme color to indicate actionable priorities
   - Tooltip displays both count AND percentage for context (e.g., "Bad Feet: 8 failures (42% of total)")
   - Subtitle: "Work on these first" to reinforce purpose

3. **Removed Failure Reasons chart** - User feedback identified this as redundant with Training Priorities. Both showed the same failure reason breakdown, but Training Priorities presents it better with percentages and prime positioning.

### Final Chart Order

1. **Training Priorities** (NEW, orange-500) - Failure reasons by frequency with percentages - "Work on these first"
2. **Anti-Style** (rose-500) - Failure rate by wall angle/hold type
3. **Failure Radar** (amber-500) - Physical vs Technical vs Mental breakdown
4. **Sends by Grade** (emerald-500) - Success rate by difficulty bucket
5. **Redemption Rate** (teal-500) - Redemption rate by difficulty bucket

---

## Verification Checklist

- [x] pnpm typecheck passes with no TypeScript errors
- [x] pnpm build succeeds without errors
- [x] Training Priorities chart displays correctly as first chart
- [x] Style Distribution chart is removed
- [x] Failure Reasons chart is removed
- [x] Tooltips show both count and percentage in Training Priorities
- [x] All existing charts still function properly
- [x] Visual hierarchy prioritizes actionable insights

---

## Issues Encountered

None.

---

## Decisions Made

### Chart Redundancy
After initial implementation, user asked about the difference between "Training Priorities" and "Failure Reasons" charts. Both showed the same underlying data (failure reason breakdown). The distinction was:
- **Training Priorities**: Prescriptive, with percentages, first position
- **Failure Reasons**: Descriptive, just counts, later position

**Decision:** Removed Failure Reasons chart entirely (option 1) to reduce redundancy. Training Priorities provides the same insight with better presentation.

---

## Learnings

**Actionable insights > data dumps:** The Training Priorities chart's success comes from its positioning (first), its percentage context, and its prescriptive subtitle. These elements transform raw failure data into a clear "do this next" instruction.

---

## Next Steps

Phase 14: Unify UI Styles - create unified UI components and style guidelines to ensure consistent fonts, buttons, and visual elements across the app.
