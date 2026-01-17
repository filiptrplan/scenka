# Project Research Summary

**Project:** Scenka v2.0 - AI Coach
**Domain:** AI-powered climbing coach PWA
**Researched:** 2026-01-17
**Confidence:** MEDIUM

## Executive Summary

Scenka v2.0 is adding an AI Coach feature to an existing mobile-first PWA for rock climbers. The recommended approach combines OpenRouter's LLM API (gpt-5.1) with a custom chat interface built on existing shadcn/ui components, Supabase PostgreSQL for persistence, and Supabase Edge Functions for secure API proxying. Experts in AI coaching apps recommend pre-processing climbing data into pattern summaries (failure reasons, style weaknesses, frequency) and using those as context for both weekly recommendations and real-time chat - this hybrid approach provides structure while maintaining flexibility.

Key risks are manageable but require upfront safeguards: implement usage tracking and per-user rate limits from day one to prevent cost spikes, add output validation and adversarial testing to catch hallucinations before users see them, and design offline fallbacks (cached recommendations) since gyms often have poor connectivity. The architecture follows the existing Scenka pattern (service layer → TanStack Query hooks → UI components) which simplifies integration - no breaking changes to current features, only new tables and routes added.

## Key Findings

### Recommended Stack

The stack extends the existing Scenka PWA without requiring backend servers or infrastructure changes. OpenRouter provides unified LLM access through a single API endpoint, and @microsoft/fetch-event-source handles Server-Sent Events streaming for real-time responses. Supabase Edge Functions secure the API calls (no exposed keys), while PostgreSQL JSONB stores flexible AI data. pg_cron enables weekly recommendation scheduling without external services.

**Core technologies:**
- **OpenRouter API (openai/gpt-5.1):** LLM provider with streaming support — Unified API, pay-per-use fits solo dev, 400K context window
- **@microsoft/fetch-event-source:** SSE streaming library — Supports POST with headers (crucial for API key auth), AbortController for cancellation
- **Supabase Edge Functions:** Secure API proxy — Hides API keys from client, server-side prompt construction, follows no-backend-servers constraint
- **PostgreSQL JSONB:** Flexible data storage — Stores drill objects, pattern summaries, chat metadata without schema migrations
- **shadcn/ui (custom):** Chat UI components — Full control over styling, no heavyweight dependencies, mobile-first design

### Expected Features

The AI Coach should provide both structured weekly guidance and flexible Q&A. Users expect clear weekly focus statements with 3 actionable drills based on their actual climbing data, plus a conversational interface for asking follow-up questions. All recommendations must persist across sessions, and the UI should show climbing patterns (failure reasons, style weaknesses) that inform the AI's advice. Features like video analysis, voice coaching, and complex multi-week planning should be deferred as they add significant complexity without clear user demand.

**Must have (table stakes):**
- Weekly focus statement + 3 personalized drills — Users expect direction, not just generic advice
- Manual regenerate button — User control prevents unexpected changes
- Persistent recommendations with generation date — Standard app behavior
- Chat interface with streaming responses — Expected in 2025 AI products
- Message bubbles for user/assistant distinction — Visual clarity required
- Failure patterns, style weaknesses, climbing frequency summaries — Differentiates from generic fitness AI
- Loading states and error handling — Users expect feedback during API calls
- Offline access to last recommendations — PWA requirement

**Should have (competitive):**
- Exception-logging-based pattern analysis — Unique to Scenka, focuses on significant climbs only
- Climbing-specific domain knowledge — Generic fitness AI lacks beta/grade nuance
- Minimalist data collection — No lengthy onboarding, uses existing climb logs
- Pre-processed patterns + real-time chat hybrid — Best of both worlds
- Privacy-first approach — No social pressure, personal-only experience
- Drill explanations with context — Links advice to actual user weaknesses

