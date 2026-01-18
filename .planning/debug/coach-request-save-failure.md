---
status: verifying
trigger: "Coach request returns data successfully but fails to save to database due to PGRST116 error"
created: 2026-01-18T00:00:00Z
updated: 2026-01-18T00:00:00Z
---

## Current Focus
hypothesis: Fix is complete. Need to verify by deploying Edge Function and testing.
test: Deploy Edge Function and test "Generate Recommendations" button
expecting: Data is saved to coach_recommendations table and UI displays recommendations
next_action: Deploy Edge Function to Supabase and test the fix

## Symptoms
expected: Both display coaching feedback in UI and save coaching data to database
actual: Request returns data but nothing is saved to DB, and error PGRST116 is thrown
errors: {"code":"PGRST116","details":"The result contains 0 rows","hint":null,"message":"Cannot coerce the result to a single JSON object"}
reproduction: Click "Generate Recommendations" button to trigger coaching request
timeline: First time testing - never worked before

## Eliminated

## Evidence

- timestamp: 2026-01-18T00:00:00Z
  checked: src/services/coach.ts line 43-64 (getLatestRecommendations function)
  found: Uses .single() on SELECT query. Returns null if PGRST116 error (no rows).
  implication: This is where PGRST116 is being caught, not where it originates.

- timestamp: 2026-01-18T00:00:00Z
  checked: supabase/functions/openrouter-coach/index.ts lines 16-21 (Supabase client initialization)
  found: const supabase = createClient(supabaseUrl, supabaseKey) where supabaseKey = SUPABASE_ANON_KEY
  implication: Edge Function uses anon key but never sets user session/JWT after validating it.

- timestamp: 2026-01-18T00:00:00Z
  checked: supabase/functions/openrouter-coach/index.ts lines 316-327 (JWT validation)
  found: Validates JWT with supabase.auth.getUser(token) and stores userId
  implication: JWT is validated but never passed to the Supabase client for subsequent operations.

- timestamp: 2026-01-18T00:00:00Z
  checked: supabase/functions/openrouter-coach/index.ts lines 392-399 (INSERT operation)
  found: const { error: insertError } = await supabase.from('coach_recommendations').insert({...})
  implication: INSERT uses client with anon key, no JWT set, so RLS policy auth.uid() = user_id fails (auth.uid() is NULL).

- timestamp: 2026-01-18T00:00:00Z
  checked: supabase/migrations/20260117_create_coach_tables.sql lines 20-22 (RLS INSERT policy)
  found: CREATE POLICY "Users can insert own recommendations" ... WITH CHECK (auth.uid() = user_id)
  implication: RLS policy requires authenticated user, but Edge Function's supabase client has no auth context.

- timestamp: 2026-01-18T00:00:00Z
  checked: src/hooks/useCoach.ts lines 58-74 (useGenerateRecommendations hook)
  found: onSuccess calls queryClient.invalidateQueries() which triggers getLatestRecommendations()
  implication: After mutation "succeeds", UI queries for recommendations but finds no rows (INSERT failed silently), so PGRST116 is thrown.

## Resolution
root_cause: Edge Function validated the JWT token from the Authorization header but never set it on the Supabase client using setSession(). When INSERT operations were performed, the RLS policy "Users can insert own recommendations" checked auth.uid() = user_id, but auth.uid() was NULL because the session wasn't set. The INSERT failed silently (error was logged but not propagated), so no rows were saved. When the client called getLatestRecommendations() using .single(), it received 0 rows and threw PGRST116 error.
fix: Added supabase.auth.setSession() call after JWT validation in the Edge Function. This ensures all subsequent database operations have the proper authentication context, satisfying RLS policies.
verification: User needs to deploy Edge Function and test the "Generate Recommendations" button. Steps:
1. Run: npx supabase login (or set SUPABASE_ACCESS_TOKEN)
2. Run: npx supabase functions deploy openrouter-coach --project-ref spnvpzvuxxfwgdasttub
3. Test: Click "Generate Recommendations" button in coach page
4. Verify: Check coach_recommendations table for new row and confirm UI displays recommendations
files_changed:
- supabase/functions/openrouter-coach/index.ts: Added setSession() call after JWT validation (lines 329-341)
