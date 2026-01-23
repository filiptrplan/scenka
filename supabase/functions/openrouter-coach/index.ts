import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import { corsHeaders } from '../_shared/cors.ts'

// Constants
const MAX_RETRIES = 3

// Environment variable validation
const requiredEnvVars = [
  'OPENROUTER_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_MODEL',
  'DAILY_REC_LIMIT',
]
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!
const model = Deno.env.get('OPENROUTER_MODEL')!
const dailyRecLimit = parseInt(Deno.env.get('DAILY_REC_LIMIT') ?? '2')

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize OpenAI client with OpenRouter baseURL
const openai = new OpenAI({
  apiKey: openrouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

// System prompt for climbing coach
const systemPrompt = `You are a seasoned, down-to-earth climbing coach with decades of experience on real rock and in gyms. You speak to the climber like a mentor, not a computer reading a spreadsheet.

Your core philosophy: Most "strength" failures are actually technique gaps.

### INPUT DATA ANALYSIS
You will receive a JSON structure containing:
1.  patterns_data: Statistical failure rates.
2.  recent_climbs & recent_successes: A log of specific climbs.
3.  notes: Qualitative comments written by the user (e.g., "Sketchy foot swap," "Bad beta").

**CRITICAL INSTRUCTION: READ THE NOTES**
The stats tell you *what* failed; the notes tell you *why*. You must prioritize the nuance in the notes over the raw numbers.
- If stats say "Finger Strength Failure" but the note says "feet slipped on the crimp," **treat this as a footwork issue.**
- If stats say "Dyno Failure" but the note says "awkward coordination," **treat this as a body awareness issue.**
- Explicitly referencing these details (e.g., "I know you hated that sketchy foot swap...") makes you sound human.

### OUTPUT FORMAT
Return ONLY valid JSON with the following structure:
{
  "weekly_focus": "string",
  "drills": [
    {
      "name": "string",
      "description": "string",
      "sets": number or string,
      "reps": string,
      "rest": string,
      "measurable_outcome": "string"
    }
  ],
  "projecting_focus": [
    {
      "focus_area": "string",
      "description": "string",
      "grade_guidance": "string",
      "rationale": "string"
    }
  ]
}

### SECTIONS DETAILED

1. **weekly_focus**: A conversational, 1-2 sentence summary of the game plan.
   - *Logic:* Synthesize recent failures. If the last 3 sessions show failures on "Commitment" and "Fear," the week is about confidence, even if "Finger Strength" stats are also low.
   - *Example:* "Let's take a break from the crimps this week. I noticed you struggled with commitment on those slabs, so we're going to focus entirely on trusting your feet."

2. **drills**: An array of 3 specific drills.
   - **name**: Standard climbing terms (e.g., Silent Feet, Hover Hands, Rooting).
   - **description**: Explain *why* they are doing this based on their actual notes/patterns. Connect the dots.
   - **sets/reps/rest**: Standard numeric or duration values.
   - **measurable_outcome**: A concrete goal (e.g., "Complete 10 routes with silent feet").

3. **projecting_focus**: An array of 3-4 suggestions for what to climb.
   - **focus_area**: Broad style description (e.g., "Crimpy Overhangs", "Technical Slabs").
   - **description**: Why this style helps them. Use natural language.
   - **grade_guidance**: Qualitative only (e.g., "A grade below your max", "Flash level").
   - **rationale**: Connect to user history (e.g., "Since you mentioned struggling with that toe-hook start, we need more tension practice").

### VOICE & STYLE GUIDE

1.  **Sound Human:** Do not quote raw statistics in the text.
    -   *Bad:* "To fix your 17% precision failure rate..."
    -   *Good:* "Since we're seeing a trend of slipping off small footholds..."
2.  **Natural Terminology:** Do not Capitalize Random Words. Use "we" and "you." be encouraging but realistic.
3.  **Specific References:** If their notes mention a specific move (e.g., "foot match"), use that context.

### STYLE REFRAMING CHEAT SHEET (Strength -> Technique)

When users report "Strength" failures, find the technique gap:

-   **Pumped/Endurance:**
    -   *Technique Fix:* Efficiency, pacing, straight arms, and finding obscure rests.
    -   *Advice:* "You're likely flaming out because you're over-gripping. Let's work on shaking out sooner."
-   **Finger Strength/Crimp:**
    -   *Technique Fix:* Hip proximity to wall, body tension, and center-of-gravity.
    -   *Advice:* "It felt like a finger limit, but if we get your hips closer to the wall, those holds become jugs."
-   **Power/Dyno:**
    -   *Technique Fix:* Momentum generation, hip drive (pogo), and trajectory.
    -   *Advice:* "It's not about pulling harder; it's about timing your hip drive with your push."
-   **Core/Tension:**
    -   *Technique Fix:* Engagement through the big toe, rooting, and maintaining tension chains.
    -   *Advice:* "Keep the tension all the way to your toes so your feet don't cut when you reach."`

// Request body types
interface UserPreferences {
  preferred_discipline: string
  preferred_grade_scale: string
}

interface AnonymizedClimb {
  location: string
  grade_scale: string
  grade_value: string
  climb_type: string
  style: string[]
  outcome: string
  awkwardness: number
  failure_reasons: string[]
  notes?: string | null
  date: string
}

interface FailurePattern {
  reason: string
  count: number
  percentage: number
}

interface StyleWeakness {
  style: string
  fail_rate: number
  fail_count: number
  total_attempts: number
}

interface ClimbingFrequency {
  climbs_per_month: number
  avg_climbs_per_session: number
}

interface RecentSuccesses {
  redemption_count: number
  grade_progression: Array<{
    grade: string
    date: string
  }>
}

interface PatternAnalysis {
  failure_patterns: {
    most_common_failure_reasons: FailurePattern[]
  }
  style_weaknesses: {
    struggling_styles: StyleWeakness[]
  }
  climbing_frequency: ClimbingFrequency
  recent_successes: RecentSuccesses
}

interface RequestBody {
  user_id: string
  patterns_data: PatternAnalysis
  user_preferences: UserPreferences
  recent_climbs?: AnonymizedClimb[]
  climbing_context?: string | null
}

// Helper function to fetch existing recommendations for fallback
async function getExistingRecommendations(userId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('coach_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Failed to fetch existing recommendations:', error)
    return null
  }

  // Only return if there's valid content (not empty or error)
  if (data && data.content && Object.keys(data.content).length > 0 && !data.error_message) {
    return data
  }

  return null
}

// Build user prompt from patterns and preferences
function buildUserPrompt(
  patterns: PatternAnalysis,
  preferences: UserPreferences,
  recentClimbs?: AnonymizedClimb[],
  climbingContext?: string | null
): string {
  const { failure_patterns, style_weaknesses, climbing_frequency, recent_successes } = patterns

  let prompt = `User Profile:
- Preferred discipline: ${preferences.preferred_discipline}
- Preferred grade scale: ${preferences.preferred_grade_scale}
`

  // Add climbing context if provided
  if (climbingContext && climbingContext.trim().length > 0) {
    prompt += `\nUser's Climbing Context:\n${climbingContext.trim()}\n`
  }

  prompt += `\n`

  // Add failure patterns
  prompt += `Failure Patterns:
`
  if (failure_patterns.most_common_failure_reasons.length > 0) {
    failure_patterns.most_common_failure_reasons.forEach((fp) => {
      prompt += `- ${fp.reason}: ${fp.count} failures (${fp.percentage}%)\n`
    })
  } else {
    prompt += `- No failure data available\n`
  }

  // Add style weaknesses
  prompt += `\nStyle Weaknesses:
`
  if (style_weaknesses.struggling_styles.length > 0) {
    style_weaknesses.struggling_styles.forEach((sw) => {
      prompt += `- ${sw.style}: ${Math.round(sw.fail_rate * 100)}% fail rate (${sw.fail_count}/${sw.total_attempts})\n`
    })
  } else {
    prompt += `- No style weakness data available\n`
  }

  // Add climbing frequency
  prompt += `\nClimbing Frequency:
- Climbs per month: ${climbing_frequency.climbs_per_month}
- Avg climbs per session: ${climbing_frequency.avg_climbs_per_session}
`

  // Add recent successes
  prompt += `\nRecent Successes:
- Redemptions: ${recent_successes.redemption_count}
`
  if (recent_successes.grade_progression.length > 0) {
    prompt += `Grade progression:\n`
    recent_successes.grade_progression.forEach((gp) => {
      prompt += `- ${gp.grade} (${gp.date})\n`
    })
  }

  // Add recent climb history
  if (recentClimbs && recentClimbs.length > 0) {
    prompt += `\nRecent Climb History (last 30 climbs):
${JSON.stringify(recentClimbs, null, 0)}\n`
  }

  // Add request
  prompt += `\nBased on this data, provide:
1. A weekly focus statement addressing the user's primary weaknesses
2. 3 specific training drills with educational explanations
3. 3-4 projecting focus areas for project selection this week

Example output format:
{
  "weekly_focus": "Develop precise footwork and body positioning to address 35% failure rate on technical slab climbs",
  "drills": [
    {
      "name": "Silent Feet Ladder",
      "description": "Climb 10 easy routes focusing entirely on silent foot placements. Each foot must land without making any sound on the holds. If you hear a foot slap, that route doesn't count. This builds deliberate movement patterns and weight transfer awareness.",
      "sets": 5,
      "reps": "1 route per set",
      "rest": "2 minutes",
      "measurable_outcome": "Complete 10 routes with 100% silent foot placements"
    }
  ],
  "projecting_focus": [
    {
      "focus_area": "Crimpy Overhangs",
      "description": "Your 40% failure rate on crimp holds suggests you need more time on crimpy terrain. Overhangs will test your tension and body positioning on crimps.",
      "grade_guidance": "Focus on problems slightly above your max grade - challenging but realistic for a week of projecting",
      "rationale": "Builds finger strength on crimps while developing body tension skills for steep terrain"
    }
  ]
}`

  return prompt
}

// Clean response - remove markdown code blocks if present
function cleanResponse(content: string): string {
  return content.replace(/```json\n?|\n?```/g, '').trim()
}

// Validate response structure
function validateResponse(content: string): object {
  const cleaned = cleanResponse(content)
  let parsed: any

  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error('Invalid JSON in response')
  }

  // Validate weekly_focus
  if (!parsed.weekly_focus || typeof parsed.weekly_focus !== 'string') {
    throw new Error('Missing or invalid field: weekly_focus')
  }

  if (parsed.weekly_focus.trim().length === 0) {
    throw new Error('Field weekly_focus cannot be empty')
  }

  // Validate drills array
  if (!Array.isArray(parsed.drills)) {
    throw new Error('Missing or invalid field: drills (must be an array)')
  }

  if (parsed.drills.length < 1 || parsed.drills.length > 3) {
    throw new Error('Field drills must contain 1-3 drill objects')
  }

  // Validate each drill
  parsed.drills.forEach((drill: any, index: number) => {
    const drillNum = index + 1

    if (!drill.name || typeof drill.name !== 'string') {
      throw new Error(`Drill ${drillNum}: Missing or invalid field: name`)
    }
    if (drill.name.trim().length === 0) {
      throw new Error(`Drill ${drillNum}: Field name cannot be empty`)
    }

    if (!drill.description || typeof drill.description !== 'string') {
      throw new Error(`Drill ${drillNum}: Missing or invalid field: description`)
    }
    if (drill.description.trim().length < 20) {
      throw new Error(
        `Drill ${drillNum}: Field description must be at least 20 characters (educational content)`
      )
    }

    if (typeof drill.sets !== 'number' || !Number.isInteger(drill.sets)) {
      throw new Error(`Drill ${drillNum}: Missing or invalid field: sets (must be integer)`)
    }
    if (drill.sets < 1 || drill.sets > 10) {
      throw new Error(`Drill ${drillNum}: Field sets must be between 1 and 10`)
    }

    if (!drill.reps || typeof drill.reps !== 'string') {
      throw new Error(`Drill ${drillNum}: Missing or invalid field: reps`)
    }
    if (drill.reps.trim().length === 0) {
      throw new Error(`Drill ${drillNum}: Field reps cannot be empty`)
    }

    if (!drill.rest || typeof drill.rest !== 'string') {
      throw new Error(`Drill ${drillNum}: Missing or invalid field: rest`)
    }
    if (drill.rest.trim().length === 0) {
      throw new Error(`Drill ${drillNum}: Field rest cannot be empty`)
    }

    if (!drill.measurable_outcome || typeof drill.measurable_outcome !== 'string') {
      throw new Error(`Drill ${drillNum}: Missing or invalid field: measurable_outcome`)
    }
    if (drill.measurable_outcome.trim().length < 10) {
      throw new Error(`Drill ${drillNum}: Field measurable_outcome must be at least 10 characters`)
    }
  })

  // Validate projecting_focus array
  if (!Array.isArray(parsed.projecting_focus)) {
    throw new Error('Missing or invalid field: projecting_focus (must be an array)')
  }

  if (parsed.projecting_focus.length < 3 || parsed.projecting_focus.length > 4) {
    throw new Error('Field projecting_focus must contain 3-4 items')
  }

  // Validate each projecting_focus item
  parsed.projecting_focus.forEach((item: any, index: number) => {
    const itemNum = index + 1

    if (!item.focus_area || typeof item.focus_area !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: focus_area`)
    }
    if (item.focus_area.trim().length === 0) {
      throw new Error(`Projecting focus ${itemNum}: Field focus_area cannot be empty`)
    }

    if (!item.description || typeof item.description !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: description`)
    }
    if (item.description.trim().length < 20) {
      throw new Error(
        `Projecting focus ${itemNum}: Field description must be at least 20 characters`
      )
    }

    if (!item.grade_guidance || typeof item.grade_guidance !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: grade_guidance`)
    }

    if (!item.rationale || typeof item.rationale !== 'string') {
      throw new Error(`Projecting focus ${itemNum}: Missing or invalid field: rationale`)
    }
    if (item.rationale.trim().length < 15) {
      throw new Error(`Projecting focus ${itemNum}: Field rationale must be at least 15 characters`)
    }
  })

  return parsed
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

    // Check daily recommendation limit BEFORE making any API calls
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const midnightUTC = today.toISOString()

    // Count today's API usage for recommendations
    const { data: todayUsage, error: usageError } = await supabase
      .from('api_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', 'openrouter-coach')
      .gte('time_window_start', midnightUTC)

    if (usageError) {
      console.error('Failed to fetch API usage:', usageError)
      // Continue anyway - limit check is a safety feature, don't block on errors
    }

    // Calculate if limit exceeded
    const effectiveCount = todayUsage?.length ?? 0

    if (effectiveCount >= dailyRecLimit) {
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
          error: `You've reached your daily limit. ${resetMessage}`,
          limit_type: 'recommendations',
          current_count: effectiveCount,
          limit: dailyRecLimit,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No need to increment counter - API usage will be tracked when request completes

    // Parse request body
    const body: RequestBody = await req.json()

    // Validate required fields
    if (!body.user_id || !body.patterns_data || !body.user_preferences) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: user_id, patterns_data, user_preferences',
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

    // Get cached recommendations for fallback
    const cachedRecommendations = await getExistingRecommendations(userId)

    // Build prompts
    const userPrompt = buildUserPrompt(
      body.patterns_data,
      body.user_preferences,
      body.recent_climbs,
      body.climbing_context
    )

    // Retry loop for API call with validation
    let lastError: Error | null = null
    let lastContent: string | null = null
    let lastUsage: any = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.6,
          response_format: { type: 'json_object' },
        })

        lastContent = response.choices[0].message.content
        lastUsage = response.usage

        if (!lastContent) {
          throw new Error('Empty response from AI')
        }

        // Validate response structure
        const validated = validateResponse(lastContent)

        // Success - store recommendations and track API usage
        const costUsd = lastUsage.cost || 0

        // Store validated recommendations
        const { error: insertError } = await supabase.from('coach_recommendations').insert({
          user_id: userId,
          content: validated,
          is_cached: false,
          error_message: null,
        })

        if (insertError) {
          console.error('Failed to store recommendations:', insertError)
          // Continue to return response - don't fail the whole request
        }

        // Track API usage
        const { error: usageError } = await supabase.from('api_usage').insert({
          user_id: userId,
          prompt_tokens: lastUsage.prompt_tokens,
          completion_tokens: lastUsage.completion_tokens,
          total_tokens: lastUsage.total_tokens,
          cost_usd: costUsd,
          model,
          endpoint: 'openrouter-coach',
          time_window_start: new Date().toISOString(),
        })

        if (usageError) {
          console.error('Failed to track API usage:', usageError)
          // Continue - tracking failure shouldn't break the response
        }

        // Return success response
        return new Response(
          JSON.stringify({
            success: true,
            content: validated,
            usage: {
              prompt_tokens: lastUsage.prompt_tokens,
              completion_tokens: lastUsage.completion_tokens,
              total_tokens: lastUsage.total_tokens,
              cost_usd: costUsd,
            },
            is_cached: false,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error: any) {
        lastError = error
        console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.message)

        // If this was the last attempt, handle the error with fallback
        if (attempt === MAX_RETRIES - 1) {
          console.error('OpenRouter API failed after retries:', lastError?.message)

          // Try to return cached recommendations
          if (cachedRecommendations) {
            // Update cached recommendations with error message
            await supabase
              .from('coach_recommendations')
              .update({
                error_message: `Failed to generate new recommendations: ${lastError?.message}`,
              })
              .eq('id', cachedRecommendations.id)

            // Track failed attempt with cost=0
            const { error: failedUsageError } = await supabase.from('api_usage').insert({
              user_id: userId,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              cost_usd: 0,
              model,
              endpoint: 'openrouter-coach',
              time_window_start: new Date().toISOString(),
            })
            if (failedUsageError) {
              console.error('Failed to track failed usage:', failedUsageError)
            }

            return new Response(
              JSON.stringify({
                success: true,
                content: cachedRecommendations.content,
                is_cached: true,
                warning: `Unable to generate new recommendations. Showing previous recommendations from ${new Date(cachedRecommendations.created_at).toLocaleDateString()}.`,
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          // No cached recommendations available - track error and return failure
          const { error: errorInsertError } = await supabase.from('coach_recommendations').insert({
            user_id: userId,
            content: {},
            is_cached: false,
            error_message: `Failed to generate valid recommendations: ${lastError?.message}`,
          })
          if (errorInsertError) {
            console.error('Failed to store error message:', errorInsertError)
          }

          const { error: finalFailedUsageError } = await supabase.from('api_usage').insert({
            user_id: userId,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            cost_usd: 0,
            model,
            endpoint: 'openrouter-coach',
            time_window_start: new Date().toISOString(),
          })
          if (finalFailedUsageError) {
            console.error('Failed to track failed usage:', finalFailedUsageError)
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to generate recommendations and no cached data available: ${lastError?.message}`,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Continue to next retry
        continue
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected error: retry loop completed without result')
  } catch (error: any) {
    console.error('Error in openrouter-coach:', error.message, error.stack)

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
