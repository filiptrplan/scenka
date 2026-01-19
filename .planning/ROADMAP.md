# Roadmap: Scenka

## Overview

Scenka v2.0 adds an AI-powered climbing coach to existing mobile PWA. The journey builds from database foundations and services (Phase 18) through UI with mock data (Phase 19) to real LLM integration (Phase 20) and culminates in an interactive chat interface (Phase 21). Each phase delivers increasing value: foundation enables all features, recommendations UI provides immediate visual value, LLM integration brings personalized drills, and chat enables Q&A for deeper learning.

## Milestones

- **v1.0 Hold Color Feature** — Phases 1-4 (shipped 2026-01-15)
- **v1.1 UX & Analytics** — Phases 5-17 (shipped 2026-01-17)
- **v2.0 AI Coach** — Phases 18-24 (in progress)

## Phases

<details>
<summary> v1.0 Hold Color Feature (Phases 1-4) — SHIPPED 2026-01-15</summary>

- [x] Phase 1: Database & Types (1/1 plans) — completed 2026-01-15
- [x] Phase 2: Settings Page (2/2 plans) — completed 2026-01-15
- [x] Phase 3: Logger Integration (1/1 plans) — completed 2026-01-15
- [x] Phase 4: Display & Polish (2/2 plans) — completed 2026-01-15

**Full details:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary> v1.1 UX & Analytics (Phases 5-17) — SHIPPED 2026-01-17</summary>

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

### v2.0 AI Coach (In Progress)

**Milestone Goal:** Build AI-powered climbing coach that analyzes logged data and provides actionable training guidance through weekly dashboard recommendations and free-form chat.

#### Phase 18: AI Coach Foundation
**Goal**: Database tables, services, and hooks with cost tracking and privacy safeguards
**Depends on**: Previous milestones (climb logging, analytics infrastructure complete)
**Requirements**: REC-04, REC-06, REC-07, PATT-01, PATT-02, PATT-03, PATT-04, DIFF-01, DIFF-02
**Success Criteria** (what must be TRUE):
  1. Database tables exist for coach_recommendations and coach_messages with proper constraints
  2. coach.ts service provides LLM API abstraction with cost tracking and rate limiting
  3. patterns.ts service extracts failure patterns, style weaknesses, and climbing frequency from climb logs
  4. useCoach and useCoachMessages hooks manage state and caching via TanStack Query
  5. Privacy safeguards anonymize data before AI processing with RLS policies for user isolation
**Plans**: 5 plans
**Status**: Complete — verified 2026-01-17

Plans:
- [x] 18-01-PLAN.md — Database schema and RLS for coach tables
- [x] 18-02-PLAN.md — patterns.ts service for data aggregation
- [x] 18-03-PLAN.md — coach.ts service with cost tracking and rate limiting
- [x] 18-04-PLAN.md — Privacy safeguards and data anonymization
- [x] 18-05-PLAN.md — TanStack Query hooks (useCoach, useCoachMessages)

#### Phase 19: Coach Page + Recommendations UI
**Goal**: Complete recommendations display with pattern analysis and mock data
**Depends on**: Phase 18
**Requirements**: REC-01, REC-02, REC-03, REC-05, CHAT-05
**Success Criteria** (what must be TRUE):
  1. User can view weekly focus statement and 3 personalized drills with clear descriptions
  2. Pattern analysis section displays failure patterns, style weaknesses, and climbing frequency
  3. Manual regenerate button refreshes recommendations with loading states
  4. Recommendations persist across sessions with generation date displayed
  5. UI works offline showing last cached recommendations
  6. Clear entry points exist to chat from recommendations page
**Plans**: 6 plans
**Status**: Complete — verified 2026-01-17

Plans:
- [x] 19-01-PLAN.md — usePatternAnalysis hook for loading pattern analysis data
- [x] 19-02-PLAN.md — CoachPage layout with Recommendations and Pattern Analysis tabs
- [x] 19-03-PLAN.md — RecommendationsDisplay component with weekly focus and drills
- [x] 19-04-PLAN.md — Loading states and error handling with fallback
- [x] 19-05-PLAN.md — Offline caching of last recommendations (verify TanStack Query config)
- [x] 19-06-PLAN.md — Entry points from recommendations to chat

#### Phase 20: LLM Integration
**Goal**: Real AI recommendations via Edge Function with OpenRouter API
**Depends on**: Phase 19
**Requirements**: CHAT-08
**Success Criteria** (what must be TRUE):
  1. openrouter-coach Edge Function generates personalized weekly focus and 3 drills
  2. Recommendations are climbing-specific with proper terminology and training principles
  3. API failures gracefully fallback to previous recommendations with clear error message
  4. LLM responses are validated against climbing best practices before display
  5. Output anonymization prevents sensitive user data in AI requests
**Plans**: 3 plans
**Status**: Complete — verified 2026-01-18

Plans:
- [x] 20-01-PLAN.md — Edge Function setup with JWT validation and OpenRouter SDK
- [x] 20-02-PLAN.md — JSON validation with retry logic and database storage
- [x] 20-03-PLAN.md — Error handling with fallback and client integration

#### Phase 21: Chat Interface
**Goal**: Free-form chat with streaming responses and climbing-specific context
**Depends on**: Phase 20
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-06, CHAT-07
**Success Criteria** (what must be TRUE):
  1. User can send messages via text input with mobile-optimized send button
  2. Message bubbles visually distinguish user (right) from assistant (left)
  3. Chat responses stream in real-time with typing indicator
  4. Last 10-20 messages retained for context in conversation
  5. Chat receives pre-processed patterns (failures, styles, frequency) as context
  6. Graceful error handling with helpful fallback messages
