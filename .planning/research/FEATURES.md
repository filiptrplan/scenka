# Feature Landscape

**Domain:** AI Coach for Climbing PWA
**Researched:** 2025-01-17
**Overall confidence:** MEDIUM

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Weekly Focus Statement** | Users expect a clear, concise training focus for the week to guide their sessions | Low | Should be 1-2 sentences explaining what we're working on this week |
| **3 Personalized Drills** | Fitness apps provide specific, actionable exercises, not generic advice | Medium | Each drill needs: name, description, sets/reps/rest, and how it addresses the weekly focus |
| **Manual Regenerate Button** | Users want control to refresh recommendations without waiting for automated cycles | Low | Triggers new AI generation based on latest data |
| **Persistent Recommendations** | Users expect plans to be saved and available across sessions | Low | Store in database, retrieve on page load, show generation date |
| **Chat Interface (Message Input + Send)** | Conversational UI is the standard for AI interactions in 2025 | Low | Text input field with submit button, mobile-optimized |
| **Message Bubbles (User/Bot)** | Visual distinction between user and AI messages is expected for readability | Low | Different styles for sent vs received messages |
| **Limited Chat History** | Context retention is required - users expect AI to remember recent conversation | Medium | Keep last N messages (e.g., 10-20) in context window |
| **Streaming Responses** | Users expect real-time feedback, not waiting for full response to render | Medium | Use streaming API (OpenRouter supports this) for perceived speed |
| **Failure Patterns Summary** | Climbing training apps analyze weaknesses - users expect pattern insights | High | Pre-process climb data to identify: most common failure reasons, grades where failures cluster, style-specific issues |
| **Style Weaknesses Analysis** | Climbers identify style preferences and need weakness targeting | Medium | Analyze logged styles vs failure rates to show where struggles occur |
| **Climbing Frequency Tracking** | Context for training - users need to see how often they're climbing | Low | Count climbs per week/month, show trend |
| **Recent Successes Context** | Users need positive reinforcement and progress context for balanced coaching | Medium | Include recent sends, grade progress, redemption completions in summary |
| **Loading States** | Users expect feedback during API calls - skeleton screens over spinners | Low | Use skeleton loaders for perceived performance during LLM responses |
| **Clear Entry Points to Chat** | Chatbot UI best practice - FAB or contextual triggers for easy access | Low | Floating action button or clear button to open chat from recommendations page |
| **Graceful Error Handling** | AI systems fail - users need clear fallbacks, not dead ends | Medium | Show "I didn't understand" with helpful options, recover gracefully |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Exception-Logging-Based Patterns** | Unique to Scenka - focuses only on significant climbs, not noise from easy sends | High | Requires specialized analysis that treats "exception logging" philosophy as core feature |
| **Climbing-Specific Domain Knowledge** | Generic fitness AI lacks climbing nuance - our AI knows beta, grades, styles | High | Use OpenRouter with climbing-specific prompts, domain training |
| **Minimalist Data Collection** | Unlike Lattice requiring 15-20 questions, we work with existing climb logs | Medium | No lengthy onboarding - use logged climbs as source of truth |
| **Pre-processed Patterns + Real-Time Chat Hybrid** | Combines structured weekly plan with flexible Q&A - best of both worlds | High | Weekly drills are pre-generated and cached, chat uses those as context |
| **Redemption Tracking Integration** | Links AI advice to actual climbs users are working on | Medium | Drill suggestions can reference specific redemptions from user's list |
| **Focused Weekly Scope** | Not overwhelming 4-week plans or complex periodization - just "this week's focus" | Low | Reduces decision fatigue, easier to commit to |
| **Mobile-First PWA Experience** | No app install required, works offline, native-like feel | Medium | Differentiator vs subscription-based climbing training apps |
| **Privacy-First Approach** | No social pressure, no leaderboards, no sharing - just personal improvement | Low | Appeals to climbers who dislike competitive climbing apps |
| **Drill Explanations with Context** | Chat can explain drills in climbing-specific terms, reference user's actual weakness | Medium | "You struggle with overhangs, so this drill targets your core and finger strength on steep terrain" |
| **Context-Aware Chat Recommendations** | AI maintains conversation context across exchanges, not just system-level patterns | Medium | "Remember when you asked about crimps? Here's how today's drill builds on that" |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Lengthy Onboarding/Assessment** | Lattice requires 15-20 questions - high friction, users drop off | Use existing climb logs as data source, start immediately |
| **Video Analysis/Form Checking** | Requires camera permissions, complex ML, privacy concerns, mobile performance hit | Focus on pattern analysis from logged data, not visual form analysis |
| **Voice-Based Coaching** | Awkward in gyms, requires continuous audio, battery drain, gym noise interference | Text-only chat - more private, works in any environment |
| **4-Week Complex Periodization** | Overwhelming for most climbers, requires commitment users don't have | Simple weekly focus - easy to regenerate if priorities change |
| **Social Features/Leaderboards** | Competitive pressure, privacy concerns, doesn't align with "personal improvement" focus | Private, personal-only experience - no sharing required |
| **Push Notifications** | Interrupts gym sessions, annoying when climbing, easy to dismiss | In-app recommendations only - users check when ready |
| **Complex Exercise Libraries** | Overkill, maintenance burden, users can find drill videos online | Simple drill descriptions with references to common climbing training resources |
| **Real-Time Data Sync with Wearables** | Privacy concerns, requires additional hardware, not core to bouldering | Use logged climb data as source of truth - manual input is intentional |
| **Automated Daily Adjustments** | Confusing when recommendations change unexpectedly, users lose trust | Manual regenerate button - user controls when to refresh |
| **Over-Reliance on Predefined Scripts** | Chatbots fail when queries fall outside programmed responses, frustrates users | Flexible LLM with climbing context - adapt to unexpected questions |
| **Unlimited Conversation History** | Bloats database, increases API costs, violates privacy-first | Limited history (10-20 messages), clear conversation option |
| **Human-Like Deception** | Users resent bots pretending to be human, damages trust | Be transparent - "I'm an AI coach helping with your climbing" |

