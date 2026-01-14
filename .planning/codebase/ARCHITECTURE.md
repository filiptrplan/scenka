# Architecture

**Analysis Date:** 2026-01-14

## Pattern Overview

**Overall:** Client-Side SPA with Backend-as-a-Service

**Key Characteristics:**
- Single-page React application with Vite build system
- Backend-as-a-Service model using Supabase
- Offline-first Progressive Web App (PWA)
- Component-based architecture with shadcn/ui
- TanStack Query for server state management

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction
- Contains: React components, form handlers, event handlers
- Location: `src/components/ui/`, `src/components/features/`
- Depends on: TanStack Query hooks for data, custom hooks for business logic
- Used by: React Router for navigation

**Service Layer:**
- Purpose: Data access and CRUD operations
- Contains: Database operations, offline queue management
- Location: `src/services/climbs.ts`, `src/services/profiles.ts`, `src/services/offlineQueue.ts`
- Depends on: Supabase client, localStorage
- Used by: Custom hooks (`src/hooks/`)

**Data Layer:**
- Purpose: Type definitions and data validation
- Contains: TypeScript types, Zod schemas, Supabase client
- Location: `src/types/`, `src/lib/supabase.ts`, `src/lib/validation.ts`
- Depends on: Supabase generated types
- Used by: All layers for type safety

**Application Logic Layer:**
- Purpose: Business logic and state orchestration
- Contains: Custom hooks, authentication context, utility functions
- Location: `src/hooks/`, `src/lib/auth.tsx`, `src/lib/*.ts`
- Depends on: Service layer, data layer
- Used by: Presentation layer components

## Data Flow

**User Action Flow:**

1. User interacts with component (form submit, button click)
2. Component event handler calls custom hook method (e.g., `useCreateClimb()`)
3. Hook mutation function calls service layer (e.g., `createClimb()`)
4. Service layer executes Supabase query or queues for offline
5. TanStack Query cache invalidated/updated
6. Component re-renders with new data

**Offline Flow:**

1. User action when offline → Service detects no network
2. Mutation queued in `offlineQueue.ts` (localStorage)
3. Service worker caches API responses
4. On reconnect → `syncManager.ts` processes queued mutations
5. TanStack Query refetches fresh data

**State Management:**
- Server state: TanStack Query (caching, invalidation, optimistic updates)
- Client state: React useState for local component state
- Form state: react-hook-form with Zod validation
- Auth state: React Context (`src/lib/auth.tsx`)

## Key Abstractions

**Custom Hook:**
- Purpose: Encapsulate data operations and mutations
- Examples: `src/hooks/useClimbs.ts`, `src/hooks/useProfile.ts`
- Pattern: TanStack Query hooks (`useQuery`, `useMutation`, `useQueryClient`)

**Service:**
- Purpose: Abstract Supabase operations and offline handling
- Examples: `src/services/climbs.ts`, `src/services/profiles.ts`, `src/services/offlineQueue.ts`
- Pattern: Async functions returning typed data

**Component:**
- Purpose: Reusable UI with clear props interface
- Examples: `src/components/features/logger.tsx`, `src/components/ui/button.tsx`
- Pattern: Functional components with hooks, TypeScript props

**Zod Schema:**
- Purpose: Runtime validation and type inference
- Examples: `src/lib/validation.ts`
- Pattern: z.object() definitions for form validation

## Entry Points

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Application load
- Responsibilities: React initialization, StrictMode, provider setup (QueryClient, AuthProvider)

**Route Entry:**
- Location: `src/App.tsx`
- Triggers: React Router navigation
- Responsibilities: Route definitions, layout structure, navigation rendering

**Type Entry:**
- Location: `src/types/index.ts`
- Purpose: Central export point for domain types
- Contains: All core TypeScript interfaces and types

## Error Handling

**Strategy:** Try/catch at service layer, error propagation to UI

**Patterns:**
- Service functions throw errors on failure
- TanStack Query mutations capture errors in `error` property
- Components display error messages from mutation state
- Zod validation catches form errors before submission
- Console statements for development debugging

## Cross-Cutting Concerns

**Logging:**
- Console-based logging (console.log, console.error)
- No structured logging framework
- Debug statements in `src/lib/syncManager.ts`, `src/lib/auth.tsx`, `src/lib/supabase.ts`

**Validation:**
- Zod schemas at component layer (form validation)
- TypeScript strict mode for compile-time validation
- Supabase RLS for server-side authorization

**Authentication:**
- Supabase Auth with React Context
- Protected routes via conditional rendering
- Session management via `src/lib/auth.tsx`

**Offline Support:**
- Service worker for runtime caching (Vite PWA plugin)
- Offline queue for mutations (`src/services/offlineQueue.ts`)
- Sync manager for reconciliation (`src/lib/syncManager.ts`)
- Network status detection (`src/hooks/useNetworkStatus.ts`)

---

*Architecture analysis: 2026-01-14*
*Update when major patterns change*
