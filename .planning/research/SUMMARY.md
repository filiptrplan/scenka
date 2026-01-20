# Research Summary: AI Auto-Tagging for Scenka v2.1

**Research Date:** 2026-01-20
**Overall Confidence:** HIGH
**Ready for Roadmap:** YES

---

## Executive Summary

AI auto-tagging transforms the climbing logging experience by eliminating manual tag selection friction. Users write free-form notes (e.g., "crimpy overhang, pumped out on dyno") and AI automatically extracts structured tags: `styles[]` (crimp, overhang, dyno) and `failure_reasons[]` (pumped). The research shows this is achievable with async background processing using OpenRouter's Llama 3.1 8B model ($0.0000055/climb) via Supabase Edge Functions, maintaining the app's core value of "quick, frictionless logging" while reducing tagging friction to zero.

Critical architecture decisions: (1) Save climb immediately, extract tags in background (never block save), (2) Offline-first design (gyms have zero signal), (3) Human-in-the-loop confirmation (users see extracted tags and can edit), (4) Cost control with per-user quotas and caching. Three-phase implementation recommended: Foundation (infrastructure), Experience (UX and confirmation), Advanced (feedback loops). Key risks are manageable: cost scales linearly but is minimal ($0.55/month for 100k climbs), offline requires queueing extractions, and accuracy depends on prompt engineering (target 80%+ tag acceptance rate).

---

## Key Findings

### From STACK.md

**Core Technologies:**
- OpenRouter API (meta-llama/llama-3.1-8b-instruct) - 12.5x-66.7x cheaper than GPT-5-mini, sufficient for entity extraction, fast inference
- Supabase Edge Functions - Secure API proxy, background processing, hides API keys, no backend servers constraint
- PostgreSQL + pg_cron - Job queue for async extraction, row-level locking, periodic polling
- TanStack Query - State management, optimistic updates, cache invalidation
- Service Worker (PWA) - Offline caching, background sync when online

**Cost Analysis:**
- Per climb: ~$0.0000055 (200 input tokens + 50 output tokens)
- Monthly (100 climbs): ~$0.00055
- Daily limit: 50-100 climbs/day before meaningful cost
- Critical requirement: Cost tracking and per-user quotas before launch

**Performance Targets:**
- <2 seconds extraction (PWA requirement)
- Llama 3.1 8B: ~100-200ms per 1K tokens
- Total: ~1.5s per climb with network latency
- Non-blocking: Save immediately, extract in background

**Alternative Rejected:**
- GPT-5-mini: 12.5x-66.7x more expensive ($0.25/$2.00 per 1M tokens) with marginal accuracy gain
- DeepSeek: 9.0x-33.3x more expensive, overkill for classification task
- Redis job queue: Requires additional infrastructure, Postgres sufficient for solo dev

---

### From FEATURES.md

**Table Stakes (Must-Have for MVP):**
1. Real-time tag extraction on save - Core feature, must work
2. Transparent extracted tags display - Show styles and failure reasons grouped separately
3. One-tap tag editing - Add/remove tags with single tap
4. Confidence indicators - Visual cue showing AI certainty
5. Manual tag override - Full control over final tags
6. Graceful offline behavior - Fallback extraction or defer tagging
7. Integration with existing analytics - Training Priorities and Style Weaknesses must work with AI tags

**Differentiators (Defer to Post-MVP):**
- Learn from user corrections - Requires MLOps infrastructure, training loops
- Suggested tags while typing - More complex, may distract from core flow
- Tag confidence explanation - Nice-to-have, not critical
- Multi-language tag mapping - Can start with English climbing terminology

**Anti-Features (Explicitly Do NOT Build):**
- Blocking AI tagging during save - Users want frictionless logging
- Multi-select UI for manual tag selection - This is what v2.1 eliminates
- Mandatory AI tagging - Breaks offline behavior, allow save without tags
- Hiding low-confidence tags - Breaks trust, show all with indicators
- Auto-apply tags without review - Users need control

**Performance Requirements:**
- Tag extraction: <3 seconds (72% of users cite performance as critical)
- Non-blocking save: Climb saves immediately, tags appear shortly after
- Reliability: 95%+ accuracy on clear notes, 85%+ on ambiguous notes

---

### From ARCHITECTURE.md