## Feature Dependencies

```
Climb Logging Data
├── Failure Patterns Analysis
├── Style Weaknesses Analysis
├── Climbing Frequency Tracking
└── Recent Successes Summary

Pattern Analysis
└── Weekly Focus + 3 Drills Generation
    ├── Persistent Storage
    └── Chat Context

Chat Interface
├── Streaming API (OpenRouter)
├── Limited History Retention
└── Pre-processed Patterns as System Context
```

## MVP Recommendation

For v2.0 MVP, prioritize:

1. **Weekly Focus + 3 Drills (Manual Regenerate)**
   - Core value proposition - gives users direction
   - Pre-processed patterns ensure quality
   - Manual control reduces complexity

2. **Chat Interface with Streaming**
   - Expected feature for AI products in 2025
   - Enables drill explanations and climbing-specific advice
   - Streaming provides perceived performance

3. **Pre-processed Pattern Analysis**
   - Failure Patterns + Style Weaknesses + Frequency + Recent Successes
   - Differentiates from generic fitness AI
   - Leverages existing climb logs

4. **Persistent Recommendations Storage**
   - Save to database, show generation date
   - Enables offline access to last generated plan

5. **Graceful Error Handling**
   - Fallback to previous recommendations if API fails
   - Clear "I didn't understand" responses in chat
   - Loading states during generation

Defer to post-MVP:

- **Automated weekly generation**: Start with manual to validate value
- **Advanced drill progress tracking**: Just provide recommendations first
- **Export/share features**: Focus on personal use first
- **Drill video library**: External references are sufficient
- **Multi-week planning**: Weekly scope is simpler to validate

## Sources

