import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import { corsHeaders } from '../_shared/cors.ts'
import { getChatSystemPrompt } from '../_shared/system-prompt.ts'

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

// Request body types
interface RequestBody {
  message: string
  patterns_data?: Record<string, unknown>
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

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    if (body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    if (body.message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message cannot exceed 5000 characters' }),
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    // Store user message in database
    const { error: insertError } = await supabase.from('coach_messages').insert({
      user_id: userId,
      role: 'user',
      content: body.message,
      context: body.patterns_data || {},
    })

    if (insertError) {
      console.error('Failed to store user message:', insertError)
      // Continue streaming - don't fail the whole request
    }

    // Fetch message history for context
    const messageHistory = await getMessageHistory(userId)

    // Build messages array for LLM
    const messages = [
      { role: 'system' as const, content: getChatSystemPrompt(body.patterns_data) },
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

          // Store assistant message in database
          if (assistantContent) {
            await supabase.from('coach_messages').insert({
              user_id: userId,
              role: 'assistant',
              content: assistantContent,
              context: body.patterns_data || {},
            }).catch((err) => {
              console.error('Failed to store assistant message:', err)
            })
          }

          // Track API usage with OpenRouter's cost
          if (finalUsage) {
            await supabase.from('coach_api_usage').insert({
              user_id: userId,
              prompt_tokens: finalUsage.prompt_tokens || 0,
              completion_tokens: finalUsage.completion_tokens || 0,
              total_tokens: finalUsage.total_tokens || 0,
              cost_usd: finalUsage.cost || 0,
              model,
              endpoint: 'openrouter-chat',
              time_window_start: new Date().toISOString(),
            }).catch((err) => {
              console.error('Failed to track API usage:', err)
            })
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

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
