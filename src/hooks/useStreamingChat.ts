/* eslint-disable import/order */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { supabase } from '@/lib/supabase'
import { useCreateCoachMessage } from '@/hooks/useCoachMessages'
import { userLimitsKeys } from './useUserLimits'

export interface UseStreamingChatReturn {
  sendMessage: (message: string, patterns?: unknown, climbingContext?: string | null) => Promise<void>
  streamingResponse: string
  isStreaming: boolean
  error: string | null
  setError: (error: string | null) => void
  cleanup: () => void
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

export function useStreamingChat(): UseStreamingChatReturn {
  const [streamingResponse, setStreamingResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasErrorRef = useRef(false)
  const createMessage = useCreateCoachMessage()
  const queryClient = useQueryClient()

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const sendMessage = useCallback(
    async (message: string, patterns: unknown = null, climbingContext: string | null = null) => {
      if (!message.trim()) {
        setError('Message cannot be empty')
        return
      }

      if (isStreaming) {
        setError('Already streaming. Please wait for the current response to complete.')
        return
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      hasErrorRef.current = false

      setIsStreaming(true)
      setStreamingResponse('')
      setError(null)

      try {
        // Save user message to database
        await createMessage.mutateAsync({
          role: 'user',
          content: message,
          context: {
            patterns_data: patterns,
          },
        })

        // Get session for auth
        if (!supabase) {
          throw new Error('Supabase client not configured')
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error('Not authenticated')
        }

        let fullResponse = ''

        // Connect to SSE endpoint
        await fetchEventSource(supabaseUrl + '/functions/v1/openrouter-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message,
            patterns_data: patterns,
            climbing_context: climbingContext,
          }),
          signal: abortController.signal,

          onopen: async (response) => {
            if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
              return // Connection successful
            }
            throw new Error('Failed to establish SSE connection')
          },

          onmessage: (event) => {
            try {
              const data = JSON.parse(event.data)

              if (data.content !== undefined) {
                fullResponse += data.content
                setStreamingResponse(fullResponse)
              }

              if (data.error !== undefined) {
                setError(data.error)
                hasErrorRef.current = true
              }
            } catch {
              // Ignore JSON parse errors for partial chunks
            }
          },

          onclose: () => {
            setIsStreaming(false)
            abortControllerRef.current = null

            // Save assistant message after streaming completes
            if (fullResponse && !hasErrorRef.current) {
              void createMessage.mutateAsync({
                role: 'assistant',
                content: fullResponse,
                context: {
                  patterns_data: patterns,
                },
              })
              // Invalidate user limits to refresh counter display
              void queryClient.invalidateQueries({
                queryKey: userLimitsKeys.current(),
              })
            }
          },

          onerror: (err) => {
            setIsStreaming(false)
            abortControllerRef.current = null
            hasErrorRef.current = true
            setError(err instanceof Error ? err.message : 'An unknown error occurred')
            // Return to prevent automatic retry
            console.error('SSE error:', err)
          },
        })
      } catch (e) {
        setIsStreaming(false)
        setError(e instanceof Error ? e.message : 'Failed to send message')
        console.error('Message send error:', e)
      }
    },
    [isStreaming, createMessage]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    sendMessage,
    streamingResponse,
    isStreaming,
    error,
    setError,
    cleanup,
  }
}
