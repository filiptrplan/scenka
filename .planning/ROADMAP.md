# Roadmap: Scenka

## Milestones

- ✅ **v1.0 Hold Color Feature** — Phases 1-4 (shipped 2026-01-15)
- 🚧 **v1.1 UX & Analytics** — Phases 5-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Hold Color Feature (Phases 1-4) — SHIPPED 2026-01-15</summary>

- [x] Phase 1: Database & Types (1/1 plans) — completed 2026-01-15
- [x] Phase 2: Settings Page (2/2 plans) — completed 2026-01-15
- [x] Phase 3: Logger Integration (1/1 plans) — completed 2026-01-15
- [x] Phase 4: Display & Polish (2/2 plans) — completed 2026-01-15

**Full details:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### 🚧 v1.1 UX & Analytics (In Progress)

**Milestone Goal:** Improve user experience with form auto-reset and actionable analytics for training focus

#### Phase 5: Logger Form Reset

**Goal**: Auto-reset logger form after successful climb submission to reduce friction
**Depends on**: v1.0 complete
**Research**: Unlikely (internal React state patterns)
**Status**: ✅ Completed 2026-01-15

Plans:
- [x] 05-01: Auto-reset logger form using useImperativeHandle pattern

#### Phase 5.1: Logger Window Close Setting (INSERTED)

**Goal**: Add user preference for whether logger window closes after adding each climb or stays open for efficient entry
**Depends on**: Phase 5
**Research**: Likely (need to determine if user preferences already exist, and how to store them)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-15

Plans:
- [x] 5.1-01: Add database field, settings toggle, and App.tsx integration

**Details:**
Follows existing pattern for user preferences (home_gym, preferred_grade_scale, enabled_hold_colors)
- Adds `close_logger_after_add` boolean field to Profile
- Toggle control in settings page
- App.tsx respects preference: true = close sheet, false = keep open for rapid entry

#### Phase 6: Email Redirect Config

**Goal**: Configure Supabase email confirmation to redirect to production URL (chat.trplan.si)
**Depends on**: Phase 5.1
**Research**: Likely (need to verify if redirect URL can be set programmatically)
**Research topics**: Supabase auth redirect URL configuration options
**Status**: ✅ Completed 2026-01-15 (Manual configuration)

Plans:
- [x] 06-01: Manual dashboard configuration - Set Site URL and Redirect URLs in Supabase dashboard

#### Phase 7: Failure Analytics

**Goal**: Detailed breakdown of failure reasons by frequency to identify training focus areas
**Depends on**: Phase 6
**Research**: Unlikely (recharts already integrated, internal query patterns)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-15

Plans:
- [x] 07-01: Add Failure Reasons breakdown chart with rose-500 theme color, sorted by frequency

#### Phase 8: Style Analytics

**Goal**: Visualize most awkward climbing styles (not just failed)
**Depends on**: Phase 7
**Research**: Unlikely (same patterns as Phase 7)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-15

Plans:
- [x] 08-01: Add Style Distribution chart showing all climbs by style with purple-500 theme color

#### Phase 9: Mark Failed as Succeeded

**Goal**: Ability to mark previously failed climbs as succeeded to track redemption rate
**Depends on**: Phase 8
**Research**: Likely (need to understand current climb update flow and whether outcome change tracking exists)
**Research topics**: Climb update API, outcome field constraints, data model changes for redemptions
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 09-01: Create ClimbCard component with Mark as Sent button and integrate into Dashboard

**Details:**
Created reusable ClimbCard component that renders climb details with conditional "Mark as Sent" button for failed climbs. Integrated into Dashboard replacing inline rendering.

#### Phase 10: Completed Climbs Analytics

**Goal**: Graph tracking redemption stats - how many failed climbs are eventually completed
**Depends on**: Phase 9
**Research**: Unlikely (recharts already integrated, redemption data will exist after Phase 9)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 10-01: Create redemption_at column migration, update ClimbCard to record redemption timestamp, add Redemption Rate chart

**Details:**
Implemented redemption analytics tracking and visualization showing how many failed climbs are eventually completed. Created database migration for redemption tracking, updated ClimbCard to record redemption events, and added Redemption Rate chart to Analytics page.

#### Phase 10.1: Fix Mark as Sent Button Styling (INSERTED)

**Goal**: Fix white "Mark as Sent" buttons to conform to app style
**Depends on**: Phase 10
**Research**: Unlikely (UI styling fix)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 10.1-01: Remove custom Button classes from Mark as Sent button (completed 2026-01-16)

**Details:**
Fixed button styling by removing custom Tailwind class overrides that created white background, allowing shadcn/ui Button's outline variant to properly handle emerald color theming.

#### Phase 10.2: Fix Mark as Sent Button Text Color (INSERTED)

**Goal**: Fix white text color on "Mark as Sent" button to make it more like selection buttons (analytics, climbs, sport/boulder in logger)
**Depends on**: Phase 10.1
**Research**: Unlikely (UI styling fix - need to examine existing button patterns)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 10.2-01: Add light gray text color to Mark as Sent button (completed 2026-01-16)

**Details:**
Added `text-[#aaa]` className to Button component to override shadcn/ui outline variant's default white text. Now matches the selection button pattern used throughout app (Climbs/Analytics navigation, Boulder/Sport discipline toggles).

#### Phase 11: Make a Nice README

**Goal**: Create a polished README with disclaimer and screenshot placeholders
**Depends on**: Phase 10
**Research**: Unlikely (documentation, no code changes)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-15

Plans:
- [x] 11-01: Create comprehensive README with casual tone and screenshot placeholders

#### Phase 12: Add Logo and Emojis to README

**Goal**: Add a logo to README and enhance with tasteful emojis
**Depends on**: Phase 11
**Research**: Unlikely (documentation updates only)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-15

