# Phase 9: Mark Failed as Succeeded - Research

**Researched:** 2026-01-15
**Domain:** React mutation patterns with TanStack Query v5 + Supabase update operations
**Confidence:** HIGH

<research_summary>
## Summary

Researched existing codebase patterns for implementing "mark failed as succeeded" functionality. The codebase already has complete infrastructure for climbing updates including `updateClimb()`, `useUpdateClimb()`, and the Logger component supports editing climbs with outcome changes.

Key finding: No new infrastructure needed. Existing `useUpdateClimb()` hook with `onSuccess` cache invalidation, combined with Supabase `.update().select()` pattern, provides production-ready outcome change functionality. RLS policy "Users can update own climbs" already allows users to modify their climbs including outcome field.

**Primary recommendation:** Use existing `useUpdateClimb()` hook, add "Mark as Sent" button/indicator to climb list UI, leverage Logger's edit mode for full edits if needed.
</research_summary>

<standard_stack>
## Standard Stack

The established libraries/tools for this domain (already in codebase):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | 5.x | Server state, mutations, cache | Best-in-class React state management with caching |
| @supabase/supabase-js | 2.x | Database client, auth, RLS | Type-safe database operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.x | Form validation | Edit mode in Logger |
| zod | 3.x | Schema validation | Validate outcome changes |

### Existing Codebase Patterns
| Instead of | Use | Tradeoff |
|------------|------|----------|
| Custom mutation logic | useUpdateClimb() hook | Already tested, has cache invalidation |
| New update service | updateClimb() function | Handles offline queue, .select() for return data |
| Custom UI edit flow | Logger in edit mode | Consistent UX, reuses validation |

**Installation:** None required - all dependencies already in codebase
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/features/     # UI components
│   ├── logger.tsx         # Edit mode (already exists)
│   └── climb-card.tsx     # New: "Mark as Sent" button
├── hooks/                 # React hooks
│   └── useClimbs.ts       # useUpdateClimb() (already exists)
├── services/              # API services
│   └── climbs.ts          # updateClimb() (already exists)
└── types/                 # TypeScript types
    └── index.ts           # TablesUpdate type (already exists)
