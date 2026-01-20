# Project Milestones: Scenka

## v2.0 AI Coach (Shipped: 2026-01-20)

**Delivered:** AI-powered climbing coach with weekly recommendations, pattern analysis, streaming chat, and daily usage limits.

**Phases completed:** 18-29 (12 phases, 47 plans total)

**Key accomplishments:**

- Complete AI Coach foundation: database tables, Edge Functions, OpenRouter integration with cost tracking
- Streaming chat interface with SSE, climbing-specific system prompts, and markdown rendering
- Weekly recommendations with pattern analysis (failure patterns, style weaknesses, climbing frequency)
- Projecting focus recommendations to help select boulders each week
- User climbing context for personalized AI responses (climbing style, goals, preferences)
- Privacy safeguards: data anonymization before LLM processing, RLS policies
- Daily usage limits: 2 recommendations/day, 10 chat messages/day to control costs
- Enhanced chat system prompt with role-based coaching and recommendation context
- Full markdown rendering with syntax highlighting for formatted AI responses

**Stats:**

- ~50+ files created/modified
- 7,160 lines of TypeScript
- 12 phases, 47 plans
- 3 days from start to ship (2026-01-17 → 2026-01-20)

**Git range:** `feat(18)` → `feat(29-03)`

**What's next:** Planning next milestone

---

## v1.1 UX & Analytics (Shipped: 2026-01-17)

**Delivered:** Improved user experience with form auto-reset, redemption tracking, and unified design system.

**Phases completed:** 5-17, plus decimal phases 5.1, 10.1, 10.2, 15.1 (17 phases, 23 plans total)

**Key accomplishments:**

- Logger form auto-resets after submission with user preference for close behavior
- Training Priorities chart positioned first for actionable training insights
- "Mark as Sent" functionality tracks redemption rate with redemption_at timestamp
- Redemption Rate chart shows redemption patterns by difficulty bucket
- Unified UI system: SelectionButton, FormSection, FormLabel components with cva pattern
- Footer with version number display and minimal Toggle component
- README polished with logo, casual tone, and strategic emojis

**Stats:**

- 61 files created/modified
- 4,777 lines of TypeScript
- 17 phases, 23 plans
- 2 days from start to ship (2026-01-15 → 2026-01-17)

**Git range:** `feat(05-logger-form-reset)` → `feat(15.1-01)`

**What's next:** AI Coach milestone

---

## v1.0 Hold Color Feature (Shipped: 2026-01-15)

**Delivered:** Complete hold color tracking system allowing climbers to identify routes by color when logging and reviewing climbs.

**Phases completed:** 1-4 (6 plans total)

**Key accomplishments:**

- Database foundation with hold_color column for climbs and enabled_hold_colors for user preferences
- Mobile-friendly 9-color toggle grid in settings with form state management
- Color picker integrated into climb logger that respects user's enabled colors
- Color badges displayed in climb list views for visual identification
- Full offline-first functionality verified across all features
- Production-ready with mobile responsiveness and accessibility confirmed

**Stats:**

- 44 TypeScript files created/modified
- 4,302 lines of TypeScript
- 4 phases, 6 plans
- 10 days from start to ship (2026-01-05 → 2026-01-15)

**Git range:** `feat(validation)` → `docs(04-02)`

**What's next:** Additional features and bugfixes for next milestone

---
