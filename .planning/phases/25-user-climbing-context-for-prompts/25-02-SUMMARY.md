---
phase: 25
plan: 02
subsystem: settings-ui
tags: react, typescript, shadcn/ui, forms, textarea
completed: 2026-01-19
duration: 4s

requires:
  - Phase 25-01: Database migration and type definitions for climbing_context

provides:
  - Settings page UI for user climbing context entry
  - Real-time character count display
  - Form validation via profileSchema

affects:
  - src/components/features/settings-page.tsx
  - src/lib/validation.ts
  - src/types/index.ts

tech-stack:
  added: []
  patterns:
    - Textarea with character limit using maxLength attribute
    - Real-time character count via React Hook Form watch
    - Optional field validation with zod.string().max(2000).optional()

deviations:
  - Rule 3 - Blocking: Added climbing_context to profileSchema and Profile types before implementing UI (required for TypeScript compilation)
  - Files modified for blocking issue: src/lib/validation.ts, src/types/index.ts
  - Commit: 58d0d2e
---

# Phase 25 Plan 02: Climbing Context UI Summary

Settings page textarea for user climbing context with real-time character count and PII warning help text.

## What Was Built

Added a climbing context textarea to the settings page that allows users to describe themselves as climbers. This enhances AI coach personalization by providing user-specific context about their climbing style, goals, weaknesses, and training frequency.

## Technical Implementation

### Settings Page Changes (src/components/features/settings-page.tsx)

**Import:**
- Added `Textarea` from `@/components/ui/textarea`
- Reordered imports to satisfy ESLint rules

**Form State:**
- Added `climbingContext = watch('climbing_context')` for real-time character count updates
- Added `climbing_context: profile?.climbing_context ?? ''` to form defaultValues
- Added `climbing_context: profile.climbing_context ?? ''` to useEffect reset

**UI Section:**
- New FormSection added after "Close logger after adding climb" section
- FormLabel: "Describe Yourself as a Climber"
- Textarea with:
  - `{...register('climbing_context')}` bound to form
  - Placeholder: "e.g., Intermediate boulderer working V5-V6 projects. Weak on crimps and overhangs. Train 3x/week. Goal: send my first V7 this year."
  - Classes: `min-h-[120px] bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 hover:border-white/30 focus:border-white/50 transition-colors resize-none`
  - `maxLength={2000}` attribute for browser-enforced limit
- Help text: "Help the coach understand your goals, weaknesses, and climbing style. Avoid personal information."
- Character count: `{(climbingContext?.length ?? 0)} / 2000`

### Validation Changes (src/lib/validation.ts)

- Added `climbing_context: z.string().max(2000).optional()` to profileSchema
- Validated via zodResolver in settings form
- Optional field allows existing users to skip providing context

### Type Changes (src/types/index.ts)

- Added `climbing_context: string | null` to Profile interface
- Updated Database profiles Row/Insert/Update types to include climbing_context

## Decisions Made

1. **Optional field:** Made climbing_context optional in schema to avoid requiring existing users to fill it in immediately
2. **2000 character limit:** Followed ChatGPT's 1500-char precedent with 2000 chars for more flexibility
3. **Explicit PII warning:** Help text explicitly says "Avoid personal information" to prevent PII leakage to OpenRouter API
4. **Real-time character count:** Uses React Hook Form's watch() for live updates, not on-change events (simpler, more reactive)
5. **Nullish coalescing operator:** Used `(climbingContext?.length ?? 0)` instead of `|| 0` to satisfy ESLint @typescript-eslint/prefer-nullish-coalescing

## Testing

**Type Checking:**
- `npm run typecheck` - No errors

**Linting:**
- No new lint errors in settings-page.tsx after import order fix
- Used `??` instead of `||` for nullish coalescing
- Existing lint warnings in other files are unrelated to this change

**Manual Verification Checklist:**
- User can see climbing context textarea on settings page
- Character count shows current length / 2000
- Help text explains what context to provide and includes PII warning
- Form validation accepts up to 2000 characters
- Settings save correctly including climbing_context field

## Next Phase Readiness

**Blockers:** None

**Considerations:**
1. The climbing_context field is now available in the database and form, but has not yet been integrated into AI coach system prompts (Phase 25-04)
2. Settings page is fully functional and ready for user entry
3. Form validation ensures data integrity (max 2000 chars, optional)
4. No edge cases identified - null values handled gracefully with `?? ''` and `?? 0`

**Ready for Phase 25-03:** The service layer is ready to fetch and update climbing_context with existing useProfile hook (no changes needed).
