# Architecture Patterns

**Domain:** AI auto-tagging integration for climbing logging app
**Researched:** 2026-01-20
**Overall confidence:** HIGH

## Recommended Architecture

### System Overview

AI auto-tagging integrates with existing Scenka architecture through asynchronous background processing, maintaining app's core value of "quick, frictionless climb logging" while adding intelligent tag extraction from user notes.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (PWA)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Simplified   │──→│ Tag Service  │──→│ TanStack     │      │
│  │   Logger     │  │  (create)   │  │   Query      │      │
│  │  (NEW)      │  │              │  │  mutations   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                      │                    ↓                     │
└──────────────────────┼────────────────────┼────────────────────┘
                       │                    │
            Online →    │                    │
           ┌──────────▼────────────────────▼──────────────────┐
           │         Supabase Edge Functions                │
           │  ┌──────────────────────────────────────────┐  │
           │  │   openrouter-tag-extractor (NEW)       │  │
           │  │   - JWT auth (reuse v2.0 pattern)    │  │
           │  │   - OpenRouter API call               │  │
           │  │   - Tag extraction from notes         │  │
           │  │   - Response validation               │  │
           │  └──────────────────────────────────────────┘  │
           └──────────────────┬─────────────────────────────┘
                              │
                              ↓
           ┌──────────────────────────────────────────┐
           │         PostgreSQL Database             │
           │  ┌────────────────────────────────┐   │
           │  │   climbs table (modified)     │   │
           │  │   - styles[] (AI + manual)   │   │
           │  │   - failure_reasons[]         │   │
           │  │   - notes                    │   │
           │  │   - tags_pending_sync (new)   │   │
           │  └────────────────────────────────┘   │
           └──────────────────────────────────────────┘

Offline Path:
SimplifiedLogger → Offline Queue → localStorage → Sync Manager → (when online) → Supabase
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **SimplifiedLogger** (NEW) | Form input: grade, outcome, terrain type (8 options), awkwardness (3 options), notes. NO manual tag selectors. | TagService, TanStack Query mutations, UI feedback components |
| **TagService** (NEW) | Orchestrates AI tag extraction. Handles online/offline scenarios. Integrates with existing createClimb flow. | Edge Functions (openrouter-tag-extractor), OfflineQueue, Database (climbs table) |
| **TagConfirmationDialog** (NEW) | Displays AI-extracted tags after save. Allows user to confirm/edit/delete tags. | TagService, TanStack Query update mutation |
| **openrouter-tag-extractor** (NEW Edge Function) | Receives climb notes + context. Calls OpenRouter API to extract style and failure_reason tags. Returns validated JSON. | OpenRouter API (external), Supabase (auth, write to coach_api_usage) |
| **AnalyticsCharts** (MODIFIED) | Updated to display AI-extracted tags alongside existing analytics. | Database (climbs table), patterns service (existing) |
| **Logger** (EXISTING, to be phased out) | Current full-featured logger with manual tag selectors. | climbs service, TanStack Query (no changes) |

### Data Flow

#### Online Flow (Happy Path)

```
1. User fills simplified logger form:
   - Grade, outcome, terrain type, awkwardness, notes
   - NO manual style/failure_reason selection required

2. User taps "Log Climb":
   - Form validates (Zod schema)
   - useCreateClimbWithTags mutation starts

3. createClimbWithTags in TagService:
   a. Create climb record in database (without tags)
   b. Mark tags_pending_sync = true
   c. Return climb ID to UI immediately
   d. UI shows "Saved" + "Extracting tags..." indicator (non-blocking)

4. openrouter-tag-extractor Edge Function (background):
   - Validates JWT (from user session token)
   - Receives notes + user preferences (existing pattern from v2.0)
   - Extracts relevant tags from notes:
     * Style tags: Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch, Compression, Tension
     * Failure reason tags: Physical (Pumped, Finger Strength, Core, Power, Flexibility, Balance, Endurance), Technical (Bad Feet, Body Position, Beta Error, Precision, etc.), Mental (Fear, Commitment, Focus)
   - Returns: { styles: [], failure_reasons: [] }
   - Tracks usage in coach_api_usage table (reuse existing tracking)

5. TagService receives AI tags:
   - Update climb record with extracted tags
   - Set tags_pending_sync = false
   - Invalidate TanStack Query cache (climbs)
   - Trigger UI refresh

6. User sees extracted tags:
   - Toast notification: "Tags extracted: Slab, Bad Feet"
   - Tap notification or climb card to review/edit
   - TagConfirmationDialog opens with extracted tags
   - User can add/remove/edit tags
   - Confirm saves final tags to database
   - Tags are now final and visible in analytics
```

