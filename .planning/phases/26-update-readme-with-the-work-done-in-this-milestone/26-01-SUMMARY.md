---
phase: 26-update-readme-with-the-work-done-in-this-milestone
plan: 01
subsystem: documentation
tags: README, AI Coach, documentation, upgrade, technical-details
duration: 3 minutes
completed: 2026-01-19

tech-stack:
  added: []
  patterns:
    - Feature documentation with subsections
    - Setup instructions with code blocks
    - Technical documentation with migration references
    - Privacy safeguards documentation

key-files:
  created: []
  modified:
    - path: README.md
      changes: Added AI Coach section, v1.1 to v2.0 Upgrade section, and AI Coach Technical Details section

requires:
  - Phase 18: AI Coach Foundation (database tables, services)
  - Phase 19: Coach Page + Recommendations UI
  - Phase 20: LLM Integration
  - Phase 21: Chat Interface
  - Phase 22: OpenRouter Model Configuration
  - Phase 23: Refocus Coach on Technique
  - Phase 24: Projecting Focus Recommendations
  - Phase 25: User Climbing Context for Prompts

provides:
  - Complete AI Coach documentation in README
  - Setup instructions for OpenRouter and Edge Functions
  - Privacy safeguards explanation
  - v1.1 to v2.0 upgrade path
  - Technical details for developers

affects:
  - None (documentation-only plan)

decisions:
  - Added TODO comments for screenshot capture (deferred to avoid broken image links)
  - Used code blocks for bash commands (supabase secrets set, supabase functions deploy)
  - Placed AI Coach section after "What Makes Scenka Different" and before "Tech Stack"
  - Placed Upgrade section after Development Notes
  - Placed Technical Details section at end before "Built with love"
  - Included all migration file references for developer access
  - Listed 4 tables including profiles.climbing_context in schema section
  - Described 5-step privacy architecture data flow

deviations:
  auto-fixed-issues: []

authentication-gates: []

migration-required: false

next-phase-readiness:
  blockers: []
  concerns:
    - Screenshots need to be captured from running app (TODO comments added)
    - Users must follow setup instructions before AI Coach features work
    - Migration files referenced must exist in supabase/migrations/
---

# Phase 26 Plan 01: README Update Summary

## One-liner
Comprehensive README documentation for v2.0 AI Coach features including setup instructions, privacy safeguards, upgrade path, and technical architecture details.

## Objective
Update README.md with comprehensive documentation of AI Coach features added in v2.0 (phases 18-25) so users understand capabilities, setup requirements, privacy safeguards, and how to use them.

## What Was Built

### Task 1: Add AI Coach section to README.md

Added comprehensive AI Coach section (65 new lines) including:

- **Features list**: 6 bullet points covering Weekly Focus, Training Drills, Pattern Analysis, Chat Interface, Projecting Focus, and Climbing Context
- **Privacy Safeguards subsection**: 5 privacy guarantees explaining data anonymization, RLS policies, PII filtering, and secure Edge Functions
- **Setup Instructions subsection**: 4-step guide with code blocks for OpenRouter API key, Edge Functions deployment, and database migrations
- **Usage subsection**: 6-step user guide from logging climbs to generating recommendations and using chat
- **Screenshot placeholders**: Two TODO comments with descriptive captions for coach page and chat interface (deferred capture to avoid broken image links)

Placement: After "What Makes Scenka Different" section, before "Tech Stack" section.

### Task 2: Add v1.1 to v2.0 Upgrade section and Technical Details

Added two new sections (66 new lines):

- **v1.1 to v2.0 Upgrade subsection**: 3-step migration guide for existing users
  1. Apply database migrations with `npx supabase db push`
  2. Set up OpenRouter API key and model via `supabase secrets set`
  3. Deploy Edge Functions with `supabase functions deploy`
  - Emphasizes that existing climb data is analyzed automatically

