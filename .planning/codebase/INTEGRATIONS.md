# External Integrations

**Analysis Date:** 2026-01-14

## APIs & External Services

**Payment Processing:**
- Not detected - No payment processing currently

**Email/SMS:**
- Not detected - No email or SMS services

**External APIs:**
- None detected - Application uses only Supabase as external service

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store
  - Connection: via DATABASE_URL and SUPABASE_URL env vars
  - Client: @supabase/supabase-js 2.89.0
  - Tables: climbs, profiles (inferred from `src/types/supabase.ts`)
  - Migrations: Managed via Supabase dashboard or CLI
  - Row Level Security (RLS): Enabled

**File Storage:**
- Not detected - No file storage integration (user uploads not implemented)

**Caching:**
- TanStack Query cache - Client-side query caching
  - Location: In-memory
  - Duration: Configurable per query
  - Offline support: Yes, via service worker

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password authentication
  - Implementation: Supabase client SDK
  - Token storage: Supabase handles session management
  - Session management: JWT-based, managed by Supabase
  - Location: `src/lib/auth.tsx`

**OAuth Integrations:**
- Not detected - Only email/password authentication configured

## Monitoring & Observability

**Error Tracking:**
- Not detected - No error tracking service (Sentry, etc.)

**Analytics:**
- Not detected - No analytics service (Google Analytics, Mixpanel, etc.)

**Logs:**
- Console-based logging - stdout/stderr only
  - Development: Console statements for debugging
  - Production: Browser console only (no server-side logging)

## CI/CD & Deployment

**Hosting:**
- Not specified - Can be deployed to any static hosting (Vercel, Netlify, etc.)
  - Deployment: Manual or CI/CD (not configured in codebase)
  - Environment vars: Via .env files

**CI Pipeline:**
- Not detected - No GitHub Actions or CI configuration found

## Environment Configuration

**Development:**
- Required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Secrets location: .env file (gitignored), .env.example for reference
- Mock/stub services: Supabase local development project

**Staging:**
- Not configured - Single environment approach

**Production:**
- Secrets management: Environment variables at deployment
- Failover/redundancy: Handled by Supabase infrastructure

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints

**Outgoing:**
- None detected - No outgoing webhooks

## Service Worker & Offline Support

**PWA Features:**
- Service Worker - Offline caching and runtime
  - Implementation: Vite PWA plugin in `vite.config.ts`
  - Strategy: Runtime caching for API calls (24h), static assets (30d)
  - Offline queue: `src/services/offlineQueue.ts`
  - Sync manager: `src/lib/syncManager.ts`

---

*Integration audit: 2026-01-14*
*Update when adding/removing external services*
