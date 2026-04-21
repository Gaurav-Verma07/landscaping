"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useVoiceAgent } from "@/hooks/use-voice-agent"
import { VoiceAssistantButton } from "@/components/ui/voice-assistant-button"
import { findRoute, getAllRouteAliases } from "@/lib/navigation/routes"
import { toast } from "sonner"

export function VoiceNavigator() {
  const router = useRouter()

  const tools = useMemo(
    () => ({
      navigateTo: async (params: Record<string, unknown>) => {
        const { destination } = params as { destination: string }
        try {
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
        } catch (e) {
          const err = e instanceof Error ? e.message : "Unknown error"
          toast.error("Navigation Failed", { description: "An error occurred while navigating" })
          return `Failed to navigate: ${err}`
        }
      },
    }),
    [router]
  )

  const { status, isSpeaking, isConnecting, toggleConnection } = useVoiceAgent({
    connectionMethod: "token",
    clientTools: tools,
    onConnect: () => toast.success("Voice Assistant Connected", { description: "You can now use voice commands to navigate" }),
    onDisconnect: () => toast.info("Voice Assistant Disconnected"),
    onError: (e) => toast.error("Voice Assistant Error", { description: e.message }),
  })

  return (
    <VoiceAssistantButton
      status={status}
      isSpeaking={isSpeaking}
      isConnecting={isConnecting}
      onToggle={toggleConnection}
    />
  )
}
