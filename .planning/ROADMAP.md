# Roadmap: Scenka - Hold Color Feature

## Overview

Add a hold color selection feature to the climb logging flow. Users can configure their gym's hold colors in settings, select colors when logging climbs, and see colors displayed in their climb history. The feature integrates seamlessly into the existing offline-first PWA architecture.

## Domain Expertise

None

## Phases

- [x] **Phase 1: Database & Types** - Add hold color to schema and TypeScript types
- [x] **Phase 2: Settings Page** - Build color palette management UI
- [ ] **Phase 3: Logger Integration** - Add color picker to climb logging form
- [ ] **Phase 4: Display & Polish** - Show colors in history and verify offline sync

## Phase Details

### Phase 1: Database & Types
**Goal**: Store hold color data with each climb and track user's enabled colors
**Depends on**: Nothing (first phase)
**Research**: Unlikely (standard Supabase migration pattern)
**Plans**: 1 plan

Plans:
- [x] 01-01: Add hold_color column to climbs table, create user_colors table for preferences

### Phase 2: Settings Page
**Goal**: Users can enable/disable hold colors from a predefined palette
**Depends on**: Phase 1 (database schema ready)
**Research**: Likely (color picker UI component selection)
**Research topics**: shadcn/ui color picker options, multi-select patterns, mobile touch targets
**Plans**: 2 plans

Plans:
- [x] 02-01: Create color settings component with predefined palette (red, green, blue, yellow, black, white, orange, purple, pink)
- [x] 02-02: Integrate color settings into existing settings page with persistence

### Phase 3: Logger Integration
**Goal**: Add hold color picker field to climb logging form
**Depends on**: Phase 2 (user's enabled colors available)
**Research**: Unlikely (extends existing logger form patterns)
**Plans**: 1 plan

Plans:
- [x] 03-01: Add color picker field to logger using enabled colors, validate and store with climb

### Phase 4: Display & Polish
**Goal**: Show hold colors in climb history and verify full offline sync
**Depends on**: Phase 3 (climbs have color data)
**Research**: Unlikely (follows existing history view patterns)
**Plans**: 2 plans

Plans:
- [ ] 04-01: Display hold color indicator in climb list and detail views
- [ ] 04-02: Test offline sync, mobile responsiveness, and accessibility

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database & Types | 1/1 | Complete | 2026-01-15 |
| 2. Settings Page | 2/2 | Complete | 2026-01-15 |
| 3. Logger Integration | 1/1 | Complete | 2026-01-15 |
| 4. Display & Polish | 0/2 | Not started | - |
