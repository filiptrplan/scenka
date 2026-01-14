# Codebase Concerns

**Analysis Date:** 2026-01-14

## Tech Debt

**Missing .env.example file:**
- Issue: No documented template for required environment variables
- Files: Root directory (.env.example is referenced in CLAUDE.md but may not exist)
- Why: Environment setup not clearly documented
- Impact: Difficult onboarding for new developers, potential configuration errors
- Fix approach: Create .env.example with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

**Inefficient offline sync:**
- Issue: Mutations processed sequentially instead of batching
- File: `src/lib/syncManager.ts`
- Why: Simple for loop implementation for queue processing
- Impact: Slower sync times when multiple mutations queued
- Fix approach: Implement batch sync with Promise.all() for non-dependent mutations

**Large component files:**
- Issue: Components with too many responsibilities
- Files: `src/App.tsx` (425 lines), `src/components/features/logger.tsx` (413 lines)
- Why: Organic growth during development
- Impact: Harder to maintain, test, and understand
- Fix approach: Extract smaller components, split concerns

## Known Bugs

**Unhandled async errors in auth:**
- Symptoms: getSession() errors silently ignored
- File: `src/lib/auth.tsx` (line 32)
- Trigger: Supabase auth session errors
- Workaround: None currently (errors swallowed)
- Root cause: void suppression without error handling
- Fix: Add try/catch around getSession() with proper error logging

**localStorage quota limits:**
- Symptoms: Offline queue failures in private browsing or quota exceeded
- File: `src/services/offlineQueue.ts`
- Trigger: Large offline queue or private browsing mode
- Workaround: None (fails silently)
- Root cause: No error handling for localStorage quota limits
- Fix: Wrap localStorage operations in try/catch, handle QuotaExceededError

**No error boundaries:**
- Symptoms: Component errors crash entire app
- Files: All components lack error boundaries
- Trigger: Any component throws an error
- Workaround: Page refresh (loses state)
- Root cause: No error boundary components implemented
- Fix: Add React error boundaries at route level

## Security Considerations

**No environment variable validation:**
- Risk: App crashes or misbehaves with missing env vars
- Files: `src/lib/supabase.ts` (uses env vars without validation)
- Current mitigation: None (assumes env vars are present)
- Recommendations: Add env var validation at startup, show clear error if missing

**localStorage for sensitive data:**
- Risk: Offline queue may contain sensitive climb data in plaintext
- File: `src/services/offlineQueue.ts`
- Current mitigation: None (localStorage is unencrypted)
- Recommendations: Consider encryption for sensitive data, document privacy implications

**Client-side only validation:**
- Risk: Malicious user could bypass Zod validation
- Files: All forms rely on client-side zod validation
- Current mitigation: Supabase RLS policies provide server-side protection
- Recommendations: Ensure RLS policies validate all data on server side

## Performance Bottlenecks

**Unpaginated queries:**
- Problem: getClimbs() fetches all climbs without pagination
- File: `src/services/climbs.ts`
- Measurement: Will degrade as dataset grows (no current baseline)
- Cause: Simple select without pagination logic
- Improvement path: Implement pagination with Supabase range queries, add infinite scroll

**Sequential offline sync:**
- Problem: Offline mutations processed one at a time
- File: `src/lib/syncManager.ts`
- Measurement: Sync time scales linearly with queue size
- Cause: for loop instead of batch processing
- Improvement path: Batch non-dependent mutations, use Promise.all()

**No query result caching:**
- Problem: Some queries may fetch duplicate data
- Files: Various components using useQuery
- Measurement: Not measured
- Cause: TanStack Query not configured with staleTime defaults
- Improvement path: Add appropriate staleTime settings to queries

## Fragile Areas

**Authentication context:**
- File: `src/lib/auth.tsx`
- Why fragile: Global state, hard to test, error handling missing
- Common failures: Silent auth failures, session refresh issues
- Safe modification: Add error boundaries around auth consumers, test auth flow
- Test coverage: No tests for auth context

**Offline sync logic:**
- File: `src/lib/syncManager.ts`
- Why fragile: Complex state management, event listeners, race conditions
- Common failures: Sync failures, duplicate mutations, lost data
- Safe modification: Add comprehensive tests, mock network conditions
- Test coverage: No tests for sync manager

**App.tsx routing:**
- File: `src/App.tsx`
- Why fragile: Large file with mixed concerns (routing, UI, auth)
- Common failures: Route changes break navigation layout
- Safe modification: Extract routes to separate file, create layout components
- Test coverage: No tests for routing

## Scaling Limits

**Supabase Free Tier:**
- Current capacity: 500MB database, 1GB file storage (if used)
- Limit: ~10,000 climbs estimated before hitting limits
- Symptoms at limit: 429 rate limit errors, slow queries
- Scaling path: Upgrade to Supabase Pro, add caching, implement pagination

**Client-side only:**
- Current capacity: All data fetched to client
- Limit: Browser memory with large datasets
- Symptoms at limit: Slow render, memory crashes
- Scaling path: Implement pagination, virtual scrolling for lists

**No CDN:**
- Current capacity: Served from origin server
- Limit: Bandwidth constraints
- Symptoms at limit: Slow asset loading
- Scaling path: Deploy to Vercel/Netlify with automatic CDN

## Dependencies at Risk

**Vite 6.0.1:**
- Risk: Recent major version, potential breaking changes in ecosystem
- Impact: Build process could break with plugin updates
- Migration plan: Pin Vite version, test thoroughly before upgrading

**React Router 7.11.0:**
- Risk: Version 7 is relatively new, migrating from v6 patterns
- Impact: Routing breaking changes
- Migration plan: Document router patterns, test navigation flows

## Missing Critical Features

**Component error boundaries:**
- Problem: No error boundaries to prevent app crashes
- Current workaround: Page refresh on error
- Blocks: Graceful error handling, better UX
- Implementation complexity: Low (add React error boundaries)

**Service layer tests:**
- Problem: All CRUD operations untested
- Current workaround: Manual testing only
- Blocks: Confidence in data operations, refactoring
- Implementation complexity: Medium (mock Supabase, write tests)

**Pagination:**
- Problem: All climbs fetched at once
- Current workaround: Works for small datasets
- Blocks: Scaling to large datasets
- Implementation complexity: Medium (Supabase pagination, UI controls)

## Test Coverage Gaps

**Service layer:**
- What's not tested: All CRUD operations in services/
- Risk: Data operations could break silently
- Priority: High
- Difficulty to test: Medium (need to mock Supabase)

**Authentication:**
- What's not tested: Auth context, session management, protected routes
- Risk: Auth failures could lock users out
- Priority: High
- Difficulty to test: Medium (need to mock Supabase auth)

**Hooks:**
- What's not tested: All custom hooks (useClimbs, useProfile, useNetworkStatus)
- Risk: Data fetching logic could fail
- Priority: Medium
- Difficulty to test: Medium (need to test React hooks)

**Components:**
- What's not tested: All React components
- Risk: UI bugs could reach production
- Priority: Low (manual testing catches most issues)
- Difficulty to test: High (need React Testing Library setup)

---

*Concerns audit: 2026-01-14*
*Update as issues are fixed or new ones discovered*
