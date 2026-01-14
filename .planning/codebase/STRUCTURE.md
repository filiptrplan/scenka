# Codebase Structure

**Analysis Date:** 2026-01-14

## Directory Layout

```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui primitives (reusable)
│   └── features/      # Feature-specific components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and core logic
├── pages/             # Route components (minimal)
├── services/          # Data access layer
├── styles/            # Global styles
├── types/             # TypeScript definitions
├── main.tsx           # Application entry point
└── App.tsx            # Router and layout
```

## Directory Purposes

**components/ui/**
- Purpose: Reusable UI primitives from shadcn/ui
- Contains: Button, Input, Select, Card, Dialog, etc.
- Key files: button.tsx, input.tsx, select.tsx, card.tsx
- Subdirectories: None (flat structure)

**components/features/**
- Purpose: Feature-specific components with business logic
- Contains: logger.tsx, charts-page.tsx, settings-page.tsx, onboarding-wizard.tsx
- Key files: logger.tsx (main climb logging form)
- Subdirectories: None (flat structure)

**hooks/**
- Purpose: Custom React hooks for data operations and state
- Contains: useClimbs.ts, useProfile.ts, useNetworkStatus.ts
- Key files: useClimbs.ts (primary data hook)
- Subdirectories: None

**lib/**
- Purpose: Core utilities, business logic, and configuration
- Contains: supabase.ts, auth.tsx, validation.ts, grades.ts, utils.ts, syncManager.ts
- Key files:
  - supabase.ts - Supabase client configuration
  - auth.tsx - Authentication context provider
  - validation.ts - Zod schemas
  - grades.ts - Grade system constants and utilities
- Subdirectories: None

**services/**
- Purpose: Data access and CRUD operations
- Contains: climbs.ts, profiles.ts, offlineQueue.ts
- Key files:
  - climbs.ts - Climb CRUD operations
  - profiles.ts - User profile operations
  - offlineQueue.ts - Offline persistence layer
- Subdirectories: None

**types/**
- Purpose: TypeScript type definitions
- Contains: index.ts, supabase.ts
- Key files:
  - index.ts - Domain types (Climb, GradeScale, Discipline, etc.)
  - supabase.ts - Generated Supabase types
- Subdirectories: None

**pages/**
- Purpose: Route components (minimal usage)
- Contains: Page-level components (mostly in features/)
- Subdirectories: None

## Key File Locations

**Entry Points:**
- `src/main.tsx` - Application initialization and provider setup
- `src/App.tsx` - React Router configuration and main layout

**Configuration:**
- `vite.config.ts` - Vite build configuration, PWA plugin
- `tsconfig.json` - TypeScript compiler options, path aliases
- `tailwind.config.js` - Tailwind CSS configuration
- `.prettierrc` - Code formatting rules
- `eslint.config.js` - Linting configuration
- `components.json` - shadcn/ui component configuration

**Core Logic:**
- `src/services/` - Data access layer (climbs, profiles, offline queue)
- `src/hooks/` - Custom React hooks (useClimbs, useProfile)
- `src/lib/auth.tsx` - Authentication context
- `src/lib/validation.ts` - Zod validation schemas
- `src/lib/grades.ts` - Grade system business logic

**Testing:**
- `src/lib/grades.test.ts` - Only test file currently (grade utilities)

**Documentation:**
- `CLAUDE.md` - Project guidelines and development commands
- `README.md` - User-facing documentation
- `.env.example` - Environment variable template

## Naming Conventions

**Files:**
- PascalCase.tsx for React components (logger.tsx, button.tsx)
- kebab-case.ts for utilities/services (climbs.ts, validation.ts)
- camelCase for hooks (useClimbs.ts, useProfile.ts)
- *.test.ts for test files (co-located with source)

**Directories:**
- kebab-case for all directories (components, features, services)
- Plural names for collections (components, hooks, types, services)

**Special Patterns:**
- index.ts for directory exports (`src/types/index.ts`)
- supabase.ts for Supabase client (`src/lib/supabase.ts`)
- *.config.* for configuration files

## Where to Add New Code

**New Feature:**
- Primary code: `src/components/features/{feature-name}.tsx`
- Hooks: `src/hooks/use{FeatureName}.ts`
- Tests: `src/components/features/{feature-name}.test.tsx`

**New Component/Module:**
- Implementation: `src/components/ui/{component-name}.tsx` for reusable UI
- Types: `src/types/index.ts` (add to central exports)
- Tests: Co-located `{component-name}.test.tsx`

**New Route/Command:**
- Definition: `src/App.tsx` (add route)
- Component: `src/components/features/{route-name}.tsx`
- Tests: `{route-name}.test.tsx`

**Utilities:**
- Shared helpers: `src/lib/utils.ts` or new file in `src/lib/`
- Type definitions: `src/types/index.ts`

**Services:**
- Data operations: `src/services/{service-name}.ts`

## Special Directories

**components/ui/**
- Purpose: shadcn/ui component library
- Source: Generated via shadcn CLI, then customized
- Committed: Yes (version controlled)

**public/**
- Purpose: Static assets served by Vite
- Source: Build artifacts, images, icons
- Committed: Yes (except large assets if added)

---

*Structure analysis: 2026-01-14*
*Update when directory structure changes*