```

### Pattern 1: TanStack Query Update Mutation
**What:** Use `useUpdateClimb()` with `onSuccess` cache invalidation
**When to use:** Any climb update including outcome changes
**Example:**
```typescript
// Source: src/hooks/useClimbs.ts (existing pattern)
export function useUpdateClimb() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateClimbInput> }) =>
      updateClimb(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
  })
}
```

### Pattern 2: Supabase Partial Update
**What:** Use `.update()` with partial values and `.select()` to return updated record
**When to use:** Any database update operation
**Example:**
```typescript
// Source: src/services/climbs.ts (existing pattern)
export async function updateClimb(id: string, updates: Partial<CreateClimbInput>): Promise<Climb> {
  if (!supabase) {
    throw new Error('Supabase client not configured')
  }

  // If offline, queue the mutation
  if (!navigator.onLine) {
    offlineQueue.add('update', 'climbs', { id, updates })
    return { id, ...updates, updated_at: new Date().toISOString() } as unknown as Climb
  }

  const { data, error } = await supabase
    .from('climbs')
    .update(updates as TablesUpdate<'climbs'>)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data as Climb
}
```

### Pattern 3: Outcome Change in Logger (Edit Mode)
**What:** Logger component already supports editing climbs including outcome
**When to use:** When user wants to edit full climb details
**Example:**
```typescript
// Source: src/components/features/logger.tsx (line 78-99)
useEffect(() => {
  if (climb !== null && climb !== undefined) {
    reset({
      climb_type: climb.climb_type as Discipline,
      grade_scale: climb.grade_scale as GradeScale,
      grade_value: climb.grade_value,
      outcome: climb.outcome as Outcome,  // Outcome can be changed
      awkwardness: climb.awkwardness,
      style: climb.style,
      failure_reasons: climb.failure_reasons,
      location: climb.location,
      notes: climb.notes ?? '',
      hold_color: climb.hold_color,
    })
    setGradeScale(climb.grade_scale as GradeScale)
    setDiscipline(climb.climb_type as Discipline)
    setOutcome(climb.outcome as Outcome)  // Local state updates
    setAwkwardness(climb.awkwardness)
    setSelectedStyles(climb.style)
    setSelectedReasons(climb.failure_reasons)
  }
}, [climb, reset])
```

### Anti-Patterns to Avoid
- **Creating new update logic:** Reuse `useUpdateClimb()` instead of new mutations
- **Direct Supabase calls in components:** Go through service layer for offline queue support
- **Not invalidating cache:** Always use `onSuccess` with `invalidateQueries()`
- **Ignoring offline queue:** Existing `updateClimb()` handles offline mode automatically
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Climb update mutation | Custom useMutation hook | useUpdateClimb() | Already handles cache invalidation, tested pattern |
| Supabase update call | Direct client call | updateClimb() service | Handles offline queue, .select() for return data, error handling |
| Cache management | Manual query invalidation | onSuccess callback | Standard TanStack Query pattern |
| Type safety | Inline types | TablesUpdate<'climbs'> | Generated from Supabase schema |
| Edit form UI | New component | Logger in edit mode | Reuses validation, styling, logic |
| Outcome change logic | Custom outcome handler | Logger's existing outcome toggle | Already clears failure_reasons on Sent (lines 343-346) |

**Key insight:** The codebase already has production-tested update infrastructure. Custom implementations would miss offline queue support, cache invalidation, and UI consistency. Logger component's edit mode handles outcome changes including clearing failure_reasons when switching to Sent.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Not Invalidating Cache After Update
**What goes wrong:** Climb list shows stale data after outcome change
**Why it happens:** TanStack Query caches queries, mutation doesn't auto-refresh
**How to avoid:** Always use `onSuccess` callback with `invalidateQueries()`
**Warning signs:** Update succeeds but UI doesn't reflect change until page refresh

### Pitfall 2: Not Using .select() with Update
**What goes wrong:** Mutation completes but no updated data returned
**Why it happens:** Supabase `.update()` doesn't return data by default
**How to avoid:** Always add `.select().single()` after `.update().eq()`
**Warning signs:** Mutation returns `{ data: null, error: null }`

### Pitfall 3: Ignoring Offline Queue
**What goes wrong:** Updates fail offline without user feedback
**Why it happens:** Not using `offlineQueue.add()` for offline operations
**How to avoid:** `updateClimb()` already handles this, don't bypass service layer
**Warning signs:** Works online but fails silently offline

### Pitfall 4: RLS Policy Violations
**What goes wrong:** Update fails with permission error
**Why it happens:** RLS policy doesn't allow user to update own rows
**How to avoid:** Existing policy "Users can update own climbs" already in place
**Warning signs:** Error: "new row violates row-level security policy"

### Pitfall 5: Not Clearing Failure Reasons on Sent
**What goes wrong:** Climb marked Sent still has failure_reasons array
**Why it happens:** Partial update doesn't clear optional fields
**How to avoid:** Logger's outcome toggle already clears failure_reasons (lines 343-346)
**Warning signs:** Analytics show failure reasons for Sent climbs
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from existing codebase:

### Use Update Mutation
```typescript
// Source: src/hooks/useClimbs.ts (lines 25-35)
export function useUpdateClimb() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateClimbInput> }) =>
      updateClimb(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
    },
  })
}
```

### Call Update Mutation with Outcome Change
```typescript
// Pattern for Phase 9 implementation
import { useUpdateClimb } from '@/hooks/useClimbs'

