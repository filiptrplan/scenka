# Scenka

## What This Is

A **personal, privacy-focused mobile PWA** for recreational boulderers who are serious about improving. Scenka helps climbers track their technique failures through an "exception logging" philosophy—only logging significant climbs (failed projects, awkward sends) rather than every session.

**Target User:** Recreational boulderers who want to get better, not just log sends.

**Current Status:** Personal tool for the developer. May share with friends, but not building for public release.

## Core Value

**Quick, frictionless climb logging.**

Scenka prioritizes speed above all—climbers want to record failures and get back to climbing. Every feature must integrate seamlessly without adding friction.

**What makes Scenka different:**

1. **Exception logging philosophy** — Only log significant climbs, not every session
2. **Failure-focused tracking** — Emphasize what went wrong (technique failures) vs just tracking sends
3. **Privacy-first** — No social feeds, no public profiles, data stays yours
4. **Offline-first PWA** — Works in gyms with zero signal, no app store required

**Priority stack:** Speed > Deep insights > Beautiful/simple UX > Offline-first

## Requirements

### Validated (Completed)

✓ **Climb logging** — Log climbs with grade, outcome, awkwardness, styles, failure reasons
✓ **Multiple grading scales** — Font, V-Scale, Color Circuit
✓ **Style tags** — Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch
✓ **Failure reasons** — Physical (Pumped, Finger Strength, Core, Power); Technical (Bad Feet, Body Position, Beta Error, Precision); Mental (Fear, Commitment, Focus)
✓ **Offline-first PWA** — Service worker, offline queue, sync manager
✓ **Authentication** — Supabase Auth
✓ **Profile management** — User settings and preferences
✓ **Basic analytics** — Climb history visualization and charts
✓ **Hold color settings page** — User can enable/disable colors from a wide variety of options — v1.0
✓ **Hold color selection in logger** — Color picker field in climb logging form (from enabled colors only) — v1.0
✓ **Color persistence** — Store selected color with climb data in Supabase — v1.0
✓ **Color display in history** — Show hold color on logged climbs in climb list/detail views — v1.0
✓ **Default color set** — Pre-populate settings with common climbing gym hold colors (red, green, blue, yellow, black, white, orange, purple, pink) — v1.0
✓ **Logger form auto-reset** — Form automatically clears after successful submission for rapid logging — v1.1
✓ **Logger window close preference** — User can choose if logger closes after adding climbs — v1.1
✓ **Training Priorities analytics** — Failure breakdown chart with percentages, positioned first for actionable insights — v1.1
✓ **Mark as Sent functionality** — Ability to mark failed climbs as succeeded, tracking redemption rate — v1.1
✓ **Redemption Rate analytics** — Chart showing redemption patterns by difficulty bucket — v1.1
✓ **Unified UI components** — SelectionButton, FormSection, FormLabel with cva pattern for consistency — v1.1
✓ **Version footer** — Footer displaying version number for reference — v1.1
✓ **README documentation** — Polished README with logo and emojis — v1.1
✓ **Weekly recommendations** — User can view weekly focus statement and 3 personalized drills with name, description, sets/reps/rest — v2.0
✓ **Manual regeneration** — User can manually regenerate recommendations via button — v2.0
✓ **Recommendations persistence** — Weekly recommendations persist across sessions with generation date displayed — v2.0
✓ **Recommendations loading states** — Loading states show during AI generation — v2.0
✓ **Recommendations error handling** — Error handling with fallback to previous recommendations on API failure — v2.0
✓ **Recommendations offline support** — Recommendations work offline (last cached recommendations accessible without internet) — v2.0
✓ **Pattern analysis** — User can view failure patterns summary, style weaknesses analysis, climbing frequency tracking, and recent successes context — v2.0
✓ **Streaming chat interface** — User can send messages through text input with send button, view message bubbles with visual distinction between user and assistant, chat responses stream in real-time using Server-Sent Events — v2.0
✓ **Chat context** — Chat retains limited message history (last 10-20 messages) for context and includes pre-processed patterns (failure, styles, frequency) — v2.0
✓ **Chat entry points** — Clear entry points to chat from recommendations page — v2.0
✓ **Chat error handling** — Graceful error handling with helpful fallback messages — v2.0
✓ **Climbing-specific knowledge** — Chat provides climbing-specific domain knowledge (understands beta, grades, styles) — v2.0
✓ **Projecting focus recommendations** — Add projecting focus section to help users select boulders to project on each week — v2.0
✓ **User climbing context** — Allow users to add their own context to system prompts like what kind of climber they are — v2.0
✓ **Daily usage limits** — Impose daily limit of 2 recommendation generations and 10 chat messages per user — v2.0
✓ **Enhanced chat prompts** — Rework chat system prompt and include latest recommendations in chatbot context — v2.0
✓ **Markdown rendering** — Render markdown content in chat assistant responses for better formatting including headers, lists, code blocks, and links — v2.0
✓ **Pattern analysis based on exception logging** — Pattern analysis based on exception-logging (only significant climbs, no noise) — v2.0
✓ **Recommendations link to redemption tracking** — Recommendations link to user's redemption tracking (drills reference actual climbs) — v2.0

