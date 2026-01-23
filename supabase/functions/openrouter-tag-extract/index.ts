import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import { corsHeaders } from '../_shared/cors.ts'
import { anonymizeNotes } from '../_shared/anonymize.ts'

// Constants for tag extraction
const DAILY_TAG_LIMIT = 50
const MAX_TOKENS = 1000
const CONFIDENCE_THRESHOLD = 70
const MAX_STYLES = 3
const MAX_FAILURE_REASONS = 3
const MIN_FAILURE_REASONS = 1
const MAX_RETRIES = 2
const API_DURATION_TARGET_MS = 3000

// Valid style tags (from validation.ts)
const VALID_STYLES = [
  'Slab',
  'Vert',
  'Overhang',
  'Roof',
  'Dyno',
  'Crimp',
  'Sloper',
  'Pinch',
] as const

// Valid failure reasons (from validation.ts)
const VALID_FAILURE_REASONS = [
  'Bad Feet',
  'Body Position',
  'Beta Error',
  'Precision',
  'Precision (Feet)',
  'Precision (Hands)',
  'Coordination (Hands)',
  'Coordination (Feet)',
  'Foot Swap',
  'Heel Hook',
  'Toe Hook',
  'Rockover',
  'Pistol Squat',
  'Drop Knee',
  'Twist Lock',
  'Flagging',
  'Dyno',
  'Deadpoint',
  'Latch',
  'Mantle',
  'Undercling',
  'Gaston',
  'Match',
  'Cross',
  'Pumped',
  'Finger Strength',
  'Core',
  'Power',
  'Flexibility',
  'Balance',
  'Endurance',
  'Focus',
  'Commitment',
] as const

// Environment variable validation
const requiredEnvVars = [
  'OPENROUTER_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_TAG_MODEL',
]

