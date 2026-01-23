import { useCallback, useEffect, useState } from 'react'

import { useCoachMessages, useCreateCoachMessage, type CoachMessage } from './useCoachMessages'

export function useLocalChatMessages() {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { data: dbMessages, isLoading } = useCoachMessages()
  const createMessage = useCreateCoachMessage()

  // Sync from DB only on initial mount
  useEffect(() => {
    if (dbMessages && isInitialLoad) {
      setMessages(dbMessages)
      setIsInitialLoad(false)
    }
  }, [dbMessages, isInitialLoad])

  const addMessage = useCallback((message: CoachMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    addMessage,
    addUserMessage: addMessage,
    addAssistantMessage: addMessage,
    clearMessages,
    createMessage,
  }
}
