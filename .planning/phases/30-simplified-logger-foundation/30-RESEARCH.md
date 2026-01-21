# Phase 30: Simplified Logger Foundation - Research

**Researched:** 2026-01-21
**Domain:** React form simplification with React Hook Form + Zod validation + Radix UI
**Confidence:** HIGH

## Summary

This phase requires creating a simplified climb logging form that reduces friction by eliminating manual tag selectors while preserving core logging functionality. The simplified form focuses on essential fields (grade, outcome, terrain type, awkwardness, notes) with AI-powered auto-tagging replacing manual tag selection.

The existing logger component (`src/components/features/logger.tsx`) provides a robust foundation with React Hook Form, Zod validation, and Radix UI components. The simplification removes style tag and failure reason selectors, converts awkwardness from 5-point slider to 3-option selection, and introduces terrain type as a required field replacing style selection.

**Primary recommendation:** Modify the existing logger component to create a simplified version, preserving the form reset and validation patterns while removing multi-select complexity.

## Standard Stack

The existing stack is already installed and well-suited for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.70.0 | Form state management and validation | Performant, minimal re-renders, built-in TypeScript support |
| zod | ^4.3.5 | Schema validation and type inference | Type-safe validation, integrates seamlessly with RHF |
| @hookform/resolvers | ^5.2.2 | Zod resolver for react-hook-form | Official integration, handles validation errors |
| @radix-ui/react-select | ^2.2.6 | Dropdown/select component | Accessible, controlled, mobile-friendly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-sheet | ^1.1.15 | Slide-over panel for logger form | Mobile-optimized, existing pattern |
| @tanstack/react-query | ^5.90.16 | Mutation management (useCreateClimb) | Offline queue integration, cache invalidation |
| lucide-react | ^0.562.0 | Icons (TrendingUp, TrendingDown) | Consistent icon system |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix UI Select | Native HTML select | Less accessible, no keyboard navigation, inconsistent styling |
| React Hook Form | Formik / Redux Form | RHF is more performant, better TypeScript support, lighter bundle |
| Zod | Yup / Joi | Zod has better TypeScript inference, more active development |

**Installation:**
```bash
# All dependencies already installed
# No additional packages required
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── features/
│   │   └── logger.tsx              # Simplified logger (modify existing)
│   └── ui/
│       ├── select.tsx              # Radix UI Select wrapper
│       ├── selection-button.tsx    # Button-based selection (existing)
│       ├── form-label.tsx          # Persistent labels (existing)
│       └── form-section.tsx        # Form section grouping (existing)
├── lib/
│   ├── validation.ts               # Zod schemas (add simplifiedClimbSchema)
│   └── constants.ts               # TERRAIN_OPTIONS (add), awkwardness labels
├── hooks/
│   └── useClimbs.ts                # useCreateClimb (existing)
└── services/
    └── climbs.ts                   # createClimb (existing)
```

### Pattern 1: React Hook Form with Controlled Select Components
**What:** Use controlled Radix UI Select components with value/onValueChange pattern
**When to use:** Dropdown selections that need form integration and validation
**Example:**
```typescript
// Source: Existing logger.tsx pattern + Radix UI docs
const [gradeScale, setGradeScale] = useState<GradeScale>('color_circuit')

<Select
  value={gradeScale}
  onValueChange={(value: GradeScale) => {
    setGradeScale(value)
    setValue('grade_scale', value, { shouldValidate: true })
    setValue('grade_value', '', { shouldValidate: true })
  }}
>
  <SelectTrigger className="border-white/10 bg-white/[0.02] text-white">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="color_circuit">Color</SelectItem>
    <SelectItem value="font">Font Scale</SelectItem>
    <SelectItem value="v_scale">V-Scale</SelectItem>
  </SelectContent>
</Select>
```

### Pattern 2: SelectionButton for 3-Option Fields
**What:** Use existing SelectionButton component for mutually exclusive options (outcome, awkwardness)
**When to use:** Small number of options (2-4) that benefit from visual prominence
**Example:**
```typescript
// Source: Existing logger.tsx pattern
<div className="flex gap-2">
  <button
    type="button"
    onClick={() => {
      setAwkwardness('smooth')
      setValue('awkwardness', 'smooth', { shouldValidate: true })
    }}
    className={cn(
      'flex-1 px-4 py-3 border-2 transition-all',
      awkwardness === 'smooth'
        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
        : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
    )}
  >
    <span className="text-xs font-black uppercase tracking-wider">Smooth</span>
  </button>
  {/* Repeat for Normal, Awkward */}
</div>
```