for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!
const tagModel = Deno.env.get('OPENROUTER_TAG_MODEL')!

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize OpenAI client with OpenRouter baseURL
const openai = new OpenAI({
  apiKey: openrouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

// Types
interface Tag {
  name: string
  confidence: number
}

interface TagExtractionResult {
  style_tags: Tag[]
  failure_reasons: Tag[]
}

interface RequestBody {
  climb_id: string
  notes: string
  user_id: string
}

/**
 * Estimate token count using word count and character-based estimation
 * Uses the higher of the two estimates for safety
 */
function estimateTokenCount(text: string): number {
  // Count words (split by whitespace, filter empty)
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  // Character-based estimate (approx 4 chars per token for English)
  const charBasedEstimate = Math.ceil(text.length / 4)
  // Use the higher of the two to be conservative
  return Math.max(wordCount, charBasedEstimate)
}

/**
 * Clean response - remove markdown code blocks if present
 */
function cleanResponse(content: string): string {
  return content.replace(/```json\n?|\n?```/g, '').trim()
}

/**
 * Validate tag extraction response from LLM
 * Ensures structure, enum values, and confidence thresholds
 */
function validateTagResponse(content: string): TagExtractionResult {
  const cleaned = cleanResponse(content)
  let parsed: any

  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error('Invalid JSON in response')
  }

  // Validate style_tags array
  if (!Array.isArray(parsed.style_tags)) {
    throw new Error('Missing or invalid field: style_tags')
  }

  if (parsed.style_tags.length > MAX_STYLES) {
    throw new Error(`Field style_tags must contain max ${MAX_STYLES} items`)
  }

  // Validate each style tag
  parsed.style_tags.forEach((tag: any, index: number) => {
    const tagNum = index + 1
    if (!VALID_STYLES.includes(tag.name)) {
      throw new Error(`Invalid style tag: ${tag.name}`)
    }
    if (typeof tag.confidence !== 'number' || tag.confidence < 0 || tag.confidence > 100) {
      throw new Error(`Style tag ${tagNum}: Confidence must be number 0-100, got ${tag.confidence}`)
    }
  })

  // Validate failure_reasons array
  if (!Array.isArray(parsed.failure_reasons)) {
    throw new Error('Missing or invalid field: failure_reasons')
  }

  if (
    parsed.failure_reasons.length < MIN_FAILURE_REASONS ||
    parsed.failure_reasons.length > MAX_FAILURE_REASONS
  ) {
    throw new Error(
      `Field failure_reasons must contain ${MIN_FAILURE_REASONS}-${MAX_FAILURE_REASONS} items`
    )
  }

  // Validate each failure reason
  parsed.failure_reasons.forEach((tag: any, index: number) => {
    const tagNum = index + 1
    if (!VALID_FAILURE_REASONS.includes(tag.name)) {
      throw new Error(`Invalid failure reason: ${tag.name}`)
    }
    if (typeof tag.confidence !== 'number' || tag.confidence < 0 || tag.confidence > 100) {
      throw new Error(
        `Failure reason ${tagNum}: Confidence must be number 0-100, got ${tag.confidence}`
      )
    }
  })

  return parsed
}

/**
 * Filter tags by confidence threshold
 */
function filterTagsByConfidence(tags: Tag[], threshold: number): string[] {
  return tags.filter((tag) => tag.confidence >= threshold).map((tag) => tag.name)
}

// Edge Function handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', success: false }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let userId: string | null = null

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Validate JWT token with Supabase
    const {
      data: { user },
      error: claimsError,
    } = await supabase.auth.getUser(token)

    if (claimsError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    userId = user.id

    // Parse request body
    const body: RequestBody = await req.json()

    // Validate required fields
    if (!body.climb_id || !body.notes || !body.user_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: climb_id, notes, user_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify user_id matches token
    if (body.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check daily tag limit BEFORE making any API calls
    const { data: limits, error: limitsError } = await supabase
      .from('user_limits')
      .select('tag_count, limit_date')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() for users without limits yet

    if (limitsError) {
      console.error('Failed to fetch user limits:', limitsError)
      // Continue anyway - limit check is a safety feature, don't block on errors
    }

    // Calculate if limit exceeded
    const tagCount = limits?.tag_count ?? 0
    const limitDate = limits?.limit_date ? new Date(limits.limit_date) : new Date('1970-01-01')
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Reset count if new day (handle same-day check with comparison)
    const isSameDay = limitDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    const effectiveCount = isSameDay ? tagCount : 0

    if (effectiveCount >= DAILY_TAG_LIMIT) {
      // Calculate hours until next reset (UTC midnight)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      const hoursUntilReset = Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60))

      const resetMessage =
        hoursUntilReset <= 1
          ? 'Next reset in less than 1 hour'
          : hoursUntilReset < 24
            ? `Next reset in ${hoursUntilReset} hours`
            : 'Next reset tomorrow at midnight UTC'

      return new Response(
        JSON.stringify({
          error: `Daily quota reached - tags extracted tomorrow. Add manually in Settings. ${resetMessage}`,
          limit_type: 'tag_extraction',
          current_count: effectiveCount,
          limit: DAILY_TAG_LIMIT,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Increment counter BEFORE OpenRouter API call to ensure we don't make expensive calls for blocked requests
    await supabase.rpc('increment_tag_count', { p_user_id: userId })

    // Estimate tokens and truncate if necessary
    let notes = body.notes
    const estimatedTokens = estimateTokenCount(notes)

    if (estimatedTokens > MAX_TOKENS) {
      const truncationRatio = MAX_TOKENS / estimatedTokens
      notes = notes.substring(0, Math.floor(notes.length * truncationRatio))
      console.log(
        `Truncated notes for climb ${body.climb_id}: ${estimatedTokens} -> ${MAX_TOKENS} tokens (ratio: ${truncationRatio.toFixed(2)})`
      )
    }

    // Anonymize notes to remove PII
    const anonymizedNotes = anonymizeNotes(notes)

    // System prompt for tag extraction
    const systemPrompt = `
Extract climbing tags from the user's notes. Return ONLY raw JSON with no markdown code blocks, no explanations, no additional text.

Output format:
{
  "style_tags": [
    { "name": "TAG_NAME", "confidence": 85 }
  ],
  "failure_reasons": [
    { "name": "TAG_NAME", "confidence": 72 }
  ]
}

IMPORTANT: You MUST use ONLY the exact tag names listed below. Do NOT invent, modify, or spell differently.

Valid style tags (use exactly these words):
- \`Slab\`: Less-than-vertical climbing where body tension and balance are primary
- \`Vert\`: Vertical or near-vertical terrain, often featuring face climbing
- \`Overhang\`: Steep terrain requiring strength to stay on the wall
- \`Roof\`: Horizontal ceiling section requiring core tension
- \`Dyno\`: Dynamic jumping movements between holds
- \`Crimp\`: Small, sharp holds requiring finger strength
- \`Sloper\`: Rounded, featureless holds requiring open-hand strength and friction
- \`Pinch\`: Holds gripped between thumb and fingers

Valid failure reasons (use exactly these words):
- \`Bad Feet\`: Poor foot placement or foot slipping
- \`Body Position\`: Suboptimal body positioning relative to the wall
- \`Beta Error\`: Wrong sequence of moves or technique
- \`Precision\`: Difficulty hitting small or distant holds accurately
- \`Precision (Feet)\`: Specifically inaccurate foot placement
- \`Precision (Hands)\`: Specifically inaccurate hand placement
- \`Coordination (Hands)\`: Difficulty timing or executing hand movements
- \`Coordination (Feet)\`: Difficulty timing or executing foot movements
- \`Foot Swap\`: Difficulty swapping feet on the same hold
- \`Heel Hook\`: Failed or improper heel hook technique
- \`Toe Hook\`: Failed or improper toe hook technique
- \`Rockover\`: Difficulty executing rockover move (standing up on high foothold)
- \`Pistol Squat\`: Insufficient single-leg strength for high steps
- \`Drop Knee\`: Failed or improper drop knee technique
- \`Twist Lock\`: Difficulty with hip twist and lock-off positions
- \`Flagging\`: Poor flagging technique for balance
- \`Dyno\`: Failed dynamic jumping movement
- \`Deadpoint\`: Failed controlled dynamic movement
- \`Latch\`: Difficulty catching or sticking dynamic moves
- \`Mantle\`: Failed or improper mantle technique
- \`Undercling\`: Failed or improper undercling technique
- \`Gaston\`: Failed or improper gaston technique
- \`Match\`: Difficulty matching hands or feet on same hold
- \`Cross\`: Difficulty with cross-through moves
- \`Pumped\`: Forearm fatigue causing inability to hold on
- \`Finger Strength\`: Insufficient finger power for small holds
- \`Core\`: Inability to maintain body position due to weak core
- \`Power\`: Lack of explosive strength for difficult moves
- \`Flexibility\`: Limited range of motion preventing optimal positioning
- \`Balance\`: Inability to maintain equilibrium on the wall
- \`Endurance\`: Overall fatigue over the course of the climb
- \`Focus\`: Loss of concentration or mind wandering
- \`Commitment\`: Hesitation or lack of full commitment to moves

Rules:
- Return ONLY the JSON object, nothing else
- Maximum 3 style tags, maximum 3 failure reasons (minimum 1 failure reason)
- Include tags with confidence >= 70 only
- Confidence scores 0-100 based on how strongly the notes indicate that tag
- Climbing is complex and nuanced - add tags even if they don't match 100%
- Notes may be brief or ambiguous - use your judgment

Example notes: "Pumped out at the crux, couldn't hold the small crimp"
Example output:
{
  "style_tags": [{"name": "Crimp", "confidence": 85}],
  "failure_reasons": [{"name": "Pumped", "confidence": 90}]
}
`

    // User message with notes
    const userMessage = `Notes: ${anonymizedNotes}`

    // Retry loop for API call with validation
    let lastError: Error | null = null
    let lastUsage: any = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Measure API call duration for EXTR-07 (3-second performance target)
        const startTime = performance.now()

        const response = await openai.chat.completions.create({
          model: tagModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2, // Low temperature for consistent extraction
          response_format: { type: 'json_object' },
        })

        const duration = performance.now() - startTime

        // Log duration for EXTR-07 performance monitoring
        console.log(
          `Tag extraction API call duration for climb ${body.climb_id}: ${duration.toFixed(0)}ms`
        )

        // Warning if exceeds 3-second target
        if (duration > API_DURATION_TARGET_MS) {
          console.warn(
            `Tag extraction exceeded 3s target for climb ${body.climb_id}: ${duration.toFixed(0)}ms`
          )
        }

        lastUsage = response.usage
        const content = response.choices[0].message.content

        if (!content) {
          throw new Error('Empty response from AI')
        }

        // Validate response structure
        const validated = validateTagResponse(content)

        // Filter tags by confidence threshold
        const styleTags = filterTagsByConfidence(validated.style_tags, CONFIDENCE_THRESHOLD)
        const failureReasons = filterTagsByConfidence(
          validated.failure_reasons,
          CONFIDENCE_THRESHOLD
        )

        console.log(
          `Extracted tags for climb ${body.climb_id}: ${styleTags.length} styles, ${failureReasons.length} failure reasons`
        )

        // Fetch existing tags to merge with AI tags
        const { data: existingClimb } = await supabase
          .from('climbs')
          .select('style, failure_reasons')
          .eq('id', body.climb_id)
          .single()

        // Merge tags (union, deduplicated)
        const mergedStyles = [...new Set([...(existingClimb?.style || []), ...styleTags])]
        const mergedFailureReasons = [
          ...new Set([...(existingClimb?.failure_reasons || []), ...failureReasons]),
        ]

        // Update climb with merged tags
        const { error: updateError } = await supabase
          .from('climbs')
          .update({
            style: mergedStyles,
            failure_reasons: mergedFailureReasons,
            tags_extracted_at: new Date().toISOString(),
          })
          .eq('id', body.climb_id)

        if (updateError) {
          console.error('Failed to update climb with tags:', updateError)
          // Continue to return success - tracking failure shouldn't break the response
        }

        // Track API usage with OpenRouter's cost
        const costUsd = lastUsage.cost || 0

        const { error: usageError } = await supabase.from('api_usage').insert({
          user_id: userId,
          prompt_tokens: lastUsage.prompt_tokens,
          completion_tokens: lastUsage.completion_tokens,
          total_tokens: lastUsage.total_tokens,
          cost_usd: costUsd,
          model: tagModel,
          endpoint: 'openrouter-tag-extract',
          time_window_start: new Date().toISOString(),
        })

        if (usageError) {
          console.error('Failed to track API usage:', usageError)
          // Continue - tracking failure shouldn't break the response
        }

        // Return success response (non-blocking)
        return new Response(
          JSON.stringify({
            success: true,
            tags_extracted: true,
            style: mergedStyles,
            failure_reasons: mergedFailureReasons,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error: any) {
        lastError = error
        console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.message)

        // Continue to next retry with exponential backoff
        if (attempt < MAX_RETRIES - 1) {
          const delay = 1000 * (attempt + 1) // 1s, then 2s
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        // Last attempt failed - return success with tags_extracted: false
        console.error(
          `OpenRouter API failed after ${MAX_RETRIES} retries for climb ${body.climb_id}:`,
          lastError?.message
        )

        // Track failed attempt with cost=0
        const { error: failedUsageError } = await supabase.from('api_usage').insert({
          user_id: userId,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost_usd: 0,
          model: tagModel,
          endpoint: 'openrouter-tag-extract',
          time_window_start: new Date().toISOString(),
        })

        if (failedUsageError) {
          console.error('Failed to track failed usage:', failedUsageError)
        }

        // Return success - climb is saved, tags just didn't extract
        // Client shows toast notification
        return new Response(
          JSON.stringify({
            success: true,
            tags_extracted: false,
            error: 'Tag extraction failed, you can add tags manually',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected error: retry loop completed without result')
  } catch (error: any) {
    console.error('Error in openrouter-tag-extract:', error.message, error.stack)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
        tags_extracted: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