### HIGH Confidence (Official/Authoritative)
- [OpenRouter Quickstart Guide](https://openrouter.ai/docs/quickstart) - API capabilities, unified endpoint access
- [OpenRouter Streaming API](https://openrouter.ai/docs/api/reference/streaming) - Streaming support for real-time responses
- [Gymscore AI Coaching Toolkit 2025](https://www.gymscore.ai/ai-coaching-toolkit-2025) - Verified: automated program adaptation, AI chat assistants, personalized workout programs, real-time scoring, automated reminders
- [Lattice Training Plans](https://latticetraining.com/climbing-training-plans/) - Verified: 100% custom plans, performance analytics, coach chat functionality, schedule editing capabilities, progress tracking, adaptive plans as users train

### MEDIUM Confidence (Verified with Official Sources)
- [SensAI Complete Guide to AI Personal Training 2025](https://www.sensai.fit/blog/complete-guide-ai-personal-training-2025) - Verified: conversational interface with natural language processing, adaptive algorithms based on physiological feedback and recovery, weekly planning based on HRV/sleep data, contextual personalized coaching through conversation
- [7 Essential Features for Custom Fitness App Development](https://www.sportfitnessapps.com/blog/7-essential-features-for-custom-fitness-app-development) - Verified: AI-powered routines using user data, personalized workout plans aligned with goals, real-time feedback from wearables, clear progress insights, visual charts and metrics
- [12 Best Practices for Chatbot UI Design](https://widget-chat.com/blog/chatbot-ui-design-best-practices) - Verified: clear entry points (FABs), visual hierarchy for message bubbles, persistent conversation with history, loading states (skeleton screens), quick action buttons, clear exit options
- [9 Essential Chatbot Best Practices 2025](https://www.chatiant.com/blog/chatbot-best-practices) - Verified: conversational flows with clear intent recognition, graceful error handling with tiered fallbacks, clear onboarding explaining capabilities, consistent brand voice, clear boundaries about capabilities
- [15 Essential Features for Custom Fitness App](https://www.fitbudd.com/post/15-essential-features-for-a-custom-fitness-app) - Verified: personalized workout plans, weekly or monthly summaries, progress monitoring, visual metrics dashboard
- [10 Things People Expect from Online Fitness Coach](https://www.coachwithfitr.com/blog/10-things-people-expect-from-their-online-personal-fitness-coach) - Verified: weekly progress reports, regular check-ins, good communication increases commitment, clear response time expectations

### LOW Confidence (WebSearch Only, Needs Validation)
- [Common Conversational AI Mistakes](https://boost.ai/blog/common-conversational-ai-mistakes/) - Limited context understanding causes poor UX, scripted agents fail outside programmed responses, irrelevant or repetitive answers frustrate users
- [Chatbot UI Best Practices](https://vynta.ai/blog/chatbot-ui/) - Clear visual hierarchy with message bubbles, responsive mobile-first layouts, quick action buttons for intuitive flows (verified via WebFetch)
- [AI Chatbot Mistakes](https://www.sparkouttech.com/ai-chatbot-mistakes/) - Poor UX affects brand reputation, single negative experience can lose trust, repair costs are high
- [Lattice App Store Description](https://apps.apple.com/us/app/lattice-training-for-climbing/id1607997399) - Training weaknesses and structure features (unverified details)
- [Klettra Google Play](https://play.google.com/store/apps/details?id=com.klettra.se) - Track strengths and weaknesses for climbers (unverified details)
- [Lattice Training Plan Product Page](https://latticetraining.com/product/climbing-training-plan/) - Personalized plans target weaknesses shown in testing, help climbers improve in neglected areas (verified via WebFetch snippet)

### Gaps Requiring Phase-Specific Research
- Specific climbing drill database: What drills are most effective for each weakness (finger strength, power endurance, technique, mental)?
- Prompt engineering for climbing domain: How to get best results from OpenRouter models with climbing knowledge?
- User testing patterns: What weekly focus/delivery format resonates with boulderers?
- Error handling for AI responses: What happens when AI hallucinates drill instructions or gives bad advice?
- Drill quality validation: How do we ensure 3 recommended drills are safe and effective for the user's level?

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes - Weekly Focus/Drills | HIGH | Multiple sources confirm weekly planning is standard for fitness AI |
| Table Stakes - Chat Interface | HIGH | Official documentation confirms streaming, UX best practices are well-established |
| Table Stakes - Pattern Analysis | MEDIUM | Verified need from Lattice/app research, but implementation details unknown |
| Differentiators - Exception Logging | MEDIUM | Unique to Scenka - no external comparison, but aligns with climbing culture |
| Differentiators - Climbing Domain Knowledge | MEDIUM | Verified need from Lattice/app research, but prompt engineering quality unknown |
| Anti-Features - Onboarding/Assessment | HIGH | User sentiment from multiple sources confirms friction with lengthy assessments |
| Anti-Features - Video/Voice Analysis | HIGH | Verified technical complexity and privacy concerns from multiple sources |
| MVP Feature Prioritization | MEDIUM | Based on standard fitness app patterns, but needs user testing validation |