Plans:
- [x] 12-01: Add logo image and strategic emojis to README

**Details:**
Added logo.png at top of README with proper alt text
Added 1-2 strategic emojis per section: climbing (🧗), privacy (🔒), PWA offline (⚡), React (⚛️), analytics (📊), quick start (🚀), settings (⚙️), mobile (📱)

#### Phase 13: Revamp Analytics for More Insightful Graphs

**Goal**: Revamp analytics dashboard with more insightful graphs, addressing Style Distribution issues and improving overall data visualization
**Depends on**: Phase 12
**Research**: Unlikely (charts and data already understood)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 13-01: Add Training Priorities chart, remove Style Distribution and Failure Reasons charts

**Details:**
Training Priorities chart (orange-500) positioned as first chart showing failure reasons with percentages. Style Distribution and Failure Reasons charts removed to reduce redundancy and focus on actionable training insights.

#### Phase 14: Unify UI Styles

**Goal**: Create unified UI components and style guidelines to ensure consistent fonts, buttons, and visual elements across the app
**Depends on**: Phase 13
**Research**: Likely (need to audit current UI inconsistencies, establish design system)
**Research topics**: Current UI component variations, shadcn/ui component patterns, mobile-first design consistency
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 14-01: Create SelectionButton, FormSection, FormLabel components and refactor Logger, ChartsPage, SettingsPage, ClimbCard

**Details:**
Created three reusable shadcn/ui components (SelectionButton, FormSection, FormLabel) using cva pattern:
- SelectionButton: Toggle-style buttons for binary choices (Boulder/Sport, Sent/Fail)
- FormSection: Consistent section/card wrapper styling with hover effects
- FormLabel: Consistent form label typography

Refactored all major feature components:
- Logger: Uses SelectionButton for toggles, FormLabel for labels, FormSection for container
- ChartsPage: Uses FormSection for all 5 chart sections, FormLabel for all labels
- SettingsPage: Uses FormSection wrapper, FormLabel for all form labels
- ClimbCard: Uses FormSection wrapper, FormLabel for all labels

Impact: Reduced inline className duplication by >200 occurrences, centralized UI patterns for easier maintenance

#### Phase 15: Use the new design guidelines to finally fix the Mark as sent button. It still looks like this!

**Goal**: Fix "Mark as Sent" button styling to conform to unified design guidelines
**Depends on**: Phase 14
**Research**: Unlikely (UI styling fix following established patterns)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 15-01: Refactor Mark as Sent button to use SelectionButton component pattern

**Details:**
Refactored "Mark as Sent" button in ClimbCard to use consistent SelectionButton-like styling patterns. Button now uses outline variant with proper text-[#aaa] color and emerald-500 focus states matching the unified design system established in Phase 14.

#### Phase 15.1: Fix ugly Mark as Sent button styling (INSERTED)

**Goal**: Fix "Mark as Sent" button styling to conform to unified design system patterns by adding a proper ghost variant to the Button component
**Depends on**: Phase 15
**Research**: Unlikely (UI styling fix following established patterns)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-17

Plans:
- [x] 15.1-01: Update Button component with unified ghost variant and update ClimbCard to use it (completed 2026-01-17)

**Details:**
Updated Button component ghost variant with white opacity pattern (bg-white/[0.02], border-white/20, hover:border-white/40, text-[#888] hover:text-white). ClimbCard now uses variant="ghost" with SelectionButton typography, no className hacks.

#### Phase 16: Add Version Number to Footer

**Goal**: Display version number in application footer for user reference and debugging
**Depends on**: Phase 15.1
**Research**: Unlikely (simple UI component addition)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 16-01: Create Footer component and integrate into App layout

**Details:**
Created Footer component displaying version "v1.1.0" from package.json with fixed positioning at bottom of screen. Used z-40 to layer below OfflineStatus (z-50). Integrated into App.tsx Layout component for universal visibility across all pages.

#### Phase 17: Use the New Design System to Fix the Ugly Toggle

**Goal**: Fix toggle styling using the unified design system components
**Depends on**: Phase 15.1
**Research**: Unlikely (UI styling fix using established patterns)
**Plans**: 1 plan
**Status**: ✅ Completed 2026-01-16

Plans:
- [x] 17-01: Create Toggle component with cva pattern matching Phase 14 design system

**Details:**
Created minimal Toggle component with h-4 w-7 track size (smaller than standard Switch), using bg-white/[0.02] for unchecked state and bg-white/10 for checked state. Integrated into SettingsPage to replace "ugly" Switch component.

## Progress

**Execution Order:** Phases execute in numeric order: 5 → 5.1 → 6 → 7 → 8 → 9 → 10 → 10.1 → 10.2 → 11 → 12 → 13 → 14 → 15 → 15.1 → 16 → 17

| Phase         | Milestone | Plans | Status      | Completed |
| 5. Logger Form Reset | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 5.1 Logger Window Close Setting | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 6. Email Redirect Config | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 7. Failure Analytics | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 8. Style Analytics | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 9. Mark Failed as Succeeded | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 10. Completed Climbs Analytics | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 10.1 Fix Mark as Sent Button Styling | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 10.2 Fix Mark as Sent Button Text Color | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 11. Make a Nice README | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 12. Add Logo and Emojis to README | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 13. Revamp Analytics for More Insightful Graphs | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 14. Unify UI Styles | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 15. Use the new design guidelines to finally fix the Mark as sent button. It still looks like this! | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 16. Add Version Number to Footer | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 17. Use the New Design System to Fix the Ugly Toggle | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 15.1 Fix ugly Mark as Sent button styling | v1.1 | 1/1 | ✓ Complete | 2026-01-17 |
