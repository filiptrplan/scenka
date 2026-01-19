# Phase 26: Update README with Milestone Work - Research

**Researched:** 2026-01-19
**Domain:** Technical documentation, README writing, feature documentation
**Confidence:** MEDIUM

## Summary

Phase 26 requires documenting the AI Coach features added in v2.0 to the project README. This includes explaining the weekly recommendations system, pattern analysis dashboard, chat interface, projecting focus, climbing context configuration, Edge Functions setup, database schema, privacy safeguards, and usage examples.

The current README (142 lines) documents the core climb logging functionality (v1.0/v1.1) but lacks any mention of AI Coach features (v2.0). Research reveals that modern README best practices emphasize clear structure, practical setup instructions, screenshots with alt text, and code examples. Screenshots should be captured from the running app for documentation purposes.

**Primary recommendation:** Add a dedicated "AI Coach" section after "What Makes Scenka Different" with subsections for features, setup, privacy, and usage.

## Standard Stack

No new libraries required for documentation phase. The research focuses on documentation best practices and file organization.

### Documentation Tools
| Tool | Purpose | When to Use |
|-------|---------|-------------|
| Markdown (.md) | Standard README format | All documentation |
| Screenshots (PNG/JPEG) | Visual feature demonstration | Capturing UI states |
| Code blocks | Setup/installation examples | Commands and configuration |
| Tables | Comparison and data presentation | Feature lists, config options |

