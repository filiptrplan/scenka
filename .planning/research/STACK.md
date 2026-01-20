# Technology Stack

**Project:** Scenka v2.1 - AI Auto-Tagging
**Researched:** 2026-01-20

## Recommended Stack

### Core AI Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **OpenRouter API** (meta-llama/llama-3.1-8b-instruct) | N/A | LLM provider for tag extraction | 12.5x-66.7x cheaper than GPT-5-mini ($0.02/$0.05 per 1M tokens), sufficient for simple entity extraction, fast inference (118.0 c/s), JSON structured output support |
| **OpenAI SDK** (via Deno) | ^4.0.0 | API client compatibility | Already in use in openrouter-coach, OpenRouter is OpenAI-compatible, proven pattern, TypeScript support |
| **Supabase Edge Functions** | ^2.0 | Secure API proxy, background processing | Hides API keys, enables server-side prompt construction, supports background tasks with `EdgeRuntime.waitUntil()`, follows no-backend-servers constraint |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL** (job queue table) | ^15 | Async task processing | Native to Supabase, supports row-level locking for concurrent workers, status tracking (pending/processing/completed/failed), integrates with pg_cron for scheduling |
| **pg_cron** | ^1.0 | Periodic job queue polling | Already in codebase for weekly recommendations, standard Supabase extension, reliable scheduling without external services |
| **Background Tasks API** | Supabase Edge Functions v3 | Non-blocking LLM calls | Respond immediately to user while AI processes in background, prevents UI blocking, matches PWA offline-first philosophy |

### Frontend Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Query** | ^5.90.16 | State management for tagged climbs | Already in codebase, optimistic updates for better UX, automatic cache invalidation, handles loading/error states |
| **React Hook Form + Zod** | ^7.70.0, ^4.3.5 | Form validation on save | Already in codebase, type-safe validation, ensures quality data before AI processing |
| **Service Worker** (PWA) | Built-in browser API | Offline caching strategy | PWA requirement, cache tagged climbs locally, sync when online, supports background fetch for queued jobs |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | ^4.1.0 | Date formatting for job timestamps | Displaying job processing times, grouping by date, already in package.json |
| **zod** | ^4.3.5 | JSON schema validation | Validate LLM response structure, ensure tags match allowed values (styles, failure reasons) |
| **lucide-react** | ^0.562.0 | Status icons for job queue | Visual feedback for pending/processing/completed states, already in codebase |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **LLM Model** | meta-llama/llama-3.1-8b-instruct | openai/gpt-5-mini | GPT-5-mini is 12.5x-66.7x more expensive ($0.25/$2.00 per 1M tokens) with marginal accuracy gain for simple entity extraction |
| **LLM Model** | meta-llama/llama-3.1-8b-instruct | deepseek/deepseek-chat-v3.1 | DeepSeek is 9.0x-33.3x more expensive ($0.27/$1.00 per 1M tokens), overkill for simple classification task |
| **Processing Strategy** | Per-climb extraction | Batch processing | Batch adds complexity (queue management, progress tracking) with minimal cost savings (~30% token reduction), per-climb is simpler and provides immediate feedback |
| **Offline Strategy** | Service worker caching | IndexedDB for jobs | IndexedDB is more complex, PWA already uses service worker, cache strategies (cache-first, network-first) well-documented |
| **Job Queue** | PostgreSQL + pg_cron | Redis + dedicated worker | Redis requires additional infrastructure, Postgres job queue is sufficient for solo dev, pg_cron already integrated |

## Installation

### Core Dependencies (Already Installed)
```bash
# Already in package.json
npm install @supabase/supabase-js@^2.89.0
npm install @tanstack/react-query@^5.90.16
npm install zod@^4.3.5
npm install react-hook-form@^7.70.0
npm install @hookform/resolvers@^5.2.2
npm install date-fns@^4.1.0
```

### New Dependencies
```bash
# None required - all libraries already in codebase
# Service worker is built-in browser API
# Edge Functions use Deno runtime (supabase CLI handles this)
```

### Supabase Functions Deploy
```bash
# Deploy auto-tagging function
npx supabase functions deploy openrouter-autotag --no-verify-jwt

# Deploy background worker (optional - use pg_cron polling instead)
npx supabase functions deploy process-tag-jobs --no-verify-jwt
```

### Environment Variables (Add to Supabase Dashboard)
```bash
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
TAG_JOB_TIMEOUT=30000  # 30 seconds per tag job
TAG_JOB_RETRY_LIMIT=3  # Max retry attempts
```

