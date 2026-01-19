---
status: resolved
trigger: "supabase-insert-catch-not-function"
created: 2026-01-19T00:00:00Z
updated: 2026-01-19T00:00:00Z
---

## Current Focus
hypothesis: RESOLVED - Fixed incorrect Supabase API usage in edge functions
test: Verified no .insert().catch() patterns remain in codebase
expecting: Chat saves to database successfully after LLM completes (edge functions need redeployment)
next_action: Archive debug session and inform user to redeploy edge functions

## Symptoms
expected: Chat saves to database after LLM completes
actual: Error "supabase.from(...).insert(...).catch is not a function" appears
errors: supabase.from(...).insert(...).catch is not a function
reproduction: Open chat page, send a message, wait for LLM response
started: Never worked

## Eliminated

## Evidence
- timestamp: 2026-01-19T00:00:00Z
  checked: supabase/functions/openrouter-chat/index.ts lines 251-258
  found: await supabase.from('coach_messages').insert({...}).catch((err) => {...})
  implication: Supabase JS client v2 does not return a Promise from .insert(), so .catch() doesn't exist. The correct pattern is await the response and check for error in { error } object.

- timestamp: 2026-01-19T00:00:00Z
  checked: supabase/functions/openrouter-chat/index.ts lines 262-274
  found: await supabase.from('coach_api_usage').insert({...}).catch((err) => {...})
  implication: Same incorrect pattern used twice in the same file.

## Resolution
root_cause: Supabase edge function uses incorrect API pattern. Supabase JS client v2 returns a response object (not a Promise) from .insert(), so .catch() is not a valid method. The correct pattern is to await the response and check the error property.
fix: Replace all .insert().catch() patterns with await + error checking. Fixed 2 instances in openrouter-chat/index.ts and 3 instances in openrouter-coach/index.ts.
verification: No .insert().catch() patterns remain in codebase (grep shows only debug file references). Fix uses correct Supabase v2 API pattern: `const { error } = await supabase.from(...).insert(...)`
files_changed: ['supabase/functions/openrouter-chat/index.ts', 'supabase/functions/openrouter-coach/index.ts']