#### Offline Flow

```
1. User fills form + taps save (offline):
   - Form validates (Zod schema)
   - OfflineQueue.add('create', 'climbs', data + { tags_pending_sync: true })
   - UI shows "Saved (will sync when online)"
   - Tags: "Not extracted yet (requires connection)"

2. User goes online:
   - Sync Manager processes offline queue
   - Climbs sync to database (without tags)
   - Tags pending extraction remain flagged

3. Retroactive tag extraction (automatic):
   - On next app load (or manual trigger), query climbs where tags_pending_sync = true
   - Call openrouter-tag-extractor for each climb with notes
   - Update database with extracted tags
   - Clear pending flag
   - User sees progress: "Upgrading 3 climbs with AI tags..."

4. Updated tags sync back to device via TanStack Query cache invalidation
```

### Patterns to Follow

#### Pattern 1: Async AI Tag Extraction with Optimistic UI

**What:** Save climb immediately, extract tags in background, show progress indicator.

**When:** Always use for AI operations. Users shouldn't wait for LLM response to complete save action.

**Why:** Maintains "quick, frictionless" core value. AI extraction adds 1-3s delay, which blocks logging flow if synchronous.

**Example:**
```typescript
// src/services/tags.ts (NEW service)
export async function createClimbWithTags(input: CreateClimbInput) {
  const { user } = await supabase.auth.getUser()

  // 1. Create climb record immediately (without tags)
  const { data: climb, error } = await supabase
    .from('climbs')
    .insert({
      ...input,
      user_id: user.id,
      tags_pending_sync: true, // Mark for AI processing
    })
    .select()
    .single()

  if (error) throw error

  // 2. Trigger background tag extraction (fire and forget)
  if (input.notes && input.notes.trim().length > 0) {
    extractTagsAsync(climb.id, input.notes, user.id).catch((err) => {
      console.error('Tag extraction failed:', err)
      // Tags remain empty, user can manually add later via edit
    })
  }

  return climb // Return immediately, don't wait for AI
}

// Background extraction (fire and forget)
async function extractTagsAsync(climbId: string, notes: string, userId: string) {
  const { data: { session } } = await supabase.auth.getSession()

  try {
    const { data, error } = await supabase.functions.invoke('openrouter-tag-extractor', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { climb_id: climbId, notes, user_id: userId },
    })

    if (error) throw new Error(error.message)

    // Update climb with extracted tags
    await supabase
      .from('climbs')
      .update({
        style: data.styles || [],
        failure_reasons: data.failure_reasons || [],
        tags_pending_sync: false,
      })
      .eq('id', climbId)

    // Invalidate cache to show updated tags
    queryClient.invalidateQueries({ queryKey: climbsKeys.lists() })
  } catch (error) {
    console.error('Tag extraction failed for climb:', climbId, error)
    // Tag extraction failure doesn't block the climb from being saved
    // User can manually add tags later
  }
}
```

#### Pattern 2: Existing Edge Function Reuse

**What:** Copy auth, validation, error handling patterns from `openrouter-coach` to `openrouter-tag-extractor`.

**When:** Building new Edge Functions for external API calls.

**Why:** Consistent security, rate limiting, and error handling patterns already battle-tested in v2.0.

