# Pitfalls Research: AI Auto-Tagging in Mobile Logging Apps

**Domain:** AI Auto-Tagging for Climbing Logging
**Researched:** 2026-01-20
**Confidence:** MEDIUM

## Executive Summary

AI auto-tagging introduces unique risks to a frictionless mobile logging experience. Unlike optional AI features, auto-tagging runs on EVERY climb save, making performance and reliability critical. The core challenge: reduce friction, not add it. Users in gyms with sweaty hands and poor connectivity won't tolerate slow saves or blocked workflows.

Key findings:
- **Cost is the biggest risk** - Per-climb API costs scale linearly with user sessions (3-20+ climbs/day)
- **Performance blocks logging** - Any delay >2s in the save flow feels broken
- **Offline is not optional** - Gyms often have zero signal; blocking save breaks the app
- **Accuracy impacts trust** - Bad tags poison analytics and frustrate users
- **Privacy is easily violated** - Notes often contain PII (names, locations, gyms)

---

## Critical Pitfalls

### Pitfall 1: Blocking Save with Synchronous API Calls

**What goes wrong:**
User logs a climb and hits save, but the app waits for AI extraction before completing the save. API takes 3-5 seconds (or times out), user thinks the app is frozen, taps save again, or gives up. The feature that was supposed to reduce friction just increased it massively.

**Why it happens:**
- Implementing AI extraction as part of the same transaction as saving
- Not designing async background processing from the start
- Assuming fast network conditions (API calls from device vs. backend)
- Optimizing for happy path (fast WiFi, no API latency)
- Overlooking real-world gym connectivity (weak WiFi, zero signal)

**Consequences:**
- Users abandon the feature or the app entirely
- Duplicate saves from repeated taps
- Lost climb data when API timeouts occur
- Negative app store reviews about "slow/unreliable"
- Reverted to manual tagging (defeating the purpose)

**Prevention:**
- **Save climb first, extract tags second** - Never block the save flow
- Implement optimistic UI (show tags as "extracting...")
- Use background processing with retry logic
- Show extraction status clearly (loading indicator, "AI tags pending")
- Allow users to climb while tags extract in the background
- Cache extraction failures and retry when connectivity returns
- Set reasonable timeout (2s max for initial extraction attempt)

**Detection:**
- Users report "slow to save" or "app freezes when saving"
- Analytics show high tap-to-save duration (>2s)
- Multiple save attempts for same climb
- Drop-off after AI auto-tagging release

**Phase to address:**
Phase 1: Auto-Tag Foundation - Async extraction architecture must be designed before any user-facing implementation.

---

### Pitfall 2: Uncontrolled Per-Climb Costs

**What goes wrong:**
Auto-tagging costs are small per climb ($0.001-0.005), but multiply quickly with active users. A user logging 10 climbs/day for 30 days = 300 API calls/month. If you have 100 active users, that's 30,000 API calls/month. Without usage limits and optimization, costs spiral beyond free tiers or expected budget.

**Why it happens:**
- Not calculating per-climb cost before implementation
- Assuming users log fewer climbs than they actually do
- No per-user or per-climb cost tracking
- Using premium models when cheaper ones suffice
- No caching or deduplication of extractions
- Not monitoring API costs in real-time
- Testing with small sample sizes, scaling to production costs

**Consequences:**
- Unexpected AI API bills (can be 5-10x higher than expected)
- Hitting rate limits on free tiers (OpenRouter, etc.)
- Forced to disable feature due to cost overruns
- Need to implement emergency cost controls retroactively
- User frustration if limits are implemented after release

**Prevention:**
- **Calculate cost model upfront** - Estimate cost per climb and per user session
- Set per-user quotas (e.g., 20 climbs/day with auto-tagging, 50/day total)
- Use cheapest capable model for extraction (Haiku 3.5 or similar)
- Implement prompt optimization (minimize tokens sent/received)
- Cache extraction results by note content hash (deduplicate identical notes)
- Track costs per user and per feature in real-time dashboard
- Set cost alerts before hitting limits
- Consider batch extraction (if users save multiple climbs quickly)
- Implement usage tiers with clear communication

**Detection:**
- No cost dashboard or visibility into per-user API spend
- API costs grow linearly with user activity without optimization
- Multiple API calls for identical or similar climb notes
- Rate limit errors in production logs