### Active

### Considered for Future

- **Gym map integration** — Mark climb locations on a visual map of your gym

### Permanently Out of Scope

❌ **Social features** — No feeds, sharing, following, public profiles, or community features
❌ **Monetization** — Free forever, no premium tiers, subscriptions, or ads
❌ **Route/gym databases** — No user-generated databases of routes or gyms

## Context

**Tech Stack:**
- React 18 + TypeScript 5.6 + Vite 6
- Supabase for PostgreSQL database and authentication
- TanStack Query for server state management
- shadcn/ui for UI components
- Offline-first PWA with service worker and sync manager
- Zod validation for forms
- react-hook-form for form state
- Cloudflare Pages for frontend hosting

**Current Logger Flow:**
The climb logger (`src/components/features/logger.tsx`) is a 413-line component that handles form input with react-hook-form and Zod validation. It collects:
- Grade scale and grade value
- Outcome (Sent/Fail)
- Awkwardness (1-5 scale)
- Multiple style tags (multi-select)
- Multiple failure reasons (multi-select)

**Database Schema:**
Climbs are stored in Supabase with columns inferred from types:
- Basic info: grade_scale, grade_value, outcome, awkwardness
- Arrays: styles, failure_reasons
- Metadata: created_at, user_id

**Settings Page:**
Settings page exists at `src/components/features/settings-page.tsx` for user preferences.

## Constraints

- **Solo development only** — No collaborators, no hiring
- **No backend servers** — Only Supabase (backend-as-a-service) + Cloudflare Pages (hosting)
- **No paid hosting** — Must stay within free tiers of Supabase and Cloudflare
- **Mobile-first** — All features designed for phone usage in a gym setting

## Success Criteria

**Personal improvement** — Scenka is successful if it helps you climb better and stay consistent with tracking. This is a tool for your own growth as both a climber and a developer.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Exception logging | Only log significant climbs, not every session | ✓ Reduces friction, focuses on what matters |
| Failure-focused | Emphasize what went wrong, not just sends | ✓ Supports learning and technique improvement |
| Privacy-first | No social features or public data | ✓ Reduces pressure, keeps data personal |
| Hold colors feature | Help identify specific climbs in gym | ✓ Fully implemented with offline sync, mobile-responsive |
| Nullable hold_color column | Allow existing climbs without color data | ✓ Backward compatible, no breaking changes |
| Default colors exclude black/white | Less common as primary hold colors | ✓ 7-color default works well in practice |
| Form state with watch() | Cleaner than separate component state | ✓ Pattern established for future form development |
| useImperativeHandle pattern | Expose imperative methods from child to parent via ref | ✓ React-idiomatic for form reset operations (v1.1) |
| Logger window close default: true | Matches one-time entry pattern, user can opt-in to rapid entry | ✓ Balances friction reduction with user preference (v1.1) |
| Training Priorities chart positioning | First position, prescriptive over descriptive analytics | ✓ Actionable insights > data dumps (v1.1) |
| Unified UI components (SelectionButton, FormSection, FormLabel) | Centralize styling patterns using cva, reduce duplication | ✓ Reduced className duplication by >200 occurrences (v1.1) |
| Ghost variant in Button component | Extend existing component vs create separate GhostButton | ✓ Single source of truth for Button styling (v1.1) |
| Minimal Toggle component size (h-4 w-7) | Smaller than standard Switch, less jarring UI | ✓ Better visual hierarchy, unobtrusive (v1.1) |
| Edge Functions for LLM calls | Server-side API calls with JWT auth, no client secrets | ✓ OpenRouter integration with secure auth (v2.0) |
| SSE streaming for chat | Server-Sent Events for real-time responses | ✓ Simpler than WebSockets, HTTP-based (v2.0) |
| Daily usage limits via RPC functions | Atomic counters with UTC midnight reset | ✓ Cost control, thread-safe reset (v2.0) |
| Technique-first coaching | Strength failures = technique gaps to reframe | ✓ Focuses on movement, not just power (v2.0) |
| Markdown rendering for chat | react-markdown + remark-gfm + rehype-highlight | ✓ Formatted responses, code blocks (v2.0) |

---
*Last updated: 2026-01-20 after v2.0 milestone completed*