**Plans**: 5 plans
**Status**: Complete — verified 2026-01-19

Plans:
- [x] 21-01-PLAN.md — Edge Function for SSE streaming with JWT auth
- [x] 21-02-PLAN.md — Client-side SSE service with @microsoft/fetch-event-source
- [x] 21-03-PLAN.md — React chat interface with message bubbles and streaming
- [x] 21-04-PLAN.md — Route configuration for /coach/chat
- [x] 21-05-PLAN.md — Loading states, error handling, and visual polish

#### Phase 22: OpenRouter Model Configuration
**Goal**: Configure OpenRouter model selection via environment variables and use OpenRouter's cost data for tracking
**Depends on**: Phase 21
**Plans**: 1 plan
**Status**: Complete — verified 2026-01-19

Plans:
- [x] 22-01-PLAN.md — Configure OPENROUTER_MODEL env var and use OpenRouter's usage.cost

#### Phase 23: Refocus Coach on Technique
**Goal**: Review and modify coach to focus exclusively on technique and technique drills, not strength training
**Depends on**: Phase 21
**Plans**: 7 plans
**Status**: Complete — verified 2026-01-19

Plans:
- [x] 23-01-PLAN.md — Update AnonymizedClimb type with notes and date
- [x] 23-02-PLAN.md — Refocus system prompt on technique and add measurable_outcome
- [x] 23-03-PLAN.md — Add extractRecentClimbs function to patterns.ts
- [x] 23-04-PLAN.md — Update client service to include recent climbs in request
- [x] 23-05-PLAN.md — Update Edge Function to process and include recent climbs
- [x] 23-06-PLAN.md — Add measurable_outcome to client types and UI (gap closure)
- [x] 23-07-PLAN.md — Update example output to be technique-focused (gap closure)

#### Phase 24: Projecting Focus Recommendations
**Goal**: Add "Projecting focus" section to help users select boulders to project on each week
**Depends on**: Phase 23
**Success Criteria** (what must be TRUE):
  1. Edge Function generates 3-4 projecting focus areas based on style weaknesses
  2. Projecting focus includes qualitative grade guidance (not specific grade ranges)
  3. System prompt includes gym limitation awareness (common vs rare styles)
  4. TypeScript types updated for type safety
  5. UI displays projecting focus section below drills with proper styling
  6. Backward compatible with old cached recommendations (no projecting_focus field)
**Plans**: 3 plans

Plans:
- [ ] 24-01-PLAN.md — Extend Edge Function system prompt and validation for projecting_focus
- [ ] 24-02-PLAN.md — Update client types to include ProjectingFocus interface
- [ ] 24-03-PLAN.md — Add Projecting Focus section to coach-page UI

**Details**:
Projecting focus recommendations help users select boulders to project based on style weaknesses with qualitative grade guidance and gym awareness. Implementation extends existing Edge Function with new field, updates TypeScript types, and adds UI section using existing FormSection pattern.

## Progress

**Execution Order:**
Phases execute in numeric order: 18 → 19 → 20 → 21 → 23 → 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-01-15 |
| 2. Settings | v1.0 | 2/2 | Complete | 2026-01-15 |
| 3. Logger Integration | v1.0 | 1/1 | Complete | 2026-01-15 |
| 4. Display & Polish | v1.0 | 2/2 | Complete | 2026-01-15 |
| 5. Logger Form Reset | v1.1 | 1/1 | Complete | 2026-01-15 |
| 5.1 Logger Window Close Setting | v1.1 | 1/1 | Complete | 2026-01-15 |
| 6. Email Redirect Config | v1.1 | 1/1 | Complete | 2026-01-15 |
| 7. Failure Analytics | v1.1 | 1/1 | Complete | 2026-01-15 |
| 8. Style Analytics | v1.1 | 1/1 | Complete | 2026-01-15 |
| 9. Mark Failed as Succeeded | v1.1 | 1/1 | Complete | 2026-01-16 |
| 10. Completed Climbs Analytics | v1.1 | 1/1 | Complete | 2026-01-16 |
| 10.1 Fix Mark as Sent Button Styling | v1.1 | 1/1 | Complete | 2026-01-16 |
| 10.2 Fix Mark as Sent Button Text Color | v1.1 | 1/1 | Complete | 2026-01-16 |
| 11. Make a Nice README | v1.1 | 1/1 | Complete | 2026-01-15 |
| 12. Add Logo and Emojis to README | v1.1 | 1/1 | Complete | 2026-01-15 |
| 13. Revamp Analytics | v1.1 | 1/1 | Complete | 2026-01-16 |
| 14. Unify UI Styles | v1.1 | 1/1 | Complete | 2026-01-16 |
| 15. Fix Mark as Sent Button | v1.1 | 1/1 | Complete | 2026-01-16 |
| 16. Version Footer | v1.1 | 1/1 | Complete | 2026-01-16 |
| 17. Fix Toggle | v1.1 | 1/1 | Complete | 2026-01-16 |
| 15.1 Fix Ugly Mark as Sent Button | v1.1 | 1/1 | Complete | 2026-01-17 |
| 18. AI Coach Foundation | v2.0 | 5/5 | Complete | 2026-01-17 |
| 19. Coach Page + UI | v2.0 | 6/6 | Complete | 2026-01-17 |
| 20. LLM Integration | v2.0 | 3/3 | Complete | 2026-01-18 |
| 21. Chat Interface | v2.0 | 5/5 | Complete | 2026-01-19 |
| 22. OpenRouter Model Config | v2.0 | 1/1 | Complete | 2026-01-19 |
| 23. Refocus Coach on Technique | v2.0 | 7/7 | Complete | 2026-01-19 |
| 24. Projecting Focus Recommendations | v2.0 | 0/3 | Pending | |
