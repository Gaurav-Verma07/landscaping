"use client"

import { useConversation } from "@elevenlabs/react"
import { useCallback, useState } from "react"
import { fetchConversationToken, fetchSignedUrl } from "@/lib/elevenlabs/client"

export type ConnectionMethod = 'token' | 'signedUrl' | 'agentId'

export interface UseVoiceAgentProps {
  agentId?: string
  connectionMethod?: ConnectionMethod
  useWebRTC?: boolean
  clientTools?: Record<string, (parameters: Record<string, unknown>) => Promise<string | void> | string | void>
  textOnly?: boolean
  preferHeadphonesForIos?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (message: unknown) => void
}

export function useVoiceAgent({
  agentId,
  connectionMethod: how = 'token',
  useWebRTC = true,
  clientTools: tools,
  textOnly = false,
  preferHeadphonesForIos = false,
  onConnect,
  onDisconnect,
  onError,
  onMessage,
}: UseVoiceAgentProps) {
  const [talk, setTalk] = useState(false)
  const [conn, setConn] = useState(false)

  const conversation = useConversation({
    textOnly,
    preferHeadphonesForIosDevices: preferHeadphonesForIos,
    onConnect: () => {
      setConn(false)
      onConnect?.()
    },
    onDisconnect: () => {
      setTalk(false)
      setConn(false)
      onDisconnect?.()
    },
    onMessage: (m) => onMessage?.(m),
    onError: (err: unknown) => {
      setConn(false)
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
    onModeChange: (mode) => setTalk(mode.mode === "speaking"),
    clientTools: tools,
  })

  const flip = useCallback(async () => {
    if (conversation.status === "connected") {
      await conversation.endSession()
      return
    }
    try {
      setConn(true)
      if (how === 'token') {
        const tok = await fetchConversationToken()
        await conversation.startSession({ conversationToken: tok, connectionType: "webrtc" })
      } else if (how === 'signedUrl') {
        const url = await fetchSignedUrl()
        await conversation.startSession({ signedUrl: url, connectionType: "websocket" })
      } else {
        if (!agentId) throw new Error('Agent ID required for agentId connection')
        await conversation.startSession({
          agentId,
          connectionType: useWebRTC ? "webrtc" : "websocket",
        })
      }
    } catch (err) {
      setConn(false)
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }, [conversation, how, agentId, useWebRTC, onError])

  return {
    status: conversation.status,
    isSpeaking: talk,
    isConnecting: conn,
    toggleConnection: flip,
    conversation,
  }
}