**Phase to address:**
Phase 1: Auto-Tag Foundation - Cost tracking and quotas must be implemented before feature release.

---

### Pitfall 3: Inaccurate Tag Extraction (False Positives/Negatives)

**What goes wrong:**
AI extracts incorrect tags or misses relevant ones. Examples:
- False positive: Tags "Pinch" when climb is all slopers
- False negative: Misses "Dyno" tag for dynamic movement
- Wrong category: Tags "Physical: Pumped" instead of "Mental: Fear"
- Generic tags: Tags vague "Technical" when more specific "Beta Error" applies

Users lose trust in auto-tagging and either ignore tags or revert to manual entry. Analytics become polluted with incorrect data.

**Why it happens:**
- Insufficient testing with real climb notes (only synthetic test data)
- LLM hallucinations or probabilistic errors
- Unclear tag definitions or overlapping categories
- Prompts that don't enforce strict output format
- No confidence thresholds on extracted tags
- Climbing terminology not properly defined in prompts
- Testing only with positive examples (no edge cases)

**Consequences:**
- Users stop trusting AI tags (ignore them or disable feature)
- Analytics and insights are based on incorrect data
- Training recommendations based on wrong tags (e.g., focus on crimp strength when issue is mental)
- User frustration from constantly correcting tags
- Feature adoption drops after initial novelty wears off