**Defer (v2+):**
- Automated weekly generation — Manual validation first
- Video analysis/form checking — Complex ML, privacy concerns
- Voice-based coaching — Awkward in gyms, battery drain
- 4-week complex periodization — Overwhelming, weekly scope simpler
- Social features/leaderboards — Doesn't align with personal improvement focus
- Push notifications — Interrupts gym sessions
- Complex exercise libraries — Simple descriptions with external references sufficient

### Architecture Approach

The architecture extends the existing Scenka pattern with a clear separation of concerns: components for UI, hooks (TanStack Query) for state, services for business logic, and Edge Functions for external API integration. A new `patterns.ts` service extracts aggregation logic from charts-page.tsx into reusable functions that calculate failure patterns, style weaknesses, and climbing frequency. The `coach.ts` service handles LLM API calls and prompt construction, while new `coach_recommendations` and `coach_messages` tables persist AI-generated content. All LLM calls route through a Supabase Edge Function to hide API keys and enable secure prompt engineering.

**Major components:**
1. **CoachPage** — Main tabbed view with Recommendations and Chat sections
2. **RecommendationsDisplay** — Shows weekly focus, 3 drills, and pattern analysis
3. **ChatInterface** — Free-form chat with message bubbles, streaming responses, and quick-reply options
4. **PatternAnalysis** — Displays pre-processed climbing patterns extracted from logs
5. **coach.ts service** — LLM API calls, prompt construction, response parsing
6. **patterns.ts service** — Aggregates climb data into structured pattern summaries
7. **openrouter-coach Edge Function** — Secure OpenRouter API proxy with climbing-specific prompts

### Critical Pitfalls

The most dangerous pitfalls are cost escalation, bad advice, and poor mobile UX. Without usage tracking and per-user limits, API costs can balloon unexpectedly. AI hallucinations about climbing technique could lead to injury, so output validation and adversarial testing are mandatory. Chat interfaces that don't work well on mobile (poor streaming, no quick replies, bad error handling) cause immediate user dropoff. Privacy violations (sending identifiable climbing data to AI without consent) create GDPR risk. Offline failure is critical for a gym-focused PWA - users must be able to view cached drills even without WiFi.

1. **Uncontrolled API Costs** — Implement usage tracking from day one, set per-user quotas (e.g., 10 chat messages/week), cache recommendations aggressively, and add cost alerting before it becomes a problem
2. **AI Hallucinations and Bad Advice** — Constrain outputs with structured prompts, validate against climbing best practices, add "This is AI-generated" disclaimers, provide "Report bad advice" feature, and hard-code safe responses for edge cases
3. **Poor Chat UX Leading to Low Engagement** — Keep responses concise and climbing-specific, pre-populate common questions as quick-reply buttons, show typing indicators, implement graceful streaming with fallback, and test on mobile from day one
4. **No Offline Fallback for AI Features** — Cache generated recommendations (weekly focus + drills) for offline access, show clear "AI features require internet" message when offline, gracefully disable chat input, and store last recommendations in local storage
5. **Privacy Violations with Sensitive Health Data** — Anonymize data before sending to AI (remove names, identifiable patterns), get explicit consent for AI processing, explain what data is sent in plain language, use RLS to ensure users only access their own data, and provide "delete my AI data" option

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: AI Coach Foundation
**Rationale:** Database tables, services, and basic hooks must exist before UI. This phase also addresses the most critical pitfalls (cost tracking, privacy safeguards, rate limiting) which are expensive to retrofit. Building with mock data first validates architecture before committing to LLM integration.
**Delivers:** Database tables (coach_recommendations, coach_messages), coach.ts and patterns.ts services, useCoach hooks, cost tracking infrastructure, privacy safeguards
**Addresses:** Features: Persistent recommendations storage, failure patterns summary, style weaknesses analysis, climbing frequency tracking
**Avoids:** Pitfalls: Uncontrolled API costs (tracking/limits), Privacy violations (anonymization/consent), Rate limiting issues (backoff/quotas)

