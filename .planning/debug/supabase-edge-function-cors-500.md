---
status: resolved
trigger: "supabase-edge-function-cors-500"
created: 2026-01-18T00:00:00.000Z
updated: 2026-01-18T00:20:00.000Z
---

## Current Focus
hypothesis: RLS policy violation on coach_api_usage table is causing 500 errors - INSERT policy is missing
test: Check coach_api_usage RLS policies in migration file
expecting: Will find INSERT policy is missing, only SELECT policy exists
next_action: Complete - fixes applied, user needs to deploy

## Symptoms
expected: Clicking coach button should successfully call openrouter-coach Edge Function and return recommendations
actual: OPTIONS request to https://spnvpzvuxxfwgdasttub.supabase.co/functions/v1/openrouter-coach returns HTTP 500 (CORS Preflight Did Not Succeed), blocking the request. Also seeing RLS policy violation on coach_api_usage table.
errors:
- "CORS preflight response did not succeed. Status code: 500"
- "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource"
- "new row violates row-level security policy for table 'coach_api_usage'" (code: "42501")
- "Failed to generate recommendations: Failed to send a request to the Edge Function"
reproduction: Click coach button in the app, triggers OPTIONS preflight which fails with 500
timeline: Never worked - this is a newly created Edge Function

## Eliminated

## Evidence
- timestamp: 2026-01-18T00:05:00.000Z
  checked: /workspace/supabase/functions/openrouter-coach/index.ts
  found: CORS handling exists (lines 345-353) with proper headers. Edge Function is not causing the 500 on OPTIONS request itself - it's likely a subsequent 500 on POST that's being reported incorrectly.
  implication: CORS is likely not the root cause - the RLS policy violation is

- timestamp: 2026-01-18T00:05:00.000Z
  checked: /workspace/supabase/migrations/20260117_create_coach_tables.sql
  found: coach_api_usage table RLS policies only include SELECT (lines 85-87), but Edge Function attempts INSERTs at lines 460-473, 507-521, 531-543, 545-559
  implication: Missing INSERT policy on coach_api_usage table is causing the 42501 RLS violation error

## Resolution
root_cause: Missing INSERT RLS policy on coach_api_usage table. The table only has a SELECT policy, but the Edge Function inserts usage tracking data at multiple points (successful calls, fallback with cached data, and error cases). This causes PostgreSQL error 42501 "new row violates row-level security policy".
fix:
1. Added INSERT policy to coach_api_usage table in migration 20260118_add_coach_api_usage_insert_policy.sql
2. Created shared corsHeaders module at /workspace/supabase/functions/_shared/cors.ts
3. Updated openrouter-coach Edge Function to use shared corsHeaders module and ensure all responses include CORS headers
verification: Fixes applied locally. User needs to:
   - Run `npx supabase db push` to apply the migration
   - Redeploy the Edge Function via Supabase dashboard or CLI
   - Test by clicking coach button in the app
files_changed:
- /workspace/supabase/migrations/20260118_add_coach_api_usage_insert_policy.sql
- /workspace/supabase/functions/_shared/cors.ts
- /workspace/supabase/functions/openrouter-coach/index.ts