### Pattern 3: Form Reset After Submission
**What:** Reset form to defaultValues after successful submission
**When to use:** After mutation success, preserving v1.1 auto-reset behavior
**Example:**
```typescript
// Source: React Hook Form reset() docs
const { reset } = useForm<SimplifiedClimbInput>({
  defaultValues: {
    grade_scale: 'color_circuit',
    outcome: 'Fail',
    awkwardness: 'normal',
    terrain_type: 'Vert',
    notes: '',
  },
})

// In mutation onSuccess
onSuccess: () => {
  reset() // Resets to defaultValues
  onOpenChange?.(false) // Close the sheet
  queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
}
```

### Pattern 4: Zod Schema for Simplified Form
**What:** Create new schema with required fields and optional notes
**When to use:** Define validation rules, type inference
**Example:**
```typescript
// Source: Zod validation pattern
export const simplifiedClimbSchema = z.object({
  climb_type: z.enum(['boulder', 'sport']),
  grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  grade_value: z.string().min(1, 'You must select a grade'),
  outcome: z.enum(['Sent', 'Fail']),
  terrain_type: z.enum(['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch']),
  awkwardness: z.enum(['smooth', 'normal', 'awkward']),
  notes: z.string().optional(),
})

export type SimplifiedClimbInput = z.infer<typeof simplifiedClimbSchema>
```

### Anti-Patterns to Avoid
- **Controlled state duplication:** Don't duplicate form state in useState - watch() from form instead
- **Manual reset logic:** Don't manually reset each field - use reset() to restore defaultValues
- **Validation on every keystroke:** Don't validate on input change - validate on blur or submit for mobile UX
- **Placeholder-as-label:** Never use placeholders as labels - use persistent FormLabel above inputs (mobile best practice)
- **Removing auto-reset behavior:** Don't change the form reset pattern - v1.1 behavior must be preserved

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod + zodResolver | Type-safe, composable, handles edge cases, integrates with RHF |
| Form reset logic | Manual field clearing | reset() from react-hook-form | Handles all fields, preserves defaultValues, clears dirty state |
| Select state management | Manual value tracking | Radix UI Select controlled mode | Handles keyboard nav, accessibility, focus management |
| Mutation handling | Manual API calls with loading state | useCreateClimb (TanStack Query) | Offline queue, cache invalidation, loading/error states |
| Form labels | Floating labels or placeholder-only | Persistent FormLabel above input | Mobile UX best practice, disappears while typing confusion avoided |

**Key insight:** React Hook Form + Zod provides a complete form handling solution. Custom solutions introduce bugs, complexity, and poor mobile UX.

## Common Pitfalls

### Pitfall 1: Not Resetting Form Correctly After Submission
**What goes wrong:** Form retains old values after successful submission, causing confusion
**Why it happens:** Calling reset() without proper defaultValues or calling it at wrong time
**How to avoid:**
- Define defaultValues in useForm()
- Call reset() in mutation onSuccess callback
- Don't pass values to reset() (it resets to defaultValues)
- Close the sheet after reset completes
**Warning signs:** Form shows old data after clicking "Log Climb", new entry has stale data

### Pitfall 2: Incorrect Awkwardness Mapping
**What goes wrong:** 5-point scale values stored instead of 3-option enum
**Why it happens:** Reusing old awkwardness type/constant without updating
**How to avoid:**
- Define new type: `type Awkwardness = 'smooth' | 'normal' | 'awkward'`
- Update constants: `getAwkwardnessLabel('smooth')` → 'Smooth'
- Remove Slider component, use SelectionButton
- Update Zod schema to use enum with 3 values
**Warning signs:** Zod validation errors, UI showing numbers instead of labels

### Pitfall 3: Missing Terrain Type Required Validation
**What goes wrong:** Form submits without terrain type selected
**Why it happens:** Making terrain_type optional in schema or not adding shouldValidate
**How to avoid:**
- Make terrain_type required in Zod schema: `z.enum([...])`
- Add validation error display: `{errors.terrain_type && <p>{errors.terrain_type.message}</p>}`
- Call setValue with shouldValidate on selection
**Warning signs:** Missing data in climbs, validation not triggering

### Pitfall 4: Not Removing Old Form Fields
**What goes wrong:** Simplified form still includes style and failure_reasons fields
**Why it happens:** Copying existing logger and forgetting to remove sections
**How to avoid:**
- Create new simplifiedClimbSchema, not modify existing
- Remove entire FormSection blocks for style and failure_reasons
- Remove toggleStyle and toggleReason handlers
- Remove selectedStyles and selectedReasons state
**Warning signs:** Old UI still visible, form complexity not reduced