**Key patterns to reuse from openrouter-coach:**
- JWT token validation via `supabase.auth.getUser()`
- CORS preflight handling
- Retry loop with MAX_RETRIES (3)
- Response validation with Zod-like structure checks
- Cost tracking in `coach_api_usage` table
- Error fallback (return partial results vs fail completely)

**Example (simplified):**
```typescript
// supabase/functions/openrouter-tag-extractor/index.ts (NEW)
import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENROUTER_API_KEY')!,
  baseURL: 'https://openrouter.ai/api/v1',
})

const systemPrompt = `You are a climbing coach extracting structured tags from climbing notes.

Extract ONLY the following tag categories:
1. Style tags: Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch, Compression, Tension
2. Failure reason tags (Physical): Pumped, Finger Strength, Core, Power, Flexibility, Balance, Endurance
3. Failure reason tags (Technical): Bad Feet, Body Position, Beta Error, Precision, Precision (Feet), Precision (Hands), Coordination (Hands), Coordination (Feet), Foot Swap, Heel Hook, Toe Hook, Rockover, Pistol Squat, Drop Knee, Twist Lock, Flagging, Dyno, Deadpoint, Latch, Mantle, Undercling, Gaston, Match, Cross
4. Failure reason tags (Mental): Fear, Commitment, Focus

Return ONLY valid JSON:
{
  "styles": ["Slab", "Crimp"],
  "failure_reasons": ["Pumped", "Bad Feet"]
}

If no tags found, return empty arrays. Do not invent tags not in the lists above.`

interface RequestBody {
  climb_id: string
  notes: string
  user_id: string
}

Deno.serve(async (req: Request) => {
  // 1. CORS preflight (reuse pattern from openrouter-coach)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  // 2. Extract and validate JWT (reuse pattern)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: claimsError } = await supabase.auth.getUser(token)

  if (claimsError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  // 3. Parse request body
  const body: RequestBody = await req.json()

  if (!body.climb_id || !body.notes || !body.user_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  // 4. Verify user_id matches token
  if (body.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
      status: 403,
      headers: corsHeaders,
    })
  }

  // 5. Call OpenRouter API (reuse client pattern)
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: Deno.env.get('OPENROUTER_MODEL')!,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract tags from these climbing notes:\n\n${body.notes}` },
        ],
        temperature: 0.3, // Low temp for consistent tag extraction
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('Empty response from AI')

      // 6. Validate response structure (reuse pattern)
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())

      if (!parsed.styles || !Array.isArray(parsed.styles)) {
        throw new Error('Invalid styles array in response')
      }
      if (!parsed.failure_reasons || !Array.isArray(parsed.failure_reasons)) {
        throw new Error('Invalid failure_reasons array in response')
      }

      // 7. Update database with extracted tags
      const { error: updateError } = await supabase
        .from('climbs')
        .update({
          style: parsed.styles,
          failure_reasons: parsed.failure_reasons,
          tags_pending_sync: false,
        })
        .eq('id', body.climb_id)

      if (updateError) {
        throw new Error(`Failed to update climb: ${updateError.message}`)
      }

      // 8. Track API usage (reuse pattern)
      const costUsd = response.usage.cost || 0
      await supabase.from('coach_api_usage').insert({
        user_id: user.id,
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
        cost_usd: costUsd,
        model: Deno.env.get('OPENROUTER_MODEL')!,
        endpoint: 'openrouter-tag-extractor',
        time_window_start: new Date().toISOString(),
      })

      // 9. Return success response
      return new Response(
        JSON.stringify({ styles: parsed.styles, failure_reasons: parsed.failure_reasons }),
        { headers: corsHeaders }
      )
    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.message)

      // If last attempt, return error
      if (attempt === MAX_RETRIES - 1) {
        console.error('Tag extraction failed after retries:', error.message)

        // Track failed attempt with cost=0
        await supabase.from('coach_api_usage').insert({
          user_id: user.id,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost_usd: 0,
          model: Deno.env.get('OPENROUTER_MODEL')!,
          endpoint: 'openrouter-tag-extractor',
          time_window_start: new Date().toISOString(),
        }).catch((e) => console.error('Failed to track error:', e))

        return new Response(
          JSON.stringify({ error: `Tag extraction failed: ${error.message}` }),
          { status: 500, headers: corsHeaders }
        )
      }

      // Continue to next retry
      continue
    }
  }

  throw new Error('Unexpected error: retry loop completed without result')
})
```

#### Pattern 3: Offline Queue Extension

**What:** Extend existing `offlineQueue` to handle pending tag extraction state.

**When:** User saves climb while offline.

**Why:** Existing offline queue already handles create/update/delete mutations. Tag extraction is a post-save async operation.

**Example:**
```typescript
// src/services/offlineQueue.ts (extend existing)
interface QueuedMutation {
  id: string
  type: 'create' | 'update' | 'delete'
  tableName: string
  data: any
  timestamp: number
  tags_pending_sync?: boolean // NEW: flag for retroactive AI tagging
}