**Major Components:**
- SimplifiedLogger (NEW) - Form input without manual tag selectors
- TagService (NEW) - Orchestrates AI extraction, handles online/offline
- openrouter-tag-extractor Edge Function (NEW) - Calls OpenRouter API, validates response
- TagConfirmationDialog (NEW) - Displays extracted tags, allows edit/confirm
- AnalyticsCharts (MODIFIED) - Updated to show AI-extracted tags
- offlineQueue (EXTENDED) - Add tags_pending_sync flag, retroactive extraction

**Data Flow (Online):**
1. User fills simplified logger (grade, outcome, terrain, awkwardness, notes)
2. User taps save → Form validates
3. createClimbWithTags creates climb record immediately (without tags)
4. UI shows "Saved" + "Extracting tags..." indicator (non-blocking)
5. Edge Function extracts tags via OpenRouter in background
6. Update climb with extracted tags, invalidate TanStack Query cache
7. User sees extracted tags, can edit via TagConfirmationDialog
8. Confirm saves final tags, analytics update automatically

**Data Flow (Offline):**
1. User saves climb offline → Queued with tags_pending_sync = true
2. UI shows "Saved (will sync when online)"
3. When device reconnects → Sync Manager processes offline queue
4. Retroactive tagging job extracts tags for pending climbs
5. Updated tags sync back to device

**Database Schema Changes:**
- climbs table: ADD COLUMN tags_pending_sync BOOLEAN DEFAULT false
- profiles table: ADD COLUMN tags_migration_completed BOOLEAN DEFAULT false
- Index on tags_pending_sync for efficient queries
- Optional: ai_extraction_confidence JSONB for debugging

**Suggested Build Order:**
1. Database schema migration (low risk, foundation)
2. openrouter-tag-extractor Edge Function (test in isolation)
3. TagService layer (orchestration, depends on Edge Function)
4. SimplifiedLogger component (major UI change, depends on TagService)
5. TagConfirmationDialog component (trust feature, depends on AI extraction)
6. Offline queue extension (essential for gym use)
7. Retroactive tagging for existing climbs (nice-to-have)
8. Analytics updates (data pipeline works, just UI updates)

---

### From PITFALLS.md

**Top 5 Critical Pitfalls:**

1. **Blocking Save with Synchronous API Calls**
   - Consequence: App feels frozen, users abandon logging, duplicate saves from repeated taps
   - Prevention: Save climb first, extract second. Always async. Show extraction status.
   - Phase to address: Phase 1 (Foundation)

2. **Uncontrolled Per-Climb Costs**
   - Consequence: API bills 5-10x expected, hit rate limits, forced to disable feature
   - Prevention: Calculate cost model upfront, set per-user quotas (20 climbs/day), track costs per user, cache extraction results by note hash
   - Phase to address: Phase 1 (Foundation)

3. **Inaccurate Tag Extraction (False Positives/Negatives)**
   - Consequence: Users lose trust, analytics polluted, constant frustration from corrections
   - Prevention: Define clear tag taxonomy, test with diverse real notes, implement confidence thresholds (>80%), allow easy corrections
   - Phase to address: Phase 1 (Foundation)

4. **No Offline Support (Gyms Have Zero Signal)**
   - Consequence: Core app feature broken offline, users uninstall app, negative reviews
   - Prevention: Design offline-first, queue extraction requests when offline, show clear "Offline - tags will extract later" message
   - Phase to address: Phase 1 (Foundation)

5. **Privacy Violations (PII in Climb Notes)**
   - Consequence: GDPR violations, user trust broken, legal risk
   - Prevention: PII detection/anonymization before API call (strip names, locations, gym names), get explicit consent, process notes server-side
   - Phase to address: Phase 1 (Foundation)

