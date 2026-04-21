"use client"

import * as React from "react"
import { Loader2, Mic, MicOff, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AiAssistantLogo } from "@/components/dashboard/layout/voice-assistant/ai-assistant-logo"
import { useVoiceAssistant } from "@/components/dashboard/layout/voice-assistant/voice-assistant-provider"

export function VoiceAssistantDock() {
  const { status, isSpeaking, isConnecting, toggleConnection, sendTextCommand, exploreCommands } = useVoiceAssistant()
  const [open, setOpen] = React.useState(false)
  const [txt, setTxt] = React.useState("")

  const busy = isConnecting ?? (status === "connecting" || status === "disconnecting")
  const on = status === "connected"

  const send = async () => {
    const ok = await sendTextCommand(txt)
    if (ok) setTxt("")
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="w-[340px] rounded-3xl border border-white/10 bg-gradient-to-br from-background/95 via-background/90 to-muted/80 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={cn("absolute inset-0 rounded-full blur-lg", on ? "bg-indigo-400/40" : "bg-muted/30")} />
                  <div className="relative rounded-full border border-white/10 bg-background/70 p-1.5">
                    <AiAssistantLogo className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Siri</div>
                  <div className="text-xs text-muted-foreground">Voice + typing control</div>
                </div>
              </div>
              <Badge
                variant={on ? "default" : "secondary"}
                className={cn("border border-white/10", on ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white" : "bg-muted/70 text-muted-foreground")}
              >
                {on ? (isSpeaking ? "Speaking" : "Listening") : "Idle"}
              </Badge>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-muted/30 p-2">
              <Input
                placeholder="Type a command or page..."
                value={txt}
                onChange={(e) => setTxt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button size="icon" variant="ghost" onClick={send} className="rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button className="flex-1 rounded-2xl" variant={on ? "destructive" : "default"} onClick={toggleConnection} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : on ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {on ? "Stop Listening" : "Start Listening"}
              </Button>
            </div>

            <div className="mt-5 space-y-2 text-xs text-muted-foreground">
              <div className="text-xs font-medium text-foreground">Explore voice commands</div>
              <div className="flex flex-wrap gap-2">
                {exploreCommands.map((cmd) => (
                  <Button key={cmd} size="sm" variant="secondary" onClick={() => sendTextCommand(cmd)} className="rounded-full">
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 rounded-full px-4 py-2 shadow-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-white"
          variant="default"
        >
          <AiAssistantLogo className="h-5 w-5" />
          <span>{open ? "Close Siri" : "Siri"}</span>
        </Button>
      </div>
    </>
  )
}