### Screenshot Capture
| Tool | Platform | Why Standard |
|-------|----------|--------------|
| Browser DevTools | Desktop screenshots | Built-in, reliable |
| Mobile device simulator | Mobile screenshots | Matches PWA UX |
| [Best practice](https://www-res.cablelabs.com/wp-content/uploads/2025/05/27165537/Best-Practices-and-Guidelines-for-Writing-Machine-Readable-Documents-v7.pdf) | Use PNG or JPEG | Supports VLM-generated alt text, VLM processing |

**Installation:** None required - using built-in tools

## Architecture Patterns

### Recommended README Structure
```
# Scenka

![Logo]

## What Makes Scenka Different
- [Existing core features from v1.0/v1.1]

## AI Coach (NEW SECTION)
- [Feature overview]
- [Privacy guarantees]
- [Setup instructions]
- [Usage examples]

## Tech Stack
[Existing stack...]

## Quick Start
[Existing quick start...]

## Screenshots
[Existing screenshots + NEW coach screenshots]

## Development Notes
[Existing notes...]

## AI Coach Technical Details (NEW SECTION)
- [Database schema]
- [Edge Functions]
- [Privacy safeguards]
- [Rate limiting]
```

### Pattern 1: Feature Documentation Section
**What:** Clear section describing AI Coach features with benefit-focused language
**When to use:** Adding major new functionality to README
**Example:**
```markdown
## AI Coach

Scenka includes an AI-powered climbing coach that analyzes your logged data to provide personalized training recommendations and answer questions about technique.

**Features:**
- Weekly Focus: Personalized 1-2 sentence focus based on your failure patterns
- Training Drills: 3 specific technique drills with sets, reps, and measurable outcomes
- Pattern Analysis: Visual breakdown of failure reasons, style weaknesses, and climbing frequency
- Chat Interface: Free-form Q&A with streaming responses and climbing-specific domain knowledge
- Projecting Focus: Suggestions for what to climb each week based on weaknesses
- Climbing Context: Customizable context (like ChatGPT custom instructions) for personalized coaching
```

### Pattern 2: Setup Instructions with Code Blocks
**What:** Step-by-step environment setup with executable commands
**When to use:** Documenting any prerequisite configuration
**Example:**
```markdown
### Edge Functions Setup

The AI Coach requires Supabase Edge Functions to handle LLM requests securely.

1. Set OpenRouter API key in Supabase Dashboard:
   - Navigate to Edge Functions > Secrets
   - Add `OPENROUTER_API_KEY` with your OpenRouter key

2. Set OpenRouter model environment variable:
   ```bash
   supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro
   ```

3. Deploy Edge Functions:
   ```bash
   supabase functions deploy openrouter-coach
   supabase functions deploy openrouter-chat
   ```

4. Apply database migrations:
   ```bash
   npx supabase db push
   ```
```

**Source:** [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions/secrets)

### Anti-Patterns to Avoid
- **Screenshot-only documentation:** Screenshots get out of date quickly. Always pair with text descriptions and alt text.
- **Verbose tech jargon:** Users should understand features without deep technical knowledge. Use "weekly training plan" not "LLM-generated recommendations with JSON response validation."
- **Missing upgrade path:** v2.0 users need to know about database migrations and Edge Function deployment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screenshot automation tools | Manual capture workflow | Browser DevTools + manual naming | Screenshots are static, automation overhead unnecessary for small project |
| External documentation generators | Manual README updates | Direct markdown editing | AI-generated READMEs lack context, manual updates ensure accuracy |
| Complex image galleries | Simple inline screenshots with captions | One screenshot per section with alt text | Reduces maintenance burden |

**Key insight:** The project is small (personal use). Keep documentation simple and manually updated. Focus on clarity over automation.

## Common Pitfalls

### Pitfall 1: Missing Migration Instructions
**What goes wrong:** Users upgrade to v2.0 but coach features don't work because database tables don't exist.
**Why it happens:** README mentions features but not the required `npx supabase db push` step.
**How to avoid:** Include explicit "v1.1 to v2.0 Upgrade" section with migration commands.
**Warning signs:** User can see Coach UI but "Generate Recommendations" fails with "table does not exist" error.

### Pitfall 2: Screenshot Directory Doesn't Exist
**What goes wrong:** README references `docs/screenshots/coach-page.png` but directory doesn't exist.
**Why it happens:** Screenshots were never captured from the running application.
**How to avoid:** Check directory exists before adding screenshot references. Add TODO comments for screenshots that need capture.
**Warning signs:** Broken image links in rendered README.

### Pitfall 3: Privacy Concerns Not Addressed
**What goes wrong:** Users hesitant to use AI features because data privacy implications unclear.
**Why it happens:** README focuses on features without explaining data anonymization and RLS policies.
**How to avoid:** Add dedicated "Privacy" subsection explaining what data is sent to LLMs, how it's anonymized, and what's stored.
**Warning signs:** GitHub issues asking "Does this send my climbing data to OpenAI?"

### Pitfall 4: Missing Environment Variable Documentation
**What goes wrong:** Edge Functions deployed but fail because `OPENROUTER_API_KEY` or `OPENROUTER_MODEL` not set.
**Why it happens:** README mentions Edge Functions but not the required secrets.
**How to avoid:** Document all required environment variables with setup commands.
**Warning signs:** 500 errors from Edge Functions, Supabase logs show "Missing required environment variable".

### Pitfall 5: V1.1 Users Left Behind
**What goes wrong:** Existing users upgrade but don't know about climbing_context field in profiles table.
**Why it happens:** Migration notes assume fresh installation, not upgrade path.
**How to avoid:** Clearly label steps that apply only to new users vs. upgrades.
**Warning signs:** "column climbing_context does not exist" error for existing profiles.

## Code Examples

### Setup: Environment Variables
```bash
# Set required OpenRouter secrets
supabase secrets set OPENROUTER_API_KEY=your_key_here
supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro

# Deploy Edge Functions
supabase functions deploy openrouter-coach
supabase functions deploy openrouter-chat

# Apply database migrations (adds coach tables)
npx supabase db push
```
**Source:** [Supabase Edge Functions Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)

### Usage: Generating Recommendations
```typescript
// User flow (documented as steps, not code)
1. Log at least 3-5 climbs with detailed tags and failure reasons
2. Navigate to Coach tab
3. Click "Generate Recommendations"
4. Wait for AI analysis (~10-15 seconds)
5. Review Weekly Focus, Training Drills, and Projecting Focus sections
6. Click "Ask Coach a Question" to chat about specific topics
```

### Privacy: Data Anonymization
```markdown
**Privacy Safeguards:**
- Data sent to LLMs is anonymized (gym names → "indoor_gym", crag names → "outdoor_crags")
- Profile data (email, name) never included in LLM requests
- Row Level Security ensures users can only access their own recommendations
- Recent climb notes are included but filtered for PII (>200 character threshold with runtime validation)
```
**Source:** [LLM Integration Best Practices - HackMD](https://hackmd.io/@tech1/llm-integraion)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Basic README with features only | Structured documentation with setup, screenshots, technical details | 2025 | Better user onboarding, faster setup time |
| Manual installation documentation | Step-by-step code blocks with commands | Ongoing | Reduces configuration errors |
| No upgrade path documentation | Explicit v1.1 → v2.0 upgrade section | v2.0 release | Existing users can upgrade smoothly |

**Deprecated/outdated:**
- **Screenshot-heavy READMEs:** Modern best practices favor minimal screenshots with alt text to reduce maintenance burden.
- **Markdown without structure:** 2025 docs emphasize clear sections and navigation for both human and AI readers.

## Open Questions

1. **Screenshot capture timing:** Should screenshots be captured before or after planning completion?
   - What we know: Screenshots require running app with data populated
   - What's unclear: Whether to capture all screens now or defer to planning phase
   - Recommendation: Add TODO comments in README, capture screenshots as final step

2. **Database schema documentation level:** How much detail should README include about coach tables?
   - What we know: Migration files exist in `supabase/migrations/`
   - What's unclear: Whether README should include table schema inline or reference migration files
   - Recommendation: Include high-level overview (table names, purpose) but reference migration files for full schema

3. **Cost tracking UI mention:** Should README mention the `coach_api_usage` table if UI doesn't expose it?
   - What we know: Table tracks tokens and costs per user but no dashboard exists
   - What's unclear: Whether to document hidden features
   - Recommendation: Don't mention cost tracking table until UI exists (avoid confusion)

4. **Version banner placement:** Should v2.0 features be clearly marked as "New in v2.0"?
   - What we know: Version badges are common in READMEs
   - What's unclear: Visual style preference
   - Recommendation: Add "NEW in v2.0" badges next to AI Coach features for clarity

## Sources

### Primary (HIGH confidence)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions) - Edge Functions overview, deployment, and usage patterns
- [Supabase Secrets Management Documentation](https://supabase.com/docs/guides/functions/secrets) - Environment variable setup commands
- [Project codebase] - coach-page.tsx, chat-page.tsx, coach.ts, patterns.ts, migrations

### Secondary (MEDIUM confidence)
- [README Best Practices - Utrecht University](https://utrechtuniversity.github.io/workshop-computational-reproducibility/chapters/readme-files.html) - README structure and components
- [Software Documentation Best Practices 2025 - DocsBot AI](https://docsbot.ai/article/software-documentation-best-practices) - Clear structure and navigation recommendations
- [Crafting A README.md Guide](https://test.charlestonwv.com/news/crafting-a-readme-md-your) - Example usage and screenshots section
- [LLM Integration Best Practices - HackMD](https://hackmd.io/@tech1/llm-integraion) - Security essentials and transparency in AI features

### Tertiary (LOW confidence)
- [Top GitHub README Builders 2025](https://www.readmecodegen.com/blog/top-github-readme-builders-for-developers-2025-ai-tools-auto-generated-markdown-templates) - AI-powered README generation tools (not needed for this project)
- [AI Documentation Trends 2025 - Mintlify](https://www.mintlify.com/blog/ai-documentation-trends-whats-changing-in-2025) - LLM-friendly documentation formats (llms.txt, MCP) - not relevant for personal project
- [Markdown Documentation Best Practices - IBM Community](https://community.ibm.com/community/user/blogs/hiren-dave/2025/05/27/markdown-documentation-best-practices-for-documentation) - General markdown guidance

## Metadata

**Confidence breakdown:**
- Standard stack: LOW - No new libraries required, basic documentation tools
- Architecture: MEDIUM - README structure based on best practices and project needs
- Pitfalls: HIGH - Verified against project STATE.md blockers section and common upgrade issues

**Research date:** 2026-01-19
**Valid until:** 2026-02-18 (30 days - stable domain, but README content may need updates after implementation)