function ClimbCard({ climb }: { climb: Climb }) {
  const updateClimb = useUpdateClimb()

  const handleMarkAsSent = () => {
    updateClimb.mutate({
      id: climb.id,
      updates: {
        outcome: 'Sent',
        failure_reasons: [],  // Clear failure reasons
      },
    })
  }

  return (
    <div>
      {/* ... other climb details ... */}
      {climb.outcome === 'Fail' && (
        <button onClick={handleMarkAsSent}>
          Mark as Sent
        </button>
      )}
    </div>
  )
}
```

### Use Logger in Edit Mode
```typescript
// Source: src/App.tsx (lines 252-416)
const [editingClimb, setEditingClimb] = useState<Climb | null>(null)

function handleEditClick(climb: Climb) {
  setEditingClimb(climb)
}

function handleSaveChanges(data: ClimbForm) {
  if (editingClimb) {
    updateClimb.mutate(
      { id: editingClimb.id, updates: data },
      {
        onSuccess: () => {
          setEditingClimb(null)
        },
      }
    )
  }
}

// In JSX:
<Logger
  open={editingClimb !== null}
  onOpenChange={open => !open && setEditingClimb(null)}
  onSubmit={handleSaveChanges}
  climb={editingClimb}
/>
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-query v4 | TanStack Query v5 | 2024 | Use `@tanstack/react-query` package, updated API |
| Manual cache updates | invalidateQueries() | Always | Simpler, less error-prone than manual cache manipulation |
| onMutate + onError for rollback | onMutate + onError (same pattern) | Still current | Rollback on error still best practice in v5 |

**New tools/patterns to consider:**
- **Optimistic updates with onMutate:** Use to update UI before mutation completes, rollback on error (TanStack Query docs)
- **Context7 for TanStack Query:** Available for latest patterns if needed

**Deprecated/outdated:**
- **react-query package:** Use `@tanstack/react-query` instead (package renamed)
- **Manual query refetch:** Use `invalidateQueries()` instead for better cache coordination

**Sources for SOTA:**
- [Optimistic Updates | TanStack Query React Docs](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates)
- [TanStack Query React Docs](https://tanstack.com/query/latest/docs/react/reference/useMutation)
- [Supabase update() reference](https://supabase.com/docs/reference/javascript/update)
</sota_updates>

<open_questions>
## Open Questions

None - all implementation requirements are covered by existing patterns in codebase.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- **Existing codebase patterns** (verified by inspection):
  - src/hooks/useClimbs.ts - useUpdateClimb implementation
  - src/services/climbs.ts - updateClimb with offline queue
  - src/components/features/logger.tsx - edit mode with outcome changes
  - src/types/index.ts - TablesUpdate type definition
  - supabase/migrations/20260105175622_create_climbs_table.sql - RLS policy "Users can update own climbs"

### Secondary (MEDIUM confidence)
- [Optimistic Updates | TanStack Query React Docs](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates) - Verified cache invalidation patterns
- [Supabase update() reference](https://supabase.com/docs/reference/javascript/update) - Verified .select() requirement for return data
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Verified RLS policy structure allows updates

### Tertiary (LOW confidence - needs validation)
- None - all findings verified against existing codebase or official docs
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: TanStack Query v5 mutations, Supabase update operations
- Ecosystem: None needed - all infrastructure in codebase
- Patterns: Cache invalidation, partial updates, offline queue
- Pitfalls: Cache invalidation, .select() requirement, offline handling, RLS policies

**Confidence breakdown:**
- Standard stack: HIGH - existing codebase patterns verified
- Architecture: HIGH - from working code in src/hooks/useClimbs.ts
- Pitfalls: HIGH - identified from TanStack Query and Supabase docs
- Code examples: HIGH - from existing production code

**Research date:** 2026-01-15
**Valid until:** 2026-02-15 (30 days - TanStack Query and Supabase stable)
</metadata>

---

*Phase: 09-mark-failed-as-succeeded*
*Research completed: 2026-01-15*
*Ready for planning: yes*