### Phase 2: Coach Page + Recommendations UI
**Rationale:** UI can be built and tested with mock data before connecting to real API. Simpler than chat (single flow), validates component architecture, and delivers core value (weekly drills) quickly. Testing offline behavior here ensures fallbacks work before adding more complex features.
**Delivers:** CoachPage with tabs, RecommendationsDisplay component, PatternAnalysis component, manual refresh button, loading states, error handling, offline fallback for recommendations
**Uses:** Stack: shadcn/ui components, TanStack Query for caching
**Implements:** Architecture: Components layer, hooks layer (useRecommendations), service layer integration
**Addresses:** Features: Weekly focus statement, 3 personalized drills, manual regenerate button, loading states
**Avoids:** Pitfalls: No offline fallback (cached recommendations work offline), Poor Chat UX (not implementing chat yet)

### Phase 3: LLM Integration (Edge Function + Real Recommendations)
**Rationale:** UI is ready to display results, so LLM integration becomes plugging in real data. Edge Function handles security (no exposed keys) and prompt engineering. Testing with real API validates streaming and error handling before adding chat complexity.
**Delivers:** openrouter-coach Edge Function, prompt templates for recommendations, real API integration, output validation, fallback to previous recommendations on errors
**Uses:** Stack: OpenRouter API, Supabase Edge Functions, gpt-5.1 model
**Implements:** Architecture: Edge Function layer, LLM prompt engineering
**Addresses:** Features: Streaming responses, climbing-specific domain knowledge
**Avoids:** Pitfalls: AI hallucinations (output validation), Privacy violations (server-side prompt construction)

### Phase 4: Chat Interface
**Rationale:** Most complex feature requires all previous phases (database, UI, LLM). Chat adds streaming, optimistic updates, and context injection which must be built on solid foundation. Quick-reply buttons and mobile optimization are critical here to avoid engagement dropoff.
**Delivers:** ChatInterface component, message bubbles, streaming responses with @microsoft/fetch-event-source, optimistic updates via TanStack Query, quick-reply options for common questions, conversation context management
**Uses:** Stack: @microsoft/fetch-event-source, OpenRouter streaming API, TanStack Query
**Implements:** Architecture: Chat messages table, message caching, context injection into prompts
**Addresses:** Features: Chat interface, message bubbles, streaming responses, limited chat history, clear entry points to chat
**Avoids:** Pitfalls: Poor Chat UX (mobile-optimized, quick replies, typing indicators), Uncontrolled API costs (rate limiting per user)

### Phase 5: Polish + Weekly Automation (Optional)
**Rationale:** Core AI Coach is complete. This phase adds convenience features (pg_cron for automated weekly recommendations) and UX polish (clear conversation button, better error messaging, more quick-reply options). Can be deferred if needed since manual regenerate already works.
**Delivers:** pg_cron job for weekly recommendations, weekly recommendation generation function, "Clear Conversation" button, expanded quick-reply options, advanced error handling with recovery options
**Uses:** Stack: pg_cron extension, PostgreSQL functions
**Implements:** Architecture: Database scheduling, automated workflows
**Addresses:** Features: Enhanced error handling, improved chat UX
**Avoids:** Pitfalls: None - this is optimization phase

### Phase Ordering Rationale

