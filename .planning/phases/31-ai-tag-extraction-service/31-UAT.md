---
status: testing
phase: 31-ai-tag-extraction-service
source: 31-01-SUMMARY.md, 31-02-SUMMARY.md, 31-03-SUMMARY.md, 31-04-SUMMARY.md, 31-05-SUMMARY.md, 31-06-SUMMARY.md, 31-07-SUMMARY.md
started: 2026-01-21T15:00:00Z
updated: 2026-01-21T15:10:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 3
name: Quota Indicator Shows in Logger Form
expected: |
  Navigate to simplified logger. Below the submit button, see "Tags extracted today: X/50" text showing current quota count. If you've saved climbs today, the number should reflect that count.
awaiting: user response

## Tests

### 1. Climbing with Notes Triggers Tag Extraction
expected: Navigate to simplified logger, fill in grade, outcome, terrain type, awkwardness, and add notes (e.g., "Pumped on a crimp, bad footwork"). Submit the climb. "Climb logged successfully" toast should appear immediately, with no waiting for extraction to complete.
result: pass

### 2. Tags Saved to Database After Extraction
expected: After saving a climb with notes, wait 3-5 seconds, then check the database or climb detail view. The climb.style_tags array should be populated (e.g., ["Crimp", "Overhang"]) and climb.failure_reasons array should be populated (e.g., ["Pumped", "Bad Feet"]).
result: issue
reported: "The tags aren't saved to the DB."
severity: major

### 3. Quota Indicator Shows in Logger Form
expected: Navigate to simplified logger. Below the submit button, see "Tags extracted today: X/50" text showing current quota count. If you've saved climbs today, the number should reflect that count.
result: pending

### 4. Quota Exceeded Toast Appears
expected: Set your tag_count to 50 in the user_limits table (or extract tags 50 times). Save another climb with notes. After "Climb logged successfully" toast, a warning toast should appear saying "Daily quota reached - tags extracted tomorrow" with time until reset.
result: pending

### 5. API Error Toast Appears
expected: Temporarily disable or change the OPENROUTER_API_KEY in Supabase to cause an API error. Save a climb with notes. After "Climb logged successfully", an error toast should appear saying "Tag extraction failed. You can add tags manually." Climb should still be saved in the database.
result: pending

### 6. Network Error Toast Appears
expected: Disconnect your network or disable network in browser DevTools. Save a climb with notes. After "Climb logged successfully", an error toast should appear saying "Tag extraction failed due to network. Check your connection." Climb should still be saved in the database.
result: pending

### 7. Extraction Failure Doesn't Block Climb Save
expected: Cause tag extraction to fail (API error, network error, or quota exceeded). Verify that the climb is saved in the database and appears in your climbs list regardless of extraction failure.
result: pending

## Summary

total: 7
passed: 1
issues: 1
pending: 5
skipped: 0

## Gaps

- truth: "After saving a climb with notes, climb.style_tags array should be populated (e.g., ['Crimp', 'Overhang']) and climb.failure_reasons array should be populated (e.g., ['Pumped', 'Bad Feet'])."
  status: failed
  reason: "User reported: The tags aren't saved to the DB."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
