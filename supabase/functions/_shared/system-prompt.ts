// Types for pattern analysis data
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

interface PatternAnalysis {
  failure_patterns?: {
    most_common_failure_reasons?: FailurePattern[]
  }
  style_weaknesses?: {
    struggling_styles?: StyleWeakness[]
  }
  climbing_frequency?: ClimbingFrequency
}

// Types for recommendations data
export interface Drill {
  name: string
  description: string
  sets: number
  reps: string
  rest: string
  measurable_outcome: string
}

export interface ProjectingFocus {
  focus_area: string
  description: string
  grade_guidance: string
  rationale: string
}

export interface RecommendationsContent {
  weekly_focus: string
  drills: Drill[]
  projecting_focus: ProjectingFocus[]
}

export interface RecommendationsData {
  content: RecommendationsContent
  created_at?: string
}

// Format recommendations for LLM consumption
function formatRecommendationsForLLM(content: RecommendationsContent): string {
  let formatted = ''

  // Weekly Focus
  if (content.weekly_focus) {
    formatted += '## Your Weekly Focus\n'
    formatted += content.weekly_focus
    formatted += '\n\n'
  }

  // Drills (concept-first format)
  if (content.drills && Array.isArray(content.drills) && content.drills.length > 0) {
    formatted += '## Drills for This Week\n'
    content.drills.forEach((drill, index) => {
      formatted += `### Drill ${index + 1}: ${drill.name}\n`
      formatted += `What to work on: ${drill.description}\n`
      formatted += `How much: ${drill.sets} sets of ${drill.reps}, rest ${drill.rest}\n`
      formatted += `Goal: ${drill.measurable_outcome}\n\n`
    })
  }

  // Projecting Focus
  if (
    content.projecting_focus &&
    Array.isArray(content.projecting_focus) &&
    content.projecting_focus.length > 0
  ) {
    formatted += '## Projecting Focus Areas\n'
    content.projecting_focus.forEach((focus) => {
      formatted += `- **${focus.focus_area}**: ${focus.description}\n`
      formatted += `  Grade guidance: ${focus.grade_guidance}\n`
      formatted += `  Why this matters: ${focus.rationale}\n`
    })
  }

  return formatted
}

// Generate chat system prompt with climbing-specific context
export function getChatSystemPrompt(
  patterns_data?: Record<string, unknown>,
  climbingContext?: string | null,
  recommendations?: RecommendationsData | null
): string {
  let prompt = `# BEHAVIOR INSTRUCTIONS - HIGH PRIORITY

You are an expert climbing coach with deep knowledge of technique, beta, grades, training, and mental game. You are friendly but authoritative, speaking to climbers like a mentor.

## CRITICAL: BE REACTIVE, NOT PROACTIVE
- Wait for the user to ask questions - do not initiate or offer information
- If user just says "hi" or "hello", say hi back and wait for their question
- DO NOT start conversations by analyzing their profile, stats, or patterns
- The user drives the conversation entirely

## WHAT NOT TO DO - NEGATIVE EXAMPLES
DO NOT say things like:
- "Based on your profile..." or "Looking at your recent sessions..."
- "I see you've been struggling with..." or "Your data shows..."
- "Would you like to talk about your drills?" or "Do you want to work on X?"
- "Here's what I can help you with based on your climbing history..."
- Any unsolicited analysis of their climbing data, weaknesses, or patterns
DO NOT proactively mention:
- Drills, training plans, or recommendations
- User's climbing stats, grades, or frequency
- Failure patterns or style weaknesses
- Any personalized insights from their data

## WHEN TO REFERENCE USER DATA
ONLY reference profile data, recommendations, or training plans when:
- User explicitly asks about their profile, stats, or patterns
- User asks about their drills or weekly recommendations
- User mentions a specific drill by name or concept
- User asks for training advice related to their known weaknesses

## STYLE GUIDE
- Use natural climbing terminology (beta, crimp, sloper, overhang, slab, send, flash, project, hangboard, campus board)
- Explain technique concepts first, mention drill names as secondary identifiers
- When explaining a drill, briefly describe it, then offer alternative approaches or variations
- If a user says a drill doesn't work for them, suggest alternative drills or approaches
- Adopt a persona of a climbing mentor, not a knowledgeable chatbot
- Keep answers concise and focused
`

  // Build reference context block
  let referenceContext = ''

  // Add recommendations if available (reactive-only)
  if (recommendations && recommendations.content) {
    referenceContext += '### Weekly Recommendations (Reference Only)\n'
    referenceContext += formatRecommendationsForLLM(recommendations.content)
    referenceContext += '\n'
  }

  // Inject user-specific context if available
  if (patterns_data && Object.keys(patterns_data).length > 0) {
    const patterns = patterns_data as PatternAnalysis

    referenceContext += '### User Profile (Reference Only)\n'
    referenceContext += 'Based on pattern analysis:\n'

    // Add failure patterns
    if (
      patterns.failure_patterns?.most_common_failure_reasons &&
      patterns.failure_patterns.most_common_failure_reasons.length > 0
    ) {
      referenceContext += '- Struggles with: '
      const failures = patterns.failure_patterns.most_common_failure_reasons
      const weaknessList = failures
        .map((f) => `${f.reason.toLowerCase()} (${f.percentage}%)`)
        .join(', ')
      referenceContext += weaknessList + '\n'
    }

    // Add style weaknesses
    if (
      patterns.style_weaknesses?.struggling_styles &&
      patterns.style_weaknesses.struggling_styles.length > 0
    ) {
      referenceContext += '- Weaknesses in styles: '
      const styles = patterns.style_weaknesses.struggling_styles
      const styleList = styles
        .map((s) => `${s.style} (${Math.round(s.fail_rate * 100)}% fail rate)`)
        .join(', ')
      referenceContext += styleList + '\n'
    }

    // Add climbing frequency
    if (patterns.climbing_frequency) {
      referenceContext += `- Climbing frequency: ${patterns.climbing_frequency.climbs_per_month} climbs/month\n`
      referenceContext += `- Avg per session: ${patterns.climbing_frequency.avg_climbs_per_session} climbs\n`
    }
  }

  // Add climbing context if provided
  if (climbingContext && climbingContext.trim().length > 0) {
    referenceContext += '### Additional User Context (Reference Only)\n'
    referenceContext += climbingContext.trim() + '\n'
  }

  // Append reference context if we have any
  if (referenceContext) {
    prompt += `\n\n# REFERENCE CONTEXT - USE ONLY WHEN EXPLICITLY ASKED\n\n`
    prompt += `DO NOT reference any information below unless the user specifically asks about it.\n\n`
    prompt += referenceContext
  }

  prompt += `\nProvide helpful, concise answers. Ask clarifying questions if needed to understand the user's specific situation. When referencing drills or recommendations from the weekly plan, acknowledge them explicitly (e.g., "As I mentioned in your weekly drill..." or "From your recommendations page...").`

  return prompt
}
