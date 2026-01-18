import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'

// Environment variable validation
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SB_PUBLISHABLE_KEY']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SB_PUBLISHABLE_KEY')!
const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize OpenAI client with OpenRouter baseURL
const openai = new OpenAI({
  apiKey: openrouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

// System prompt for climbing coach
const systemPrompt = `You are an expert climbing coach specializing in bouldering and sport climbing. Your approach is weakness-based coaching - identify the user's primary weaknesses and target them with specific, actionable training.

Return valid JSON with the following structure:
- weekly_focus: A concise statement (1-2 sentences) addressing the user's primary weaknesses and the training focus for this week
- drills: An array of 3 training drills

Each drill must have:
- name: Drill name using climbing-specific terminology (e.g., "7-3-5-3 Hangboard Protocol", "Campus Board Ladders", "Antagonist Training")
- description: A detailed educational explanation of what the drill is and why it's beneficial for the user's specific weaknesses
- sets: Number of sets (e.g., 4)
- reps: Repetition count or duration (e.g., "6-8 reps per hold" or "3-5 min")
- rest: Rest period between sets (e.g., "90s")

Use technical climbing terminology throughout:
- Hangboard protocols (8-12s hangs, half-crimp, open-hand)
- Campus board (power, dynamic movement, ladders)
- Antagonistic training (push muscles, tendon health)
- Periodization (strength, power, endurance phases)
- Contact strength, finger strength, core power
- For drills: explain what each drill is and why it's beneficial for the user`

// Request body types
interface UserPreferences {
  preferred_discipline: string
  preferred_grade_scale: string
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
}

// Build user prompt from patterns and preferences
function buildUserPrompt(
  patterns: PatternAnalysis,
  preferences: UserPreferences
): string {
  const { failure_patterns, style_weaknesses, climbing_frequency, recent_successes } =
    patterns

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

  // Add request
  prompt += `\nBased on this data, provide:
1. A weekly focus statement addressing the user's primary weaknesses
2. 3 specific training drills with educational explanations

Example output format:
{
  "weekly_focus": "Focus on improving finger strength through structured hangboard training to address your 40% failure rate on crimp-style holds",
  "drills": [
    {
      "name": "7-3-5-3 Hangboard Protocol",
      "description": "A progressive hangboard protocol that builds contact strength by alternating between 7-second, 3-second, 5-second, and 3-second hangs with 90-second rests. Targets the half-crimp and open-hand grip positions critical for bouldering.",
      "sets": 4,
      "reps": "6-8 reps per hold",
      "rest": "90s"
    }
  ]
}`

  return prompt
}

// Edge Function handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Validate JWT token with Supabase
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token)

    if (claimsError || !claims.data.user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Parse request body
    const body: RequestBody = await req.json()

    // Validate required fields
    if (!body.user_id || !body.patterns_data || !body.user_preferences) {
      return Response.json(
        { error: 'Missing required fields: user_id, patterns_data, user_preferences' },
        { status: 400 }
      )
    }

    // Verify user_id matches token
    if (body.user_id !== claims.data.user.id) {
      return Response.json({ error: 'User ID mismatch' }, { status: 403 })
    }

    // Build prompts
    const userPrompt = buildUserPrompt(body.patterns_data, body.user_preferences)

    // Call OpenRouter API
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    })

    // Extract content and usage
    const content = response.choices[0].message.content
    const usage = response.usage

    if (!content) {
      return Response.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    // Parse JSON response
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (e) {
      return Response.json({ error: 'Invalid JSON response from AI' }, { status: 500 })
    }

    // Return success response
    return Response.json({
      content: parsedContent,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      },
    })
  } catch (error: any) {
    console.error('Error in openrouter-coach:', error.message, error.stack)

    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
})
