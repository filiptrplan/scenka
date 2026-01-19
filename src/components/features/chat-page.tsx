import { Send } from 'lucide-react'
import { useRef, useEffect, useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePatternAnalysis } from '@/hooks/useCoach'
import { useCoachMessages } from '@/hooks/useCoachMessages'
import { useStreamingChat } from '@/hooks/useStreamingChat'

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
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-700 text-gray-100 rounded-bl-sm'
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
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
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-400">Coach is thinking...</span>
    </div>
  )
}

export function ChatPage() {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: messages, isLoading } = useCoachMessages()
  const { data: patterns } = usePatternAnalysis()
  const { sendMessage, streamingResponse, isStreaming, error, cleanup } = useStreamingChat()

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
    if (!inputValue.trim() || isStreaming) {
      return
    }

    const message = inputValue.trim()
    setInputValue('')
    await sendMessage(message, patterns)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex flex-col">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-12 text-[#888]">Loading messages...</div>
        ) : messages && messages.length > 0 ? (
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
          <div className="text-center py-12 text-[#888]">
            No messages yet. Ask Coach a question!
          </div>
        )}

        {/* Streaming bubble */}
        {streamingResponse && (
          <MessageBubble
            message={{
              content: streamingResponse,
              created_at: new Date().toISOString(),
            }}
            isCurrentUser={false}
          />
        )}

        {/* Typing indicator */}
        {isStreaming && <TypingIndicator />}

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
            disabled={isStreaming}
            rows={1}
            className="flex-1 min-h-[44px] resize-none bg-white/[0.02] border-white/20"
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!inputValue.trim() || isStreaming}
            className="h-[44px] w-[44px] flex-shrink-0 bg-white text-black hover:bg-white/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error !== null && <div className="text-red-400 text-sm mt-2">{error}</div>}
      </div>
    </div>
  )
}
