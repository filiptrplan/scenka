# Feature Landscape

**Domain:** AI auto-tagging in climbing logging mobile PWA
**Researched:** 2025-01-20
**Mode:** Ecosystem research for v2.1 milestone

## Table Stakes

Features users expect from AI auto-tagging in mobile logging apps. Missing = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Real-time tag extraction** | Users expect AI to work instantly, no waiting | Low | Must happen on save, not blocking interaction |
| **Transparent extracted tags display** | Users need to see what AI inferred from their notes | Low | Show tags prominently after save, grouped by type (styles, failure reasons) |
| **One-tap tag editing** | Users will want to correct mistakes quickly | Medium | Tap a tag to deselect, tap empty tag type to add manually |
| **Confidence indicators** | Users expect to know how certain AI is about each tag | Medium | Visual indicator (opacity? icon?) showing low/high confidence |
| **Manual tag override** | Users must be able to override AI decisions when wrong | Low | Full ability to add/remove tags regardless of AI output |
| **Graceful offline behavior** | Mobile apps must work in gyms with poor signal | High | Fallback to rule-based extraction or defer tagging until sync |
| **Sync when AI becomes available** | Users expect offline tags to be enhanced when online | Medium | Queue AI tagging request, run on next connectivity |
| **Integration with existing analytics** | Extracted tags must drive existing insights (Training Priorities, Style Weaknesses) | Medium | Analytics currently depend on structured tag data |

## Differentiators

