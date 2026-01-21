---
phase: 30-simplified-logger-foundation
plan: 01
subsystem: validation
tags: [zod, typescript, validation-schema, constants]

requires: []
provides: [simplifiedClimbSchema, SimplifiedClimbInput, TERRAIN_OPTIONS, AWKWARDNESS_OPTIONS]
affects: [30-02]

tech-stack:
  added: []
  patterns: []

decisions: []

file-changes:
  created: []
  modified:
    - src/lib/validation.ts
    - src/lib/constants.ts

metrics:
  duration: 1m
  completed: 2026-01-21

---

# Phase 30 Plan 01: Simplified Validation Schema Summary

**Established type-safe validation schema and constants for the simplified logger form, removing multi-select complexity while preserving core data capture.**

## What Was Built

Created the foundation for simplified climb logging by defining:

1. **TERRAIN_OPTIONS constant** (`src/lib/constants.ts`) - 8 terrain types (Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch) as a required field
2. **AWKWARDNESS_OPTIONS constant** (`src/lib/constants.ts`) - 3 simplified options (smooth, normal, awkward) replacing the 5-point scale
3. **simplifiedClimbSchema** (`src/lib/validation.ts`) - Zod validation schema with terrain_type and awkwardness as required enums
4. **SimplifiedClimbInput type** (`src/lib/validation.ts`) - Type-safe TypeScript interface inferred from schema

## Key Changes

### Constants Added (`src/lib/constants.ts`)

```typescript
export const TERRAIN_OPTIONS = ['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch'] as const
export const AWKWARDNESS_OPTIONS = ['smooth', 'normal', 'awkward'] as const
```

### Validation Schema (`src/lib/validation.ts`)

The simplifiedClimbSchema removes complexity from the original climbSchema:

**Removed fields:**
- `style` array field (multi-select tags) - SIMP-06
- `failure_reasons` array field (multi-select tags) - SIMP-07
- `redemption_at` field (not used in simplified flow)

**Modified fields:**
- `terrain_type` - New required enum field (8 options) - SIMP-03
- `awkwardness` - Changed from number (1-5) to enum (smooth/normal/awkward) - SIMP-04

**Preserved fields:**
- `location` (required)
- `climb_type` (boulder/sport)
- `grade_scale` (font/v_scale/color_circuit)
- `grade_value` (string with validation)
- `hold_color` (optional)
- `outcome` (Sent/Fail)
- `notes` (optional) - SIMP-05

## Technical Decisions

1. **Exported constants as `as const`**: Enables type-safe usage with readonly inference for enum validation

2. **Zod `.pipe()` pattern for grade_value**: Preserves existing validation pattern from climbSchema for consistency

3. **No breaking changes to existing schemas**: Created new simplifiedClimbSchema alongside existing climbSchema, allowing gradual migration

4. **Optional hold_color**: Preserved for color circuit routes where hold color is a key identifier

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All success criteria met:
- simplifiedClimbSchema validates terrain_type as required field (z.enum(TERRAIN_OPTIONS))
- simplifiedClimbSchema validates awkwardness as 3-option enum (smooth/normal/awkward)
- simplifiedClimbSchema does NOT include style or failure_reasons fields
- TERRAIN_OPTIONS constant has 8 terrain types
- AWKWARDNESS_OPTIONS constant has 3 awkwardness options

TypeScript compilation verified with `npm run typecheck` - no errors.

## Next Phase Readiness

**Completed:**
- Validation schema and type definitions for simplified logger

**Ready for:**
- Phase 30-02: Can build simplified logger UI component using SimplifiedClimbInput type
- Phase 30-02: Can use TERRAIN_OPTIONS and AWKWARDNESS_OPTIONS for form selections
- Phase 31: AI tag extraction will work with notes field captured by simplifiedClimbSchema

**No blockers identified.**