// src/services/tags.ts
export async function createClimbWithTags(input: CreateClimbInput) {
  const { user } = await supabase.auth.getUser()

  if (!navigator.onLine) {
    // Queue climb with tag extraction flag
    offlineQueue.add('create', 'climbs', {
      ...input,
      user_id: user.id,
      tags_pending_sync: true, // Mark for retroactive extraction
    })
    return optimisticClimb // Return optimistic result
  }

  // Online: create + async tag extraction (Pattern 1)
  const { data, error } = await supabase
    .from('climbs')
    .insert({
      ...input,
      user_id: user.id,
      tags_pending_sync: true,
    })
    .select()
    .single()

  if (error) throw error

  // Trigger background extraction
  if (input.notes) {
    extractTagsAsync(data.id, input.notes, user.id)
  }

  return data
}

// src/lib/syncManager.ts (extend existing)
export async function syncOfflineQueue(): Promise<void> {
  const mutations = offlineQueue.getAll()

  if (mutations.length === 0) return

  if (!supabase) {
    console.error('Supabase client not configured')
    return
  }

  console.log(`Syncing ${mutations.length} offline mutations...`)

  for (const mutation of mutations) {
    try {
      switch (mutation.type) {
        case 'create':
          await supabase.from(mutation.tableName).insert(mutation.data)
          break
        case 'update':
          await supabase
            .from(mutation.tableName)
            .update(mutation.data.updates)
            .eq('id', mutation.data.id)
          break
        case 'delete':
          await supabase.from(mutation.tableName).delete().eq('id', mutation.data.id)
          break
      }
      offlineQueue.remove(mutation.id)
    } catch (error) {
      console.error(`Failed to sync mutation ${mutation.id}:`, error)
      // Keep in queue for next sync attempt
    }
  }

  // After sync, trigger retroactive tag extraction for climbs with notes
  await processRetroactiveTagging()
}

// NEW: Retroactive tag extraction for climbs waiting for AI
async function processRetroactiveTagging(): Promise<void> {
  const { data: climbs } = await supabase
    .from('climbs')
    .select('id, notes')
    .eq('tags_pending_sync', true)
    .is('notes', null, false)

  if (!climbs || climbs.length === 0) return

  console.log(`Retroactively tagging ${climbs.length} climbs...`)

  const { data: { user } } = await supabase.auth.getUser()

  for (const climb of climbs) {
    if (climb.notes) {
      try {
        await extractTagsAsync(climb.id, climb.notes, user.id)
      } catch (error) {
        console.error(`Failed to retroactively tag climb ${climb.id}:`, error)
        // Continue with next climb, don't block entire batch
      }
    }
  }
}

