# Scenka Agent Guidelines

## Project Overview

Mobile-first PWA for rock climbers tracking technique failures using React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase.

## Development Commands

### Build & Dev

```bash
pnpm dev            # Start Vite dev server
pnpm build          # Production build
pnpm preview        # Preview production build
```

### Linting & Formatting

```bash
pnpm lint           # ESLint check
pnpm format         # Prettier format
pnpm typecheck      # TypeScript type checking
```

### Testing

```bash
pnpm test           # Run all tests
pnpm vitest run <path-to-test-file>           # Run specific test file
pnpm vitest run <path-to-test-file> -t "<test-name>"  # Run specific test by name
```

## Tech Stack

React 18+ (Vite), TypeScript (strict), Tailwind CSS v3+, shadcn/ui, TanStack Query, Supabase (PostgreSQL + RLS + Auth), react-hook-form, zod, recharts, lucide-react

## Available Skills

### senior-architect

**ALWAYS use when designing backend** (database schema, API endpoints, migrations, RLS policies). Also use when designing system architecture, making technical decisions, creating architecture diagrams, evaluating trade-offs, or defining integration patterns. Provides comprehensive software architecture guidance for scalable, maintainable systems using the project's tech stack (React, NodeJS, Postgres, etc.).

### frontend-design

**ALWAYS use when designing UIs** (components, pages, layouts, visual design). Generates creative, production-grade frontend interfaces with high design quality that avoids generic AI aesthetics. Apply this skill when the user asks to create UI components, implement new features, or improve the visual design of the application.

## Code Style Guidelines

### File Organization

```
src/components/{ui,features}/  # Reusable UI components
src/lib/                      # Utilities, constants, helpers
src/hooks/                    # Custom React hooks
src/pages/                    # Route/page components
src/services/                 # API/Supabase services
src/types/                    # TypeScript type definitions
src/styles/                   # Global styles
```

### TypeScript

- Strict mode enabled, no `any` types
- Use `interface` for object shapes, `type` for unions/primitives
- Export types from `src/types/index.ts`
- Enable noUncheckedIndexedAccess

### Imports

- Group: React → third-party → internal → types → relative
- Use `@/` for internal modules, alphabetical within groups
- Remove unused imports

```typescript
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import type { Climb } from '@/types'
```

### Components

- Functional with hooks, default export
- PascalCase names, kebab-case files (e.g., `grade-picker.tsx`)
- Props interface unless using shadcn/ui patterns
- <200 lines, extract complex logic to hooks

```typescript
interface GradePickerProps {
  scale: 'font' | 'v_scale' | 'color_circuit'
  value: string
  onChange: (value: string) => void
}

export function GradePicker({ scale, value, onChange }: GradePickerProps) {}
```

### State Management

- TanStack Query for server state (cache, loading, error)
- React Context for global app state (auth, preferences)
- useState for local component state
- Optimistic updates for mutations

### Error Handling

- Handle all Supabase/API errors with user-friendly messages
- Use error boundaries for component-level errors
- Validate input with zod before submission

### Styling (Tailwind)

- Utility classes over custom CSS, mobile-first (md:, lg:)
- Semantic color tokens (bg-primary, text-foreground)
- 44px+ touch targets, dark mode default (#09090b)
- Use shadcn/ui components as building blocks

### Supabase Integration

- All operations through Supabase client
- RLS enabled (auth.uid() = user_id)
- Type-safe queries with generated types
- Validate with zod, handle offline states

### Form Handling

- react-hook-form + zod validation
- Real-time feedback, auto-focus first input
- Keyboard navigation (Enter submit, Esc cancel)

### Performance & Accessibility

- Lazy load routes/components, React.memo for expensive pure components
- Virtual scrolling for long lists, optimize images (WebP)
- Semantic HTML, keyboard accessible, aria-labels
- Focus management in modals/drawers

### Testing

- Test lib/ and services/ business logic
- Mock Supabase calls, test form validation
- Aim for 80%+ coverage on critical paths

## Key Domain Concepts

### Grading Systems

Font (3-9c), V-Scale (VB-V17), Color (Teal→Black)
Maintain mapping in `src/lib/grades.ts`

### Core Philosophy

"Exception Logging" - only log significant climbs (failed projects, awkward sends)

### Tags

Style: Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch
Failure Reasons: Physical (Pumped, Finger Strength, Core, Power), Technical (Bad Feet, Body Position, Beta Error, Precision), Mental (Fear, Commitment, Focus)

### Awkwardness Scale

1 = Flow state, 5 = Sketchy/desperate

## PWA Requirements

Mobile-first, standalone display, dark theme, 44px+ targets, offline support, <2s load

## Screenshot Workflow

Screenshots are located in `~/Pictures/Screenshots`. When asked to read an image of the UI or take a look at a problem, access the latest screenshot in that folder.

**IMPORTANT: Always use the zai MCP tools when working with images/screenshots.** This includes:

- `zai-mcp-server_ui_to_artifact` for UI screenshots (convert to code/prompts/specs)
- `zai-mcp-server_extract_text_from_screenshot` for extracting text/code from screenshots
- `zai-mcp-server_diagnose_error_screenshot` for error messages and stack traces
- `zai-mcp-server_understand_technical_diagram` for architecture diagrams and flowcharts
- `zai-mcp-server_analyze_data_visualization` for charts and graphs
- `zai-mcp-server_ui_diff_check` for comparing two UI screenshots

## Before Submitting Code

1. `npm run lint` - fix all issues
2. `npm run typecheck` - no errors
3. `npm run test` - all tests pass
4. Check mobile responsiveness
5. Verify keyboard navigation
6. Test offline functionality

## Common Patterns

```typescript
// TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['climbs'],
  queryFn: () => supabase.from('climbs').select('*'),
})

// Mutation
const mutation = useMutation({
  mutationFn: (climb: CreateClimbInput) => supabase.from('climbs').insert(climb),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['climbs'] }),
})

// Zod Validation
const climbSchema = z.object({
  grade_value: z.string().min(1),
  outcome: z.enum(['Sent', 'Fail']),
  awkwardness: z.number().int().min(1).max(5),
})
```