### Pitfall 5: Breaking Offline Queue Integration
**What goes wrong:** Climbs logged while offline don't sync or duplicate on reconnect
**Why it happens:** Not using existing createClimb service that handles offline queue
**How to avoid:**
- Continue using createClimb from src/services/climbs.ts
- Use useCreateClimb hook for mutation
- Don't bypass offlineQueue logic
**Warning signs:** Offline logs lost, duplicate entries on reconnect

## Code Examples

Verified patterns from existing code and official sources:

### Simplified Zod Schema
```typescript
// Source: Based on existing climbSchema pattern in src/lib/validation.ts
export const TERRAIN_OPTIONS = ['Slab', 'Vert', 'Overhang', 'Roof', 'Dyno', 'Crimp', 'Sloper', 'Pinch'] as const
export const AWKWARDNESS_OPTIONS = ['smooth', 'normal', 'awkward'] as const

export const simplifiedClimbSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  climb_type: z.enum(['boulder', 'sport']),
  grade_scale: z.enum(['font', 'v_scale', 'color_circuit']),
  grade_value: z.string().min(1, 'You must select a grade'),
  outcome: z.enum(['Sent', 'Fail']),
  terrain_type: z.enum(TERRAIN_OPTIONS),
  awkwardness: z.enum(AWKWARDNESS_OPTIONS),
  notes: z.string().optional(),
})

export type SimplifiedClimbInput = z.infer<typeof simplifiedClimbSchema>
```

### Form Initialization with Proper Defaults
```typescript
// Source: Existing logger.tsx pattern
const { data: profile } = useProfile()
const [outcome, setOutcome] = useState<Outcome>('Fail')
const [awkwardness, setAwkwardness] = useState<'smooth' | 'normal' | 'awkward'>('normal')
const [terrainType, setTerrainType] = useState<typeof TERRAIN_OPTIONS[number]>('Vert')

const {
  register,
  handleSubmit,
  setValue,
  reset,
  formState: { errors },
} = useForm<SimplifiedClimbInput>({
  resolver: zodResolver(simplifiedClimbSchema),
  defaultValues: {
    climb_type: 'boulder',
    grade_scale: 'color_circuit',
    outcome: 'Fail',
    terrain_type: 'Vert',
    awkwardness: 'normal',
    location: profile?.home_gym ?? 'My Gym',
    notes: '',
  },
})

// Auto-populate location from profile
useEffect(() => {
  const gym = profile?.home_gym
  if (gym !== undefined && gym !== null && gym !== '') {
    setValue('location', gym)
  }
}, [profile, setValue])
```

### Form Reset After Submission
```typescript
// Source: Based on existing useClimbs.ts pattern + React Hook Form docs
const mutation = useCreateClimb()

const handleFormSubmit = (data: SimplifiedClimbInput): void => {
  mutation.mutate(data, {
    onSuccess: () => {
      // Reset form to defaultValues
      reset()
      // Reset local state
      setOutcome('Fail')
      setAwkwardness('normal')
      setTerrainType('Vert')
      // Close the sheet
      onOpenChange?.(false)
    },
  })
}
```

### Terrain Type Selection (New Required Field)
```typescript
// Source: Based on existing outcome selection pattern in logger.tsx
<div className="space-y-2">
  <FormLabel>Terrain Type</FormLabel>
  <div className="grid grid-cols-4 gap-2">
    {TERRAIN_OPTIONS.map((terrain) => (
      <button
        key={terrain}
        type="button"
        onClick={() => {
          setTerrainType(terrain)
          setValue('terrain_type', terrain, { shouldValidate: true })
        }}
        className={cn(
          'px-3 py-3 text-xs font-black uppercase tracking-wider rounded-md border-2 transition-all',
          terrainType === terrain
            ? 'bg-white/10 border-white/30 text-white'
            : 'border-white/20 hover:border-white/30 bg-white/[0.02] text-[#888]'
        )}
      >
        {terrain}
      </button>
    ))}
  </div>
  {errors.terrain_type !== undefined && (
    <p className="text-xs text-red-400 font-mono">{errors.terrain_type.message}</p>
  )}
</div>
```