## Architecture

### Request Flow

```
User saves climb in Logger
  ↓
Logger component calls TanStack Query mutation
  ↓
Mutation inserts climb with tags: null
  ↓
Mutation triggers Edge Function (openrouter-autotag) via RPC or webhook
  ↓
Edge Function validates auth, extracts notes + metadata
  ↓
Edge Function calls OpenRouter API (Llama 3.1 8B)
  ↓
LLM returns JSON: { styles: [], failure_reasons: [] }
  ↓
Edge Function validates response against Zod schema
  ↓
Edge Function updates climb record with extracted tags
  ↓
TanStack Query automatically invalidates cache
  ↓
UI shows tagged climb with updated tags
```

### Background Job Queue Pattern (For Offline Resilience)

**Table Schema:**
```sql
create table tag_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  climb_id uuid not null references climbs(id),
  status text not null default 'pending', -- pending | processing | completed | failed
  notes text not null,
  metadata jsonb,
  retry_count int default 0,
  locked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Job Processing:**
1. pg_cron triggers Edge Function every minute to process pending jobs
2. Function locks job row (SELECT ... FOR UPDATE SKIP LOCKED)
3. Extracts tags via LLM (background task)
4. Updates climb record with tags
5. Marks job as completed or failed with retry logic

### Offline Strategy

**Service Worker Caching:**
```javascript
// Cache climb data on save
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.includes('/climbs')) {
    event.respondWith(
      caches.open('climbs-v1').then(cache =>
        cache.match(event.request).then(response => {
          return response || fetch(event.request).then(fresh => {
            cache.put(event.request, fresh.clone())
            return fresh
          })
        })
      )
    )
  }
})
```

**Background Sync Pattern:**
```javascript
// Use Background Sync API when offline
navigator.serviceWorker.ready.then(reg => {
  reg.sync.register('tag-pending-jobs')
})

