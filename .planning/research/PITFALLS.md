# Pitfalls Research

**Domain:** AI Coach Integration in Climbing/Fitness Apps
**Researched:** 2026-01-17
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Uncontrolled API Costs

**What goes wrong:**
OpenAI API usage balloons from cents to dollars/month rapidly. A single free-form chat feature can become the most expensive part of the infrastructure, especially with users sending multiple messages daily. Costs spiral without visibility or constraints.

**Why it happens:**
- No usage monitoring or dashboards
- Every chat request costs tokens
- Users don't understand API call costs
- No rate limiting per user
- Prompts include too much context

**How to avoid:**
- Implement usage tracking from day one (cost per user, total cost)
- Set hard usage limits per user (e.g., 10 chat messages/week)
- Cache recommendations instead of regenerating
- Optimize prompts for brevity
- Use cheaper models for non-critical tasks
- Implement cost alerting before it becomes a problem

**Warning signs:**
- No visibility into daily/weekly API costs
- Chat feature grows in usage with no cost controls
- Sending full user history with every request
- Multiple API calls for single user interaction

**Phase to address:**
Phase 1: AI Coach Foundation — Must include usage tracking, caching, and rate limiting before releasing to users.

---

### Pitfall 2: AI Hallucinations and Bad Advice

**What goes wrong:**
AI coach generates incorrect climbing advice, unrealistic drills, or harmful recommendations. Users trust the AI and get injured or make bad training decisions. Fitbit's AI coach was reported to have "occasional hallucinations" including "mismatched calorie estimates."

**Why it happens:**
- LLMs are probabilistic, not deterministic
- No guardrails or validation
- AI doesn't understand climbing physics/physiology
- Testing only covers happy paths
- No human review of generated content

**How to avoid:**
- Constrain outputs with structured prompts
- Validate recommendations against climbing best practices
- Add "This is AI-generated" disclaimers
- Provide "Report bad advice" feature
- Test adversarial prompts (ask for dangerous advice)
- Hard-code safe responses for edge cases
- Add safety rails: "I can help with technique, but for injuries consult a pro"

**Warning signs:**
- Accepting all AI responses without validation
- No testing of edge cases or adversarial inputs
- Generated content sounds plausible but is factually wrong
- No mechanism for users to report bad advice

**Phase to address:**
Phase 1: AI Coach Foundation — Implement output validation and testing before user-facing release.

---

### Pitfall 3: Poor Chat UX Leading to Low Engagement

**What goes wrong:**
Users try the AI chat once, get frustrated, and never return. Common issues: responses too slow, confusing interface, AI doesn't understand climbing context, or requires too much typing on mobile.

**Why it happens:**
- Overly complex conversation flows
- No personalization or context awareness
- Poor error handling when API fails
- Not optimized for mobile (44px touch targets, keyboard handling)
- Streaming implementation is janky or broken
- AI feels generic, not climbing-specific

**How to avoid:**
- Keep responses concise and climbing-specific
- Pre-populate common questions as quick-reply buttons
- Show typing indicators for API latency
- Implement graceful streaming with fallback to full response
- Handle all API errors with clear, actionable messages
- Test on mobile from day one
- Maintain conversation context between messages

**Warning signs:**
- Users need to type long questions every time
- No quick-reply options for common queries
- API errors show technical messages to users
- Poor mobile keyboard handling (auto-focus issues)
- Streaming text is choppy or breaks layout

**Phase to address:**
Phase 2: Chat Experience — Focus on mobile UX, streaming, and context awareness.

---

### Pitfall 4: No Offline Fallback for AI Features

**What goes wrong:**
Users at climbing gyms with poor WiFi try to use AI coach and get broken UI or silent failures. They assume the feature is buggy or the app doesn't work.

**Why it happens:**
- PWA already has offline support but AI features weren't designed for it
- No graceful degradation when API is unavailable
- No cached recommendations to show
- UI doesn't indicate what's happening

**How to avoid:**
- Cache generated recommendations (weekly focus + drills) for offline access
- Show clear "AI features require internet" message when offline
- Gracefully disable chat input with explanation
- Store last generated recommendations in local storage
- Allow users to browse previous AI responses offline
- Network-aware UI: show offline status prominently

**Warning signs:**
- Chat UI loads but sends requests that fail silently
- No indication that features require network
- Users can't see previously generated content when offline
- Error messages for network issues are unclear

**Phase to address:**
Phase 2: Chat Experience — Implement offline fallbacks before mobile testing.

---

### Pitfall 5: Privacy Violations with Sensitive Health Data

**What goes wrong:**
Climbing performance data (injuries, failure patterns, training history) is sensitive health data under GDPR. Sending this data to third-party AI APIs without proper consent or safeguards violates privacy regulations and user trust.

