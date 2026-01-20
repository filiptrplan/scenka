# Scenka

## What This Is

A **personal, privacy-focused mobile PWA** for recreational boulderers who are serious about improving. Scenka helps climbers track their technique failures through an "exception logging" philosophy—only logging significant climbs (failed projects, awkward sends) rather than every session. v2.0 added AI-powered coaching with weekly recommendations and pattern analysis.

**Target User:** Recreational boulderers who want to get better, not just log sends.

**Current Status:** Personal tool for developer. May share with friends, but not building for public release.

## Core Value

**Quick, frictionless climb logging.**

Scenka prioritizes speed above all—climbers want to record failures and get back to climbing. Every feature must integrate seamlessly without adding friction.

**What makes Scenka different:**

1. **Exception logging philosophy** — Only log significant climbs, not every session
2. **Failure-focused tracking** — Emphasize what went wrong (technique failures) vs just tracking sends
3. **Privacy-first** — No social feeds, no public profiles, data stays yours
4. **Offline-first PWA** — Works in gyms with zero signal, no app store required

**Priority stack:** Speed > Deep insights > Beautiful/simple UX > Offline-first

## Current Milestone: v2.1 Simplified Logging + AI Auto-Tagging

**Goal:** Simplify climb logging to reduce friction while using AI to auto-extract tags from notes for analytics.

**Target features:**
- Simplified logger form: grade, outcome, terrain type (8 options), awkwardness (3 options: awkward/normal/smooth), notes
- AI-powered auto-tagging: analyze notes on save and extract relevant tags automatically
- Reduced friction: eliminate multi-select decisions from logging flow
- Notes as primary source: rich free-form text captures everything, AI categorizes for patterns

## Requirements

### Validated (Completed)

✓ **Climb logging** — Log climbs with grade, outcome, awkwardness, styles, failure reasons — v1.0 (simplified in v2.1)
✓ **Multiple grading scales** — Font, V-Scale, Color Circuit — v1.0
✓ **Style tags** — Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch — v1.0
✓ **Failure reasons** — Physical (Pumped, Finger Strength, Core, Power); Technical (Bad Feet, Body Position, Beta Error, Precision); Mental (Fear, Commitment, Focus) — v1.0
✓ **Offline-first PWA** — Service worker, offline queue, sync manager — v1.0
✓ **Authentication** — Supabase Auth — v1.0
✓ **Profile management** — User settings and preferences — v1.0
✓ **Basic analytics** — Climb history visualization and charts — v1.0
✓ **Hold color tracking** — Settings page, color picker in logger, color display in history — v1.0
✓ **Logger form auto-reset** — Form automatically clears after successful submission for rapid logging — v1.1
✓ **Logger window close preference** — User can choose if logger closes after adding climbs — v1.1
✓ **Training Priorities analytics** — Failure breakdown chart with percentages, positioned first for actionable insights — v1.1
✓ **Mark as Sent functionality** — Ability to mark failed climbs as succeeded, tracking redemption rate — v1.1
✓ **Redemption Rate analytics** — Chart showing redemption patterns by difficulty bucket — v1.1
✓ **Unified UI components** — SelectionButton, FormSection, FormLabel with cva pattern for consistency — v1.1
✓ **Version footer** — Footer displaying version number for reference — v1.1
✓ **README documentation** — Polished README with logo and emojis — v1.1
✓ **AI Coach with weekly recommendations** — User can view weekly focus statement and 3 personalized drills with name, description, sets/reps/rest — v2.0
✓ **Pattern analysis** — Failure patterns summary, style weaknesses analysis, climbing frequency tracking, and recent successes context — v2.0
✓ **Streaming chat interface** — Real-time chat with message bubbles, SSE streaming, typing indicators — v2.0
✓ **Climbing-specific knowledge** — Chat understands beta, grades, styles with domain expertise — v2.0
✓ **Projecting focus recommendations** — Help users select boulders to project on each week — v2.0
✓ **User climbing context** — Allow users to describe climbing style and goals — v2.0
✓ **Daily usage limits** — 2 recommendations/day, 10 chat messages/day for cost control — v2.0
✓ **Enhanced chat prompts** — Role-based coaching with recommendation context — v2.0
✓ **Markdown rendering** — Formatted responses with syntax highlighting for code blocks — v2.0

### Active

- [ ] Simplified logger form with reduced fields (terrain type, awkwardness, notes)
- [ ] AI-powered auto-tagging on climb save (analyze notes, extract tags)
- [ ] Remove manual failure reasons multi-select from logging flow
- [ ] Keep notes as primary data source for AI analysis
- [ ] Update analytics to display AI-extracted tags

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
*Last updated: $(date '+%Y-%m-%d') after v2.1 milestone initialized*
