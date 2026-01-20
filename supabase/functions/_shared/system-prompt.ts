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
interface Drill {
  name: string
  description: string
  sets: number
  reps: string
  rest: string
  measurable_outcome: string
}

interface ProjectingFocus {
  focus_area: string
  description: string
  grade_guidance: string
  rationale: string
}

interface RecommendationsContent {
  weekly_focus: string
  drills: Drill[]
  projecting_focus: ProjectingFocus[]
}

interface RecommendationsData {
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
  if (content.projecting_focus && Array.isArray(content.projecting_focus) && content.projecting_focus.length > 0) {
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
  let prompt = `You are an expert climbing coach with deep knowledge of technique, beta, grades, training, and mental game. You are friendly but authoritative, speaking to climbers like a mentor.

Your primary purpose is to help users clarify drills and recommendations from their weekly coaching plan, or ask questions about alternative training approaches. Users typically come to you from the recommendations page with questions about specific drills or their training focus.

Your behavior:
- Answer-focused, user drives the conversation
- Only reference weekly recommendations if the user specifically asks about them or mentions drills
- Explain technique concepts first, then mention drill names as secondary identifiers
- When explaining a drill, briefly describe it, then offer alternative approaches or variations
- If a user says a drill doesn't work for them, suggest alternative drills or approaches (do not suggest regenerating recommendations)
- Use natural climbing terminology (beta, crimp, sloper, overhang, slab, send, flash, project, hangboard, campus board)
`

  // Add recommendations if available (reactive-only)
  if (recommendations && recommendations.content) {
    prompt += '\n\n'
    prompt += formatRecommendationsForLLM(recommendations.content)
    prompt += '\n\n'
  }

  // Inject user-specific context if available
  if (patterns_data && Object.keys(patterns_data).length > 0) {
    const patterns = patterns_data as PatternAnalysis

    prompt += 'User Profile (based on pattern analysis):\n'

    // Add failure patterns
    if (
      patterns.failure_patterns?.most_common_failure_reasons &&
      patterns.failure_patterns.most_common_failure_reasons.length > 0
    ) {
      prompt += '- Struggles with: '
      const failures = patterns.failure_patterns.most_common_failure_reasons
      const weaknessList = failures
        .map((f) => `${f.reason.toLowerCase()} (${f.percentage}%)`)
        .join(', ')
      prompt += weaknessList + '\n'
    }

    // Add style weaknesses
    if (
      patterns.style_weaknesses?.struggling_styles &&
      patterns.style_weaknesses.struggling_styles.length > 0
    ) {
      prompt += '- Weaknesses in styles: '
      const styles = patterns.style_weaknesses.struggling_styles
      const styleList = styles
        .map((s) => `${s.style} (${Math.round(s.fail_rate * 100)}% fail rate)`)
        .join(', ')
      prompt += styleList + '\n'
    }

    // Add climbing frequency
    if (patterns.climbing_frequency) {
      prompt += `- Climbing frequency: ${patterns.climbing_frequency.climbs_per_month} climbs/month\n`
      prompt += `- Avg per session: ${patterns.climbing_frequency.avg_climbs_per_session} climbs\n`
    }
  }

  // Add climbing context if provided
  if (climbingContext && climbingContext.trim().length > 0) {
    prompt += '\n\nUser Context:\n'
    prompt += climbingContext.trim() + '\n'
  }

  prompt += `\nProvide helpful, concise answers. Ask clarifying questions if needed to understand the user's specific situation. When referencing drills or recommendations from the weekly plan, acknowledge them explicitly (e.g., "As I mentioned in your weekly drill..." or "From your recommendations page...").`

  return prompt
}
