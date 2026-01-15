# Scenka - Hold Color Feature

## What This Is

A mobile-first PWA for rock climbers to track technique failures. Users log climbs with grade, outcome, awkwardness, style tags, and failure reasons. The app supports multiple grading scales (Font, V-Scale, Color Circuit) and works offline with automatic sync.

This project adds a **hold color selection feature** to help users identify which specific climb they failed on by selecting the color of the climbing holds.

## Core Value

**Quick, frictionless climb logging.**

The hold color feature must integrate seamlessly into the existing logging flow without adding friction. Color selection should be fast and intuitive.

## Requirements

### Validated

✓ **Climb logging** — existing (grade, outcome, awkwardness, styles, failure reasons)
✓ **Multiple grading scales** — existing (Font, V-Scale, Color Circuit)
✓ **Style tags** — existing (Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch)
✓ **Failure reasons** — existing (Physical: Pumped, Finger Strength, Core, Power; Technical: Bad Feet, Body Position, Beta Error, Precision; Mental: Fear, Commitment, Focus)
✓ **Offline-first PWA** — existing (service worker, offline queue, sync manager)
✓ **Authentication** — existing (Supabase Auth)
✓ **Profile management** — existing
✓ **Charts and analytics** — existing (climb history visualization)

### Active

- [ ] **Hold color settings page** — User can enable/disable colors from a wide variety of options
- [ ] **Hold color selection in logger** — Color picker field in climb logging form (from enabled colors only)
- [ ] **Color persistence** — Store selected color with climb data in Supabase
- [ ] **Color display in history** — Show hold color on logged climbs in climb list/detail views
- [ ] **Default color set** — Pre-populate settings with common climbing gym hold colors (red, green, blue, yellow, black, white, orange, purple, pink)

### Out of Scope

- **Color filtering** — Not in v1 (users cannot filter climb history by hold color)
- **Color statistics** — Not in v1 (no charts showing which colors are climbed most)
- **Color photos** — Not in v1 (no photo attachment or color detection from images)
- **Color search** — Not in v1 (no search functionality by color)

## Context

**Existing Architecture:**
- React 18 + TypeScript 5.6 + Vite 6
- Supabase for PostgreSQL database and authentication
- TanStack Query for server state management
- shadcn/ui for UI components
- Offline-first PWA with service worker and sync manager
- Zod validation for forms
- react-hook-form for form state

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

**None specified** — Build the feature using existing patterns and components where practical.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Color categories approach | User wants specific climbing hold colors, not arbitrary color picker | — Pending |
| Customizable palette | User wants to enable/disable colors in settings, not fixed list | — Pending |
| Quick logging priority | User emphasized fast logging over advanced features | — Pending |
| No filtering/stats/photos in v1 | Explicitly excluded to keep scope focused | — Pending |

---
*Last updated: 2026-01-14 after initialization*
