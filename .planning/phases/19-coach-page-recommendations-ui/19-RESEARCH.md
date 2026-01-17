# Phase 19: Coach Page + Recommendations UI - Research

**Researched:** 2026-01-17
**Domain:** React components, TanStack Query UI patterns, shadcn/ui
**Confidence:** HIGH

## Summary

This phase implements the Coach Page UI to display AI recommendations and pattern analysis. The research reveals a clear path following existing codebase patterns: use the same page structure as ChartsPage and SettingsPage (header + sections with FormSection), use useCoach and useGenerateRecommendations hooks already built in Phase 18, implement tab navigation for Recommendations vs Pattern Analysis views, and follow the established dark theme design system (bg-[#0a0a0a], FormSection with border-white/10, uppercase headers with colored divider lines). Mock data is used for UI development since the LLM Edge Function is not yet integrated (Phase 20). Loading states follow the existing pattern of simple centered text, and offline support is already handled by TanStack Query's 24-hour staleTime.

**Primary recommendation:** Create CoachPage component with two tab sections (Recommendations and Pattern Analysis), use existing hooks (useCoachRecommendations, useGenerateRecommendations), mock data matching the GenerateRecommendationsResponse interface, and follow all design system patterns from ChartsPage for visual consistency.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | Component library | Already in project, all pages use it |
| React Router | 7.11.0 | Routing and navigation | Already in project, App.tsx uses Route pattern |
| TanStack Query | 5.90.16 | State management, caching | Already in project, useCoach hook built with it |
| shadcn/ui components | Latest | UI building blocks | Already installed: Button, FormSection, FormLabel, Badge, Tabs |
| Radix UI | Latest | Headless UI primitives | @radix-ui/react-tabs installed (1.1.13) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons | Already in project (Settings, TrendingUp, etc.) |
| date-fns | 4.1.0 | Date formatting | Already in project for "Last updated: X" display |
| sonner | 2.0.7 | Toast notifications | Already in project for success/error messages |
| Zod | 4.3.5 | Runtime validation | Already in project for mock data validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix UI Tabs | Custom state management | Radix provides accessibility, keyboard navigation, ARIA attributes built-in |
| TanStack Query | useState + useEffect | TanStack provides caching, loading states, automatic refetching |
| FormSection component | Direct Tailwind classes | FormSection provides consistent borders/padding/bg across all pages |
| useCoach hook | Direct API calls in component | Hook encapsulates caching logic, error handling, loading states |

**Installation:**
```bash
# No new dependencies needed - all required libraries already installed
# - React Router, TanStack Query, shadcn/ui components
# - lucide-react icons
# - Radix UI Tabs (already installed via @radix-ui/react-tabs)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── features/
│   │   ├── coach-page.tsx       # Main page with tabs
│   │   └── index.ts            # Export coach-page
├── hooks/
│   ├── useCoach.ts             # Already exists - use for data
│   └── useGenerateRecommendations # Already exists - use for mutations
├── services/
│   ├── coach.ts                # Already exists - data fetching
│   └── patterns.ts            # Already exists - pattern analysis
├── lib/
│   ├── mockRecommendations.ts   # NEW: Mock data matching real API shape
│   └── mockPatterns.ts        # NEW: Mock pattern analysis data
```

### Pattern 1: Page Structure (Existing Pattern)
**What:** All pages follow header + sections with FormSection wrapper
**When to use:** Creating the Coach Page component
**Example:**
```typescript
// Source: /workspace/src/components/features/charts-page.tsx
export function ChartsPage() {
  const { data: climbs = [], isLoading, error } = useClimbs()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-[#888]">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-red-400">
            Failed to load analytics: {error.message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="border-b-2 border-white/20 pb-6">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2">
            Analytics
          </h1>
          <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
            Technique failure breakdown
          </p>
        </header>

        {/* Sections with FormSection wrapper */}
        <section className="space-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-1 flex-1 bg-orange-500" />
            <h2 className="text-3xl font-black tracking-tighter uppercase">TRAINING PRIORITIES</h2>
            <div className="h-1 flex-1 bg-orange-500" />
          </div>
          <FormSection>
            {/* Content */}
          </FormSection>
        </section>
      </div>
    </div>
  )
}
```

### Pattern 2: TanStack Query Loading/Error States (Existing Pattern)
**What:** Simple centered text for loading and error states
**When to use:** All query-based components
**Example:**
```typescript
// Source: /workspace/src/components/features/charts-page.tsx
const { data: climbs = [], isLoading, error } = useClimbs()

if (isLoading) {
  return (
    <div className="text-center py-12 text-[#888]">Loading analytics...</div>
  )
}

if (error) {
  return (
    <div className="text-center py-12 text-red-400">
      Failed to load analytics: {error.message}
    </div>
  )
}
```

### Pattern 3: Mutation with Loading State (Existing Pattern)
**What:** Button disabled state during mutation, success toast on completion
**When to use:** Manual regenerate button
**Example:**
```typescript
// Source: /workspace/src/components/features/settings-page.tsx
const updateProfile = useUpdateProfile()

const handleFormSubmit = (data: ProfileFormData) => {
  updateProfile.mutate(data, {
    onSuccess: () => {
      toast.success('Settings saved successfully')
      void navigate('/')
    },
  })
}

// In JSX:
<Button
  type="submit"
  disabled={updateProfile.isPending}
  className="flex-1 h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
>
  {updateProfile.isPending ? 'Saving...' : 'Save'}
</Button>
```

### Pattern 4: Radix UI Tabs Component (Existing Component)
**What:** Tabs component with active state styling
**When to use:** Switching between Recommendations and Pattern Analysis views
**Example:**
```typescript
// Source: /workspace/src/components/ui/tabs.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function CoachPage() {
  return (
    <Tabs defaultValue="recommendations">
      <TabsList>
        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
      </TabsList>
      <TabsContent value="recommendations">
        {/* Recommendations content */}
      </TabsContent>
      <TabsContent value="patterns">
        {/* Pattern analysis content */}
      </TabsContent>
    </Tabs>
  )
}
```

### Pattern 5: Header with Decorative Lines (Existing Pattern)
**What:** Section headers with colored horizontal lines on both sides
**When to use:** Section dividers within page
**Example:**
```typescript
// Source: /workspace/src/components/features/charts-page.tsx
<section className="space-y-2">
  <div className="flex items-center gap-4 mb-6">
    <div className="h-1 flex-1 bg-orange-500" />
    <h2 className="text-3xl font-black tracking-tighter uppercase">TRAINING PRIORITIES</h2>
    <div className="h-1 flex-1 bg-orange-500" />
  </div>
  <FormSection>
    {/* Content */}
  </FormSection>
</section>
```

### Pattern 6: Badge Components for Tags (Existing Pattern)
**What:** Badge components for displaying failure reasons, styles
**When to use:** Displaying failure patterns and style weaknesses
**Example:**
```typescript
// Source: /workspace/src/components/features/climb-card.tsx
import { Badge } from '@/components/ui/badge'

{climb.style.length > 0 && (
  <div>
    <div className="mb-2">
      <FormLabel>Style</FormLabel>
    </div>
    <div className="flex flex-wrap gap-2">
      {climb.style.map((style) => (
        <Badge
          key={style}
          variant="outline"
          className="text-xs font-mono uppercase border-white/20 text-[#ccc] px-2 py-1"
        >
          {style}
        </Badge>
      ))}
    </div>
  </div>
)}
```

### Anti-Patterns to Avoid
- **Creating new routing patterns**: Follow existing NavLink or Tabs pattern from App.tsx
- **Hardcoded loading spinners**: Use existing centered text pattern for consistency
- **Skipping FormSection wrapper**: All content sections must use FormSection for visual consistency
- **Custom caching logic**: TanStack Query already handles caching with staleTime, gcTime
- **Direct Supabase calls in component**: Use useCoach hook for all data access
- **Non-standard styling**: Follow existing design tokens (bg-[#0a0a0a], text-[#f5f5f5], uppercase headers)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation | Custom useState for active tab | Radix UI Tabs component (@radix-ui/react-tabs) | Accessibility, keyboard navigation, ARIA attributes built-in |
| Loading state management | Manual loading flags | TanStack Query isLoading from useCoach | Automatic loading states, handles race conditions |
| Offline cache | localStorage handling | TanStack Query staleTime/gcTime settings | Automatic cache invalidation, stale-while-revalidate |
| Toast notifications | Custom alert/toast | sonner toast library | Already configured in App.tsx, styled, accessible |
| Icon system | Custom SVG icons | lucide-react | Large icon library, tree-shakeable, consistent design |
| Form section styling | Direct Tailwind classes | FormSection component | Consistent borders/padding/bg across all pages |

**Key insight:** Radix UI Tabs provides accessibility and keyboard navigation for free - don't rebuild. TanStack Query already solves caching - set staleTime and trust it. sonner is already configured for toasts - don't create duplicate notification systems.

## Common Pitfalls

### Pitfall 1: Using Wrong Mock Data Structure
**What goes wrong:** Mock data doesn't match the real API response shape, causing UI to break when LLM is connected in Phase 20
**Why it happens:** Creating mock data without referencing the GenerateRecommendationsResponse interface
**How to avoid:** Define mock data explicitly matching the coach.ts interface (weekly_focus, drills array with name, description, sets, reps, rest)
**Warning signs:** Using different field names (e.g., "focus_statement" instead of "weekly_focus"), drill objects missing required fields

### Pitfall 2: Forgetting Navigation Integration
**What goes wrong:** Coach Page created but not accessible from anywhere in the app
**Why it happens:** Creating the component but not adding route to App.tsx and nav tab
**How to avoid:** Add Coach route to App.tsx Layout (after analytics, before settings), add "Coach" tab to nav list in Layout component
**Warning signs:** No NavLink for /coach in App.tsx, no route defined, testing shows 404

### Pitfall 3: Missing Loading State for Regeneration
**What goes wrong:** User clicks regenerate button, nothing visually happens, may click multiple times
**Why it happens:** Not checking useGenerateRecommendations().isPending for button disabled state
**How to avoid:** Check mutation.isPending for button disabled state and show loading text, use toast for success/error feedback
**Warning signs:** Button doesn't show "Generating..." state, no success toast after regeneration completes

### Pitfall 4: Not Handling No Recommendations State
**What goes wrong:** User sees empty screen or broken UI when no recommendations exist yet
**Why it happens:** Assuming recommendations.data always has content, not handling null/undefined
**How to avoid:** Check if recommendations.data is null, show "Generate your first recommendations" message with call-to-action button
**Warning signs:** No conditional render for null data, accessing .content without checking existence

### Pitfall 5: Breaking Design System Consistency
**What goes wrong:** Coach Page looks different from other pages (Charts, Settings), inconsistent branding
**Why it happens:** Not following existing design patterns (header style, FormSection usage, color tokens)
**How to avoid:** Copy header pattern from ChartsPage exactly, use FormSection for all content sections, match text colors and typography (text-[#f5f5f5], uppercase headers)
**Warning signs:** Different background color (not bg-[#0a0a0a]), missing border on sections, non-uppercase headers

### Pitfall 6: Tab State Not Managed for Pattern Analysis
**What goes wrong:** Pattern analysis tab shows empty or crashes because data fetching is separate from recommendations
**Why it happens:** Assuming patterns data comes with recommendations, but it's a separate service (patterns.ts)
**How to avoid:** Create usePatternAnalysis hook that calls extractPatterns service, manage loading/error states separately from recommendations
**Warning signs:** Pattern Analysis tab always shows same data as Recommendations, no separate loading state

### Pitfall 7: Chat Entry Points Missing
**What goes wrong:** User can see recommendations but no way to ask questions or chat with coach
**Why it happens:** Focusing only on REC-01, REC-02 requirements, missing CHAT-05 requirement
**How to avoid:** Add "Ask Coach" button in recommendations section (visible even if chat not fully implemented), navigate to /coach/chat route (stub for now)
**Warning signs:** No button to access chat functionality, CHAT-05 requirement not satisfied

## Code Examples

Verified patterns from official sources:

### Mock Recommendations Data
```typescript
// Source: coach.ts GenerateRecommendationsResponse interface
// File: src/lib/mockRecommendations.ts

export const mockRecommendations = {
  weekly_focus: 'Focus on improving your foot precision and body positioning on steep terrain this week. Your failures indicate you tend to rush through sequences.',
  drills: [
    {
      name: 'Silent Feet Drill',
      description: 'Place feet silently on every hold. No scraping or stomping. Focus on precision and body tension.',
      sets: 3,
      reps: '5 routes',
      rest: '2 minutes'
    },
    {
      name: 'Core Engagement',
      description: 'On every move, engage core before pulling. Keep hips close to the wall throughout the sequence.',
      sets: 4,
      reps: '8 boulders',
      rest: '3 minutes'
    },
    {
      name: 'Slow Motion Beta',
      description: 'Work routes at 50% speed, focusing on finding the most efficient sequence. Identify wasted movement.',
      sets: 2,
      reps: '3 projects',
      rest: '5 minutes'
    }
  ],
  pattern_analysis: {
    failure_patterns: {
      most_common_failure_reasons: [
        { reason: 'Precision', count: 12, percentage: 30 },
        { reason: 'Bad Feet', count: 10, percentage: 25 },
        { reason: 'Body Position', count: 8, percentage: 20 }
      ]
    },
    style_weaknesses: {
      struggling_styles: [
        { style: 'Overhang', fail_count: 15, total_attempts: 20, fail_rate: 0.75 },
        { style: 'Roof', fail_count: 8, total_attempts: 12, fail_rate: 0.67 }
      ]
    },
    climbing_frequency: {
      climbs_per_week: [
        { week: 'Week 3, 2026', count: 12 },
        { week: 'Week 2, 2026', count: 8 },
        { week: 'Week 1, 2026', count: 15 }
      ],
      climbs_per_month: 35,
      avg_climbs_per_session: 6
    }
  },
  generation_date: new Date().toISOString(),
  is_cached: true
}
```

### Coach Page Component Structure
```typescript
// Source: Existing page patterns (charts-page.tsx, settings-page.tsx)
// File: src/components/features/coach-page.tsx

import { RefreshCw, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form-label'
import { FormSection } from '@/components/ui/form-section'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useCoachRecommendations, useGenerateRecommendations } from '@/hooks/useCoach'
import { useClimbs } from '@/hooks/useClimbs'
import { extractPatterns } from '@/services/patterns'
import type { PatternAnalysis } from '@/types'

export function CoachPage() {
  const { data: recommendations, isLoading, error } = useCoachRecommendations()
  const { data: climbs = [] } = useClimbs()
  const generateRecommendations = useGenerateRecommendations()
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null)
  const [patternsLoading, setPatternsLoading] = useState(false)

  // Load pattern analysis separately
  useEffect(() => {
    if (climbs.length > 0) {
      setPatternsLoading(true)
      // TODO: Call extractPatterns with user_id
      setPatternsLoading(false)
    }
  }, [climbs])

  const handleRegenerate = () => {
    generateRecommendations.mutate(
      {
        climbs,
        user_preferences: {
          preferred_discipline: 'boulder',
          preferred_grade_scale: 'font',
        },
      },
      {
        onSuccess: () => {
          toast.success('Recommendations regenerated successfully')
        },
        onError: (err) => {
          toast.error(`Failed to regenerate: ${err.message}`)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-[#888]">Loading recommendations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center py-12 text-red-400">
            Failed to load recommendations: {error.message}
          </div>
        </div>
      </div>
    )
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
        <div className="mx-auto max-w-2xl">
          <header className="border-b-2 border-white/20 pb-6">
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
              Coach
            </h1>
            <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
              AI-powered training recommendations
            </p>
          </header>

          <div className="text-center py-16">
            <p className="text-[#888] mb-6">No recommendations yet</p>
            <Button
              onClick={() => void handleRegenerate()}
              disabled={generateRecommendations.isPending}
              className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
            >
              {generateRecommendations.isPending ? 'Generating...' : 'Generate Recommendations'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const content = recommendations.content as {
    weekly_focus: string
    drills: Array<{
      name: string
      description: string
      sets: number
      reps: string
      rest: string
    }>
  }

  const lastUpdated = new Date(recommendations.generation_date)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="border-b-2 border-white/20 pb-6">
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
            Coach
          </h1>
          <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
            AI-powered training recommendations
          </p>
        </header>

        <Tabs defaultValue="recommendations">
          <TabsList className="grid w-full grid-cols-2 bg-white/[0.02] border-2 border-white/10">
            <TabsTrigger value="recommendations" className="text-xs font-black uppercase tracking-wider">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs font-black uppercase tracking-wider">
              Pattern Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-6 space-y-8">
            {/* Weekly Focus Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-blue-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Weekly Focus</h2>
                <div className="h-1 flex-1 bg-blue-500" />
              </div>
              <FormSection>
                <FormLabel className="mb-4 block">This week's focus</FormLabel>
                <p className="text-lg text-[#f5f5f5] leading-relaxed">{content.weekly_focus}</p>
              </FormSection>
            </section>

            {/* Drills Section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 flex-1 bg-green-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Training Drills</h2>
                <div className="h-1 flex-1 bg-green-500" />
              </div>

              {content.drills.map((drill, index) => (
                <FormSection key={index} className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-black uppercase">{drill.name}</h3>
                    <Badge variant="outline" className="text-xs font-mono border-white/20 text-[#ccc]">
                      {drill.sets} × {drill.reps}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#bbb] leading-relaxed mb-3">{drill.description}</p>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#666]">
                    <span>Rest: {drill.rest}</span>
                  </div>
                </FormSection>
              ))}
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => void handleRegenerate()}
                disabled={generateRecommendations.isPending}
                className="w-full h-12 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {generateRecommendations.isPending ? 'Generating...' : 'Regenerate Recommendations'}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 border-white/20 hover:border-white/40 bg-white/[0.02] text-white font-black uppercase tracking-wider"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Coach a Question
              </Button>
            </div>

            {/* Last Updated */}
            <div className="text-center pt-4">
              <FormLabel>
                Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </FormLabel>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="mt-6 space-y-8">
            {/* Pattern Analysis Content */}
            {patternsLoading ? (
              <div className="text-center py-12 text-[#888]">Loading patterns...</div>
            ) : patterns ? (
              <>
                {/* Failure Patterns */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-orange-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Failure Patterns</h2>
                    <div className="h-1 flex-1 bg-orange-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-3">
                      {patterns.failure_patterns.most_common_failure_reasons.map((item) => (
                        <div key={item.reason} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-mono border-white/20 text-[#ccc]">
                            {item.reason}
                          </Badge>
                          <span className="text-sm text-[#888]">
                            {item.count} times ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </section>

                {/* Style Weaknesses */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-rose-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Style Weaknesses</h2>
                    <div className="h-1 flex-1 bg-rose-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-3">
                      {patterns.style_weaknesses.struggling_styles.map((item) => (
                        <div key={item.style} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-mono border-white/20 text-[#ccc]">
                            {item.style}
                          </Badge>
                          <span className="text-sm text-[#888]">
                            {Math.round(item.fail_rate * 100)}% fail rate ({item.fail_count}/{item.total_attempts})
                          </span>
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </section>

                {/* Climbing Frequency */}
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 flex-1 bg-teal-500" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Climbing Frequency</h2>
                    <div className="h-1 flex-1 bg-teal-500" />
                  </div>
                  <FormSection>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-[#888] mb-1">Average per session</p>
                        <p className="text-4xl font-black">{patterns.climbing_frequency.avg_climbs_per_session}</p>
                      </div>
                      <div className="text-center pt-4 border-t border-white/10">
                        <p className="text-sm text-[#888] mb-1">Per month</p>
                        <p className="text-4xl font-black">{patterns.climbing_frequency.climbs_per_month}</p>
                      </div>
                    </div>
                  </FormSection>
                </section>
              </>
            ) : (
              <div className="text-center py-12 text-[#888]">
                No climbing data available for pattern analysis
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

### Add Route to App.tsx
```typescript
// Source: /workspace/src/App.tsx
import { CoachPage } from '@/components/features/coach-page'

// In Layout function:
<nav className="flex gap-2 mb-8">
  <NavLink to="/">Climbs</NavLink>
  <NavLink to="/analytics">Analytics</NavLink>
  <NavLink to="/coach">Coach</NavLink> {/* NEW: Add Coach nav item */}
</nav>

// In Routes:
<Route path="/" element={<Layout />}>
  <Route index element={<DashboardWrapper />} />
  <Route path="analytics" element={<ChartsPage />} />
  <Route path="coach" element={<CoachPage />} /> {/* NEW: Add Coach route */}
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

### Export from Index
```typescript
// Source: /workspace/src/components/features/index.ts
export { ChartsPage } from './charts-page'
export { SettingsPage } from './settings-page'
export { CoachPage } from './coach-page' // NEW
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual loading flags | TanStack Query isLoading | 2022+ | Automatic loading state management, no race conditions |
| localStorage for caching | TanStack Query staleTime/gcTime | 2022+ | Automatic cache invalidation, stale-while-revalidate |
| Custom tab state | Radix UI Tabs component | 2021+ | Accessibility, keyboard navigation built-in |
| Direct Supabase calls in UI | Service layer + hooks | 2021+ | Separation of concerns, testable, reusable |
| Custom toast implementations | sonner library | 2023+ | Accessible, styled, already configured |

**Deprecated/outdated:**
- Manual loading state management with useState: Use TanStack Query isLoading
- localStorage for caching: Use TanStack Query cache configuration
- Custom tab implementations: Use Radix UI Tabs (@radix-ui/react-tabs)
- Direct navigation handling: Use React Router NavLink/Routes

## Open Questions

1. **How should we handle pattern analysis data fetching?**
   - What we know: patterns.ts service exists with extractPatterns function, returns PatternAnalysis interface
   - What's unclear: Should we create a usePatternAnalysis hook or call extractPatterns directly in CoachPage component? Should it be cached like recommendations?
   - Recommendation: Create usePatternAnalysis hook following the same pattern as useCoach (useQuery with 24h staleTime), keeps data fetching logic out of component

2. **What happens when user has no climbs yet?**
   - What we know: extractPatterns returns getEmptyPatterns() when climbs array is empty
   - What's unclear: Should Pattern Analysis tab be disabled when no climbs exist? What messaging to show?
   - Recommendation: Show "No climbing data available" message in Pattern Analysis tab, disable tab or show empty state UI, guide user to log climbs first

3. **What should the "Ask Coach" button do in this phase?**
   - What we know: CHAT-05 requires clear entry points to chat from recommendations page
   - What's unclear: Should it navigate to a /coach/chat route (not implemented yet)? Show a "coming soon" modal?
   - Recommendation: Navigate to /coach/chat route (can be a stub/placeholder for now), show "Chat feature coming in Phase 21" message if route not found

4. **How should we handle regenerate button if no recommendations exist?**
   - What we know: useCoachRecommendations returns null when no recommendations exist
   - What's unclear: Should regenerate button be in header or inline? Should it be the primary CTA when no data?
   - Recommendation: Show "Generate your first recommendations" message centered with prominent button when no data, move regenerate to inline button when data exists

## Sources

### Primary (HIGH confidence)
- **Existing codebase patterns** - Verified all patterns directly from source code
  - Files: src/components/features/charts-page.tsx, settings-page.tsx, climb-card.tsx
  - Files: src/hooks/useCoach.ts, src/hooks/useClimbs.ts, src/hooks/useProfile.ts
  - Files: src/components/ui/button.tsx, form-section.tsx, form-label.tsx, badge.tsx, tabs.tsx
  - Files: src/services/coach.ts, src/services/patterns.ts
  - File: src/App.tsx (routing and navigation patterns)
  - File: src/types/index.ts (all data structures and interfaces)
- **Database schema** - Verified coach_recommendations table structure and JSONB content column
  - File: supabase/migrations/20260117_create_coach_tables.sql
- **Design system** - Verified color tokens, typography, spacing from existing components
  - Files: All page and component files follow consistent bg-[#0a0a0a], text-[#f5f5f5], FormSection pattern

### Secondary (MEDIUM confidence)
- **TanStack Query documentation** - Verified staleTime, gcTime configuration, useMutation patterns
  - URL: https://tanstack.com/query/latest/docs/react/guides/queries
- **Radix UI Tabs documentation** - Verified Tabs API, accessibility, keyboard navigation
  - URL: https://www.radix-ui.com/primitives/docs/components/tabs
- **date-fns formatDistanceToNow** - Verified format string options
  - URL: https://date-fns.org/v2.29.3/docs/formatDistanceToNow

### Tertiary (LOW confidence)
- **WebSearch for mock data best practices** - Not accessed, using domain knowledge
- **Chat implementation details** - Not yet implemented, only entry point needed for this phase
- **Pattern analysis UI patterns** - Based on existing analytics patterns from charts-page.tsx

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from package.json and existing codebase
- Architecture: HIGH - All patterns extracted directly from existing components (ChartsPage, SettingsPage, ClimbCard)
- UI components: HIGH - All components verified from src/components/ui/
- Data structures: HIGH - All interfaces verified from src/types/index.ts and src/services/coach.ts
- Design system: HIGH - All design tokens verified from existing pages
- Pattern analysis hook: MEDIUM - Need to decide whether to create hook or call service directly
- Chat entry point behavior: LOW - Chat not implemented yet, only button needed

**Research date:** 2026-01-17
**Valid until:** 2026-02-16 (30 days - stable domain: React, TanStack Query, Radix UI, existing codebase patterns)
