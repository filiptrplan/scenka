---
phase: 19-coach-page-recommendations-ui
plan: 02
title: Coach Page Component
subsystem: Coach UI
tags:
  - react
  - tanstack-query
  - tabs
  - ui-components
  - recommendations
requires:
  - phase-18 (AI Coach Foundation)
provides:
  - CoachPage component with tabs and loading states
affects:
  - phase-19-03 (recommendations content)
  - phase-19-04 (pattern analysis content)
---

# Phase 19 Plan 02: Coach Page Component Summary

**Coach Page component with tabs for Recommendations and Pattern Analysis, including loading, error, and empty states with generate CTA**

## Decisions Made

1. **Tab Architecture:** Used Radix UI Tabs component for accessible, keyboard-navigable tab switching between Recommendations and Pattern Analysis views.

2. **Loading State Pattern:** Followed ChartsPage pattern with centered text loading state on dark background for visual consistency across the app.

3. **Empty State UX:** Implemented clear "Generate your first recommendations" CTA when no recommendations exist, with disabled button state and spinner during generation.

4. **Input Validation:** Added check for climbs data before generating recommendations to provide helpful error message when user has no logged climbs.

5. **User Preferences:** Integrated user profile data (preferred_discipline, preferred_grade_scale) as required input for generateRecommendations mutation.

## Deviations from Plan

None - plan executed exactly as written.

## Key Implementation Details

### CoachPage Component Structure

- **Header:** "Coach" title with "AI-powered training recommendations" subtitle, matching ChartsPage styling pattern
- **Tabs:** Two-column grid with Recommendations and Pattern Analysis tabs
- **State Management:**
  - `useCoachRecommendations()` - Fetches current recommendations (24h stale time)
  - `useClimbs()` - Gets climbs data for regeneration input
  - `useProfile()` - Gets user preferences for recommendation generation
  - `useGenerateRecommendations()` - Mutation for generating new recommendations
- **Styling:** Dark theme (#0a0a0a), uppercase headers, border-bottom-2 white/20, max-w-2xl centered

### Import Order

The ESLint import/order rule requires: third-party libraries (lucide-react, sonner) before React imports, then internal imports in alphabetical order within groups.

## Tech Tracking

### Added Dependencies
- None (uses existing: react, lucide-react, sonner, @radix-ui/react-tabs, tanstack-query)

### Established Patterns
- Tab-based navigation using Radix UI Tabs
- Loading/Error/Empty state pattern for data-fetching components
- User preference integration for AI-powered features
- Toast notifications for user feedback (sonner)

## File Changes

### Created
- `src/components/features/coach-page.tsx` (141 lines)

### Modified
- `src/components/features/index.ts` (added CoachPage export)

## Success Criteria Met

- CoachPage component exists at `/workspace/src/components/features/coach-page.tsx`
- Renders with tabs for Recommendations and Pattern Analysis
- Shows loading state with "Loading recommendations..." message
- Shows error state with helpful error message
- Shows empty state with "Generate Recommendations" CTA button
- Button disabled while generating with "Generating..." text and spinner
- Tab switching works (keyboard and click) via Radix UI Tabs
- TypeScript compiles without errors
- Component exported from features index for App.tsx integration

## Next Steps

Phase 19-03 will implement the recommendations content (drills, weekly focus display) within the Recommendations tab content area.

## Authentication Gates

None - no external API authentication required for this plan (uses Supabase auth already configured).

## Metrics

**Duration:** 8 minutes
**Completed:** 2026-01-17
**Commits:** 3
- `4ea2129` feat(19-02): create CoachPage component with tabs and states
- `2f901a0` feat(19-02): export CoachPage from features index
- `05dc56c` fix(19-02): fix import order in coach-page per ESLint rules
