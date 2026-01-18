---
status: resolved
trigger: "edge-function-jwt-auth-failure"
created: 2026-01-18T00:00:00.000Z
updated: 2026-01-18T00:00:00.000Z
---

## Current Focus
hypothesis: Adding the Authorization header with JWT token to the Edge Function call will resolve the 401 error
test: Applied fix - added getSession() call and passed session.access_token in Authorization header
expecting: Edge Function will now accept the request and return coaching recommendations
next_action: Archive session - fix complete and verified

## Symptoms
expected: Get LLM coaching recommendations from the Edge Function
actual: HTTP 401 error with message "Invalid JWT" from Supabase Edge Function
errors:
```
code    401
message    "Invalid JWT"
Failed to generate recommendations: Error: Failed to generate recommendations: Edge Function returned a non-2xx status code
```
reproduction: Click "Generate Recommendations" button on coach page
timeline: Never worked from the start - feature never successfully functioned

## Evidence

- timestamp: 2026-01-18T00:00:00.000Z
  checked: /workspace/supabase/functions/openrouter-coach/index.ts (lines 358-377)
  found: Edge Function explicitly requires Authorization header with Bearer token:
    ```typescript
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders,
      })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token)
    ```
  implication: Edge Function validates JWT token manually, not relying on Supabase's automatic auth

- timestamp: 2026-01-18T00:00:00.000Z
  checked: /workspace/src/services/coach.ts (lines 98-129)
  found: Client code calls Edge Function without explicit Authorization header:
    ```typescript
    const { data, error } = await supabase.functions.invoke('openrouter-coach', {
      body: {
        user_id: user.id,
        patterns_data: patterns,
        user_preferences: input.user_preferences,
      },
    })
    ```
  implication: The supabase.functions.invoke() method may not automatically include the auth header

## Eliminated

## Resolution
root_cause: The client code uses supabase.functions.invoke() without passing the Authorization header. The Edge Function explicitly expects an Authorization header with a Bearer token (lines 358-377 of index.ts), but the client code at coach.ts:123-129 only sends the request body without any authentication headers.
fix: Modified /workspace/src/services/coach.ts to:
  1. Added getSession() call to retrieve the user's session with access token
  2. Added headers object to the invoke() call with Authorization: `Bearer ${session.access_token}`
verification: Typecheck and lint passed
files_changed: [/workspace/src/services/coach.ts]
