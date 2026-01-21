import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import { corsHeaders } from '../_shared/cors.ts'
import { getChatSystemPrompt, type RecommendationsData } from '../_shared/system-prompt.ts'

// Environment variable validation
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_MODEL', 'DAILY_CHAT_LIMIT']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!
const model = Deno.env.get('OPENROUTER_MODEL')!
const dailyChatLimit = parseInt(Deno.env.get('DAILY_CHAT_LIMIT') ?? '10')

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize OpenAI client with OpenRouter baseURL
const openai = new OpenAI({
  apiKey: openrouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
})

// Request body types
interface RequestBody {
  message: string
  patterns_data?: Record<string, unknown>
  climbing_context?: string | null
  recommendations?: RecommendationsData | null
}

interface Message {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Helper function to fetch message history
async function getMessageHistory(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to fetch message history:', error)
    return []
  }

  // Reverse to get chronological order
  return (data as Message[]).reverse()
}

// Helper function to fetch recommendations if not provided
async function fetchRecommendationsIfMissing(
  userId: string,
  recommendations?: RecommendationsData | null
): Promise<RecommendationsData | null> {
  // If recommendations already provided in request body, return them directly
  if (recommendations && recommendations.content) {
    return recommendations
  }

  // Fetch from database if not provided
  const { data, error } = await supabase
    .from('coach_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    console.log('No recommendations available')
    return null
  }

  // Only return if there's valid content
  if (data && data.content && Object.keys(data.content).length > 0) {
    console.log('Recommendations found')
    return data as RecommendationsData
  }

  return null
}

// Helper function to estimate token count (rough approximation: ~1.3 tokens per word, or ~4 chars per token)
function estimateTokenCount(text: string): number {
  // Count words (split by whitespace, filter empty)
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length
  // Or count characters / 4 for English text approximation
  const charBasedEstimate = Math.ceil(text.length / 4)
  // Use the higher of the two to be conservative
  return Math.max(wordCount, charBasedEstimate)
}

// Edge Function handler with SSE streaming
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
    return new Response(
      JSON.stringify({ error: 'Method not allowed', success: false }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  let userId: string | null = null

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Validate JWT token with Supabase
    const {
      data: { user },
      error: claimsError,
    } = await supabase.auth.getUser(token)

    if (claimsError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    userId = user.id

    // Check daily chat limit BEFORE making LLM API call
    const { data: limits, error: limitsError } = await supabase
      .from('user_limits')
      .select('chat_count, limit_date')
      .eq('user_id', userId)
      .maybeSingle()

    if (limitsError) {
      console.error('Failed to fetch user limits:', limitsError)
      // Continue anyway - don't block on limit check error
    }

    const chatCount = limits?.chat_count ?? 0
    const limitDate = limits?.limit_date ? new Date(limits.limit_date) : new Date('1970-01-01')
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Reset count if new day (handle same-day check with comparison)
    const isSameDay = limitDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    const effectiveCount = isSameDay ? chatCount : 0

    if (effectiveCount >= dailyChatLimit) {
      // Calculate hours until next reset (UTC midnight)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      const hoursUntilReset = Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60))

      const resetMessage = hoursUntilReset <= 1
        ? 'Next reset in less than 1 hour'
        : hoursUntilReset < 24
        ? `Next reset in ${hoursUntilReset} hours`
        : 'Next reset tomorrow at midnight UTC'

      return new Response(
        JSON.stringify({
          error: `You've reached your daily limit. ${resetMessage}`,
          limit_type: 'chat',
          current_count: effectiveCount,
          limit: dailyChatLimit,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Increment counter BEFORE storing message and making LLM API call
    await supabase.rpc('increment_chat_count', { p_user_id: userId })

    // Parse request body
    const body: RequestBody = await req.json()

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message cannot exceed 5000 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check token limit (10k tokens) to prevent abuse
    const MAX_TOKENS = 10000

    // Estimate tokens from message
    const messageTokens = estimateTokenCount(body.message)

    // Estimate tokens from optional context data
    let contextTokens = 0
    if (body.patterns_data) {
      contextTokens += estimateTokenCount(JSON.stringify(body.patterns_data))
    }
    if (body.climbing_context) {
      contextTokens += estimateTokenCount(body.climbing_context)
    }
    if (body.recommendations && body.recommendations.content) {
      contextTokens += estimateTokenCount(JSON.stringify(body.recommendations.content))
    }

    // Estimate tokens from system prompt (rough estimate)
    const systemPrompt = getChatSystemPrompt(body.patterns_data, body.climbing_context, body.recommendations)
    const systemPromptTokens = estimateTokenCount(systemPrompt)

    // Total estimated tokens for this request
    const estimatedTotalTokens = messageTokens + contextTokens + systemPromptTokens

    if (estimatedTotalTokens > MAX_TOKENS) {
      return new Response(
        JSON.stringify({
          error: `Request exceeds maximum token limit (${MAX_TOKENS} tokens). Estimated: ${estimatedTotalTokens} tokens. Please reduce the length of your message or context.`,
          estimated_tokens: estimatedTotalTokens,
          max_tokens: MAX_TOKENS,
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch recommendations if not provided in request body
    const recommendations = await fetchRecommendationsIfMissing(userId, body.recommendations)

    // NOTE: User message is saved by the client, not here to avoid duplicates

    // Fetch message history for context
    const messageHistory = await getMessageHistory(userId)

    // Build messages array for LLM
    const messages = [
      {
        role: 'system' as const,
        content: getChatSystemPrompt(body.patterns_data, body.climbing_context, recommendations),
      },
      ...messageHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Call OpenAI with streaming
          const response = await openai.chat.completions.create({
            model,
            messages,
            stream: true,
            temperature: 0.3,
          })

          let assistantContent = ''
          let finalUsage: any = null

          // Stream each chunk
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''

            if (content) {
              assistantContent += content

              // Send SSE event
              const data = JSON.stringify({ content })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            // Capture usage from final chunk
            if (chunk.usage) {
              finalUsage = chunk.usage
            }
          }

          // NOTE: Assistant message is saved by the client, not here to avoid duplicates

          // Track API usage with OpenRouter's cost
          if (finalUsage) {
            const { error: usageError } = await supabase.from('api_usage').insert({
              user_id: userId,
              prompt_tokens: finalUsage.prompt_tokens || 0,
              completion_tokens: finalUsage.completion_tokens || 0,
              total_tokens: finalUsage.total_tokens || 0,
              cost_usd: finalUsage.cost || 0,
              model,
              endpoint: 'openrouter-chat',
              time_window_start: new Date().toISOString(),
            })
            if (usageError) {
              console.error('Failed to track API usage:', usageError)
            }
          }

          // Send DONE signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          controller.close()
        } catch (error: any) {
          console.error('Stream error:', error.message, error.stack)

          // Send error event
          const errorData = JSON.stringify({ error: error.message || 'Stream error' })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))

          // Send DONE signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          controller.close()
        }
      },
    })

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error in openrouter-chat:', error.message, error.stack)

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
