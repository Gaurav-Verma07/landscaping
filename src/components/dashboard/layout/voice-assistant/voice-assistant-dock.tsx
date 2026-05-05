"use client"

import * as React from "react"
import { Loader2, X, Trash2, StopCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AiAssistantLogo } from "@/components/dashboard/layout/voice-assistant/ai-assistant-logo"
import { useAIChat } from "@/lib/hooks/use-ai-chat"
import { AIChatMessage } from "@/app/dashboard/ai/ai-chat-message"

const SUGGESTIONS = [
  "Summarise unread messages",
  "Show overdue invoices",
  "List active customers",
  "Open marketing",
]

export function VoiceAssistantDock() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const {
    messages,
    loading,
    sendMessage,
    confirmAction,
    cancelAction,
    clearMessages,
    stopStreaming,
  } = useAIChat()

  // Scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const text = value.trim()
    if (!text || loading) return
    setValue("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat panel ───────────────────────────────────────────────── */}
      {open && (
        <div className="flex w-[360px] flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-background/97 via-background/93 to-muted/80 shadow-2xl backdrop-blur overflow-hidden"
          style={{ height: "520px", overflow: 'scroll' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-400/30 blur-lg" />
                <div className="relative rounded-full border border-white/10 bg-background/70 p-1.5">
                  <AiAssistantLogo className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">AI Assistant</p>
                <p className="text-xs text-muted-foreground">Ask anything about your business</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {loading && (
                <Badge variant="secondary" className="border border-white/10 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-xs">
                  <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                  Thinking
                </Badge>
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages} title="Clear">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3">
            <div className="py-3 space-y-3">
              {messages.length === 0 ? (
                <EmptyState onSuggestion={(s) => { sendMessage(s) }} />
              ) : (
                messages.map((msg) => (
                  <AIChatMessage
                    key={msg.id}
                    message={msg}
                    onConfirm={(action) => confirmAction(msg.id, action)}
                    onCancel={() => cancelAction(msg.id)}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Stop */}
          {loading && (
            <div className="flex justify-center px-3 pb-1 shrink-0">
              <Button variant="outline" size="sm" className="h-6 gap-1 text-xs rounded-full" onClick={stopStreaming}>
                <StopCircle className="h-3 w-3" />
                Stop
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 p-3 shrink-0">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-muted/30 px-3 py-2">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… (Enter to send)"
                className="min-h-[32px] max-h-[100px] flex-1 resize-none border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
                disabled={loading}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:opacity-90"
                onClick={handleSend}
                disabled={!value.trim() || loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle button ─────────────────────────────────────────────── */}
      <Button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-full px-4 py-2 shadow-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-white hover:opacity-90"
        variant="default"
      >
        <AiAssistantLogo className="h-5 w-5" />
        <span className="text-sm font-medium">{open ? "Close" : "AI Assistant"}</span>
      </Button>
    </div>
  )
}

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 blur-xl" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-background/70">
          <AiAssistantLogo className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">How can I help?</p>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Ask about customers, invoices, campaigns, or tell me to open a module.
        </p>
      </div>
      <div className="grid w-full gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-xl border border-white/10 bg-muted/30 px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}