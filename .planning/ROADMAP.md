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
**Research**: Likely (need to understand current analytics structure, identify most valuable metrics, determine best chart types)
**Research topics**: Current analytics implementation, climbing training metrics, recharts advanced features
**Plans**: 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 13 to break down)

**Details:**
Current issues to address:
- Style Distribution graph is not very useful
- Not all bar names are displayed (label overflow issue)
- Overall need more insightful graphs for training focus

May involve:
- Removing or replacing existing charts
- Adding new more meaningful metrics
- Improving label visibility and chart layout
- Better filtering and data grouping

## Progress

**Execution Order:** Phases execute in numeric order: 5 → 5.1 → 6 → 7 → 8 → 9 → 10 → 10.1 → 11 → 12 → 13

| Phase         | Milestone | Plans | Status      | Completed |
| 5. Logger Form Reset | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 5.1 Logger Window Close Setting | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 6. Email Redirect Config | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 7. Failure Analytics | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 8. Style Analytics | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 9. Mark Failed as Succeeded | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 10. Completed Climbs Analytics | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 10.1 Fix Mark as Sent Button Styling | v1.1 | 1/1 | ✓ Complete | 2026-01-16 |
| 11. Make a Nice README | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 12. Add Logo and Emojis to README | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 13. Revamp Analytics for More Insightful Graphs | v1.1 | 0/? | Not started | - |