**Prevention:**
- **Define clear tag taxonomy with examples** - Each tag must have non-overlapping definition
- Test extraction against diverse real-world notes (not just synthetic)
- Implement confidence thresholds (only show tags above 80% confidence)
- Require user confirmation for low-confidence tags
- Provide easy "correct this tag" flow and learn from corrections
- A/B test multiple prompts and measure extraction accuracy
- Implement tag deduplication rules (e.g., don't tag both "Crimp" and "Sloper" - mutually exclusive)
- Add "None of these" option when all tags are wrong
- Monitor extraction accuracy metrics (user correction rate)

**Detection:**
- High rate of user corrections (>30% of tags need editing)
- Users report "tags are always wrong" or "never useful"
- Analytics show contradictory tag patterns (e.g., user tagged both "Sent" and "Fail")
- User feedback loop is unused or low engagement

**Phase to address:**
Phase 1: Auto-Tag Foundation - Tag taxonomy, testing, and confidence thresholds must be validated before launch.

---

### Pitfall 4: No Offline Support (Gyms Have Zero Signal)

**What goes wrong:**
User is at climbing gym with zero WiFi signal, logs a climb, tries to save, and... nothing. The app blocks save until AI extraction completes, but there's no network. User sees error, thinks the app is broken, can't log their session. Or worse: app crashes or data is lost.

**Why it happens:**
- Assumed AI features always require online (no offline design)
- Not planning for gym connectivity reality (underground gyms, poor WiFi)
- Overlooking PWA offline-first requirement
- No background sync for failed extractions
- Not caching previous successful extractions for reference
- No network-aware UI (doesn't show "offline" state clearly)

**Consequences:**
- Core app feature (logging climbs) broken in offline mode
- Users uninstall app or leave bad reviews
- Lost climb data when saves fail offline
- Users can't use the app where they need it most (at the gym)
- Feature that was supposed to add value becomes a blocker

**Prevention:**
- **Design offline-first** - Climb saves work 100% offline, auto-tag is secondary
- Queue extraction requests when offline, process when connection returns
- Show clear "Offline - tags will extract later" message
- Allow manual tag selection as fallback offline
- Cache successful extraction patterns for similar notes
- Implement conflict resolution (if user adds manual tags and AI extracts later)
- Prioritize network requests (sync climbs first, then extract tags)
- Show extraction status clearly (pending, complete, failed)

**Detection:**
- App crashes or errors when device in airplane mode
- Save button doesn't respond in offline mode
- Users report "app doesn't work at my gym"
- No "retry" or "sync pending" indicators for failed extractions

**Phase to address:**
Phase 1: Auto-Tag Foundation - Offline architecture must be designed from day one, not retrofitted.

---

### Pitfall 5: Privacy Violations (PII in Climb Notes)

**What goes wrong:**
Users write notes that include identifiable information: "Climbed with Sarah at Boulders in Seattle, felt pumped on the crimpy V5." AI extraction sends this note to external API, potentially violating privacy. User didn't expect "my climbing notes" to be sent to third-party services.

**Why it happens:**
- Not treating climbing notes as sensitive personal data
- No PII detection or anonymization before API calls
- Overlooking privacy requirement: "no PII sent to external APIs"
- Users don't understand what data is sent to AI
- No explicit consent for AI processing of notes
- Assuming "it's just climbing data, not sensitive"

**Consequences:**
- Privacy violation and potential GDPR compliance issues
- User trust broken when they realize notes are sent externally
- Negative app store reviews about privacy concerns
- Legal risk if users include medical info in notes
- Reputation damage for privacy-focused app

**Prevention:**
- **Implement PII detection and redaction** - Strip names, locations, gym names before API call
- Use anonymization tools (Microsoft Presidio, Google Cloud DLP) or simple regex patterns
- Get explicit consent for AI processing (not buried in TOS)
- Show clear UI: "AI will extract tags from your notes" with option to disable
- Process notes server-side (via Edge Function) rather than client-side for better control
- Store only extracted tags, not raw notes sent to AI
- Provide "delete my AI data" option
- Audit data flow: what's sent to API, what's stored, retention policy

**Detection:**
- No PII detection/anonymization before API calls
- Privacy policy doesn't mention AI data processing
- Notes sent to AI without user awareness
- Regex or PII detection tools not in use

**Phase to address:**
Phase 1: Auto-Tag Foundation - Privacy safeguards (PII detection, anonymization, consent) must be implemented before any API integration.

---

### Pitfall 6: UX Confusion (Where Are Tags? Can I Edit Them?)

**What goes wrong:**
Auto-tagging runs in the background, but users don't know:
- Where tags are displayed (in climb detail? In analytics? In edit view?)
- Whether they can edit or remove AI-extracted tags
- Which tags were auto-extracted vs. manually added
- What to do when tags are wrong
- How to disable auto-tagging entirely

The feature is "magic" but mysterious, leading to confusion and frustration.

**Why it happens:**
- Overlooking user education (how to explain AI features)
- Assuming tags are self-explanatory
- No visual distinction between AI and manual tags
- Missing edit/remove controls for tags
- Not considering user workflow (when do they see tags?)
- Designing for engineers, not climbers with sweaty hands

**Consequences:**
- Users ignore tags entirely (feature adoption = 0)
- Users can't correct wrong tags, frustration builds
- Confusion about which tags are trustworthy
- Feature feels "tacked on" rather than integrated
- Users disable auto-tagging because they don't understand it

**Prevention:**
- **Clear visual distinction** - Show "AI-extracted" badge or different color for AI tags
- Inline editing: Allow tap-to-edit or tap-to-remove any tag
- Tag confidence visualization: Show high-confidence tags differently
- Onboarding: Explain auto-tagging once, allow disable
- Contextual help: "What are these tags?" tooltip or info icon
- Tag editing in climb detail view: Easy access to correct tags
- Show extraction status: "Tags extracted from your note"
- Feedback loop: "Report incorrect tag" to improve future extractions

**Detection:**
- No distinction between AI and manual tags in UI
- No way to edit or remove tags
- Users ask "what are these tags?" or "how do I turn this off?"
- Low tag interaction rate (users don't click or edit tags)

**Phase to address:**
Phase 2: Auto-Tag Experience - UX must be tested with real users before launch. Tag editing, distinction, and education are critical.

---

### Pitfall 7: No User Correction Feedback Loop

**What goes wrong:**
Users correct AI-extracted tags, but those corrections don't improve future extractions. The AI continues making the same mistakes, leading to persistent frustration. There's no mechanism to learn from user feedback or track accuracy metrics.

**Why it happens:**
- No data collection on user corrections
- No tracking of which tags are edited, added, or removed
- No feedback loop to prompt engineer
- Treating AI as "one-shot" rather than iterative system
- No monitoring of extraction accuracy over time
- No A/B testing of prompt improvements

**Consequences:**
- AI doesn't improve, errors persist
- Users waste time constantly correcting same mistakes
- No visibility into feature performance (is auto-tagging working?)
- Can't identify systematic extraction errors
- Feature stagnates, users lose trust
- No data to justify feature investment or kill it if it's not working

**Prevention:**
- **Track every user interaction with tags** - Edits, additions, removals
- Calculate accuracy metrics: % tags accepted vs. edited
- Identify systematic errors (e.g., always missing "Dyno" tag)
- Log corrections with original extracted tags for analysis
- A/B test prompt variations based on correction data
- Create dashboard: extraction accuracy, most-corrected tags, user feedback
- Feed corrections back into prompt engineering process
- Set quality targets (e.g., 80%+ tag acceptance rate)
- Consider model fine-tuning if errors are systematic

**Detection:**
- No tracking of tag edit/add/remove events
- No accuracy metrics dashboard
- No prompt iteration based on user feedback
- Same extraction errors persist over time
- No A/B testing of prompts

**Phase to address:**
Phase 2: Auto-Tag Experience - Feedback loop and monitoring must be built alongside the feature, not as an afterthought.

---

### Pitfall 8: Slow or Unreliable Extraction Blocking User Flow

**What goes wrong:**
Even with async processing, slow API responses or unreliable networks make the UX feel broken. Users see "Extracting tags..." for 10+ seconds, or extraction fails repeatedly. They don't know if the feature is working or if they should retry.

**Why it happens:**
- Not optimizing prompts for fast responses (too much context)
- Using expensive, slow models instead of faster alternatives
- No timeout handling or retry logic
- Overlooking real-world network conditions (gym WiFi is often weak)
- No fallback when extraction fails permanently
- Not testing on slow networks (3G, throttled WiFi)

**Consequences:**
- Users think the feature is broken or slow
- Repeated extraction attempts add to costs
- Users disable auto-tagging due to poor UX
- Feature doesn't feel "magical" - feels sluggish
- Network errors cascade into bad user experience

**Prevention:**
- **Optimize for speed first** - Use fastest capable model (Haiku 3.5, GPT-4o-mini)
- Minimize prompt context (only send note text, not full climb history)
- Set aggressive timeouts (2-3s max)
- Implement exponential backoff with max retry attempts
- Fallback: Show "Unable to extract tags" with manual tag option
- Cache extraction results by note content hash
- Test extraction on slow networks (throttle to 3G speeds)
- Show extraction progress: not just spinner, but "Connecting..." "Extracting..."
- Clear error messages when extraction fails: "Network error - try again or add tags manually"

**Detection:**
- Extraction takes >5 seconds on average
- High extraction failure rate (>10%)
- Users report "tags never load" or "always says extracting"
- No testing on slow networks or throttled connections

**Phase to address:**
Phase 1: Auto-Tag Foundation - Performance optimization and error handling must be built from the start.

---

## Moderate Pitfalls

### Pitfall 9: Tag Pollution (Too Many Tags, Low Signal)

**What goes wrong:**
AI extracts 10+ tags for every climb, most of which are generic or not useful. Users are overwhelmed by tag noise, can't see patterns, and analytics become cluttered with low-value data.

**Prevention:**
- Limit extracted tags to top 3-5 most relevant
- Require confidence threshold (don't show tags <70% confidence)
- Prioritize specific tags over generic ("Dyno" > "Technical")
- Allow user preference: "Show all tags" vs. "Show high-confidence only"
- A/B test tag limits (3 vs 5 vs all)

---

### Pitfall 10: Tag Category Confusion

**What goes wrong:**
Users don't understand tag categories (Physical, Technical, Mental) or tags are miscategorized. "Crimp" is in Physical, but it's really about hold type. "Bad Feet" is Technical, but feels like Physical to users.

**Prevention:**
- Group tags by category in UI with clear labels
- Show category tooltips: "Physical: Body and muscle issues" / "Technical: Movement and technique issues"
- Recategorize tags based on user mental model
- Allow filtering by category in analytics

---

### Pitfall 11: No Cost Per User Visibility

**What goes wrong:**
Backend can see total API costs, but can't tell which users are driving costs. One power user logging 50 climbs/day (vs. average 10) costs 5x more. No way to set fair usage limits or identify outliers.

**Prevention:**
- Track API costs per user in database
- Dashboard showing top users by API usage and cost
- Per-user quotas with clear communication
- Analytics on average climbs per session, per user

---

### Pitfall 12: Missing Edge Cases (Empty Notes, Short Notes, Emoji-Only Notes)

**What goes wrong:**
AI extraction fails or returns nonsense for edge cases:
- Empty note (no text)
- Single word note ("Send!")
- Emoji-only note ("🧗‍♂️")
- Very short note ("Hard")
- Very long note (essay about technique)

**Prevention:**
- Handle empty notes: Don't call API, no tags
- Short notes: Set minimum length threshold before extraction
- Long notes: Truncate or extract only key segments
- Test extraction against diverse real-world notes
- Return empty tag array gracefully when extraction fails

---

## Minor Pitfalls

### Pitfall 13: No Visual Feedback During Extraction

**What goes wrong:**
Tags appear suddenly without animation or indication that AI is working. Users don't know when tags are done extracting.

**Prevention:**
- Animate tag appearance (fade in, slide in)
- Show loading indicator during extraction
- Clear "Tags extracted" message when complete

---

### Pitfall 14: Tag Duplicate Extraction

**What goes wrong:**
AI extracts the same tag twice ("Crimp" appears twice in tag list) or extracts mutually exclusive tags (both "Sloper" and "Crimp" - can't be both).

**Prevention:**
- Deduplicate extracted tags before display
- Implement mutual exclusion rules (e.g., can't tag both "Slab" and "Overhang")
- Post-processing to clean up tag list

---

### Pitfall 15: No "Disable Auto-Tagging" Option

**What goes wrong:**
Some users don't want AI features or have privacy concerns. No way to turn off auto-tagging, leading to frustration or feature abandonment.

**Prevention:**
- Settings toggle: "Auto-tag climbs using AI"
- Per-session opt-out (e.g., "Don't use AI for this session")
- Respect user preference globally

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1: Auto-Tag Foundation | Architecture | Blocking save flow | Save first, extract second - async only |
| Phase 1: Auto-Tag Foundation | Cost | Uncontrolled API costs | Implement per-user quotas, cost tracking, caching |
| Phase 1: Auto-Tag Foundation | Privacy | PII in notes sent to API | PII detection/anonymization before API call |
| Phase 1: Auto-Tag Foundation | Offline | No offline support | Queue requests, show "pending" state |
| Phase 2: Auto-Tag Experience | UX | Confusing tag UI | Clear distinction (AI vs manual), easy editing |
| Phase 2: Auto-Tag Experience | Accuracy | Wrong tags, low trust | Confidence thresholds, user correction loop |
| Phase 2: Auto-Tag Experience | Performance | Slow extraction | Optimize prompts, use fast models, timeouts |
| Phase 3: Advanced Tagging | Feedback | No learning from corrections | Track corrections, A/B test prompts |

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No PII detection before API call | Ships faster | Privacy violations, user trust issues | Never - must implement PII safeguards |
| Client-side API calls | Simpler backend | API key exposure, no control over costs | Never - must use Edge Functions |
| Synchronous extraction during save | Simpler implementation | Blocks save flow, bad UX | Never - must be async from day one |
| Hard-coding tag extraction prompts | Faster iteration | Can't A/B test, optimize prompts | MVP only, move to managed prompts by Phase 2 |
| No user correction tracking | Saves DB schema | Can't improve extraction, no metrics | Acceptable for MVP, must implement by Phase 2 |
| Using expensive models (GPT-4) | Better accuracy (maybe) | 10x higher costs, slower responses | Use Haiku 3.5 or similar for MVP |
| No caching of extraction results | Simpler code | Paying for duplicate extractions | Must implement by Phase 2 |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenRouter API | Calling directly from client (exposes API key) | Proxy through Supabase Edge Function, never expose key |
| OpenRouter API | Sending full note + user history | Send only note text, minimal context |
| PII detection | Not implementing, assuming notes are safe | Use regex or tools (Presidio, DLP) to strip PII |
| Async extraction | Making it part of save transaction | Separate transactions: save climb, then extract tags |
| Offline support | Blocking save when offline | Save locally, queue extraction for later sync |
| Tag storage | Not tracking AI vs manual tags | Store tag metadata: source ("ai" or "manual"), confidence |
| Cost tracking | Only monitoring total cost | Track per-user cost, per-climb cost, set alerts |
| Rate limiting | No backoff on 429 errors | Implement exponential backoff with max retries |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending too much context per request | Slow extraction (5-10s), high costs | Minimize prompt: only note text, no history | Immediate - every request is wasteful |
| No caching of extractions | Duplicate API calls for identical notes | Cache by note content hash, 24h TTL | Users saving similar climbs repeatedly |
| Using expensive models | 10x higher costs, slower responses | Use Haiku 3.5 or GPT-4o-mini for extraction | From day one, costs escalate |
| No timeout handling | Extraction hangs, poor UX | Set 2-3s timeout, fallback to manual tags | Slow networks or API issues |
| No backoff on rate limits | API errors, failed extractions | Exponential backoff with max retries | High usage, many users |
| Client-side API calls | API key exposure, no cost control | Use Edge Function as proxy | Security issue, unauthorized usage |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing OpenRouter API key in client | API key theft, unauthorized usage, cost fraud | Use Supabase Edge Functions as proxy, never expose key to client |
| Sending PII to AI API | Privacy violations, GDPR issues | PII detection/anonymization before API call (regex, Presidio) |
| No input validation on notes | Prompt injection attacks, hallucinations | Validate and sanitize notes, limit length (500 chars) |
| No rate limiting per user | Abuse, cost attacks, DoS | Implement per-user quotas (e.g., 20 climbs/day with auto-tag) |
| Logging full notes sent to AI | Data leak if logs compromised | Don't log full notes, only metadata (length, extraction success) |
| No audit trail of API calls | Can't debug issues, no accountability | Log API requests with metadata (user_id, cost, model, tokens) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No distinction between AI and manual tags | Confusion about tag trust | Show "AI" badge or different color for AI-extracted tags |
| No way to edit tags | Stuck with wrong tags | Tap-to-edit, tap-to-remove any tag |
| No loading indicator during extraction | Unclear if feature is working | Show "Extracting tags..." spinner or skeleton UI |
| Poor error handling on extraction failure | Don't know what to do | Clear message: "Network error - tap to retry or add tags manually" |
| Too many tags shown | Overwhelmed, can't see patterns | Limit to top 3-5 high-confidence tags |
| No tag categories | Hard to find patterns | Group by category (Physical, Technical, Mental) with labels |
| No offline feedback | Don't know why tags aren't showing | Show "Offline - tags will extract later" message |
| No onboarding for AI features | Don't understand what tags are | One-time explanation: "AI extracts style tags from your notes" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Async Extraction:** Often missing async architecture - verify save is NOT blocked by AI API call
- [ ] **Offline Support:** Often blocks save offline - verify climb saves work 100% offline
- [ ] **PII Detection:** Often not implemented - verify notes are stripped of names, locations, gym names before API call
- [ ] **Cost Tracking:** Often no per-user visibility - verify you can see cost per user, per climb
- [ ] **Confidence Thresholds:** Often missing - verify only high-confidence tags (>70-80%) are shown
- [ ] **Tag Editing:** Often can't edit tags - verify users can tap-to-edit or tap-to-remove any tag
- [ ] **AI vs Manual Distinction:** Often no visual difference - verify AI tags are clearly marked
- [ ] **Extraction Speed:** Often too slow (>3s) - verify extraction completes in <2s average
- [ ] **Error Handling:** Often shows technical errors - verify failures show user-friendly messages with retry
- [ ] **Feedback Loop:** Often doesn't track corrections - verify tag edits are logged and accuracy is measured
- [ ] **Rate Limiting:** Often no per-user quotas - verify users have limits (e.g., 20 climbs/day)
- [ ] **Edge Cases:** Often fails on empty/short notes - verify extraction handles diverse note lengths
- [ ] **API Key Security:** Often exposed in client - verify all API calls go through Edge Functions

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Blocking save flow | HIGH | Refactor to async extraction, add background queue (3-5 days) |
| Uncontrolled costs | HIGH | Implement per-user quotas, cost tracking, caching, optimize prompts (1-2 weeks) |
| Inaccurate extraction | MEDIUM | Add confidence thresholds, user correction tracking, A/B test prompts (5-7 days) |
| No offline support | HIGH | Implement save-locally queue, background sync, network-aware UI (1-2 weeks) |
| Privacy violations | HIGH | Implement PII detection, anonymization, explicit consent flow (5-7 days) |
| UX confusion | LOW | Add tag editing, visual distinction, onboarding (2-3 days) |
| No feedback loop | MEDIUM | Track corrections, build accuracy dashboard, A/B test prompts (3-5 days) |
| Slow extraction | LOW | Optimize prompts, use faster model, add timeouts (1-2 days) |
| API key exposed | HIGH | Rotate keys, implement Edge Function proxy, audit usage logs (3-5 days) |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Blocking Save Flow | Phase 1: Auto-Tag Foundation | Save completes in <1s regardless of network, extraction happens in background |
| Uncontrolled Costs | Phase 1: Auto-Tag Foundation | Cost dashboard shows per-user cost, quotas enforced, caching reduces duplicate calls |
| Inaccurate Extraction | Phase 1: Auto-Tag Foundation | Tag accuracy >80%, confidence thresholds tested, edge cases handled |
| No Offline Support | Phase 1: Auto-Tag Foundation | Saves work offline, extraction queued, sync when connected |
| Privacy Violations | Phase 1: Auto-Tag Foundation | PII detection active, notes anonymized before API call, explicit consent flow |
| UX Confusion | Phase 2: Auto-Tag Experience | Tags clearly marked (AI vs manual), editing works, onboarding shown |
| No Feedback Loop | Phase 2: Auto-Tag Experience | Corrections tracked, accuracy dashboard live, A/B testing active |
| Slow Extraction | Phase 1: Auto-Tag Foundation | Extraction <2s average, timeouts implemented, fast model used |

---

## Sources

### Cost Management & Optimization
- [How to Monitor Your LLM API Costs and Cut Spending by 90%](https://www.helicone.ai/blog/monitor-and-optimize-llm-costs) - MEDIUM confidence (verified via WebFetch, 30-50% cost reduction from optimization)
- [LLM Cost Optimization: How To Run Gen AI Apps Cost-Efficiently](https://cast.ai/blog/llm-cost-optimization-how-to-run-gen-ai-apps-cost-efficiently) - LOW confidence (WebSearch only)
- [LLM Cost Optimization: A Guide to Cutting AI Spending Without Sacrificing Quality](https://www.getmaxim.ai/articles/llm-cost-optimization-a-guide-to-cutting-ai-spending-without-sacrificing-quality) - LOW confidence (WebSearch only)
- [How I Cut My AI App Costs by 52% Without Changing a Single Line of Code](https://dev.to/pranay_batta/how-i-cut-my-ai-app-costs-by-52-without-changing-a-single-line-of-code-348j) - MEDIUM confidence (verified via WebFetch, cost optimization strategies)
- [LLM API Pricing Comparison (2025): OpenAI, Gemini, Claude](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025) - LOW confidence (WebSearch only)
- [LLM API Pricing Comparison (2025): Live Rates + Cost Calculator](https://binaryverseai.com/llm-pricing-comparison/) - LOW confidence (WebSearch only)

### Offline Patterns
- [Mobile-First Architecture: Building Offline-First Apps for Low Connectivity Environments](https://kawaldeepsingh.medium.com/mobile-first-architecture-building-offline-first-apps-for-low-connectivity-environments-6b38587c4047) - MEDIUM confidence (verified via WebFetch, offline-first patterns)
- [Offline Mobile App Design: Challenges, Strategies, Best Practices](https://leancode.co/blog/offline-mobile-app-design) - MEDIUM confidence (verified via WebFetch, offline UX patterns)
- [Day 4/100: Offline On-Device AI current state & future trends](https://blog.karanbalaji.com/100-days-of-ai-day-4-offline-on-device-ai-in-2025-and-beyond) - LOW confidence (WebSearch only)
- [Top 6 Local AI Models for Maximum Privacy and Offline Capabilities](https://blog.swmansion.com/top-6-local-ai-models-for-maximum-privacy-and-offline-capabilities-888160243a94) - LOW confidence (WebSearch only)
- [Designing Offline-First Mobile Apps for Low-Connectivity Markets](https://niotechone.com/blog/designing-offline-first-mobile-apps-for-low-connectivity-markets) - LOW confidence (WebSearch only)
- [Fitness Tech With Offline Mode Vs Cloud-dependent Apps](https://www.alibaba.com/product-insights/fitness-tech-with-offline-mode-vs-cloud-dependent-apps-why-does-losing-signal-mid-session-derail-habit-formation.html) - LOW confidence (WebSearch only)
- [Love This Gym App, But It Needs Offline Mode and Data Sync! - Reddit](https://www.reddit.com/r/hardyapp/comments/16r901n/love_this_gym_app_but_it_needs_offline_mode_and/) - LOW confidence (WebSearch only, user feedback)

### Privacy & PII Handling
- [How to Handle PII When Using AI: Best Practices](https://www.cbtnuggets.com/blog/technology/data/how-to-handle-pii-when-using-ai) - MEDIUM confidence (verified via WebFetch, PII handling guidelines)
- [PII Security in the Age of AI: Best Practices](https://www.sentinelone.com/cybersecurity-101/cybersecurity/pii-security-ai-best-practices) - LOW confidence (WebSearch only)
- [Prevent sensitive information disclosure | Security](https://developer.android.com/privacy-and-security/risks/ai-risks/sensitive-information-disclosure) - MEDIUM confidence (verified via WebFetch, Android security guidelines)
- [Data Privacy in AI Testing: Insights for Engineering and QA Leaders](https://blog.qasource.com/data-privacy-in-ai-testing) - LOW confidence (WebSearch only)
- [AI Privacy Risks & Mitigations – Large Language Models (LLMs)](https://www.edpb.europa.eu/system/files/2025-04/ai-privacy-risks-and-mitigations-in-llms.pdf) - LOW confidence (WebSearch only)

### AI Accuracy & Feedback Loops
- [Why Correcting AI Triggers Negative Feedback Loops](https://chihchienliu.substack.com/p/why-correcting-ai-triggers-negative) - LOW confidence (WebSearch only)
- [The Power of AI Feedback Loop: Learning From Mistakes](https://irisagent.com/blog/the-power-of-feedback-loops-in-ai-learning-from-mistakes) - LOW confidence (WebSearch only)
- [False Positives and False Negatives - Generative AI Detection Tools](https://lawlibguides.sandiego.edu/c.php?g=1443311&p=10721367) - MEDIUM confidence (verified via WebFetch, false positive/negative tradeoffs)
- [The Case Of False Positives And Negatives In AI Privacy Tools](https://www.protecto.ai/blog/false-positives-and-negatives-in-ai-privacy-tools) - LOW confidence (WebSearch only)
- [What is the purpose of tagging data? - Toloka AI](https://toloka.ai/blog/machine-learning-tagging-text/) - LOW confidence (WebSearch only)

### UX Best Practices
- [10 Common (and Costly) Mistakes When Designing AI Products](https://uzer.co/en/mistakes-designing-ai-products-ux-tips) - MEDIUM confidence (verified via WebFetch, AI UX mistakes)
- [Mobile Design Mistakes That Cost You Customers and Money](https://www.uxmatters.com/mt/archives/2025/08/mobile-design-mistakes-that-cost-you-customers-and-money.php) - MEDIUM confidence (verified via WebFetch, mobile UX patterns)
- [It's 2025, and These 5 UX Mistakes Still Drive Users Away](https://medium.com/design-bootcamp/its-2025-and-these-5-ux-mistakes-still-drive-users-away-72a0590a1104) - LOW confidence (WebSearch only)
- [Mobile App Performance Optimization: Best Practices for 2025](https://www.scalosoft.com/blog/mobile-app-performance-optimization-best-practices-for-2025/) - LOW confidence (WebSearch only)

### Cost Tracking & Governance
- [LLM Cost Tracking Solution: Observability, Governance & Optimization](https://www.truefoundry.com/blog/llm-cost-tracking-solution) - LOW confidence (WebSearch only)
- [I built a small tool to track LLM API costs per user/feature + ... - Reddit](https://www.reddit.com/r/SaasDevelopers/comments/1q35yjl/i_built_a_small_tool_to_track_llm_api_costs_per/) - LOW confidence (WebSearch only)
- [The State Of AI Costs In 2025](https://www.cloudzero.com/state-of-ai-costs) - LOW confidence (WebSearch only)

---

**Research complete. Ready for roadmap planning.**

*Pitfalls research for: AI Auto-Tagging in Climbing Logging App*
*Researched: 2026-01-20*