// Make retroactive tagging callable from UI (e.g., on app load)
export async function triggerRetroactiveTagging(): Promise<void> {
  if (!navigator.onLine) {
    console.warn('Cannot trigger retroactive tagging while offline')
    return
  }
  await processRetroactiveTagging()
}
```

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Blocking AI Extraction on Save

**What:** Wait for AI response before returning from `createClimb` mutation.

**Why bad:** Adds 1-3s delay to every save action. Violates "quick, frictionless" core value. Gym environment often has poor connectivity.

**Consequences:** Users abandon logging, reduced engagement, app feels sluggish.

**Instead:** Use async background extraction (Pattern 1). Save immediately, extract tags in background, show progress indicator.

#### Anti-Pattern 2: Separate Manual/AI Tag Arrays

**What:** Add `ai_extracted_styles[]` and `manual_styles[]` columns to database.

**Why bad:** Unnecessary complexity. Analytics need combined view. User should be able to override AI suggestions, not maintain separate sources.

**Consequences:** Schema bloat, confusing analytics display, more complex queries.

**Instead:** Single `styles[]` array. AI tags populate it initially, user can edit. Source doesn't matter, final tags do.

#### Anti-Pattern 3: Tag Extraction Without User Confirmation

**What:** Automatically save AI tags without user review.

**Why bad:** AI makes mistakes. User needs control over their data. Climbing terminology is nuanced (e.g., "sloper crimp" vs "crimp").

**Consequences:** Incorrect analytics, user distrust of AI, manual corrections required.

**Instead:** Show extracted tags after save, allow user to confirm/edit (TagConfirmationDialog).

#### Anti-Pattern 4: Synchronous Retry on Failure

**What:** If AI extraction fails, retry immediately in loop blocking user action.

**Why bad:** OpenRouter API may be down or rate-limited. Blocking user for retries is terrible UX.

**Consequences:** App hangs, user force-quits, tags never extracted.

**Instead:** Fire-and-forget extraction. If it fails, climb saves without tags. User can manually add tags later, or retroactive extraction can retry on next app load.

### Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Tag extraction latency** | Edge Functions handle <1s per request | Scale horizontally with Supabase's auto-scaling | Consider queue + background workers for cost optimization |
| **Database queries** | Direct reads/writes fine | Index on `tags_pending_sync` for retroactive extraction | Read replicas for analytics queries |
| **API costs** | OpenRouter: ~$0.001/climb | Monitor `coach_api_usage` table, add rate limits if needed | Batch processing for retroactive extraction, consider cheaper models |
| **Offline queue size** | localStorage handles 100s of mutations | localStorage limit ~5MB (sufficient for climbing data) | Migrate to IndexedDB for larger offline datasets |
| **Edge Function timeout** | 25s limit plenty for single tag extraction | Same, ensure prompts stay concise | Use Supabase Queues for batch retroactive extraction |

### Database Schema Changes

#### New Columns

```sql
-- Migration: v2.1_add_ai_tagging_support.sql

-- Add to climbs table
ALTER TABLE public.climbs
ADD COLUMN IF NOT EXISTS tags_pending_sync BOOLEAN NOT NULL DEFAULT false;

-- Index for retroactive extraction queries
CREATE INDEX IF NOT EXISTS climbs_tags_pending_idx
ON public.climbs(tags_pending_sync)
WHERE tags_pending_sync = true;

-- Optional: Track AI extraction confidence (for debugging/analytics)
-- Add only if needed for monitoring user trust in AI
ALTER TABLE public.climbs
ADD COLUMN IF NOT EXISTS ai_extraction_confidence JSONB DEFAULT '{}'::jsonb;
-- Structure: { styles: 0.85, failure_reasons: 0.72 }

-- RLS: Allow users to update new columns
CREATE POLICY "Users can update tags_pending_sync"
ON public.climbs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update ai_extraction_confidence"
ON public.climbs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### Migration Strategy

**Approach:** Additive migration with backward compatibility.

