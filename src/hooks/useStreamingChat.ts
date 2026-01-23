/* eslint-disable import/order */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { supabase } from '@/lib/supabase'
import { useCreateCoachMessage } from '@/hooks/useCoachMessages'
import { useCoachRecommendations } from '@/hooks/useCoach'
import { userLimitsKeys } from './useUserLimits'

import type { CoachMessage } from './useCoachMessages'

export interface UseStreamingChatReturn {
  sendMessage: (message: string, patterns?: unknown, climbingContext?: string | null) => Promise<void>
  streamingResponse: string
  isStreaming: boolean
  error: string | null
  setError: (error: string | null) => void
  cleanup: () => void
  addUserMessage: (message: CoachMessage) => void
  addAssistantMessage: (message: CoachMessage) => void
}

interface UseStreamingChatOptions {
  addUserMessage: (message: CoachMessage) => void
  addAssistantMessage: (message: CoachMessage) => void
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

export function useStreamingChat({ addUserMessage, addAssistantMessage }: UseStreamingChatOptions): UseStreamingChatReturn {
  const [streamingResponse, setStreamingResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasErrorRef = useRef(false)
  const createMessage = useCreateCoachMessage()
  const queryClient = useQueryClient()
  const isSendingRef = useRef(false) // Guard against duplicate operations

  // Fetch recommendations (leverages TanStack Query cache with 24h staleTime)
  const { data: recommendations } = useCoachRecommendations()

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const sendMessage = useCallback(
    async (message: string, patterns: unknown = null, climbingContext: string | null = null) => {
      // Guard check FIRST - before any state modification
      if (isSendingRef.current) {
        return
      }
      isSendingRef.current = true

      try {
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

        // Optimistically add user message to local state immediately
        const tempTimestamp = new Date().toISOString()
        addUserMessage({
          id: `temp-${tempTimestamp}`,
          user_id: 'temp',
          role: 'user',
          content: message,
          created_at: tempTimestamp,
          context: {
            patterns_data: patterns,
          },
        })

        // Save user message to database (background, no invalidation)
        createMessage.mutateAsync({
          role: 'user',
          content: message,
          context: {
            patterns_data: patterns,
          },
        }).catch((err) => {
          setError(`Failed to save message: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
        await fetchEventSource(`${supabaseUrl  }/functions/v1/openrouter-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message,
            patterns_data: patterns,
            climbing_context: climbingContext,
            recommendations,
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

            // Optimistically add assistant message to local state immediately
            if (fullResponse && !hasErrorRef.current) {
              const assistantTimestamp = new Date().toISOString()
              addAssistantMessage({
                id: `temp-assistant-${assistantTimestamp}`,
                user_id: 'temp',
                role: 'assistant',
                content: fullResponse,
                created_at: assistantTimestamp,
                context: {
                  patterns_data: patterns,
                },
              })

              // Clear streaming response since the message is now in local state
              setStreamingResponse('')

              // Save assistant message to database (background, no invalidation)
              createMessage.mutateAsync({
                role: 'assistant',
                content: fullResponse,
                context: {
                  patterns_data: patterns,
                },
              }).catch((err) => {
                setError(`Failed to save message: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
            // Clear streaming response on error so it doesn't persist
            setStreamingResponse('')
            // Return to prevent automatic retry
          },
        })
      } catch (e) {
        setIsStreaming(false)
        setError(e instanceof Error ? e.message : 'Failed to send message')
      } finally {
        // ALWAYS reset guard, regardless of success/failure
        isSendingRef.current = false
      }
    },
    [isStreaming, createMessage, recommendations, addUserMessage, addAssistantMessage, queryClient]
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
    addUserMessage,
    addAssistantMessage,
  }
}