Features that set product apart. Not expected in basic logging apps, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Climbing-specific tag extraction patterns** | General NLP won't understand climbing terminology like "crimpy" or "beta error" | Medium | Domain-specific entity recognition for climbing jargon |
| **Multi-language tag mapping** | Extract "pumped" from "gassed", "tired", "exhausted" | Medium | Synonym mapping for colloquialisms |
| **Context-aware failure reason extraction** | Distinguish between "fell on crimp" (physical: finger strength) vs "couldn't grab crimp" (technical: precision) | High | Needs semantic understanding, not just keyword matching |
| **Suggested tags while typing** | Real-time extraction as user writes notes, not just on save | High | More complex UX, may be distracting; better to show on save |
| **Learn from user corrections** | Model improves based on what users change | HIGH | Requires training loop, MLOps infrastructure; defer this |
| **Tag confidence explanation** | Show WHY AI extracted each tag (e.g., "pumped" matched in notes) | Medium | Helps users trust system and debug mistakes |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Blocking AI tagging during save** | Users want frictionless logging; waiting for AI = friction | Extract tags in background, show after save completes |
| **Multi-select UI for manual tag selection** | This is what v2.1 is eliminating; it creates friction | Keep only one-tap add/remove on extracted tags list |
| **Confidence threshold that hides low-confidence tags** | Hiding AI output breaks trust; users want to see everything | Show all tags with confidence indicators, let user decide |
| **Mandatory AI tagging (can't save without it)** | Breaks offline behavior, fails when AI unavailable | Allow save without tags, tag later in background |
| **Auto-apply tags without showing user what was extracted** | Users feel loss of control, can't catch mistakes | Always show extracted tags for review, require at least glance |
| **Complex tag explanation UI** | Too much cognitive load; users want quick logging | Keep it simple: show tag + confidence, maybe brief hover tooltip |
| **Tagging every single climb** | "Exception logging" philosophy means only significant climbs | Only tag significant climbs (fails, awkward sends) |

## Feature Dependencies

```
Tag extraction (AI or fallback)
  -> Tag storage (Supabase: styles[], failure_reasons[])
    -> Pattern analysis (Training Priorities, Style Weaknesses)
      -> Coach recommendations (uses pattern analysis)
        -> Weekly drills and focus areas

Manual tag correction
  -> Updated tag storage
    -> Re-run pattern analysis
      -> Updated coach recommendations
```

**Critical path:** Tag extraction -> Storage -> Pattern analysis. If AI fails, must have fallback to ensure analytics still work.

## MVP Recommendation

For v2.1 milestone, prioritize:

1. **Real-time tag extraction on save** - Core feature, must work
2. **Transparent extracted tags display** - Show styles and failure reasons grouped separately
3. **One-tap tag editing** - Add/remove tags with single tap
4. **Confidence indicators** - Visual cue showing AI certainty
5. **Manual tag override** - Full control over final tags
6. **Graceful offline behavior** - Fallback extraction (rule-based) or defer tagging
7. **Integration with existing analytics** - Ensure Training Priorities and Style Weaknesses still work with AI-extracted tags

Defer to post-MVP:

- **Learn from user corrections** - Requires MLOps infrastructure, training loops
- **Suggested tags while typing** - More complex, may distract from core flow
- **Tag confidence explanation** - Nice-to-have, not critical for MVP
- **Multi-language tag mapping** - Can start with English climbing terminology

## Detailed Feature Specifications

### Real-time Tag Extraction

**When:** On climb save (after form validation)

**How:** Cloud AI service (OpenRouter + LLM) with climbing-specific prompt

**Input:**
- Free-form notes text
- Terrain type (from logger form)
- Outcome (Sent/Fail)
- Awkwardness (awkward/normal/smooth)

**Output:**
```typescript
{
  styles: string[],        // e.g., ["crimp", "overhang"]
  failure_reasons: string[], // e.g., ["pumped", "bad feet"]
  confidence: {            // Optional for MVP, recommended for differentiator
    styles: { [tag: string]: number },  // 0-1 confidence per tag
    failure_reasons: { [tag: string]: number }
  }
}
```

**Performance requirements:**
- Extraction completes within 2-3 seconds (72% of users cite performance as critical)
- Non-blocking: climb saves immediately, tags appear shortly after
- Show loading indicator during extraction

### Extracted Tags Display

**Where:** Immediately after successful save, in climb detail view or success confirmation

**UI pattern (MVP):**
```
Extracted tags

Styles
[crimp] [overhang]

Failure reasons
[pumped] [bad feet]

[+ Add tag]
```

**With confidence indicators (differentiator):**
```
Extracted tags

Styles (AI confidence)
[crimp 92%] [overhang 87%] [sloper 54%]

Failure reasons (AI confidence)
[pumped 95%] [bad feet 78%]
```

Low-confidence tags could have visual distinction (lighter color? question mark icon?).

### One-tap Tag Editing

**Interactions:**
- Tap existing tag -> deselect (remove from climb)
- Tap [+ Add tag] -> show available tags filtered by type (styles vs failure reasons)
- Tap empty tag from available list -> select (add to climb)
- Save changes immediately on selection (no "Done" button needed)

**Tag categories:**
- Styles: slab, vert, overhang, roof, dyno, crimp, sloper, pinch (8 options)
- Failure reasons: Physical (pumped, finger strength, core, power), Technical (bad feet, body position, beta error, precision), Mental (fear, commitment, focus) (11 options)

### Confidence Indicators

**Visual options (ranked by simplicity):**

1. **Opacity** - Low confidence tags have reduced opacity (simplest, good default)
2. **Icon indicator** - Question mark or exclamation icon next to low-confidence tags
3. **Percentage text** - Show actual confidence score (most explicit, most complex)
4. **Color coding** - Green for high confidence, yellow for medium, red for low

**Recommendation:** Start with opacity (option 1) for MVP, add percentage text in post-MVP if needed.

### Manual Tag Override

**Scope:** Full control over tags, regardless of AI output

**When:** After AI extraction completes

**How:**
- User can remove any AI-extracted tag (one tap)
- User can add any tag from available list (one tap from [+ Add tag])
- Changes persist immediately
- No "confirm" or "save" button - frictionless editing

**Edge cases:**
- User removes all tags -> climb has no tags, valid state
- User adds tags AI missed -> fine, no conflict
- User edits tags before AI completes -> UI should lock or merge changes on completion

### Graceful Offline Behavior

**Approach:** Hybrid extraction strategy

**When online:**
- Use cloud AI (OpenRouter + LLM) for intelligent extraction
- Cache extraction results in local storage

**When offline:**
- Use rule-based extraction (keyword matching + fuzzy matching)
- Queue AI extraction request to run when connectivity returns
- Show "Basic tags extracted (offline)" indicator to user

**Rule-based extraction (offline fallback):**

```typescript
// Style keyword mapping
const styleKeywords = {
  crimp: ['crimp', 'crimps', 'crimpy', 'small holds', 'tiny'],
  overhang: ['overhang', 'steep', 'roof', 'overhanging'],
  slab: ['slab', 'vertical', 'friction'],
  // ... etc
}

// Failure reason keyword mapping
const failureReasonKeywords = {
  pumped: ['pumped', 'gassed', 'tired', 'exhausted', 'forearm'],
  'bad feet': ['feet', 'footwork', 'feet cutting', 'feet slipping'],
  // ... etc
}

// Fuzzy matching for typos (Levenshtein distance)
// Threshold: 2-3 character differences for short words
```

**Benefits:**
- Works completely offline
- Fallback when AI fails (network error, rate limit, service down)
- Fast (no network latency)

**Limitations:**
- Less accurate than AI (no semantic understanding)
- Won't handle complex phrases like "couldn't generate power for the dynamic move"
- Users must manually add tags rule-based extraction misses

### Sync When AI Becomes Available

**When:** Device regains connectivity

**How:**
- Process offline queue of pending AI extraction requests
- For each climb with rule-based tags:
  1. Run AI extraction
  2. Compare AI output with existing tags
  3. If AI extracts additional tags, show notification: "AI found 2 more tags for [climb]"
  4. User can accept, review, or dismiss
  5. If user accepts, update tags and re-run pattern analysis

**UI pattern:**
```
AI enhancement available

Climb: V5 crimpy overhang
Found 2 new tags: [core] [dyno]
[Accept all] [Review] [Dismiss]
```

**User preference:** Allow opt-out of auto-accepting AI-enhanced tags (default: review first).

### Integration with Existing Analytics

**Current analytics dependency:**
- Training Priorities chart -> breakdown by failure_reasons
- Style Weaknesses analysis -> fail rate by style
- Pattern analysis -> trends in failures over time

**Requirement:** AI-extracted tags must populate same database schema (styles[], failure_reasons arrays) for analytics to work unchanged.

**Migration path:**
- Existing climbs with manual tags -> no change needed
- New climbs with AI-extracted tags -> same schema
- Analytics queries -> no change needed
- Enhancement: Show "AI-extracted" indicator on climbs with AI tags

## Edge Cases and Ambiguities

### Ambiguous Notes

**Problem:** Notes like "pumped but couldn't commit to the throw" - is this physical (pumped) or mental (commitment)?

**Approach:**
- AI should extract both tags when ambiguous
- User can review and remove mismatched tags
- Confidence scoring helps (e.g., "pumped" 95% confidence, "commitment" 60% confidence)

**Example:**
```
Notes: "pumped but couldn't commit to the throw"

AI extracts:
- pumped (95% confidence)
- commitment (60% confidence)
- power (40% confidence) - weak match

User sees:
[pumped 95%] [commitment 60%] [power 40%]

User removes [power], keeps first two. Correct.
```

### Missing Information

**Problem:** Notes like "just fell" - no failure reason or style information

**Approach:**
- AI should NOT invent tags (hallucination prevention)
- Return empty arrays for missing information
- No tags is valid state
- Analytics will show "No tags" category (already handled)

### Typos and Colloquialisms

**Problem:** Notes like "gasd out, couldnt stick sloprs" - typos, slang

**Approach:**
- AI should handle typos natively (LLMs are robust to misspellings)
- Rule-based extraction uses fuzzy matching (Levenshtein distance)
- Synonym mapping: "gasd" -> "pumped", "couldnt" -> "couldn't stick" (precision failure?)

**Fuzzy matching parameters:**
- Threshold: 2-3 character differences for short words (< 8 chars)
- N-gram matching for longer phrases
- Phonetic matching for sound-alike words (optional enhancement)

### Conflicting Context

**Problem:** Notes like "fell on crimp start then pumped out on overhang finish" - multiple styles in one climb

**Approach:**
- Extract all relevant styles: [crimp, overhang]
- Extract all relevant failure reasons: [pumped]
- Analytics should handle multiple tags (already supported)
- No conflict, just multiple data points

### AI Hallucinations

**Problem:** AI extracts tags that don't exist in notes

**Approach:**
- Strong prompt engineering: "Only extract tags EXPLICITLY mentioned in notes"
- Provide tag vocabulary to AI (force it to choose from known list)
- User review catches hallucinations (human-in-the-loop)
- Confidence scoring helps: hallucinated tags usually low confidence

## Performance and Reliability Requirements

### Speed

- Tag extraction: < 3 seconds (72% of users cite performance as critical for app retention)
- Non-blocking save: climb saves immediately, tags appear shortly after
- Loading state: "AI analyzing your climb..." with spinner or progress indicator

### Reliability

- 95%+ extraction accuracy on clear, explicit notes (e.g., "crimpy overhang, pumped out")
- 85%+ accuracy on ambiguous notes (e.g., "couldn't stick the move")
- 70%+ accuracy on notes with typos/colloquialisms (e.g., "gasd out on sloprs")
- Graceful degradation: if AI fails, fallback to rule-based extraction

### Cost Control

- OpenRouter token limits: 500 tokens input (notes + prompt), 100 tokens output
- Daily extraction limits: 50 climbs/day (reasonable for recreational boulderers)
- Cache extraction results to avoid re-analyzing same notes on reload
- Queue offline extractions, batch process when online

### Privacy

- User notes are sent to AI service (OpenRouter) for extraction
- AI receives anonymized notes only (no user ID, email, etc.)
- AI model (Claude, GPT-4, etc.) does not store or learn from user data
- Local storage caches extraction results (cleared on app uninstall)

## User Experience Flows

### Primary Flow (Online)

1. User fills simplified logger form: grade, outcome, terrain, awkwardness, notes
2. User taps "Save climb"
3. Form validates and saves immediately (non-blocking)
4. Success message: "Climb saved! AI analyzing..."
5. After 2-3 seconds, extracted tags appear below success message:
   ```
   Extracted tags
   Styles: [crimp] [overhang]
   Failures: [pumped] [bad feet]
   ```
6. User taps tags to remove them (one tap)
7. User taps [+ Add tag] to add missing tags
8. Changes persist immediately
9. User continues to next climb or closes logger

### Offline Flow

1. User fills simplified logger form: grade, outcome, terrain, awkwardness, notes
2. User taps "Save climb"
3. Form validates and saves immediately (offline queue)
4. Success message: "Climb saved (offline)"
5. Rule-based extraction runs immediately (local, fast):
   ```
   Extracted tags (basic)
   Styles: [crimp] [overhang]
   Failures: [pumped]
   ```
6. User can edit tags (one tap to remove, [+ Add tag] to add)
7. When device regains connectivity:
   - AI processes queued extractions
   - Notification: "AI found 1 more tag for V5 crimpy overhang"
   - User can [Accept all] [Review] [Dismiss]
8. If user accepts, tags update and analytics refresh

### Edit Flow (Revisiting Old Climbs)

1. User navigates to climb detail view
2. User sees tags displayed with confidence indicators
3. User taps tag to remove
4. User taps [+ Add tag] to add
5. Changes persist immediately
6. Pattern analysis re-runs in background
7. Analytics update on next view

## Confidence Indicators - Deeper Dive

### Visual Design Options

**Option 1: Opacity (Recommended for MVP)**
```typescript
// High confidence (>80%): full opacity
[tag style="background: #3b82f6; opacity: 1">crimp</tag>

// Medium confidence (50-80%): reduced opacity
[tag style="background: #3b82f6; opacity: 0.7">overhang</tag>

// Low confidence (<50%): very reduced opacity
[tag style="background: #3b82f6; opacity: 0.5">sloper</tag>
```

**Option 2: Icon Indicator**
```typescript
// High confidence: no icon or checkmark
[tag]crimp ✓</tag>

// Medium confidence: question mark
[tag]overhang ?</tag>

// Low confidence: exclamation mark
[tag]sloper !</tag>
```

**Option 3: Percentage Text**
```typescript
[tag]crimp 92%</tag>
[tag]overhang 78%</tag>
[tag]sloper 54%</tag>
```

**Option 4: Color Coding**
```typescript
// High confidence (>80%): green
[tag style="border-left: 3px solid #22c55e">crimp</tag>

// Medium confidence (50-80%): yellow
[tag style="border-left: 3px solid #eab308">overhang</tag>

// Low confidence (<50%): red
[tag style="border-left: 3px solid #ef4444">sloper</tag>
```

**Recommendation:** Start with Option 1 (opacity) for MVP - simplest, unobtrusive, intuitive.

### Confidence Thresholds

**Tunable parameters:**
- High confidence: >= 80% (full opacity)
- Medium confidence: 50-79% (reduced opacity)
- Low confidence: < 50% (very reduced opacity)

**How to calibrate:**
- Manually test AI extraction on 50+ sample notes
- Compare AI output with "ground truth" (human-labeled tags)
- Adjust thresholds based on error rates
- If too many false positives at 80%, raise to 85%
- If too many false negatives at 50%, lower to 40%

### User Interpretation

**User education (one-time onboarding):**
```
AI Tag Confidence

High confidence (solid): AI is very sure this tag is correct

Medium confidence (faded): AI is somewhat sure, please review

Low confidence (very faded): AI is uncertain, consider removing
```

**After first use, no more education needed.**

## Feedback Loops and Model Improvement

### Manual Correction Tracking

**What to log:**
- User corrections (tags added, tags removed)
- Original AI-extracted tags
- Confidence scores for each tag
- Notes text that produced extraction
- User identity (for personalization, not for training shared model)

**How to use:**
- Identify systematic errors (e.g., AI always extracts "core" when user meant "power")
- Identify missing patterns (e.g., AI never extracts "focus" from "couldn't concentrate")
- Adjust prompt engineering to address common errors
- Add synonyms to keyword mapping for rule-based extraction

### A/B Testing (Post-MVP)

**Test variations:**
- Prompt A: "Extract tags from notes" vs Prompt B: "Identify climbing styles and failure reasons mentioned"
- Confidence thresholds: 70/80/85% for "high confidence"
- Fuzzy matching thresholds: 2/3/4 character differences for offline extraction

**Metrics:**
- User correction rate (how often users edit AI-extracted tags)
- Tag acceptance rate (how often users accept AI tags without editing)
- Time from save to edit (quick edits = AI wrong, no edits = AI right)
- Analytics engagement (do users interact with analytics more when tags are better?)

### Model Retraining (Future, Not MVP)

**Prerequisites:**
- 1000+ climbs with manual corrections logged
- Clear pattern of systematic errors identified
- Budget for custom model training (or fine-tuning open-source LLM)

**Approach:**
- Fine-tune small LLM (e.g., Llama 7B) on domain-specific climbing notes
- Deploy as on-device model for privacy and offline functionality
- Hybrid approach: on-device model for initial extraction, cloud model for ambiguous cases

**Why defer:** MLOps infrastructure, model hosting, cost, complexity. Start with cloud LLM (OpenRouter + Claude/GPT-4), fine-tune later if needed.

## Integration with Existing Scenka Features

### Current Climb Schema

```sql
CREATE TABLE climbs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  grade_scale text,
  grade_value text,
  outcome text CHECK (outcome IN ('Sent', 'Fail')),
  awkwardness integer CHECK (awkwardness BETWEEN 1 AND 5),
  styles text[], -- Will be auto-extracted in v2.1
  failure_reasons text[], -- Will be auto-extracted in v2.1
  notes text,
  hold_color text,
  created_at timestamp,
  redemption_at timestamp
);
```

**v2.1 changes:**
- `awkwardness` will change from 1-5 scale to enum (awkward/normal/smooth)
- `styles[]` will be auto-extracted from notes (no manual multi-select in logger)
- `failure_reasons[]` will be auto-extracted from notes (no manual multi-select in logger)
- `notes` becomes primary data source for AI extraction

### Current Pattern Analysis (src/services/patterns.ts)

**Existing dependency:**
- `extractFailurePatterns()` iterates over `climb.failure_reasons[]`
- `extractStyleWeaknesses()` iterates over `climb.styles[]`

**v2.1 changes:**
- No changes to pattern analysis logic
- AI-extracted tags populate same arrays
- Analytics continue to work unchanged
- Enhancement: Show "AI-extracted" badge on climbs with AI tags

### Current Coach Service

**Existing dependency:**
- Coach queries pattern analysis
- Pattern analysis depends on tags

**v2.1 changes:**
- No changes to coach service
- Better tags = better pattern analysis = better coach recommendations
- Enhancement: Coach can reference AI-extracted tags in advice (e.g., "Your logs show you struggle with bad feet on overhangs")

## Sources

### User Expectations and Performance
- [Mobile App UX: 7 Ways AI is Transforming UX in 2025](https://procreator.design/blog/ways-ai-transforming-mobile-app-ux/) - Predictive design, mapping user states, flexible flows (MEDIUM confidence)
- [Mobile User Expectations in 2025](https://www.luciq.ai/mobile-user-expectations-2025) - 72% of users cite performance as critical, 71% more likely to share data with transparent AI usage, 44% concerned about accuracy, 52% about data security (HIGH confidence - survey data)

### Human-in-the-Loop Patterns
- [Human-in-the-Loop AI (HITL) - Complete Guide](https://parseur.com/blog/human-in-the-loop-ai) - Accuracy rates up to 99.9% with human verification, hybrid workflows, pre-labeling with automation then human verification based on confidence thresholds (HIGH confidence)
- [Human-in-the-Loop Review Workflows](https://www.comet.com/site/blog/human-in-the-loop/) - Practical approaches to human oversight in AI applications (MEDIUM confidence)
- [Human in the Loop: The Key to Value Creation in AI](https://spd.tech/artificial-intelligence/human-in-the-loop/) - HITL combines automated data processing with human oversight to ensure accuracy (MEDIUM confidence)

### Confidence Scoring
- [Power Platform AI Week: Human-in-the-Loop Approvals with AI Confidence Scoring](https://www.linkedin.com/pulse/power-platform-ai-week-day-6-human-in-the-loop-scoring-marcel-broschk-m8oaf) - Use confidence scores as discriminators, persist raw input, extracted values, per-field confidence scores, human reviewer identity, edits made (MEDIUM confidence)
- [Evaluate Model Performance - Appian 25.4](https://docs.appian.com/suite/help/25.4/evaluate-ai.html) - Machine learning models apply confidence scores to predictions, use in training and production (MEDIUM confidence)
- [Building Trust in GenAI Applications: A New Confidence Score Approach](https://egen.ai/insights/genai-confidence-score-trust-framework/) - Confidence score models for measuring trustworthiness of GenAI output (MEDIUM confidence)

### Offline Behavior and Fallbacks
- [AI-Powered App Features — What Developers Need to Know in 2025](https://medium.com/@swatimishra2824/ai-powered-app-features-what-developers-need-to-know-in-2025-f2fbb9863e14) - Dedicated AI service layer, caching for embeddings and responses, fallback flows when AI unavailable, apps with AI features see 40-60% higher engagement (MEDIUM confidence)
- [Integrating LLMs in Mobile Apps: Challenges & Best Practices (2025)](https://www.theusefulapps.com/news/integrating-llms-mobile-challenges-best-practices-2025) - Combine on-device and cloud processing, plan robust fallback mechanisms, cache frequently accessed model outputs, functions completely offline with no network latency (MEDIUM confidence)
- [On-Device AI & GenAI Agents: How Mobile Apps Will Be Transformed](https://www.linkedin.com/pulse/on-device-ai-genai-agents-how-mobile-apps-transformed-melby-thomas-zyflc) - On-device AI for privacy, speed, and offline functionality, quantization reduces model size 75%+ (MEDIUM confidence)

### NLP Entity Extraction
- [What is Entity Extraction? A Beginner's Guide - Google Cloud](https://cloud.google.com/discover/what-is-entity-extraction) - NLP techniques identify and categorize key information within text, scalable for real-time or batch processing, choose appropriate technique (rule-based, ML, deep learning, hybrid) based on requirements (MEDIUM confidence)
- [7 NLP Techniques for Extracting Information from Unstructured Text](https://www.width.ai/post/extracting-information-from-unstructured-text-using-algorithms) - POS tagging, context for words, build better understanding of key information, can train models on domain-specific data (MEDIUM confidence)

### Edge Cases and Typos
- [Raw Text Correction with Fuzzy Matching for NLP Tasks](https://towardsdatascience.com/raw-text-correction-with-fuzzy-matching-for-nlp-tasks-828547742ef7/) - Use fuzzy string matching and regex to correct erroneous words, keep raw text unchanged (MEDIUM confidence)
- [Exploring NLP Fuzzy Matching Algorithms](https://www.youtube.com/watch?v=__Ysw69Hiw0) - Levenshtein distance algorithm, n-gram matching, handles partial words and misspelled words (MEDIUM confidence)
- [Rule-based Matching - spaCy Documentation](https://spacy.io/usage/rule-based-matching) - Fuzzy matching v3.5 allows matching tokens with alternate spellings, typos without specifying every variant (MEDIUM confidence)
- [Misspellings in Natural Language Processing: A Survey - arXiv](https://arxiv.org/html/2501.16836v1) - NLP models struggle with misspellings, causes decline in performance, robustness is system's ability to effectively process text with errors (LOW confidence - survey paper, not implementation guidance)

### Edge Case Handling
- [Handling Edge Cases - The Interactive Book of Prompting](https://prompts.chat/book/12-handling-edge-cases) - Users send empty messages, paste walls of text, make ambiguous requests, try to break systems intentionally (MEDIUM confidence)
- [How to Create LLM Test Datasets with Synthetic Data - Evidently AI](https://www.evidentlyai.com/llm-guide/llm-test-dataset-synthetic-data) - Edge cases are less common but plausible queries that are tricky for AI to handle, might be long, ambiguous (MEDIUM confidence)
- [Demystifying Evals for AI Agents - Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) - Effective evals rely on verifiable end-state outcomes and rubrics that capture both task completion and interaction quality (HIGH confidence - official Anthropic documentation)

### AI Analytics and Insights
- [AI Analytics: What It Is and How It Transforms Data into Insights](https://zapier.com/blog/ai-analytics/) - AI analytics automatically processes, analyzes, and extracts insights from data, automates pattern identification (MEDIUM confidence)
- [What is Log Analysis with AI? - IBM](https://www.ibm.com/think/topics/ai-for-log-analysis) - AI helps automate log analysis, identify patterns and anomalies, deliver real-time insights, predict analytics helps understand user interactions by identifying patterns in customer behavior (MEDIUM confidence)
- [AI-Driven Log Analytics for Custom Applications in OCI](https://www.ateam-oracle.com/aidriven-log-analytics-for-custom-applications-in-oci) - Custom log sources and parsers, regex parser with multi-line handling, ML-based visualizations for clustering, use LoganAI for rapid insights (LOW confidence - vendor-specific documentation)

### Climbing App Context
- [TopLogger](https://toplogger.nu/) - Indoor climbing management app with "Smart route tags" mentioned but no AI auto-tagging details available (LOW confidence - no specific AI information found)
- [Redpoint: Bouldering, Climbing - App Store](https://apps.apple.com/us/app/redpoint-bouldering-climbing/id1324072645) - Tracks climbs automatically, provides personalized training suggestions based on data, but no mention of AI auto-tagging from notes (LOW confidence - description doesn't mention auto-tagging)
- [Climbing Performance Analysis: A Novel Tool](https://www.researchgate.net/publication/338682414_Climbing_performance_analysis_A_novel_tool_for_the_assessment_of_rock_climber's_movement_performance) - Discusses climbing performance analysis methods, failure and success metrics (LOW confidence - research paper, not app feature description)

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes - Performance expectations | HIGH | Survey data confirms 72% cite performance as critical (Luciq survey) |
| Table Stakes - Human-in-the-loop | HIGH | Multiple authoritative sources confirm HITL is best practice |
| Table Stakes - Offline fallback | MEDIUM | Multiple sources recommend fallback strategies, but implementation patterns vary |
| Differentiators - Climbing-specific NLP | MEDIUM | No direct climbing app examples, but entity extraction is well-documented |
| Anti-Features - Blocking AI | HIGH | UX best practices confirm blocking interactions create friction |
| Edge cases - Typos/Fuzzy matching | MEDIUM | Fuzzy matching algorithms well-documented, but climbing-specific mapping untested |
| Confidence indicators - Visual design | LOW | No mobile UI patterns found for confidence display, design recommendations are hypothetical |
| Integration with analytics | HIGH | Codebase review confirms current analytics depend on tag arrays |
| Cost control considerations | LOW | No cost benchmarks found for OpenRouter with climbing prompts, estimates based on token limits |

## Gaps Requiring Phase-Specific Research

- **Climbing-specific prompt engineering:** What prompts produce the most accurate tag extraction from climbing notes? Requires testing with real user notes.
- **Confidence calibration:** What confidence thresholds work best in practice? Requires manual testing on 50+ sample notes.
- **User education for confidence indicators:** How to communicate confidence to users without cognitive overhead? Requires user testing.
- **Cost benchmarking:** What are actual token usage and costs for climbing-specific extraction? Requires implementation and monitoring.
- **Offline vs online quality gap:** How much accuracy loss from rule-based vs AI extraction? Requires A/B testing.
- **User acceptance of AI corrections:** Will users accept "AI found more tags" notifications, or find it annoying? Requires user testing.
