# Roadmap: Scenka

## Overview

Scenka is a personal, privacy-focused mobile PWA for recreational boulderers who are serious about improving. The application prioritizes quick, frictionless climb logging with exception logging philosophy—only significant climbs (failed projects, awkward sends) are logged.

## Milestones

- **v1.0 Hold Color Feature** — Phases 1-4 (shipped 2026-01-15)
- **v1.1 UX & Analytics** — Phases 5-17 (shipped 2026-01-17)
- **v2.0 AI Coach** — Phases 18-29 (shipped 2026-01-20)
- **v2.1 Simplified Logging + AI Auto-Tagging** — Phases 30-33 (in progress)

## Phases

<details>
<summary>✅ v1.0 Hold Color Feature (Phases 1-4) — SHIPPED 2026-01-15</summary>

- [x] Phase 1: Database & Types (1/1 plans) — completed 2026-01-15
- [x] Phase 2: Settings Page (2/2 plans) — completed 2026-01-15
- [x] Phase 3: Logger Integration (1/1 plans) — completed 2026-01-15
- [x] Phase 4: Display & Polish (2/2 plans) — completed 2026-01-15

**Full details:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 UX & Analytics (Phases 5-17) — SHIPPED 2026-01-17</summary>

- [x] Phase 5: Logger Form Reset (1/1 plans) — completed 2026-01-15
- [x] Phase 5.1: Logger Window Close Setting (1/1 plans) — completed 2026-01-15
- [x] Phase 6: Email Redirect Config (1/1 plans) — completed 2026-01-15
- [x] Phase 7: Failure Analytics (1/1 plans) — completed 2026-01-15
- [x] Phase 8: Style Analytics (1/1 plans) — completed 2026-01-15
- [x] Phase 9: Mark Failed as Succeeded (1/1 plans) — completed 2026-01-16
- [x] Phase 10: Completed Climbs Analytics (1/1 plans) — completed 2026-01-16
- [x] Phase 10.1: Fix Mark as Sent Button Styling (1/1 plans) — completed 2026-01-16
- [x] Phase 10.2: Fix Mark as Sent Button Text Color (1/1 plans) — completed 2026-01-16
- [x] Phase 11: Make a Nice README (1/1 plans) — completed 2026-01-15
- [x] Phase 12: Add Logo and Emojis to README (1/1 plans) — completed 2026-01-15
- [x] Phase 13: Revamp Analytics for More Insightful Graphs (1/1 plans) — completed 2026-01-16
- [x] Phase 14: Unify UI Styles (1/1 plans) — completed 2026-01-16
- [x] Phase 15: Use Design Guidelines to Fix Mark as Sent Button (1/1 plans) — completed 2026-01-16
- [x] Phase 16: Add Version Number to Footer (1/1 plans) — completed 2026-01-16
- [x] Phase 17: Use New Design System to Fix Toggle (1/1 plans) — completed 2026-01-16
- [x] Phase 15.1: Fix Ugly Mark as Sent Button (1/1 plans) — completed 2026-01-17

**Full details:** [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

<details>
<summary>✅ v2.0 AI Coach (Phases 18-29) — SHIPPED 2026-01-20</summary>

**Full details:** [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>🚧 v2.1 Simplified Logging + AI Auto-Tagging (Phases 30-33) — IN PROGRESS</summary>

- [x] Phase 30: Simplified Logger Foundation (2/2 plans, 1 wave) — completed 2026-01-21
- [ ] Phase 31: AI Tag Extraction Service (7/7 plans, 6 waves) — gap closure in progress
  - [x] 31-01-PLAN.md — Database migrations (tag_count, RPC function, api_usage table)
  - [x] 31-02-PLAN.md — Edge Function implementation (openrouter-tag-extract)
  - [x] 31-03-PLAN.md — Client service and wiring (trigger extraction after climb save)
  - [x] 31-04-PLAN.md — Error handling and user feedback (toast notifications, quota UI)
  - [x] 31-05-PLAN.md — Quota exceeded toast integration (completed 2026-01-21)
  - [x] 31-06-PLAN.md — Deployment: migrations and Edge Function (completed 2026-01-21)
  - [ ] 31-07-PLAN.md — Extraction error toast wiring (gap closure)
- [ ] Phase 32: Tag Display & Editing (0/6 requirements) — not started
- [ ] Phase 33: Offline Support & Analytics Integration (0/9 requirements) — not started

**Goal:** Simplify climb logging to reduce friction while using AI to auto-extract tags from notes for analytics.

**Key Features:**
- Simplified logger form: grade, outcome, terrain type (8 options), awkwardness (3 options: awkward/normal/smooth), notes
- AI-powered auto-tagging: analyze notes on save and extract relevant tags automatically
- Reduced friction: eliminate multi-select decisions from logging flow
- Notes as primary source: rich free-form text captures everything, AI categorizes for patterns
- Offline-first: AI extraction queued when offline, processed when online

</details>

## Progress

| Phase | Milestone | Requirements Complete | Status      | Completed  |
|-------|-----------|----------------------|--------------|------------|
| 1-4   | v1.0      | N/A                  | Complete     | 2026-01-15 |
| 5-17  | v1.1      | N/A                  | Complete     | 2026-01-17 |
| 18-29 | v2.0      | N/A                  | Complete     | 2026-01-20 |
| 30-33 | v2.1      | 20/32                | In Progress  | -          |

---

*Last updated: 2026-01-21*
