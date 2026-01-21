# Requirements: Scenka v2.1

**Defined:** 2026-01-20
**Core Value:** Quick, frictionless climb logging

## v1.1 Requirements

Requirements for simplified logging + AI auto-tagging. Each maps to roadmap phases.

### Simplified Logger

- [x] **SIMP-01**: User can log climb with grade scale and grade value
- [x] **SIMP-02**: User can log climb with outcome (Sent/Fail)
- [x] **SIMP-03**: User can log climb with terrain type from 8 options
- [x] **SIMP-04**: User can log climb with awkwardness (3 options: awkward/normal/smooth)
- [x] **SIMP-05**: User can log climb with free-form notes (primary data source)
- [x] **SIMP-06**: Logger form does NOT include manual style tags selector
- [x] **SIMP-07**: Logger form does NOT include manual failure reasons selector
- [x] **SIMP-08**: Form validates all required fields before submission
- [x] **SIMP-09**: Form auto-resets after successful submission (preserve v1.1 behavior)

### AI Tag Extraction

- [ ] **EXTR-01**: System extracts styles from notes on climb save
- [ ] **EXTR-02**: System extracts failure reasons from notes on climb save
- [ ] **EXTR-03**: Tag extraction happens asynchronously (non-blocking save flow)
- [ ] **EXTR-04**: Climb saves immediately, tags appear after extraction completes
- [ ] **EXTR-05**: System tracks AI extraction costs per user in user_limits table
- [ ] **EXTR-06**: System enforces per-user tag extraction quota (50 climbs/day default)
- [ ] **EXTR-07**: Extraction completes within 3 seconds on online device with good connectivity
- [ ] **EXTR-08**: Extraction fails gracefully if AI service unavailable (no crash, user informed)

### Tag Display & Editing

- [ ] **DISP-01**: System displays extracted tags grouped separately (styles, failure reasons)
- [ ] **DISP-02**: User can remove extracted tag with single tap
- [ ] **DISP-03**: User can add available tags with single tap from list
- [ ] **DISP-04**: User can manually add tags AI missed
- [ ] **DISP-05**: User can manually remove tags AI extracted incorrectly
- [ ] **DISP-06**: Tag changes require user confirmation (save button prevents accidental removal)

### Offline Support

- [ ] **OFFL-01**: User can save climb when offline (AI extraction queued)
- [ ] **OFFL-02**: System queues climbs for AI extraction when saved offline
- [ ] **OFFL-03**: System shows "Saved (offline)" message when device has no connectivity
- [ ] **OFFL-04**: System processes queued extractions when device regains connectivity
- [ ] **OFFL-05**: System updates tags with AI-extracted results after sync

### Analytics Integration

- [ ] **ANAL-01**: Training Priorities chart displays AI-extracted failure reasons
- [ ] **ANAL-02**: Style Weaknesses analysis displays AI-extracted styles
- [ ] **ANAL-03**: Pattern analysis processes AI-extracted tags correctly
- [ ] **ANAL-04**: Analytics queries work unchanged with AI-extracted tags

## v1.2 Requirements

Deferred to v2.2. Not in current roadmap.

### Advanced Tagging

- **ADV-01**: Learn from user corrections (track tag edits for prompt optimization)
- **ADV-02**: A/B testing framework for prompt variations
- **ADV-03**: Retroactive tagging for existing climbs (batch job on first v2.1 launch)
- **ADV-04**: Extraction caching by note content hash (deduplicate identical notes)
- **ADV-05**: Tag confidence explanation tooltips

### Rule-based Offline Fallback

- **FALL-01**: Rule-based keyword extraction when offline
- **FALL-02**: Fuzzy matching for typos and colloquialisms
- **FALL-03**: AI enhancement notifications when offline tags are improved by cloud extraction

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Blocking AI extraction during save | Core value is frictionless logging - waiting breaks UX |
| Multi-select UI for manual tag selection | This is what v2.1 eliminates |
| Mandatory AI tagging (can't save without it) | Breaks offline behavior, allow save without tags |
| Hiding low-confidence tags | Breaks trust, show all with indicators |
| Auto-apply tags without user review | Users need control over final tags |
| Suggested tags while typing | More complex, may distract from core flow |
| Learn from user corrections | Requires MLOps infrastructure, defer to v2.2 |
| Rule-based offline fallback | Adds complexity, simpler to just defer tagging until online |
| Retroactive tagging for existing climbs | Nice-to-have, not critical for v2.1 |
| Extraction caching by note hash | Optimization, not MVP |
| Tag confidence explanation | Too complex for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SIMP-01 | Phase 30 | Complete |
| SIMP-02 | Phase 30 | Complete |
| SIMP-03 | Phase 30 | Complete |
| SIMP-04 | Phase 30 | Complete |
| SIMP-05 | Phase 30 | Complete |
| SIMP-06 | Phase 30 | Complete |
| SIMP-07 | Phase 30 | Complete |
| SIMP-08 | Phase 30 | Complete |
| SIMP-09 | Phase 30 | Complete |
| EXTR-01 | Phase 31 | Pending |
| EXTR-02 | Phase 31 | Pending |
| EXTR-03 | Phase 31 | Pending |
| EXTR-04 | Phase 31 | Pending |
| EXTR-05 | Phase 31 | Pending |
| EXTR-06 | Phase 31 | Pending |
| EXTR-07 | Phase 31 | Pending |
| EXTR-08 | Phase 31 | Pending |
| DISP-01 | Phase 32 | Pending |
| DISP-02 | Phase 32 | Pending |
| DISP-03 | Phase 32 | Pending |
| DISP-04 | Phase 32 | Pending |
| DISP-05 | Phase 32 | Pending |
| DISP-06 | Phase 32 | Pending |
| OFFL-01 | Phase 33 | Pending |
| OFFL-02 | Phase 33 | Pending |
| OFFL-03 | Phase 33 | Pending |
| OFFL-04 | Phase 33 | Pending |
| OFFL-05 | Phase 33 | Pending |
| ANAL-01 | Phase 33 | Pending |
| ANAL-02 | Phase 33 | Pending |
| ANAL-03 | Phase 33 | Pending |
| ANAL-04 | Phase 33 | Pending |

**Coverage:**
- v1.1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after roadmap creation*