// Service worker handles sync on reconnect
self.addEventListener('sync', (event) => {
  if (event.tag === 'tag-pending-jobs') {
    event.waitUntil(processPendingTagJobs())
  }
})
```

### Cost Analysis

**Per-Climb Tagging Cost:**
- Input: ~150 tokens (notes + metadata + prompt)
- Output: ~50 tokens (JSON tags)
- Model: Llama 3.1 8B ($0.02/$0.05 per 1M tokens)
- Cost: (150 * 0.02/1M) + (50 * 0.05/1M) = $0.000003 + $0.0000025 = **$0.0000055 per climb**

**Monthly Cost (100 climbs/month):**
- Cost: 100 * $0.0000055 = **$0.00055/month**
- Annual: 1200 climbs = **$0.0066/year**

**Comparison with GPT-5-mini:**
- Cost per climb: ~$0.00020 (36x more expensive)
- Annual cost: ~$0.24/month for 100 climbs

**Daily Limits Recommendation:**
- Free tier limit: ~50-100 climbs/day before meaningful cost
- Paid tier: $0.55/month allows ~100,000 climbs/month
- Use existing user_limits table for per-user quotas (extends v2.0 pattern)

### Performance Targets

**Response Time:**
- Target: <2 seconds per climb (API latency + LLM inference)
- Llama 3.1 8B: ~100-200ms per 1K tokens
- Network: ~500ms average (Edge Functions global distribution)
- Total: ~1.5s per climb (meets PWA <2s requirement)

**UI Blocking Prevention:**
- Background tasks respond immediately: "Tagging in progress..."
- TanStack Query optimistic updates show immediate save
- Real-time updates via Supabase Realtime (optional enhancement)

**Mobile Performance:**
- 44px touch targets for loading states
- Skeleton screens for tag preview
- Offline indicator when network unavailable
- Progressive loading: show existing tags first, update with AI tags when ready

### Anti-Patterns to Avoid

1. **Don't: Block UI while tagging**
   - Instead: Return 200 OK immediately, process in background
   - Pattern: `EdgeRuntime.waitUntil(promise)` in Edge Functions

2. **Don't: Use expensive models for simple tasks**
   - Entity extraction is classification, not reasoning
   - Llama 3.1 8B sufficient, GPT-5 unnecessary

3. **Don't: Re-tag every climb on app load**
   - Cache tags in database, only update on user edit
   - Batch re-tag only when prompt changes or user requests

4. **Don't: Ignore offline scenarios**
   - Show "AI tagging unavailable offline" message
   - Allow manual tag selection as fallback
   - Queue jobs for background sync when online

5. **Don't: Skip validation**
   - Validate LLM response against allowed tag values
   - Reject invalid tags, show error to user
   - Fall back to empty tags, don't corrupt data

## Integration with Existing Stack

**Reuses v2.0 Infrastructure:**
- OpenRouter integration (same API key, different model)
- Supabase Edge Functions pattern (follows openrouter-coach)
- TanStack Query hooks (extend useClimbs pattern)
- Zod validation (extend climbSchema)
- User limits tracking (extend coach_api_usage table)

**New Components:**
- `TagJobMonitor`: Display tagging status in logger
- `TagBadge`: Visual indicator of AI vs manual tags
- `TagQueueStatus`: Background job count (optional enhancement)

**New Services:**
- `tagService.ts`: API calls to openrouter-autotag
- `jobQueueService.ts`: Monitor background job status

**Database Changes:**
- `climbs` table: Already has `style[]` and `failure_reasons[]` columns (no migration needed)
- `tag_jobs` table: New for background queue
- `user_limits` table: Extend with `tag_count` column

## Sources

### HIGH Confidence (Official/Authoritative)
- [OpenRouter Pricing](https://openrouter.ai/pricing) - Token pricing structure, model catalog
- [Llama 3.1 8B Instruct - OpenRouter](https://openrouter.ai/meta-llama/llama-3.1-8b-instruct) - Model capabilities, pricing ($0.02/$0.05 per 1M tokens)
- [Supabase Edge Functions - Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) - `EdgeRuntime.waitUntil()`, async operations, error handling
- [PWA Caching - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) - Service worker strategies, offline handling
- [Llama 3.1 8B - llm-stats](https://llm-stats.com/models/llama-3.1-8b-instruct) - Performance metrics (118.0 c/s), context window, pricing

### MEDIUM Confidence (Verified with Official Sources)
- [GPT-5 Mini vs Llama 3.1 8B - Galaxy.ai](https://blog.galaxy.ai/compare/gpt-5-mini-vs-llama-3-1-8b-instruct) - Cost comparison (12.5x-66.7x cheaper), benchmark performance
- [GPT-5 Mini vs Llama 3.1 8B - airank.dev](https://airank.dev/models/compare/gpt-5-mini-vs-llama-3-1-8b-instruct) - 51.9% higher benchmark score vs Llama, context window comparison
- [Job Queue Pattern - Jigz.dev](https://www.jigz.dev/blogs/how-i-solved-background-jobs-using-supabase-tables-and-edge-functions) - PostgreSQL job queue pattern, row locking, status states
- [Entity Extraction LLM vs Regex - MDPI](https://www.mdpi.com/2673-7426/5/3/50) - LLM accuracy vs rule-based approaches
- [Top AI Models 2026 - TeamDay.ai](https://www.teamday.ai/blog/top-ai-models-openrouter-2026) - Model comparison, cost analysis

### LOW Confidence (WebSearch Only, Needs Validation)
- [Mobile UX Best Practices - SendBird](https://sendbird.com/blog/mobile-app-ux-best-practices) - Mobile design patterns, real-time interactions
- [PWA Offline Strategies - MagicBell](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies) - Service worker caching patterns (cache-first vs network-first)
- [LLM Entity Extraction - Reddit](https://www.reddit.com/r/LocalLLaMA/comments/1boblzb/llm_for_entity_extraction/) - Community discussion on LLM vs regex (needs validation)

### Research Gaps

1. **Prompt Engineering Quality:**
   - No verified examples for climbing-specific entity extraction
   - Need iterative testing with real climb notes
   - Tag mapping accuracy unknown (how often does Llama misclassify "crimp" vs "pinch"?)

2. **Background Job Scalability:**
   - pg_cron polling every minute may not scale to many users
   - Consider dedicated worker for production scale
   - Solo dev: Polling acceptable, monitor performance

3. **Real-time Updates:**
   - TanStack Query polling vs Supabase Realtime
   - Realtime adds complexity but better UX
   - Start with polling, upgrade to Realtime if needed

4. **Tag Dispute Resolution:**
   - User disagrees with AI tags
   - Allow manual override with flag
   - Track "AI confidence" for future fine-tuning

---

*Research completed: 2026-01-20*
*Overall confidence: MEDIUM*
*Ready for roadmap: yes*
