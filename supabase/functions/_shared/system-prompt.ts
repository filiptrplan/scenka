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

// Generate chat system prompt with climbing-specific context
export function getChatSystemPrompt(patterns_data?: Record<string, unknown>): string {
  let prompt = `You are an expert climbing coach specializing in bouldering and sport climbing technique. Your expertise covers climbing movement, beta analysis, grade progression, and training methods.

Your role is to help climbers improve through Q&A about technique, beta, grades, training styles, and mental game. Be concise, helpful, and use proper climbing terminology.

Use these terms naturally:
- beta: The sequence of moves to complete a climb
- crimp: Small edge holds requiring finger strength
- sloper: Rounded holds requiring friction and body tension
- overhang: Steep terrain requiring strength and technique
- slab: Low-angle terrain requiring balance and footwork
- send: Successfully complete a climb
- flash: Send on first try with beta knowledge
- project: A climb being worked on
- campus board: Training board for explosive power
- hangboard: Training tool for finger strength
`

  // Inject user-specific context if available
  if (patterns_data && Object.keys(patterns_data).length > 0) {
    const patterns = patterns_data as PatternAnalysis

    prompt += '\n\nUser Profile (based on pattern analysis):\n'

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

  prompt += `\nProvide helpful, concise answers. Ask clarifying questions if needed to understand the user's specific situation.`

  return prompt
}