```sql
-- Step 1: Add new columns with defaults (safe for existing data)
ALTER TABLE public.climbs ADD COLUMN tags_pending_sync BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create index for efficient queries
CREATE INDEX climbs_tags_pending_idx ON public.climbs(tags_pending_sync) WHERE tags_pending_sync = true;

-- Step 3: Update RLS policies
DROP POLICY IF EXISTS "Users can update own climbs" ON public.climbs;
CREATE POLICY "Users can update own climbs"
  ON public.climbs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migration complete - no data loss, existing climbs have tags_pending_sync = false
```

### Retroactive Tagging for Existing Data

**Approach:** Batch job triggered on first v2.1 launch.

```typescript
// src/services/tags.ts (NEW)
export async function tagExistingClimbsForUser(userId: string) {
  // Check if user already processed
  const { data: profile } = await supabase
    .from('profiles')
    .select('tags_migration_completed')
    .eq('id', userId)
    .single()

  if (profile?.tags_migration_completed) {
    console.log('User already migrated, skipping')
    return
  }

  // Get climbs with notes but empty tags
  const { data: climbs } = await supabase
    .from('climbs')
    .select('id, notes, style, failure_reasons')
    .eq('user_id', userId)
    .is('notes', null, false)
    .in('style', [null, [], '{}'])
    .in('failure_reasons', [null, [], '{}'])

  if (!climbs || climbs.length === 0) {
    // Mark as complete even if no climbs to tag
    await supabase
      .from('profiles')
      .update({ tags_migration_completed: true })
      .eq('id', userId)
    return
  }

  console.log(`Retroactively tagging ${climbs.length} climbs for user ${userId}`)

  // Process in batches of 10 (Edge Function timeout safe)
  const batchSize = 10
  for (let i = 0; i < climbs.length; i += batchSize) {
    const batch = climbs.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (climb) => {
        try {
          await extractTagsAsync(climb.id, climb.notes, userId)
        } catch (error) {
          console.error(`Failed to tag climb ${climb.id}:`, error)
          // Continue with next climb, don't block entire migration
        }
      })
    )

    // Add small delay between batches to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Mark migration complete
  await supabase
    .from('profiles')
    .update({ tags_migration_completed: true })
    .eq('id', userId)

  console.log('Retroactive tagging complete')
}

// Add migration column to profiles table
-- Migration SQL (add to v2.1 migration)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tags_migration_completed BOOLEAN NOT NULL DEFAULT false;
```

**User experience:** Show "Upgrading your climbing data with AI tags..." progress bar on first v2.1 launch. Process in background. Allow user to dismiss and continue using app.

### Suggested Build Order

Based on dependencies and risk profile:

#### Phase 1: Core Infrastructure (Low Risk)

1. **Database schema migration**
   - Add `tags_pending_sync` column to climbs table
   - Add `tags_migration_completed` column to profiles table
   - Create index on `tags_pending_sync`
   - Deploy migration
   - Test backward compatibility
   - **Why first?** Foundation for all other work, can test in isolation

2. **New Edge Function: openrouter-tag-extractor**
   - Implement tag extraction from notes
   - Reuse auth/validation patterns from `openrouter-coach`
   - Add API usage tracking in `coach_api_usage` table
   - Test with sample climbing notes
   - Verify response validation
   - **Why second?** Can test in isolation via curl/supabase CLI, no UI dependencies

3. **TagService layer**
   - Create `src/services/tags.ts` with:
     - `createClimbWithTags()` function
     - `extractTagsAsync()` function (fire and forget)
     - `processRetroactiveTagging()` function
     - `tagExistingClimbsForUser()` function
   - Integrate with existing `createClimb()` from climbs service
   - Add online/offline detection
   - Unit tests (mock Edge Function calls)
   - **Why third?** Orchestration layer, connects UI to backend, depends on Edge Function

#### Phase 2: Simplified Logger (Medium Risk)

