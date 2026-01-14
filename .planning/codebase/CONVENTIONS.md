# Coding Conventions

**Analysis Date:** 2026-01-14

## Naming Patterns

**Files:**
- PascalCase.tsx for React components (logger.tsx, charts-page.tsx)
- kebab-case.ts for utilities and services (climbs.ts, validation.ts, grades.ts)
- camelCase.ts for hooks (useClimbs.ts, useProfile.ts)
- *.test.ts for test files co-located with source

**Functions:**
- camelCase for all functions (normalizeGrade, getDifficultyBucket, createClimb)
- No special prefix for async functions
- Descriptive names with clear action verbs (get, create, update, delete)

**Variables:**
- camelCase for variables (gradeScale, selectedStyles, awkwardness)
- UPPER_SNAKE_CASE for constants (FONT_GRADES, V_SCALE_GRADES, COLOR_CIRCUIT)
- No underscore prefix for private members (TypeScript handles privacy)

**Types:**
- PascalCase for interfaces and types (Climb, Profile, GradeScale)
- No I prefix for interfaces (User, not IUser)
- PascalCase for enums, UPPER_CASE for values

## Code Style

**Formatting:**
- Prettier with .prettierrc
- 100 character line length (printWidth)
- Single quotes for strings
- No semicolons (semi: false)
- 2 space indentation
- Trailing commas: ES5 style

**Linting:**
- ESLint with eslint.config.js (modern flat config)
- Extends: TypeScript, React, JSX a11y, import ordering
- Rules: No unused locals/params, no unchecked indexed access
- Run: pnpm lint

## Import Organization

**Order:**
1. React (useState, useEffect, etc.)
2. Third-party packages (from 'react-hook-form', '@tanstack/react-query', etc.)
3. Internal modules with @/ alias (@/components/ui/button, @/lib/validation)
4. Type imports (import type { Climb } from '@/types')

**Grouping:**
- Blank line between import groups
- Alphabetical within each group
- Type-only imports preferred for types

**Path Aliases:**
- @/ maps to ./src/ (configured in tsconfig.json)
- Examples: @/components, @/lib, @/hooks, @/services, @/types

## Error Handling

**Patterns:**
- Throw errors at service layer, catch at component layer
- TanStack Query captures mutation errors automatically
- Display error messages from mutation.error property
- Zod validation catches form errors before submission

**Error Types:**
- Throw on invalid data, Supabase failures, network errors
- Log error with console.error before throwing
- No custom error classes (use standard Error)

**Logging:**
- Console statements for development debugging
- No structured logging framework
- Console locations: syncManager.ts, auth.tsx, supabase.ts

## Logging

**Framework:**
- Console-based (console.log, console.error)
- No pino, winston, or structured logging

**Patterns:**
- Debug logging during development
- Error logging in catch blocks
- No production logging service configured

## Comments

**When to Comment:**
- Minimal comments (code is self-documenting)
- Explain complex business logic or algorithms
- Document configuration decisions

**JSDoc/TSDoc:**
- Not extensively used
- Clear function names reduce need for documentation
- Type definitions serve as documentation

**TODO Comments:**
- Not detected in codebase

## Function Design

**Size:**
- Keep under 200 lines (extract larger components)
- Single responsibility principle
- Extract helpers for complex logic

**Parameters:**
- Destructure objects in parameter list
- Use interfaces for complex parameters
- Max 3-4 parameters preferred

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- Async functions return Promises

## Module Design

**Exports:**
- Named exports preferred (export function, export const)
- Default exports for components (export default function Logger)
- Export types from index.ts barrel files

**Barrel Files:**
- `src/types/index.ts` re-exports all types
- `src/components/features/index.ts` re-exports feature components
- Avoid circular dependencies

## Component Patterns

**Functional Components:**
- Default export with hooks
- TypeScript props interface
- Destructure props in parameter list

**Example:**
```typescript
interface LoggerProps {
  onSubmit: (data: ClimbForm) => void
}

export function Logger({ onSubmit }: LoggerProps) {
  // Component logic
}
```

**Styling:**
- Tailwind utility classes
- Semantic color tokens (bg-primary, text-foreground)
- Mobile-first responsive design (md:, lg: breakpoints)

## State Management Patterns

**Server State:**
- TanStack Query for all server data
- Query keys: ['climbs'], ['profile']
- Cache invalidation after mutations

**Local State:**
- useState for component state
- useRef for DOM references
- useCallback for memoized callbacks

**Form State:**
- react-hook-form with useForm hook
- Zod resolver for validation
- Controlled components

---

*Convention analysis: 2026-01-14*
*Update when patterns change*
