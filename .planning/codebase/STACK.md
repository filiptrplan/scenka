# Technology Stack

**Analysis Date:** 2026-01-14

## Languages

**Primary:**
- TypeScript 5.6.2 - All application code with strict mode

**Secondary:**
- JavaScript - Build configuration files

## Runtime

**Environment:**
- Node.js (ES2020 target) - Build and development
- Modern browsers - Client-side React application

**Package Manager:**
- pnpm - Lockfile: pnpm-lock.yaml present

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- Vite 6.0.1 - Build tool and dev server
- React Router DOM 7.11.0 - Client-side routing

**Testing:**
- Vitest - Test runner (integrated with Vite)

**Build/Dev:**
- TypeScript 5.6.2 - Type checking and compilation
- PostCSS - CSS processing
- Vite PWA Plugin 0.21.1 - Progressive Web App support

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.89.0 - Database and authentication client
- @tanstack/react-query 5.90.16 - Server state management and caching
- react-hook-form 7.70.0 - Form state management
- zod 4.3.5 - Schema validation

**Infrastructure:**
- Tailwind CSS 3.4.19 - Utility-first CSS framework
- shadcn/ui - Reusable UI component primitives
- lucide-react 0.562.0 - Icon library
- recharts 3.6.0 - Data visualization
- sonner 2.0.7 - Toast notifications
- date-fns 4.1.0 - Date utilities

## Configuration

**Environment:**
- .env files - Supabase connection configuration
- .env.example present - Environment variable template

**Build:**
- vite.config.ts - Vite build configuration with PWA plugin
- tsconfig.json - TypeScript compiler options with strict mode
- tailwind.config.js - Tailwind CSS configuration
- postcss.config.js - PostCSS processing setup

## Platform Requirements

**Development:**
- Node.js 20+ (LTS recommended)
- pnpm package manager
- Any modern OS (macOS/Linux/Windows)

**Production:**
- PWA deployment - Static hosting or any web server
- Supabase project for backend services
- Browser support: Modern browsers with ES2020 support

---

*Stack analysis: 2026-01-14*
*Update after major dependency changes*