4. **SimplifiedLogger component**
   - Create new `src/components/features/simplified-logger.tsx`
   - Remove manual style/failure_reason selectors (from existing logger.tsx)
   - Add terrain type picker (8 options: Slab, Vert, Overhang, Roof, Dyno, Crimp, Sloper, Pinch, Compression, Tension)
   - Simplified awkwardness (3 options: awkward/normal/smooth vs 1-5 scale)
   - Keep notes field (primary data source)
   - Update validation schema (new Zod schema)
   - Reuse existing UI patterns (SelectionButton, FormSection)
   - Mobile-first responsive design
   - **Why fourth?** Major UI change, breaks existing logger flow, depends on TagService

5. **TagConfirmationDialog component**
   - Create `src/components/ui/tag-confirmation-dialog.tsx`
   - Display AI-extracted tags after save
   - Allow user to add/remove/edit tags
   - Show confidence scores (optional, if tracking)
   - Confirm/save mutation to database
   - Mobile-friendly design (touch targets 44px+)
   - **Why fifth?** Depends on AI extraction working, critical user trust feature

6. **Integrate TagService into simplified logger**
   - Call `createClimbWithTags()` on save button tap
   - Show "Saved" toast + "Extracting tags..." indicator
   - Open TagConfirmationDialog after extraction completes
   - Handle offline scenarios gracefully (show offline queue status)
   - Error handling (if extraction fails, allow manual tagging)
   - **Why sixth?** Connects all pieces, requires both components working

#### Phase 3: Offline Support & Analytics (Medium Risk)

7. **Offline queue extension**
   - Add `tags_pending_sync` flag to `QueuedMutation` interface
   - Update `syncManager.ts` to call `processRetroactiveTagging()` after sync
   - Add `getClimbsWithPendingTagExtraction()` helper function
   - Test offline → online flow
   - Verify retroactive extraction works
   - **Why seventh?** Essential for gym use cases (zero signal), depends on existing offline infrastructure

8. **Retroactive tagging for existing climbs**
   - Implement batch job in `tags.ts`
   - Add migration tracking to profiles table
   - Show progress indicator on first v2.1 launch
   - Add "Retry AI tagging" button on climb detail page
   - Test with sample existing climbs
   - **Why eighth?** Nice-to-have, not critical for new climbs, retroactive polish

9. **Analytics updates**
   - Update Training Priorities chart (from v1.1) to show AI-extracted tags
   - Update Style Weaknesses analysis (from v2.0)
   - Add "Tags extracted by AI" badge/indicator
   - Verify analytics accuracy with real tagged data
   - Add confidence score visualization (optional)
   - **Why last?** Data pipeline works, just UI updates, lowest risk

### Integration Points

#### With Existing Systems

| System | Integration Point | Changes Required |
|---------|-----------------|-----------------|
| **TanStack Query** | `useCreateClimb` mutation (existing) | Replace with `useCreateClimbWithTags()` that calls TagService |
| **Offline Queue** | `offlineQueue.add()` (existing) | Accept `tags_pending_sync` flag in mutation data |
| **Sync Manager** | `syncOfflineQueue()` (existing) | Call `processRetroactiveTagging()` after sync completes |
| **Analytics** | `extractPatterns()` from patterns service (existing v2.0) | No changes needed - query same `styles[]` and `failure_reasons[]` columns |
| **Coach** | Pattern analysis (existing v2.0) | No changes needed - uses same tag arrays, AI tagging improves data quality |
| **Edge Functions** | `openrouter-coach` (existing v2.0) | Reuse auth, validation, error handling patterns for new function |

### Monitoring & Debugging

#### Key Metrics to Track

1. **Tag extraction success rate**
   - Monitor `coach_api_usage.endpoint = 'openrouter-tag-extractor'`
   - Success vs failure ratio
   - Alert if <95% success rate

2. **User engagement with tags**
   - % of climbs where user edits AI-extracted tags
   - % of climbs where user accepts all AI tags
   - % of climbs with empty tags after AI extraction

3. **Confidence scores** (if implemented)
   - Average confidence for style tags
   - Average confidence for failure_reasons
   - Correlation with user edits (high confidence = fewer edits?)

4. **Retroactive extraction backlog**
   - Count of climbs with `tags_pending_sync = true`
   - Age of oldest pending extraction
   - Clear backlog within 24h goal

