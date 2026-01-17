# Requirements: Scenka AI Coach

**Defined:** 2026-01-17
**Core Value:** Quick, frictionless climb logging

## v1 Requirements

Requirements for v2.0 AI Coach milestone. Each maps to roadmap phases.

### Weekly Recommendations

- [ ] **REC-01**: User can view weekly focus statement (1-2 sentences explaining what to work on this week)
- [ ] **REC-02**: User can view 3 personalized drills with name, description, and sets/reps/rest
- [ ] **REC-03**: User can manually regenerate recommendations via button
- [ ] **REC-04**: Weekly recommendations persist across sessions with generation date displayed
- [ ] **REC-05**: Loading states show during AI generation
- [ ] **REC-06**: Error handling with fallback to previous recommendations on API failure
- [ ] **REC-07**: Recommendations work offline (last cached recommendations accessible without internet)

### Pattern Analysis

- [ ] **PATT-01**: User can view failure patterns summary (most common failure reasons)
- [ ] **PATT-02**: User can view style weaknesses analysis (styles where user struggles)
- [ ] **PATT-03**: User can view climbing frequency tracking (climbs per week/month)
- [ ] **PATT-04**: User can view recent successes context (recent sends, grade progress, redemptions)

### Chat Interface

- [ ] **CHAT-01**: User can send messages through text input with send button (mobile-optimized)
- [ ] **CHAT-02**: User can view message bubbles with visual distinction between user and assistant
- [ ] **CHAT-03**: Chat responses stream in real-time using Server-Sent Events
- [ ] **CHAT-04**: Chat retains limited message history (last 10-20 messages) for context
- [ ] **CHAT-05**: Clear entry points to chat from recommendations page
- [ ] **CHAT-06**: Graceful error handling with helpful fallback messages
- [ ] **CHAT-07**: Context-aware chat includes pre-processed patterns (failure, styles, frequency)
- [ ] **CHAT-08**: Chat provides climbing-specific domain knowledge (understands beta, grades, styles)

### Differentiators

- [ ] **DIFF-01**: Pattern analysis based on exception-logging (only significant climbs, no noise)
- [ ] **DIFF-02**: Recommendations link to user's redemption tracking (drills reference actual climbs)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Automation

- **AUTO-01**: Automated weekly recommendation generation (pg_cron job)
- **AUTO-02**: Usage tracking dashboard with per-user quotas
- **AUTO-03**: Cost alerting before threshold exceeded

### Advanced Chat

- **CHAT-V2-01**: Quick-reply buttons for common questions
- **CHAT-V2-02**: Clear conversation button to reset history
- **CHAT-V2-03**: "Report bad advice" feature for feedback

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Video analysis/form checking | Complex ML, privacy concerns, requires camera permissions |
| Voice-based coaching | Awkward in gyms, battery drain, gym noise interference |
| 4-week complex periodization | Overwhelming for climbers, weekly scope simpler to validate |
| Social features/leaderboards | Competitive pressure, doesn't align with personal improvement focus |
| Push notifications | Interrupts gym sessions, annoying when climbing |
| Lengthy onboarding/assessment | High friction, Lattice requires 15-20 questions - users drop off |
| Unlimited conversation history | Bloats database, increases API costs, violates privacy-first |
| Human-like deception | Users resent bots pretending to be human, damages trust |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REC-01 | Phase 19 | Pending |
| REC-02 | Phase 19 | Pending |
| REC-03 | Phase 19 | Pending |
| REC-04 | Phase 18 | Complete |
| REC-05 | Phase 19 | Pending |
| REC-06 | Phase 18 | Complete |
| REC-07 | Phase 18 | Complete |
| PATT-01 | Phase 18 | Complete |
| PATT-02 | Phase 18 | Complete |
| PATT-03 | Phase 18 | Complete |
| PATT-04 | Phase 18 | Complete |
| CHAT-01 | Phase 21 | Pending |
| CHAT-02 | Phase 21 | Pending |
| CHAT-03 | Phase 21 | Pending |
| CHAT-04 | Phase 21 | Pending |
| CHAT-05 | Phase 19 | Pending |
| CHAT-06 | Phase 21 | Pending |
| CHAT-07 | Phase 21 | Pending |
| CHAT-08 | Phase 20 | Pending |
| DIFF-01 | Phase 18 | Complete |
| DIFF-02 | Phase 18 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-17*
*Last updated: 2026-01-17 after Phase 18 completion*
