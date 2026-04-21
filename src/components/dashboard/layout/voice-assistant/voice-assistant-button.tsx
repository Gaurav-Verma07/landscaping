"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AiAssistantLogo } from "@/components/dashboard/layout/voice-assistant/ai-assistant-logo"
import { useVoiceAssistant } from "@/components/dashboard/layout/voice-assistant/voice-assistant-provider"

export function VoiceAssistantButton() {
  const { status, isSpeaking, isConnecting, toggleConnection } = useVoiceAssistant()
  const busy = isConnecting ?? (status === "connecting" || status === "disconnecting")

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("relative overflow-visible border-transparent bg-transparent shadow-none", "hover:bg-transparent")}
      onClick={toggleConnection}
      disabled={busy}
    >
      <span className="sr-only">Toggle Voice Assistant</span>
      <span className="relative block h-9 w-9">
        <span className={cn("absolute -inset-2 rounded-full blur-2xl opacity-90 animate-pulse", "bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-500")} />
        <span className={cn("absolute -inset-1 rounded-full animate-ping", "bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500")} />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-background/40 shadow-2xl backdrop-blur animate-pulse">
          {busy ? <Loader2 className="h-[1.1rem] w-[1.1rem] animate-spin text-foreground" /> : <AiAssistantLogo className="h-[1.6rem] w-[1.6rem]" />}
        </span>
      </span>
      <span className="sr-only">Toggle Voice Assistant</span>
    </Button>
  )
}