#### Error Handling

```typescript
// src/services/tags.ts
async function extractTagsAsync(climbId: string, notes: string, userId: string) {
  try {
    const result = await callTagExtractor(notes, userId)
    await updateClimbTags(climbId, result)
  } catch (error) {
    // Log error for monitoring
    console.error('Tag extraction failed for climb:', climbId, error)

    // Don't block user, just leave tags empty
    // User can manually add tags later via edit dialog
    // Retries happen via retroactive extraction job

    // Track failure rate in separate table (optional)
    await supabase.from('tag_extraction_failures').insert({
      climb_id: climbId,
      error_message: error.message,
      timestamp: new Date().toISOString(),
    }).catch((e) => console.error('Failed to track extraction failure:', e))
  }
}
```

### Security Considerations

1. **Rate limiting** (reuse from v2.0 pattern)
   - Existing `user_limits` table tracks `rec_count` for recommendations
   - Add separate column `tag_count` for tag extraction calls
   - Limit: 50 tags/day per user (generous, prevents abuse)
   - Check limit in Edge Function before calling OpenRouter

2. **PII detection** (if notes contain gym names, partners' names)
   - Add instruction to system prompt: "Do not extract personal information as tags"
   - Validate extracted tags against approved tag list (styles[], failure_reasons[])
   - Reject any tag not in approved list

3. **Cost monitoring**
   - Track OpenRouter API costs per user in `coach_api_usage` table
   - Alert if cost > $5/user/month
   - Fallback: Use cheaper model for tag extraction (GPT-3.5-turbo vs GPT-4)
   - Batch retroactive extraction to reduce API calls

## Sources

- [Background Tasks | Supabase Docs](https://supabase.com/docs/guides/functions/background-tasks) - HIGH confidence, official documentation on async tasks in Edge Functions
- [Supabase Back-end Logics | Database vs Edge Functions](https://www.closefuture.io/blogs/supabase-database-vs-edge-functions) - HIGH confidence, architectural guidance for when to use Edge Functions
- [How I Used Generative AI to Transform Site Tagging and Categories](https://nkdagility.com/resources/engineering-notes/how-i-used-generative-ai-to-transform-site-tagging-and-categories/) - MEDIUM confidence, real-world implementation example with human validation
- [AI Architectures in 2025: Components, Patterns and Practical Code](https://medium.com/@angelosorte1/ai-architectures-in-2025-components-patterns-and-practical-code-562f1a52c462) - MEDIUM confidence, modern AI architecture patterns
- [Offline-First Mobile Architecture: Enhancing Usability and Resilience in Mobile Systems](https://www.researchgate.net/publication/393910615_Offline-First_Mobile_Architecture_Enhancing_Usability_and_Resilience_in_Mobile_Systems) - HIGH confidence, research-backed offline patterns
- [The Complete Guide to Offline-First Architecture in Android](https://androidengineers.substack.com/p/the-complete-guide-to-offline-first) - MEDIUM confidence, practical offline implementation patterns including retroactive sync

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|---------|
| Component boundaries | HIGH | Based on existing codebase structure (logger.tsx, coach service, Edge Functions) |
| Data flow (online) | HIGH | Existing patterns in openrouter-coach provide clear template, async background processing well-documented |
| Data flow (offline) | MEDIUM | Offline queue exists, retroactive extraction pattern not yet tested but follows established patterns |
| Database schema | HIGH | Simple additive migration, minimal breaking changes, existing climbs table structure |
| Build order | HIGH | Based on dependency analysis, lowest-risk first, incremental validation possible |
| Scalability | MEDIUM | Supabase auto-scales, but 1M user behavior is theoretical (no production data) |
| Security patterns | HIGH | Reuse existing v2.0 JWT auth, rate limiting, cost tracking patterns |

---

*Architecture research for: AI auto-tagging integration in Scenka climbing logging app*
*Researched: 2026-01-20*
