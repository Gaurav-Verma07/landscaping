
'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { AIMessage } from '@/lib/ai/provider.interface'
import type { PendingAction } from '@/lib/ai/tool-executor'

export type ChatMessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  pendingAction?: PendingAction
  streaming?: boolean
}

export function useAIChat() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setMessages((prev) => [...prev, { ...msg, id }])
    return id
  }, [])

  const updateMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const sendMessage = useCallback(
    async (userText: string) => {
      if (loading) return

      addMessage({ role: 'user', content: userText })
      const assistantId = addMessage({ role: 'assistant', content: '', streaming: true })

      setLoading(true)
      abortRef.current = new AbortController()

      const history: AIMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
      ]

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) throw new Error('AI request failed')

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assistantText = ''
        let pendingAction: PendingAction | undefined

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            try {
              const chunk = JSON.parse(raw)

              // ── Text streaming ─────────────────────────────────────────────
              if (chunk.type === 'text' && chunk.content) {
                assistantText += chunk.content
                updateMessage(assistantId, { content: assistantText })
              }

              // ── Tool call side-effects ─────────────────────────────────────
              // The provider emits tool_call chunks for navigation and approvals.
              // All other tool calls are handled server-side in the agentic loop.
              if (chunk.type === 'tool_call' && chunk.toolResult) {
                try {
                  const result = JSON.parse(chunk.toolResult)

                  // Navigation — router.push() client-side
                  if (result?.navigating && result?.path) {
                    router.push(result.path)
                  }

                  // Approval required — surface card to user
                  if (result?.requires_approval && result?.action) {
                    pendingAction = result.action
                  }
                } catch { /* ignore */ }
              }

              // ── Errors ─────────────────────────────────────────────────────
              if (chunk.type === 'error') {
                assistantText += `\n⚠️ ${chunk.error}`
                updateMessage(assistantId, { content: assistantText })
              }
            } catch { /* ignore malformed chunks */ }
          }
        }

        // Invalidate relevant caches after any tool interaction
        // so data is fresh if user navigated to a new page
        await queryClient.invalidateQueries()

        updateMessage(assistantId, {
          content: assistantText || '✅ Done.',
          streaming: false,
          pendingAction,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          updateMessage(assistantId, {
            content: 'Something went wrong. Please try again.',
            streaming: false,
          })
        }
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    [messages, loading, addMessage, updateMessage, router, queryClient]
  )

  const confirmAction = useCallback(
    async (messageId: string, action: PendingAction) => {
      updateMessage(messageId, { pendingAction: undefined })

      const executingId = addMessage({
        role: 'assistant',
        content: 'Executing...',
        streaming: true,
      })

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [], confirmedAction: action }),
        })

        const result = await res.json()

        if (result.type === 'error') {
          updateMessage(executingId, {
            content: `❌ Failed: ${result.message}`,
            streaming: false,
          })
        } else {
          // Invalidate relevant query cache after write
          await queryClient.invalidateQueries()
          updateMessage(executingId, {
            content: '✅ Done.',
            streaming: false,
          })
        }
      } catch {
        updateMessage(executingId, {
          content: '❌ Action failed. Please try again.',
          streaming: false,
        })
      }
    },
    [addMessage, updateMessage, queryClient]
  )

  const cancelAction = useCallback(
    (messageId: string) => {
      updateMessage(messageId, { pendingAction: undefined })
      addMessage({ role: 'assistant', content: 'Action cancelled.' })
    },
    [addMessage, updateMessage]
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    messages,
    loading,
    sendMessage,
    confirmAction,
    cancelAction,
    clearMessages,
    stopStreaming,
  }
}