### Awkwardness 3-Option Selection (Simplified from 5-Point)
```typescript
// Source: Based on existing outcome selection pattern
<div className="space-y-2">
  <FormLabel>Awkwardness</FormLabel>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => {
        setAwkwardness('smooth')
        setValue('awkwardness', 'smooth', { shouldValidate: true })
      }}
      className={cn(
        'flex-1 px-4 py-3 border-2 transition-all',
        awkwardness === 'smooth'
          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
      )}
    >
      <span className="text-xs font-black uppercase tracking-wider">Smooth</span>
    </button>
    <button
      type="button"
      onClick={() => {
        setAwkwardness('normal')
        setValue('awkwardness', 'normal', { shouldValidate: true })
      }}
      className={cn(
        'flex-1 px-4 py-3 border-2 transition-all',
        awkwardness === 'normal'
          ? 'bg-white/10 border-white/30 text-white'
          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
      )}
    >
      <span className="text-xs font-black uppercase tracking-wider">Normal</span>
    </button>
    <button
      type="button"
      onClick={() => {
        setAwkwardness('awkward')
        setValue('awkwardness', 'awkward', { shouldValidate: true })
      }}
      className={cn(
        'flex-1 px-4 py-3 border-2 transition-all',
        awkwardness === 'awkward'
          ? 'bg-red-500/10 border-red-500/50 text-red-400'
          : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
      )}
    >
      <span className="text-xs font-black uppercase tracking-wider">Awkward</span>
    </button>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple style tags (multi-select) | Single terrain type (required) | Phase 30 | Reduces complexity, eliminates multi-select friction |
| 5-point awkwardness slider | 3-option awkwardness selection | Phase 30 | Simplifies input, clearer UI, faster logging |
| Manual failure reason tags | AI-powered auto-tagging | Phase 31+ | Analytics via notes instead of manual categorization |
| Controlled components with manual state | React Hook Form controlled components | Existing | Better performance, type-safe, minimal re-renders |

**Deprecated/outdated:**
- Slider component for awkwardness: Being replaced by 3 SelectionButtons
- Multi-select badges for style: Removed entirely
- Multi-select badges for failure_reasons: Removed entirely

## Open Questions

1. **Should simplified logger be a new component or modify existing?**
   - What we know: Existing logger.tsx has complex UI with all fields
   - What's unclear: Whether to branch into new component (e.g., simplified-logger.tsx) or modify existing
   - Recommendation: Create new simplified-logger.tsx component to keep existing logger intact during transition, allowing gradual migration

2. **How should terrain type be displayed in UI (grid vs dropdown)?**
   - What we know: 8 options, need to fit mobile screen
   - What's unclear: Grid of 8 buttons vs dropdown with 8 items
   - Recommendation: Grid of 2x4 or 4x2 buttons similar to grade selection, faster tap selection on mobile

3. **Should notes be required or optional?**
   - What we know: Notes are primary data source for AI tagging
   - What's unclear: Whether to enforce notes entry
   - Recommendation: Keep optional as specified (SIMP-05 says "free-form notes" not "required notes"), but add helpful placeholder encouraging descriptive input

## Sources

### Primary (HIGH confidence)
- React Hook Form Documentation - Form reset, controlled components, validation patterns
  - URL: https://react-hook-form.com/docs/useform/reset
  - URL: https://react-hook-form.com/docs/useform
- Radix UI Primitives - Select component patterns
  - URL: https://www.radix-ui.com/primitives/docs/components/select
- Existing codebase patterns - logger.tsx, validation.ts, constants.ts
  - Verified form reset, validation, state management patterns already in use

### Secondary (MEDIUM confidence)
- Zod Validation and React Hook Form Integration - Medium article
  - URL: https://medium.com/@adorekasun/4-engineering-dynamic-forms-zod-validation-and-react-hook-form-integration-4f02658e27d1
- Validating Dependent Fields with Zod and React Hook Form - dev.to
  - URL: https://dev.to/timwjames/validating-dependent-fields-with-zod-and-react-hook-form-2fa9
- Climbing terrain types domain knowledge
  - URL: https://www.reddit.com/r/climbharder/comments/uzgd7z/how_would_you_describe_different_types_of/
  - URL: https://outdoors.stackexchange.com/questions/28638/how-are-different-terrains-defined-by-their-angle-called-in-climbing

### Tertiary (LOW confidence)
- Mobile Form Best Practices - ivyforms.com
  - URL: https://ivyforms.com/blog/mobile-form-best-practices/
  - Content was CSS, not actual best practices - not reliable
- Form UI/UX Design Best Practices 2026
  - URL: https://www.designstudiouiux.com/blog/form-ux-design-best-practices/
  - Content was CSS, not actual best practices - not reliable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, existing code uses them correctly
- Architecture: HIGH - Patterns verified in existing logger.tsx, React Hook Form and Radix UI docs confirm best practices
- Pitfalls: HIGH - Patterns verified through existing code, official docs, and common React Hook Form mistakes

**Research date:** 2026-01-21
**Valid until:** 2026-02-20 (30 days - stable libraries with minor updates expected)
