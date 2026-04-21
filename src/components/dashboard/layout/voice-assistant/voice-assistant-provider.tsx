"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useVoiceAgent } from "@/hooks/use-voice-agent"
import { findRoute, getAllRouteAliases } from "@/lib/navigation/routes"

type VoiceAssistantContextValue = {
  status: string
  isSpeaking: boolean
  isConnecting: boolean
  toggleConnection: () => Promise<void>
  sendTextCommand: (input: string) => Promise<boolean>
  exploreCommands: string[]
}

const VoiceAssistantContext = React.createContext<VoiceAssistantContextValue | null>(null)

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const tools = React.useMemo(
    () => ({
      navigateTo: async (params: Record<string, unknown>) => {
        const { destination } = params as { destination: string }
        const r = findRoute(destination)
        if (!r) {
          const aliases = getAllRouteAliases()
          toast.error("Navigation Error", { description: `Could not find: "${destination}"` })
          return `Could not find route for: "${destination}". Available: ${aliases.slice(0, 5).join(", ")}, and more.`
        }
        router.push(r.path)
        const msg = `Navigating to ${r.title}`
        toast.success("Navigation", { description: msg })
        return msg
      },
    }),
    [router]
  )

  const { status, isSpeaking, isConnecting, toggleConnection } = useVoiceAgent({
    connectionMethod: "token",
    clientTools: tools,
    onConnect: () => toast.success("Siri Connected", { description: "You can now use voice or typed commands" }),
    onDisconnect: () => toast.info("Siri Disconnected"),
    onError: (e) => toast.error("Siri Error", { description: e.message }),
  })

  const sendTextCommand = React.useCallback(
    async (input: string) => {
      const t = input.trim()
      if (!t) {
        toast.info("Type a command to get started")
        return false
      }
      const r = findRoute(t)
      if (!r) {
        toast.error("Command not recognized", { description: `Try "Clients", "Invoices", or "Calendar".` })
        return false
      }
      router.push(r.path)
      toast.success("Navigation", { description: `Opening ${r.title}` })
      return true
    },
    [router]
  )

  const exploreCommands = React.useMemo(() => getAllRouteAliases().slice(0, 6), [])

  const v = React.useMemo(
    () => ({ status, isSpeaking, isConnecting, toggleConnection, sendTextCommand, exploreCommands }),
    [exploreCommands, isConnecting, isSpeaking, sendTextCommand, status, toggleConnection]
  )

  return <VoiceAssistantContext.Provider value={v}>{children}</VoiceAssistantContext.Provider>
}

export function useVoiceAssistant() {
  const ctx = React.useContext(VoiceAssistantContext)
  if (!ctx) throw new Error("useVoiceAssistant must be used within VoiceAssistantProvider")
  return ctx
}
