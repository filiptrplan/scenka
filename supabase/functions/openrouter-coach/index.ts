import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import { corsHeaders } from '../_shared/cors.ts'

// Constants
const MAX_RETRIES = 3

// Environment variable validation
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_MODEL']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!
const model = Deno.env.get('OPENROUTER_MODEL')!

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize OpenAI client with OpenRouter baseURL
const openai = new OpenAI({
  apiKey: openrouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

// System prompt for climbing coach
const systemPrompt = `You are an expert climbing coach specializing in bouldering and sport climbing technique. Your core philosophy: most 'strength' failures are actually technique gaps.

Return valid JSON with the following structure:
- weekly_focus: A concise statement (1-2 sentences) addressing the user's primary weaknesses and the training focus for this week
- drills: An array of 3 training drills
- projecting_focus: An array of 3-4 project focus areas

Each drill must have:
- name: Drill name using climbing-specific terminology (e.g., "Silent Feet Ladder", "Flagging and Drop-Knee Drills", "Center of Gravity Control")
- description: A detailed educational explanation of what the drill is and why it's beneficial for the user's specific weaknesses
- sets: Number of sets (e.g., 4)
- reps: Repetition count or duration (e.g., "6-8 reps per hold" or "3-5 min")
- rest: Rest period between sets (e.g., "90s")
- measurable_outcome: A concrete, measurable outcome for tracking progress (e.g., "Complete 10 routes with feet silent", "Perform 20 flagging drills without repositioning")

Use technical climbing terminology throughout:
- Movement drills (silent feet, straight arms, body tension)
- Positioning drills (flagging, drop-knees, back-steps)
- Efficiency drills (rest positions, clipping sequence)
- Footwork drills (precision, smear usage, heel/toe hooks)
- Body positioning drills (center of gravity, hip turns, momentum)

Each projecting focus item must have:
- focus_area: A concise description of the type of climbs to focus on (e.g., "Crimpy Overhangs", "Tensiony Slabs", "Pinchy Overhangs")
- description: Why this focus area addresses the user's weaknesses and what it will help improve
- grade_guidance: Qualitative guidance on difficulty level (e.g., "slightly above your max grade", "within one letter grade of your hardest send")
- rationale: How this focus area connects to the user's specific weakness data and climbing goals

STRENGTH-TO-TECHNIQUE REFRAMING:
When users fail due to 'Pumped', 'Finger Strength', 'Core', or 'Power', reframe these as technique issues:
- Pumped: explain efficient movement and resting technique to conserve energy
- Finger Strength: explain crimping technique with proper body position to reduce load
- Core: explain body tension drills to improve center of gravity control
- Power: explain momentum and body positioning drills for dynamic movement

For drills: explain what each drill is and why it's beneficial for the user. Each drill must have a measurable outcome (e.g., 'Complete 10 routes with feet silent', 'Perform 20 flagging drills without repositioning')

Guidelines for projecting focus:
1. Base recommendations primarily on style weaknesses (e.g., if struggling with Sloper, recommend "Sloper problems" or "Sloper overhangs")
2. Be mindful of gym limitations - recommend styles that most gyms set (e.g., crimpy overhangs are common; dynos with toe hooks are rare)
3. Provide qualitative grade guidance only (e.g., "slightly above max grade") - not specific grade ranges
4. Keep focus areas broad but add details (e.g., "crimpy overhangs" not just "overhangs")
5. Include 3-4 focus areas to give users options`

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
function buildUserPrompt(patterns: PatternAnalysis, preferences: UserPreferences, recentClimbs?: AnonymizedClimb[]): string {
  const { failure_patterns, style_weaknesses, climbing_frequency, recent_successes } = patterns

  let prompt = `User Profile:
- Preferred discipline: ${preferences.preferred_discipline}
- Preferred grade scale: ${preferences.preferred_grade_scale}

`

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
      throw new Error(`Projecting focus ${itemNum}: Field description must be at least 20 characters`)
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
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  let userId: string | null = null

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders,
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
        headers: corsHeaders,
      })
    }

    userId = user.id

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
          headers: corsHeaders,
        }
      )
    }

    // Verify user_id matches token
    if (body.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    // Get cached recommendations for fallback
    const cachedRecommendations = await getExistingRecommendations(userId)

    // Build prompts
    const userPrompt = buildUserPrompt(body.patterns_data, body.user_preferences, body.recent_climbs)

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
        const { error: usageError } = await supabase.from('coach_api_usage').insert({
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
            headers: corsHeaders,
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
            await supabase
              .from('coach_api_usage')
              .insert({
                user_id: userId,
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                cost_usd: 0,
                model,
                endpoint: 'openrouter-coach',
                time_window_start: new Date().toISOString(),
              })
              .catch((err) => {
                console.error('Failed to track failed usage:', err)
              })

            return new Response(
              JSON.stringify({
                success: true,
                content: cachedRecommendations.content,
                is_cached: true,
                warning: `Unable to generate new recommendations. Showing previous recommendations from ${new Date(cachedRecommendations.created_at).toLocaleDateString()}.`,
              }),
              {
                headers: corsHeaders,
              }
            )
          }

          // No cached recommendations available - track error and return failure
          await supabase
            .from('coach_recommendations')
            .insert({
              user_id: userId,
              content: {},
              is_cached: false,
              error_message: `Failed to generate valid recommendations: ${lastError?.message}`,
            })
            .catch((err) => {
              console.error('Failed to store error message:', err)
            })

          await supabase
            .from('coach_api_usage')
            .insert({
              user_id: userId,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              cost_usd: 0,
              model,
              endpoint: 'openrouter-coach',
              time_window_start: new Date().toISOString(),
            })
            .catch((err) => {
              console.error('Failed to track failed usage:', err)
            })

          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to generate recommendations and no cached data available: ${lastError?.message}`,
            }),
            {
              status: 500,
              headers: corsHeaders,
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
      headers: corsHeaders,
    })
  }
})
