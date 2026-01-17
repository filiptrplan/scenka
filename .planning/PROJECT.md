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

### Active

## Current Milestone: v2.0 AI Coach

**Goal:** Build AI-powered climbing coach that analyzes logged data and provides actionable training guidance through weekly dashboard recommendations and free-form chat.

**Target features:**
- Separate Coach page with weekly focus + 3 drills, regenerated manually
- Free-form classic chat interface with limited message history
- Pre-processed climbing patterns: Failure Patterns, Style Weaknesses, Climbing Frequency (structured sections)
- Comprehensive summary includes recent successes for context
- OpenRouter API (openai/gpt-5.1 model) with LLM general climbing knowledge
- Persistent recommendations saved to database table with created_at
- Suggestions evolve over time based on data improvements + user feedback (combined approach)
- User can ask: practice details, drill explanations, alternatives, projecting tactics
- Suggestions are actionable: for warmup or as focus areas during sessions

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

---
*Last updated: 2026-01-17 after v2.0 milestone planning started*
