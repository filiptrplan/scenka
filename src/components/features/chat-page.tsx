import { Brain, Send, Trash2 } from 'lucide-react'
import { useRef, useEffect, useState, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePatternAnalysis } from '@/hooks/useCoach'
import { useClearCoachMessages } from '@/hooks/useCoachMessages'
import { useLocalChatMessages } from '@/hooks/useLocalChatMessages'
import { useStreamingChat } from '@/hooks/useStreamingChat'
import { useUserLimits, getTimeUntilNextReset } from '@/hooks/useUserLimits'
import { markdownComponents } from '@/lib/markdown-components'
import { getProfile } from '@/services/profiles'

interface MessageBubbleProps {
  message: {
    content: string
    created_at: string
  }
  isCurrentUser: boolean
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-lg transition-all duration-200 hover:brightness-110 ${isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-sm hover:brightness-110'
            : 'bg-gray-700 text-gray-100 rounded-bl-sm hover:brightness-105'
        }`}
      >
        {isCurrentUser ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm, rehypeHighlight]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        )}
        <div
          className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-400'}`}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="mb-4 flex items-center gap-2 px-4">
      <Brain className="h-4 w-4 text-gray-400" />
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-400">Coach is thinking...</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="flex-1 space-y-2 max-w-[80%]">
          <div className="h-4 bg-blue-600/30 rounded w-full animate-pulse" />
          <div className="h-4 bg-blue-600/30 rounded w-2/3 animate-pulse ml-auto" />
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function ChatPage() {
  const [inputValue, setInputValue] = useState('')
  const [lastMessage, setLastMessage] = useState<string>('')
  const [profile, setProfile] = useState<{ climbing_context: string | null } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: patterns } = usePatternAnalysis()
  const { messages, isLoading, addUserMessage, addAssistantMessage, clearMessages: clearLocalMessages } = useLocalChatMessages()
  const { sendMessage, streamingResponse, isStreaming, error, cleanup, setError } = useStreamingChat({ addUserMessage, addAssistantMessage })
  const { data: limits } = useUserLimits()
  const clearMessagesMutation = useClearCoachMessages()

  const dailyChatLimit = 10
  const chatCount = limits?.chat_count ?? 0
  const chatRemaining = Math.max(0, dailyChatLimit - chatCount)
  const isChatAtLimit = chatRemaining <= 0

  // Fetch profile on mount
  useEffect(() => {
    void getProfile().then(setProfile)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingResponse])

  // Mobile focus effect - auto-focus textarea on mount for mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      textareaRef.current?.focus()
    }
  }, [])

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const handleSend = async () => {
    if (isChatAtLimit) {
      toast.error('You have reached your daily chat limit')
      return
    }

    if (!inputValue.trim() || isStreaming) {
      return
    }

    const message = inputValue.trim()
    setLastMessage(message)
    setInputValue('')
    textareaRef.current?.focus()
    await sendMessage(message, patterns, profile?.climbing_context ?? null)
  }

  const handleRetry = async () => {
    if (!lastMessage || isStreaming) {
      return
    }
    setError(null)
    await sendMessage(lastMessage, patterns, profile?.climbing_context ?? null)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleClearChat = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      clearLocalMessages()
      void clearMessagesMutation.mutateAsync(undefined, {
        onSuccess: () => toast.success('Chat history cleared'),
      })
    }
  }


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex flex-col">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.role === 'user'}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-[#888]" />
            <p className="text-[#888] text-sm mb-2">No messages yet</p>
            <p className="text-xs text-gray-500 font-mono">
              Ask Coach about technique, beta, or training
            </p>
          </div>
        )}

        {/* Streaming bubble */}
        {streamingResponse.length > 0 && (
          <MessageBubble
            key="streaming-response"
            message={{
              content: streamingResponse,
              created_at: new Date().toISOString(),
            }}
            isCurrentUser={false}
          />
        )}

        {/* Typing indicator */}
        {isStreaming === true && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Coach a question..."
            rows={1}
            className="flex-1 min-h-[44px] resize-none bg-white/[0.02] border-white/20 transition-all duration-200 hover:border-white/30"
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => void handleSend()}
              disabled={!inputValue.trim() || isStreaming || isChatAtLimit}
              className={`h-[44px] w-[44px] flex-shrink-0 bg-white text-black transition-all duration-200 ${
                !inputValue.trim() || isStreaming || isChatAtLimit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
            {messages.length > 0 ? (
              <Button
                onClick={handleClearChat}
                disabled={isStreaming}
                variant="ghost"
                size="icon"
                className="h-[44px] w-[44px] text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                aria-label="Clear chat history"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            ) : null}
            <span className="text-xs text-[#888] whitespace-nowrap">
              {chatCount}/{dailyChatLimit} used today
            </span>
          </div>
        </div>
        {error !== null && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-red-400">{error}</span>
            {lastMessage.length > 0 && !isStreaming && (
              <button
                onClick={() => void handleRetry()}
                type="button"
                className="ml-2 text-xs text-blue-400 underline hover:text-blue-300 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {isChatAtLimit === true && (
          <p className="text-xs text-red-400 mt-2">{getTimeUntilNextReset()}</p>
        )}
      </div>
    </div>
  )
}