- **AI Coach Technical Details section**: Complete technical documentation
  - **Database Schema**: Lists 4 tables (coach_recommendations, coach_messages, coach_api_usage, profiles.climbing_context) with JSONB flexibility and RLS policies
  - **Edge Functions**: Describes openrouter-coach and openrouter-chat functions with JWT validation, anonymization, and response validation
  - **Rate Limiting**: Explains 50k tokens/day limit (~15-20 recommendations or 50-100 chat messages) with real-time enforcement
  - **Privacy Architecture**: 5-step data flow diagram from client fetch to Supabase storage
  - **Migration file references**: Links to 3 migration files for full schema access

Placement: Upgrade section after Development Notes (Awkwardness Scale subsection), Technical Details section after Upgrade section, both before Project Status.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during this documentation-only plan.

## Verification

### Task 1 Verification
- [x] README.md contains "## AI Coach (New in v2.0)" heading
- [x] Features list with 6 bullet points
- [x] "### Privacy Safeguards" subsection with 5 privacy guarantees
- [x] "### Setup Instructions" subsection with code blocks for secrets, deployment, and migrations
- [x] "### Usage" subsection with 6 steps
- [x] Two screenshot TODO comments with descriptive captions

### Task 2 Verification
- [x] "### v1.1 to v2.0 Upgrade" heading with 3 steps
- [x] "## AI Coach Technical Details" heading
- [x] "### Database Schema" subsection listing 4 tables
- [x] "### Edge Functions" subsection describing openrouter-coach and openrouter-chat
- [x] "### Rate Limiting" subsection explaining 50k tokens/day limit
- [x] "### Privacy Architecture" subsection with 5-step data flow
- [x] Migration file references

### Overall Verification
- [x] README.md includes new "AI Coach" section after "What Makes Scenka Different"
- [x] README.md includes v1.1 to v2.0 Upgrade section with clear migration steps
- [x] README.md includes AI Coach Technical Details section
- [x] All code blocks use proper bash syntax highlighting
- [x] Screenshot TODO comments include descriptive captions
- [x] Privacy safeguards clearly explained
- [x] Setup instructions include all required commands from STATE.md blockers (OPENROUTER_API_KEY, OPENROUTER_MODEL, Edge Functions deployment, migrations)
- [x] Migration file references are correct
- [x] No "NEW in v2.0" badges needed (already handled by section placement)
- [x] README markdown structure is valid

## Success Criteria

- [x] README.md comprehensively documents AI Coach features
- [x] Users can set up AI Coach by following README instructions
- [x] Users understand privacy safeguards before using features
- [x] Existing users can upgrade from v1.1 to v2.0
- [x] Technical details available for developers
- [x] Screenshots documented with TODO comments (actual capture deferred)

## Key Links Established

1. **AI Coach Setup section** → STATE.md blockers
   - Via: Edge Function deployment (`supabase functions deploy`) and env var commands (`supabase secrets set`)
   - Pattern: All STATE.md blocker commands included in setup instructions

2. **AI Coach Technical Details** → supabase/migrations/
   - Via: Database schema reference section with migration file paths
   - Pattern: Links to 3 migration files (create_coach_tables.sql, add_coach_api_usage_insert_policy.sql, add_climbing_context_to_profiles.sql)

## Commits

- `d29187b` - docs(26-01): add AI Coach section to README
  - Added comprehensive AI Coach section with feature overview
  - Included Privacy Safeguards subsection (5 privacy guarantees)
  - Added Setup Instructions with code blocks for OpenRouter, Edge Functions, and migrations
  - Added Usage subsection with 6-step guide
  - Added two screenshot TODO comments with descriptive captions

- `d0b4e48` - docs(26-01): add v1.1 to v2.0 Upgrade and Technical Details sections
  - Added v1.1 to v2.0 Upgrade section with 3-step migration guide
  - Added AI Coach Technical Details section with database schema overview
  - Added Edge Functions subsection describing openrouter-coach and openrouter-chat
  - Added Rate Limiting subsection explaining 50k tokens/day limit
  - Added Privacy Architecture subsection with 5-step data flow
  - Added migration file references for full schema details

## Performance

- **Duration**: 3 minutes
- **Commits**: 2 (atomic per task)
- **Deviations**: 0
- **Authentication gates**: 0

## Next Steps

- Capture actual screenshots from running app to replace TODO comments (optional, not blocking)
- Consider v2.0 release with updated README documentation
- Phase 26 complete - v2.0 milestone documentation complete
