# Scenka

![Scenka logo](./logo.png)

A personal climbing tracker built for climbers who want to get better, not just log sends. Exception logging, failure-focused, privacy-first, and offline-ready.

> [!IMPORTANT]
> This project is completely and utterly vibe-coded. No human-written code here.
> If that turns you away that's fine. Here's another thing to turn you away:
> this is completely for my personal enjoyment and I make no guarantees as to
> how, when and if bugs will be fixed or features will be added.

## What Makes Scenka Different

Scenka follows an "exception logging" philosophy — only log significant climbs (failed projects, awkward sends) rather than every session. Less friction, more focus on what matters.

- **Failure-focused tracking** — Emphasize what went wrong (technique failures) vs just tracking sends 🧗
- **Multiple grading scales** — Font, V-Scale, Color Circuit
- **Detailed failure analysis** — Track style tags (Slab, Overhang, Dyno, etc.) and failure reasons (Physical, Technical, Mental)
- **Privacy-first** — No social feeds, no public profiles, your data stays yours 🔒
- **Offline-first PWA** — Works in gyms with zero signal, no app store required ⚡
- **Hold color tracking** — Mark climbs by hold color to easily find them again

## AI Coach (New in v2.0) 🧠

Scenka includes an AI-powered climbing coach that analyzes your logged data to provide personalized training guidance. Focuses on technique development with privacy-first design and climbing-specific domain knowledge.

**Features:**

- Weekly Focus: Personalized 1-2 sentence focus based on your failure patterns
- Training Drills: 3 specific technique drills with sets, reps, and measurable outcomes
- Pattern Analysis: Visual breakdown of failure reasons, style weaknesses, and climbing frequency
- Chat Interface: Free-form Q&A with streaming responses for deeper learning
- Projecting Focus: Suggestions for what to climb each week based on weaknesses
- Climbing Context: Customizable context (like ChatGPT custom instructions) for personalized coaching

### Privacy Safeguards

Your climbing data never leaves without anonymization:

- Gym names and crags anonymized before LLM processing (indoor_gym, outdoor_crags)
- Profile data (email, name) never included in LLM requests
- Row Level Security ensures users can only access their own recommendations
- Recent climb notes filtered for PII (>200 character threshold with runtime validation)
- All data sent to OpenRouter via secure Edge Functions (no client-side API calls)

### Setup Instructions

To enable AI Coach features, set up OpenRouter and deploy Edge Functions:

1. Get OpenRouter API key:
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Generate API key from dashboard

2. Set OpenRouter secrets in Supabase:

   ```bash
   supabase secrets set OPENROUTER_API_KEY=your_key_here
   supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-pro
   ```

3. Deploy Edge Functions:

   ```bash
   supabase functions deploy openrouter-coach
   supabase functions deploy openrouter-chat
   supabase functions deploy openrouter-tag-extract
   ```

4. Apply database migrations (adds coach tables and climbing_context):
   ```bash
   npx supabase db push
   ```

### Usage

1. Log at least 3-5 climbs with detailed tags and failure reasons
2. Navigate to Coach tab
3. Click "Generate Recommendations" to get weekly focus, drills, and pattern analysis
4. Add climbing context in Settings (optional): Describe your climbing style, goals, preferences
5. Click "Ask Coach a Question" to chat about specific techniques, drills, or climbing concepts
6. Regenerate recommendations weekly for fresh analysis

<!-- TODO: Capture screenshot from app -->

![Screenshot: Coach page with weekly focus, training drills, and pattern analysis tabs](./docs/screenshots/coach-page.png)

_[Capture from: Navigate to Coach tab, showing Recommendations tab with Weekly Focus, Training Drills, Projecting Focus sections, and Pattern Analysis tab with failure patterns, style weaknesses, and climbing frequency]_

## Auto-Tagging (New in v2.0) 🏷️

Scenka includes AI-powered automatic tag extraction that analyzes your climb notes to suggest relevant style tags and failure reasons. Reduces logging friction while maintaining control over your data.

**Features:**

- **Smart Extraction**: Analyzes your free-form notes to extract climbing tags automatically
- **Style Tags**: Detects Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch from descriptions
- **Failure Reasons**: Identifies Physical (Pumped, Finger Strength, Core, Power), Technical (Bad Feet, Body Position, Beta Error, Precision), and Mental (Fear, Commitment, Focus) patterns
- **Smart Merging**: AI tags merge with your manual selections (union, not replacement) — you always have final control
- **Privacy-First**: Notes are anonymized before AI processing
- **Fast**: Completes within 3 seconds with 70%+ confidence threshold
- **Non-Blocking**: Fire-and-forget operation — your climb saves immediately, tagging happens in background

### Privacy Safeguards

Your notes are protected during AI processing:

- Gym names and specific location references anonymized before LLM processing
- Profile data (email, name) never included in AI requests
- All data sent to OpenRouter via secure Edge Functions (no client-side API calls)
- 70% confidence threshold ensures only high-confidence tags are auto-applied
- Maximum 1000 tokens per extraction limits data exposure

### Usage

1. When logging a climb, write detailed notes about the route or problem
2. Save the climb — tags are extracted automatically in the background
3. AI-suggested tags merge with any manual tags you selected
4. Remove or modify any tags you disagree with — you always have control

### Daily Quota

Each user limited to 50 tag extractions/day to balance utility with cost control. Quota resets at UTC midnight automatically.

### Example

**Note:** "Pumped out on the crimps at the top, but the feet were bad the whole time. Overhung section at the start felt easy."

**Auto-Extracted Tags:**

- Style: Overhang, Crimp
- Failure Reasons: Physical: Pumped, Technical: Bad Feet

---

## Tech Stack

- **React 18** + **TypeScript** + **Vite** — Fast, type-safe frontend ⚛️
- **Supabase** — PostgreSQL database, authentication, and realtime sync
- **shadcn/ui** — Beautiful, accessible UI components
- **TanStack Query** — Server state management and caching
- **Zod** — Schema validation and type safety
- **react-hook-form** — Form state management
- **Recharts** — Data visualization for analytics 📊
- **PWA** — Service worker for offline capability

## Quick Start 🚀

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Available Scripts ⚙️

- `pnpm dev` — Start Vite dev server
- `pnpm build` — Production build (includes TypeScript compilation)
- `pnpm preview` — Preview production build locally
- `pnpm lint` — ESLint check
- `pnpm format` — Prettier format
- `pnpm typecheck` — TypeScript type checking
- `pnpm test` — Run all tests

## Screenshots 📱

<!-- TODO: Capture screenshot from app -->

![Screenshot: Logger form with grade picker, outcome selection, and multi-select style tags](./docs/screenshots/logger-form.png)

<!-- TODO: Capture screenshot from app -->

![Screenshot: Analytics dashboard showing failure breakdown by category](./docs/screenshots/analytics-dashboard.png)

<!-- TODO: Capture screenshot from app -->

![Screenshot: Settings page with hold color preferences and grade scale selection](./docs/screenshots/settings-page.png)

<!-- TODO: Capture screenshot from app -->

![Screenshot: Climb history view with list of logged climbs and details](./docs/screenshots/climb-history.png)
