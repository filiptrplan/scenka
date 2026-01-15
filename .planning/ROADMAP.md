# Roadmap: Scenka

## Milestones

- ✅ **v1.0 Hold Color Feature** — Phases 1-4 (shipped 2026-01-15)
- 🚧 **v1.1 UX & Analytics** — Phases 5-8 (in progress)

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

#### Phase 6: Email Redirect Config

**Goal**: Configure Supabase email confirmation to redirect to production URL (chat.trplan.si)
**Depends on**: Phase 5
**Research**: Likely (need to verify if redirect URL can be set programmatically)
**Research topics**: Supabase auth redirect URL configuration options
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

#### Phase 7: Failure Analytics

**Goal**: Detailed breakdown of failure reasons by frequency to identify training focus areas
**Depends on**: Phase 6
**Research**: Unlikely (recharts already integrated, internal query patterns)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

#### Phase 8: Style Analytics

**Goal**: Visualize most awkward climbing styles (not just failed)
**Depends on**: Phase 7
**Research**: Unlikely (same patterns as Phase 7)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 5 → 6 → 7 → 8

| Phase         | Milestone | Plans | Status      | Completed |
| ------------- | --------- | ----- | ----------- | --------- |
| 5. Logger Form Reset | v1.1 | 1/1 | ✓ Complete | 2026-01-15 |
| 6. Email Redirect Config | v1.1 | 0/? | Not started | - |
| 7. Failure Analytics | v1.1 | 0/? | Not started | - |
| 8. Style Analytics | v1.1 | 0/? | Not started | - |
