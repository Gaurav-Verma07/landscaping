"use client"

import { Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VoiceAssistantButtonProps {
  status: "connected" | "connecting" | "disconnected" | "disconnecting"
  isSpeaking: boolean
  onToggle: () => void
  /** Optional: separate connecting state (will override status if provided) */
  isConnecting?: boolean
  className?: string
}

export function VoiceAssistantButton({
  status,
  isSpeaking,
  isConnecting,
  onToggle,
  className,
}: VoiceAssistantButtonProps) {
  // Use isConnecting prop if provided, otherwise derive from status
  const connecting = isConnecting ?? (status === "connecting" || status === "disconnecting")
  return (
    <div className={cn("fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2", className)}>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden bg-background border rounded-lg shadow-lg",
          status === "connected" ? "w-64 p-4 opacity-100" : "w-0 h-0 opacity-0 border-0"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Voice Assistant</span>
          <div className={cn("w-2 h-2 rounded-full", isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
        </div>
        <p className="text-xs text-muted-foreground">
          {status === "connected" 
            ? isSpeaking 
              ? "Agent is speaking..." 
              : "Listening..." 
            : "Disconnected"}
        </p>
      </div>

      <Button
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-xl transition-all duration-300",
          status === "connected" 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-primary hover:bg-primary/90",
          isSpeaking && "ring-4 ring-primary/30"
        )}
        onClick={onToggle}
        disabled={connecting}
      >
        {connecting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : status === "connected" ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle Voice Assistant</span>
      </Button>
      
      {/* Add empty space below the button */}
      <div className="h-4"></div>
    </div>
  )
}
