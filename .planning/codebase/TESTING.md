# Testing Patterns

**Analysis Date:** 2026-01-14

## Test Framework

**Runner:**
- Vitest - Configured in package.json
- No separate vitest.config.ts file (uses Vite config)

**Assertion Library:**
- Vitest built-in expect
- Matchers: toBe, toEqual, toThrow, toBeGreaterThan, toBeLessThan

**Run Commands:**
```bash
pnpm test              # Run all tests
pnpm vitest run        # Run once without watch mode
pnpm vitest run <path> # Run specific test file
```

## Test File Organization

**Location:**
- *.test.ts alongside source files (co-located)
- No separate __tests__/ or tests/ directory

**Naming:**
- {filename}.test.ts pattern
- Example: grades.test.ts next to grades.ts

**Structure:**
```
src/
  lib/
    grades.ts
    grades.test.ts
  services/
    climbs.ts (no test yet)
    profiles.ts (no test yet)
  hooks/
    useClimbs.ts (no test yet)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest'

describe('functionName', () => {
  describe('Category of tests', () => {
    it('should do something specific', () => {
      // Test code
    })
  })
})
```

**Patterns:**
- Nested describe blocks for logical grouping
- Clear test descriptions (normalizes lowest Font grade (3))
- Boundary testing (min/max values)
- Edge case coverage (invalid inputs, empty strings)

## Mocking

**Framework:**
- Vitest built-in mocking (vi)
- No mocking currently used in grades.test.ts

**Patterns:**
- Not currently implemented
- Will need vi.mock() for Supabase calls in service tests

**What to Mock:**
- Supabase client calls (in services/)
- localStorage calls (in offlineQueue tests)
- Network status (in useNetworkStatus tests)

**What NOT to Mock:**
- Pure utility functions (grades.ts, utils.ts)

## Fixtures and Factories

**Test Data:**
- Inline test data in current tests
- No shared fixtures or factories

**Location:**
- Not currently implemented
- Could add tests/fixtures/ for shared test data

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage tracked for awareness only

**Configuration:**
- Vitest coverage via c8 (built-in)
- No coverage exclusions configured yet

**View Coverage:**
```bash
pnpm vitest run --coverage  # Generate coverage report
```

## Test Types

**Unit Tests:**
- Test single functions in isolation
- Current: src/lib/grades.test.ts (only test file)
- Focus: Pure functions, business logic

**Integration Tests:**
- Test multiple modules together
- Not currently implemented
- Needed: Service + Supabase integration

**E2E Tests:**
- Not currently implemented
- No Playwright or Cypress setup
- Manual testing for user flows

## Common Patterns

**Testing Pure Functions:**
```typescript
import { describe, it, expect } from 'vitest'
import { normalizeGrade } from './grades'

describe('normalizeGrade', () => {
  it('normalizes Font grade correctly', () => {
    const result = normalizeGrade('font', '6a')
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(10)
  })
})
```

**Testing Edge Cases:**
```typescript
it('handles invalid grade', () => {
  const result = normalizeGrade('font', 'invalid')
  expect(result).toBe(0) // Or appropriate default
})
```

**Testing Boundaries:**
```typescript
it('handles lowest grade', () => {
  expect(normalizeGrade('font', '3')).toBeGreaterThan(0)
})

it('handles highest grade', () => {
  expect(normalizeGrade('font', '9c')).toBeLessThan(10)
})
```

## Test Quality Examples

**Current State:**
- 1 test file: src/lib/grades.test.ts (116 lines)
- Comprehensive coverage of grade normalization
- Good boundary and edge case testing
- Clear test descriptions

**Missing Coverage:**
- Component tests (no React Testing Library)
- Hook tests (useClimbs, useProfile)
- Service tests (climbs, profiles, offlineQueue)
- Integration tests (auth, sync manager)

## Testing Gaps

**Critical Areas Without Tests:**
- src/services/ - All CRUD operations untested
- src/hooks/ - Data fetching and mutations untested
- src/components/ - All components untested
- src/lib/auth.tsx - Authentication flow untested
- src/lib/syncManager.ts - Offline sync logic untested

**Priority:**
1. Add service layer tests (mock Supabase)
2. Add hook tests (mock TanStack Query)
3. Add critical component tests (logger, onboarding)
4. Add integration tests (auth flow, offline sync)

---

*Testing analysis: 2026-01-14*
*Update when test patterns change*