**Moderate Pitfalls:**
- UX Confusion (where are tags? can I edit them?)
- No User Correction Feedback Loop (AI doesn't improve)
- Slow or Unreliable Extraction (feels broken)
- Tag Pollution (too many tags, low signal)
- No Cost Per User Visibility (can't identify outliers)

**Anti-Patterns:**
- Client-side API calls (exposes API key)
- Synchronous extraction during save (blocks user)
- No PII detection (privacy violations)
- No offline queue (breaks gym use)
- Separate manual/AI tag arrays (unnecessary complexity)

**Technical Debt Never Acceptable:**
- No PII detection before API call (privacy violation)
- Client-side API calls (security issue)
- Synchronous extraction (blocks save flow)

---

## Implications for Roadmap

### Recommended Phase Structure

Based on dependency analysis and risk profile, a **3-phase structure** is recommended:

#### Phase 1: Auto-Tag Foundation

**Rationale:** Critical infrastructure and safeguards must be implemented before any user-facing features. Async architecture, offline support, cost control, and privacy are non-negotiable foundation elements. Trying to build UX without these guarantees will require major refactoring.

**Deliverables:**
- Database schema migration (tags_pending_sync, tags_migration_completed)
- openrouter-tag-extractor Edge Function (reuse auth/validation patterns from openrouter-coach)
- TagService layer (createClimbWithTags, extractTagsAsync, processRetroactiveTagging)
- Cost tracking and per-user quotas in user_limits table
- PII detection and anonymization before API calls
- Offline queue extension (tags_pending_sync flag)
- Basic testing with sample climbing notes

**Features from FEATURES.md:**
- Real-time tag extraction (backend ready)
- Graceful offline behavior (queue architecture ready)

**Pitfalls Avoided:**
- Blocking save flow (async from day one)
- Uncontrolled costs (quotas and tracking implemented)
- Privacy violations (PII detection active)
- No offline support (queue architecture designed)

**Estimated Effort:** 3-5 days

**Research Flags:**
- Prompt engineering quality - Needs testing with real climb notes
- PII detection accuracy - Validate regex patterns on real user notes

---

#### Phase 2: Auto-Tag Experience

**Rationale:** Once foundation is solid, build user-facing features that demonstrate value and build trust. Simplified logger removes friction, confirmation dialog ensures control, confidence indicators provide transparency. This is the "magic" users see.

**Deliverables:**
- SimplifiedLogger component (remove manual tag selectors, add terrain type picker, simplified awkwardness)
- TagConfirmationDialog component (show extracted tags, allow edit/confirm)
- Confidence indicators (opacity or percentage, 80% threshold for high confidence)
- Integration of TagService into simplified logger
- Visual distinction between AI and manual tags (badges, colors)
- One-tap tag editing workflow
- Onboarding: Explain auto-tagging once
- Tag display in climb detail view

**Features from FEATURES.md:**
- Transparent extracted tags display
- One-tap tag editing
- Confidence indicators
- Manual tag override
- Integration with existing analytics

**Pitfalls Avoided:**
- UX confusion (clear distinction, easy editing)
- Tag pollution (limit to top 3-5 high-confidence tags)
- No visual feedback (loading indicators, animations)

**Estimated Effort:** 5-7 days

**Research Flags:**
- User acceptance of AI corrections - Will users trust AI tags or constantly edit?
- Confidence threshold calibration - What thresholds work in practice?

---

#### Phase 3: Advanced Tagging

**Rationale:** After UX is validated, add features that improve accuracy over time through learning and optimization. Not critical for MVP, but important for long-term success and cost efficiency.

**Deliverables:**
- User correction tracking (log every tag edit/add/remove)
- Extraction accuracy dashboard (acceptance rate, most-corrected tags)
- A/B testing framework for prompt variations
- Retroactive tagging for existing climbs (batch job on first v2.1 launch)
- Extraction caching by note content hash (deduplicate identical notes)
- Analytics updates (show AI-extracted badge)
- Tag explanation tooltips (optional)
- Disable auto-tagging option in settings

**Features from FEATURES.md:**
- Sync when AI becomes available (retroactive tagging)
- Learn from user corrections (deferred to Phase 3, not MVP)
- Tag confidence explanation (deferred)

**Pitfalls Avoided:**
- No feedback loop (corrections tracked, A/B testing active)
- Tag pollution (caching reduces duplicate calls)
- No cost visibility (dashboard shows per-user spend)

**Estimated Effort:** 4-6 days

**Research Flags:**
- Prompt A/B testing - What prompt variations improve accuracy?
- Fine-tuning ROI - Should we fine-tune model based on corrections?

---

### Which Phases Need Deeper Research

**Phase 1 Needs Research:**
- **Prompt Engineering Quality** - What prompts produce the most accurate tag extraction? Requires testing with 50+ real climb notes.
- **PII Detection Accuracy** - How well does regex-based anonymization work on climbing notes? Test with real user data.

**Phase 2 Needs Research:**
- **Confidence Threshold Calibration** - What confidence thresholds work best? Requires manual testing on sample notes.
- **User Education for Confidence Indicators** - How to communicate confidence without cognitive overhead? Requires user testing.

**Phase 3 Needs Research:**
- **Prompt A/B Testing** - Which prompt variations improve extraction accuracy? Requires running experiments.
- **Fine-tuning ROI** - Is custom model fine-tuning worth the cost? Requires analysis of correction patterns.

**Standard Patterns (Skip Research):**
- Database schema migration (well-documented Supabase pattern)
- Edge Function auth and validation (reuse openrouter-coach pattern)
- TanStack Query mutations (existing in codebase)
- Offline queue (existing infrastructure)
- Component design (shadcn/ui patterns well-established)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Stack (Technologies)** | HIGH | OpenRouter pricing official, Llama 3.1 benchmarks verified, Supabase documentation authoritative |
| **Features (What to Build)** | HIGH | User expectations backed by survey data (72% cite performance), human-in-the-loop best practices well-documented |
| **Architecture (How to Build)** | HIGH | Existing codebase provides clear patterns (openrouter-coach, offline queue), async background processing well-documented in Supabase docs |
| **Pitfalls (What to Avoid)** | MEDIUM | Cost and offline risks well-documented, but climbing-specific accuracy untested (no real notes yet) |
| **Overall** | HIGH | Foundation solid, UX patterns clear, risks identified and mitigable |

### Gaps to Address

**Before Implementation:**
1. **Climbing-specific prompt engineering** - No verified examples for climbing entity extraction. Need iterative testing with real climb notes.
2. **Confidence calibration** - What thresholds (70/80/85%) work best? Requires manual testing on 50+ sample notes.
3. **PII detection accuracy** - How well does regex-based anonymization work? Test with real user notes.

**During Implementation:**
4. **User acceptance of AI tags** - Will users trust AI or constantly edit? Requires user testing after Phase 2.
5. **Cost benchmarking** - What are actual token usage and costs for climbing-specific extraction? Monitor after launch.
6. **Offline vs online quality gap** - How much accuracy loss from rule-based vs AI extraction? Requires A/B testing.

**Post-Launch:**
7. **Prompt optimization** - What prompt variations improve accuracy? A/B test in Phase 3.
8. **Fine-tuning ROI** - Should we fine-tune Llama 3.1 on climbing-specific data? Depends on correction patterns.

---

## Sources

### HIGH Confidence (Official/Authoritative)
- OpenRouter Pricing - Token pricing structure, model catalog
- Llama 3.1 8B Instruct (OpenRouter) - Model capabilities, pricing ($0.02/$0.05 per 1M tokens)
- Supabase Edge Functions - Background Tasks - Async operations, `EdgeRuntime.waitUntil()`
- Supabase Documentation - RLS, Edge Functions, pg_cron
- Mobile User Expectations in 2025 (Luciq survey) - 72% cite performance as critical
- Human-in-the-Loop AI (Parseur) - Accuracy rates, hybrid workflows
- Offline-First Mobile Architecture (ResearchGate) - Research-backed patterns
- PWA Caching (MDN) - Service worker strategies, offline handling

### MEDIUM Confidence (Verified with Official Sources)
- GPT-5 Mini vs Llama 3.1 8B (Galaxy.ai) - Cost comparison (12.5x-66.7x cheaper), benchmark performance
- Job Queue Pattern (Jigz.dev) - PostgreSQL job queue, row locking, status states
- Entity Extraction LLM vs Regex (MDPI) - LLM accuracy vs rule-based approaches
- Mobile UX Best Practices (SendBird) - Mobile design patterns, real-time interactions
- Power Platform AI Week (LinkedIn) - Confidence scores as discriminators, human reviewer identity
- AI Analytics (Zapier, IBM) - Pattern identification, real-time insights
- LLM Cost Optimization (Helicone, dev.to) - 30-50% cost reduction strategies
- PII Security in AI (Android Security, CBT Nuggets) - Privacy guidelines, anonymization

### LOW Confidence (WebSearch Only, Needs Validation)
- Climbing App Context (TopLogger, Redpoint) - No specific AI auto-tagging details found
- Confidence Indicator Visual Design - No mobile UI patterns found, design recommendations hypothetical
- LLM Fine-tuning ROI - Theoretical, requires implementation to validate
- User Acceptance of AI Corrections - No climbing app data, requires user testing

---

**Research complete. Ready for roadmap planning.**

*Synthesized: 2026-01-20*
*Overall confidence: HIGH*
*Ready for requirements definition: YES*
