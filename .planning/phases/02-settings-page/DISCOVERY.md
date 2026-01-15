# Phase 2 Discovery: Color Settings UI

**Date:** 2026-01-15
**Phase:** 02-settings-page
**Discovery Level:** Level 2 (Standard Research)

## Research Question

What's the best approach for implementing a multi-select color palette UI component in a shadcn/ui + React Hook Form context for mobile-first PWA?

## Context

We need to add a hold color settings section to the existing settings page where users can:
1. See all 9 available hold colors (red, green, blue, yellow, black, white, orange, purple, pink)
2. Enable/disable individual colors (toggle state)
3. Store their enabled colors preference in the profile
4. Have this section fit seamlessly into the existing settings page design

**Existing Patterns:**
- Settings page uses react-hook-form with Zod validation
- Profile stored in Supabase with `preferred_grade_scale`, `preferred_discipline`, `home_gym`
- Form uses shadcn/ui components (Input, Select, Button)
- Mobile-first design with Tailwind utility classes
- Dark theme (#09090b background)

## Options Evaluated

### Option A: Custom Grid of Color Chips (RECOMMENDED)

**Approach:** Build a custom component using CSS Grid with clickable color chips and checkmark indicators for enabled state.

**Pros:**
- Full control over visual design and touch targets (44px+ for mobile)
- Can match existing settings page aesthetic perfectly
- No additional dependencies
- Lightweight implementation
- Easy to add checkmark/badge indicators for enabled state
- Follows existing codebase patterns (custom UI components)

**Cons:**
- Requires custom component implementation
- Need to handle keyboard navigation manually

**Implementation:**
```tsx
// Color grid component
<div className="grid grid-cols-3 gap-3">
  {ALL_COLORS.map((color) => (
    <button
      type="button"
      key={color}
      onClick={() => toggleColor(color)}
      className={`
        relative h-14 rounded-lg border-2 transition-all
        ${enabledColors.includes(color)
          ? 'border-white bg-' + color
          : 'border-white/10 bg-' + color + '/30'
        }
      `}
      aria-pressed={enabledColors.includes(color)}
    >
      {enabledColors.includes(color) && (
        <Check className="absolute inset-0 m-auto h-6 w-6" />
      )}
    </button>
  ))}
</div>
```

**Color Display:**
- Map color names to Tailwind classes: `bg-red-500`, `bg-green-500`, etc.
- Or use inline styles with specific hex values for accuracy

### Option B: shadcn/ui Checkbox Group

**Approach:** Use shadcn/ui Checkbox component with custom colored labels.

**Pros:**
- Uses existing shadcn/ui component
- Built-in accessibility
- Form integration with react-hook-form

**Cons:**
- Checkbox component is monochrome (would need custom styling for color chips)
- Layout would be list-based, not grid-based
- Less visual appeal than dedicated color chips
- More CSS customization needed

### Option C: Multi-Select Dropdown

**Approach:** Use shadcn/ui Select or similar dropdown with multi-select capability.

**Pros:**
- Compact UI
- Uses familiar Select pattern from existing settings

**Cons:**
- Poor UX for color selection (can't see colors at a glance)
- Requires custom multi-select implementation (shadcn/ui Select is single-select)
- Doesn't show visual color representation well
- Not mobile-friendly for 9 items

## Recommendation

**Go with Option A: Custom Grid of Color Chips**

**Rationale:**
1. **Visual clarity:** Users can see all colors at once in a grid layout
2. **Mobile-friendly:** Large touch targets (h-14 = 56px > 44px requirement)
3. **Seamless integration:** Can match existing settings page design patterns
4. **No new dependencies:** Uses existing Tailwind + Lucide icons
5. **Better UX:** Color chips with checkmarks are intuitive and fast to use

## Implementation Considerations

### 1. Color Mapping

**Option 1: Tailwind Color Classes**
```tsx
const colorMap: Record<HoldColor, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  black: 'bg-black',
  white: 'bg-white',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}
```

**Option 2: Inline Styles with Hex Values** (RECOMMENDED for accuracy)
```tsx
const colorMap: Record<HoldColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  black: '#000000',
  white: '#ffffff',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
}
```

### 2. Form State Management

**Using react-hook-form:**
```tsx
// In settings-page.tsx
const { register, setValue, watch } = useForm<UpdateProfileInput>()

// Watch enabled colors
const enabledColors = watch('enabled_hold_colors', DEFAULT_COLORS)

// Toggle handler
const toggleColor = (color: HoldColor) => {
  const current = enabledColors || []
  const updated = current.includes(color)
    ? current.filter(c => c !== color)
    : [...current, color]
  setValue('enabled_hold_colors', updated)
}
```

### 3. Validation Schema

```typescript
// In validation.ts
export const profileSchema = z.object({
  // ... existing fields
  enabled_hold_colors: z.array(z.enum(['red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink'])).default(DEFAULT_COLORS),
})
```

### 4. Database Migration

Need to add `enabled_hold_colors` column to profiles table:

```sql
ALTER TABLE profiles
ADD COLUMN enabled_hold_colors TEXT[] DEFAULT ARRAY['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink']::TEXT[];
```

**Default colors:** All colors except black and white (most common gym holds)

### 5. Accessibility

- Use `button` elements for interactive color chips (not divs)
- Add `aria-pressed` for toggle state
- Add `aria-label` for screen readers: "Enable red color"
- Keyboard navigation: Tab through grid, Enter/Space to toggle
- Focus visible indicator: `ring-2 ring-white ring-offset-2`

### 6. Mobile Responsiveness

- Grid: `grid-cols-3` on mobile, `grid-cols-5` on larger screens
- Touch targets: `h-14` (56px) exceeds 44px minimum
- Spacing: `gap-3` (12px) between chips

## Component Structure

```
src/components/features/
├── settings-page.tsx (existing - modify)
└── color-settings.tsx (NEW - extract color grid)
```

**Extract to separate component?** Yes, for better testability and reusability.

## Database Changes Required

1. **Migration:** Add `enabled_hold_colors` TEXT[] column to profiles table
2. **TypeScript types:** Update Profile interface to include `enabled_hold_colors?: HoldColor[]`
3. **Validation:** Update profileSchema with array validation

## Tasks Identified

1. Create database migration for `enabled_hold_colors` column
2. Update TypeScript types for Profile interface
3. Update Zod validation schema
4. Create ColorSettings component with color grid
5. Integrate ColorSettings into settings-page.tsx
6. Test form persistence and loading
7. Verify mobile responsiveness and accessibility

## No Discovery Needed For

- react-hook-form patterns (well-established in codebase)
- Supabase profile updates (existing patterns in profiles.ts)
- Zod validation (existing patterns)
- shadcn/ui styling (existing patterns)

## Next Steps

Create 2 plans:
1. **02-01:** Database and types (migration, TypeScript types, Zod schema)
2. **02-02:** UI implementation (ColorSettings component, integration, testing)

---

**Discovery complete. Ready to proceed with planning.**