**Why it happens:**
- Not treating fitness data as "sensitive"
- Sending raw user data to OpenAI API
- No explicit consent for AI processing
- Not anonymizing/aggregating data before API calls
- Users don't know their data is processed by third parties

**How to avoid:**
- Anonymize data before sending to AI (remove names, identifiable patterns)
- Get explicit consent for AI processing (not buried in TOS)
- Explain what data is sent to AI in plain language
- Use RLS to ensure users can only access their own data
- Store only necessary data, minimize what's sent to AI
- Provide "delete my AI data" option
- Review GDPR Article 8 requirements for sensitive data

**Warning signs:**
- Sending full user profile to AI without consent
- No data minimization (sending everything vs. just what's needed)
- Privacy policy doesn't mention AI data processing
- Users can't opt out of AI features while using the app

**Phase to address:**
Phase 1: AI Coach Foundation — Implement privacy safeguards before any API integration.

---

### Pitfall 6: Rate Limiting Causing User Frustration

**What goes wrong:**
API rate limits (429 errors) hit during peak usage or with many users. Requests fail, users see errors, and trust is lost. Retry logic either doesn't exist or creates too much latency.

**Why it happens:**
- No rate limit handling
- No backoff strategy
- Burst traffic without queueing
- Not monitoring rate limit headroom
- No usage per-user throttling

**How to avoid:**
- Implement exponential backoff with jitter for 429 errors
- Track rate limit headers and headroom
- Implement request queueing during bursts
- Set per-user request quotas
- Show "Please wait" messaging during rate limits
- Monitor rate limit usage and alert before hitting limits
- Consider caching to reduce API calls

**Warning signs:**
- No handling of 429 rate limit responses
- Multiple concurrent API calls without coordination
- No visibility into rate limit usage
- Burst traffic patterns (e.g., weekly recommendations for all users at once)

**Phase to address:**
Phase 1: AI Coach Foundation — Implement rate limiting and backoff from day one.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coding prompt templates | Faster implementation, no prompt management system | Hard to iterate on prompts, can't A/B test | MVP only (Phase 1), migrate to managed prompts by Phase 2 |
| No prompt versioning | Ship faster | Can't debug bad responses, no rollback capability | Never - track prompt versions from start |
| Using only one AI model | Simpler code | Can't optimize costs, locked into one vendor | Initial implementation, should plan for model switching |
| Skipping prompt validation for drill generation | Ships faster | Bad drills, user complaints, lost trust | Never - validate all generated content |
| No cost monitoring dashboard | Saves dev time | Can't control costs, surprised by bills | Never - must have visibility from day one |
| Storing AI responses in client-only cache | Simpler, no DB schema | Users lose data on device switch, no analytics | Acceptable for MVP, but should persist to DB in Phase 1 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenRouter API | Storing API key in frontend, sending to every client | Use Supabase Edge Functions to proxy API calls, never expose keys to client |
| OpenRouter API | No error handling for rate limits, timeouts | Try/catch with exponential backoff, show user-friendly messages |
| OpenRouter API | Sending full user history with every request | Send only minimal context needed, cache and reuse responses |
| Supabase RLS | Assuming RLS protects API data sent to OpenAI | RLS protects DB access, but you must anonymize data before API calls |
| TanStack Query | Not caching AI responses, hitting API for same query | Cache with appropriate stale time, use query keys to deduplicate |
| Streaming responses | Assuming streaming works on all devices/networks | Test streaming on slow networks, have fallback to full message on failure |
| Offline mode | Not caching AI recommendations, app broken offline | Cache recommendations in localStorage or IndexedDB, show offline UI |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending too much context per request | Slow responses, high token costs | Minimal context, cache previous context | Starts slow, degrades with more data |
| No response caching | Repeated queries hit API every time | Cache recommendations by week/user pattern | Immediately - paying for redundant calls |
| Streaming without backpressure | UI jank on slow networks | Implement buffering, throttle updates | Slow 3G networks, weak WiFi |
| Multiple concurrent API calls | Rate limits, high costs | Queue requests, limit concurrent calls | Multiple users or frequent user actions |
| Large prompt templates | Expensive per-call costs | Optimize prompts, use template injection | Every request is wasteful |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing OpenRouter API key in client code | API key theft, unauthorized usage, cost fraud | Use Supabase Edge Functions as proxy, never expose keys |
| Sending identifiable user data to AI | Privacy violations, GDPR issues | Anonymize/aggregate data before API calls |
| No input validation on chat | Prompt injection attacks, hallucinations | Validate and sanitize user inputs, limit message length |
| No rate limiting per user | Abuse, DoS attacks, cost attacks | Implement per-user quotas, track request patterns |
| Logging sensitive AI responses | Data leak if logs compromised | Don't log full AI responses, mask sensitive content |
| No audit trail of AI decisions | Can't debug bad recommendations, no accountability | Store generated content with metadata (prompt, model, timestamp) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No typing indicator during API latency | User thinks app is broken, taps again | Show animated typing indicator or skeleton UI |
| Streaming text that's too fast | Can't read, feels robotic | Moderate streaming speed, add small delays between chunks |
| Generic AI responses ("How can I help?") | Feels robotic, not climbing-specific | Start with context-aware: "Based on your slab weakness this week..." |
| No quick-reply options | Have to type everything, friction on mobile | Pre-populate relevant questions as tappable buttons |
| No conversation history | Can't reference previous advice | Maintain session context, show last few messages |
| Poor error messages ("Network error") | Don't know what to do | Show actionable: "Connection failed. Tap to retry or view cached drills." |
| Chat requires full attention | Can't use quickly at the gym | Provide one-tap options for common needs |

## "Looks Done But Isn't" Checklist

- [ ] **Cost Tracking:** Often missing usage dashboards — verify cost per user, total cost, and alerting is in place
- [ ] **Prompt Validation:** Often missing adversarial testing — verify edge cases, dangerous queries, and factually wrong outputs are caught
- [ ] **Rate Limit Handling:** Often missing backoff logic — verify 429 errors are handled gracefully with user messaging
- [ ] **Offline Fallback:** Often missing cached recommendations — verify users can see previously generated drills offline
- [ ] **Privacy Consent:** Often missing explicit AI consent — verify users explicitly agree to AI data processing (not just general app TOS)
- [ ] **Mobile Streaming:** Often broken on slow networks — verify streaming works on 3G, weak WiFi, and has fallback
- [ ] **Error Handling:** Often shows technical errors to users — verify all API failures show user-friendly, actionable messages
- [ ] **Context Retention:** Often AI doesn't remember previous messages — verify conversation context persists across messages
- [ ] **Quick Replies:** Often requires typing everything — verify common queries are available as one-tap options
- [ ] **API Key Security:** Often key exposed in client code — verify all AI API calls go through backend/Edge Functions

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Uncontrolled API costs | MEDIUM | Implement usage tracking, set limits, optimize prompts, add caching (2-3 days work) |
| AI Hallucinations | HIGH | Add output validation, create test suite for edge cases, implement human review (1-2 weeks work) |
| Poor Chat UX | MEDIUM | Redesign with mobile-first approach, add streaming, quick replies, better error handling (3-5 days work) |
| No offline fallback | MEDIUM | Cache recommendations, add offline UI, implement graceful degradation (2-3 days work) |
| Privacy violations | HIGH | Audit data flows, implement anonymization, get explicit consent, update privacy policy (1-2 weeks work) |
| Rate limiting issues | LOW | Implement backoff, request queueing, monitoring (1-2 days work) |
| API key exposed | HIGH | Rotate keys, implement Edge Functions proxy, audit usage logs (3-5 days work) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Uncontrolled API Costs | Phase 1: AI Coach Foundation | Cost dashboard shows per-user usage, hard limits enforced, caching reduces redundant calls |
| AI Hallucinations | Phase 1: AI Coach Foundation | Test suite covers edge cases, adversarial prompts handled, bad-advice reporting feature works |
| Poor Chat UX | Phase 2: Chat Experience | Mobile usability testing passes, streaming smooth, quick replies available, errors user-friendly |
| No Offline Fallback | Phase 2: Chat Experience | Users can view cached drills offline, clear messaging when AI unavailable, network-aware UI |
| Privacy Violations | Phase 1: AI Coach Foundation | Data minimization before API calls, explicit consent flow, anonymization verified, delete option available |
| Rate Limiting | Phase 1: AI Coach Foundation | 429 errors handled with backoff, per-user quotas enforced, headroom monitoring active |

## Sources

### Cost Management
- [Effective Strategies for OpenAI Cost Management in 2025](https://sedai.io/blog/how-to-optimize-openai-costs-in-2025) - LOW confidence (WebFetch only)
- [OpenAI Cost Optimization: 14 Strategies To Know](https://www.cloudzero.com/blog/openai-cost-optimization/) - MEDIUM confidence (WebFetch verified)
- [Mastering AI Token Cost Optimization: Strategies to Cut AI Costs](https://10clouds.com/blog/a-i/mastering-ai-token-optimization-proven-strategies-to-cut-ai-cost/) - LOW confidence (WebSearch only)
- [LLM API Pricing Comparison (2025): OpenAI, Gemini, Anthropic Claude, Grok, and DeepSeek models](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025) - LOW confidence (WebSearch only)

### Rate Limiting
- [API Rate Limits Explained: Best Practices for 2025](https://orq.ai/blog/api-rate-limit) - LOW confidence (WebFetch failed, incomplete content)

### UX Best Practices
- [How Does AI Chatbot Implementation Work: Avoid 5 UX Mistakes](https://www.telkomsel.com/en/enterprise/insight/blog/how-does-implementation-ai-chatbot-work-avoid-ux-mistakes) - MEDIUM confidence (WebFetch verified)
- [Top Chatbot UX Tips and Best Practices for 2025](https://www.netguru.com/blog/chatbot-ux-tips) - LOW confidence (WebFetch had minimal content)
- [7 UX Mistakes That Kill Mobile App Retention (And How to Fix Them in 2025)](https://vxplore.medium.com/7-ux-mistakes-that-kill-mobile-app-retention-and-how-to-fix-them-in-2025-3dfb07a4fefa) - LOW confidence (WebSearch only)

### AI Hallucinations
- [Fitbit AI Coach: The LLM Shift That Leaves Garmin and Strava Lagging](https://the5krunner.com/2025/10/28/fitbit-ai-coach-llm-shift-garmin-strava-lag/) - LOW confidence (WebSearch only)
- [Fitbit AI coach public beta transforms wearable wellness](https://www.aicerts.ai/news/fitbit-ai-coach-public-beta-transforms-wearable-wellness/) - MEDIUM confidence (WebFetch verified)
- [Beyond Personal Training: From Humans to AI](https://medium.com/data-science/beyond-personal-training-from-humans-to-ai-802a14368672) - LOW confidence (WebSearch only)
- [GPT-4 as a virtual fitness coach: a case study assessing its...](https://pmc.ncbi.nlm.nih.gov/articles/PMC12261634/) - MEDIUM confidence (WebSearch - academic source)

### Offline Patterns
- [Building AI-Powered Mobile Apps: Running On-Device LLMs in Android and Flutter 2025 Guide](https://medium.com/@stepan_plotytsia/building-ai-powered-mobile-apps-running-on-device-llms-in-android-and-flutter-2025-guide-0b440c0ae08b) - LOW confidence (WebSearch only)
- [Connectivity Is Not a Given: Offline Mobile App Design](https://leancode.co/blog/offline-mobile-app-design) - LOW confidence (WebFetch failed with 429)

### Privacy & GDPR
- [GDPR for digital health: developing EU privacy-compliant mHealth apps](https://www.chino.io/post/do-fitness-tracking-apps-need-to-be-complied-with-data-protection-law) - MEDIUM confidence (WebFetch verified)
- [Why Should Data Privacy Be The #1 Concern Of Health Apps](https://countly.com/blog/health-app-data-privacy-concerns) - LOW confidence (WebSearch only)
- [GDPR Compliance for Fitness Apps: Safeguarding Personal Health Information](https://www.gdpr-advisor.com/gdpr-compliance-for-fitness-apps-safeguarding-personal-health-information/) - LOW confidence (WebSearch only)
- [How Do AI Wellness Apps Handle User Data Privacy?](https://lifestyle.sustainability-directory.com/question/how-do-ai-wellness-apps-handle-user-data-privacy/) - LOW confidence (WebSearch only)

### User Expectations
- [10 Things People Expect from Their Online Personal Fitness Coach](https://www.coachwithfitr.com/blog/10-things-people-expect-from-their-online-personal-fitness-coach) - LOW confidence (WebSearch only)
- [AI in Fitness Apps: 7 Features That Keep Users Hooked](https://www.vtnetzwelt.com/mobile-app-development/why-your-fitness-app-needs-these-10-ai-features-to-scale-in-2026/) - LOW confidence (WebSearch only)
- [Unveiling the Power of AI Fitness Apps](https://www.sciencedirect.com/org/science/article/pii/S1062737525000447) - MEDIUM confidence (WebSearch - academic source)

### Fitness App General Pitfalls
- [Why Do Some Fitness Apps Fail? Common Mistakes to Avoid](https://www.resourcifi.com/fitness-app-development-mistakes-avoid/) - LOW confidence (WebSearch only)
- [Why Most Fitness Apps Fail](https://apidots.com/blog/why-fitness-apps-fail-and-how-to-build-successful-fitness-apps/) - LOW confidence (WebSearch only)
- [Mistakes to Avoid While Developing a Fitness App](https://codiant.com/blog/fitness-app-development-mistakes/) - LOW confidence (WebSearch only)

---
*Pitfalls research for: AI Coach Integration in Climbing/Fitness Apps*
*Researched: 2026-01-17*