Foundation first is mandatory because database tables, services, and hooks form the substrate that UI depends on. Architecture research identified clear dependencies: components → hooks → services → external APIs. UI before LLM allows building and testing with mock data, which is faster and catches design issues before API complexity. Recommendations before chat follows the simplicity principle - single-flow recommendations validate the entire pipeline (data aggregation → prompt → LLM → display) before adding the complexity of bi-directional chat. Offline support in Phase 2 ensures fallbacks work before adding more complex features that could compound failure modes. Phase 5 is optional because the core value proposition (weekly drills + Q&A) is complete after Phase 4.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (LLM Integration):** Prompt engineering for climbing domain requires specific knowledge of climbing terminology and training principles. No existing templates found for climbing coaches.
- **Phase 4 (Chat Interface):** Streaming implementation with @microsoft/fetch-event-source has good docs but few examples for React-specific patterns. Error handling for SSE failures needs validation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Database schema follows existing climbs table pattern, RLS policies are standard Supabase, TanStack Query hooks mirror useClimbs.ts.
- **Phase 2 (UI):** shadcn/ui components are well-documented, mobile-first design follows existing Scenka patterns, TanStack Query caching is standard.
- **Phase 5 (Polish):** pg_cron has official Supabase docs, database functions are standard PostgreSQL, UI polish patterns are well-established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | OpenRouter, Supabase Edge Functions, @microsoft/fetch-event-source verified with official docs. Clear rationale for all choices. |
| Features | MEDIUM | Table stakes confirmed by fitness app research and competitor analysis. Differentiators based on Scenka's unique exception-logging philosophy but lack direct comparison products. Drill database and prompt engineering quality unknown. |
| Architecture | HIGH | Follows existing Scenka patterns directly observed in codebase. Database schema mirrors climbs table. Component boundaries clear and well-documented. |
| Pitfalls | MEDIUM | Critical pitfalls verified by multiple sources (cost escalation, hallucinations, privacy). Prevention strategies are sound but require validation during implementation. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Climbing drill database:** Research didn't identify authoritative sources for effective drills per weakness (finger strength, power endurance, technique). Handle during Phase 3 planning by compiling climbing training resources and creating structured prompt templates.
- **Prompt engineering quality:** No verified examples of climbing-specific AI prompts. Handle during Phase 3 by iterative testing with climbing experts, versioning prompts from the start, and adding adversarial tests.
- **Streaming UX patterns:** Limited examples of React streaming with @microsoft/fetch-event-source specifically. Handle during Phase 4 by prototyping streaming early, testing on slow networks, and implementing fallback to full message.
- **User testing validation:** Research didn't include actual boulderer feedback on what weekly format works best. Handle during Phase 2-3 by gathering user feedback on mock recommendations before full LLM integration.

## Sources

### Primary (HIGH confidence)
- OpenRouter Quickstart Guide — API authentication, streaming support, model selection
- OpenRouter Streaming API — SSE implementation, request/response format
- OpenRouter Pricing — Cost structure, pay-per-use model
- OpenRouter Error Handling — Error codes, retry patterns
- OpenRouter Rate Limits — Rate limit headers, burst handling
- Supabase Edge Functions — Server-side functions, external API integration, environment variables
- Supabase pg_cron docs — Database scheduling, cron syntax, function invocation
- shadcn/ui Components — UI primitives, mobile-first patterns
- TanStack Query Optimistic Updates — Cache management, mutation patterns
- Existing Scenka codebase — Service/hook/component patterns, database schema, RLS policies

### Secondary (MEDIUM confidence)
- Gymscore AI Coaching Toolkit 2025 — Automated program adaptation, AI chat assistants, weekly planning patterns
- Lattice Training Plans — Performance analytics, coach chat functionality, weakness targeting
- SensAI Complete Guide to AI Personal Training 2025 — Conversational interface, adaptive algorithms, weekly planning
- Microsoft fetch-event-source GitHub — Library documentation, usage examples, TypeScript support
- Fitbit AI Coach reports — Hallucination examples, user expectations, feature comparisons
- GDPR for digital health apps — Sensitive data requirements, consent patterns, data minimization
- API Rate Limits Explained (Orq.ai) — Rate limit handling, backoff strategies

### Tertiary (LOW confidence)
- Streaming text with TypeIt blog — Typewriter effect patterns (needs validation)
- Common Conversational AI Mistakes (Boost.ai) — UX failure patterns (verified via WebFetch)
- AI in Fitness Apps feature lists — General feature expectations (needs user testing validation)
- Climbing training methodology articles — Drill recommendations (unverified, needs expert validation)

---
*Research completed: 2026-01-17*
*Ready for roadmap: yes*
