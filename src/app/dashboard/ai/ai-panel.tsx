'use client'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAIChat } from "@/lib/hooks/use-ai-chat"
import { Bot, StopCircle, Trash2, X } from "lucide-react"
import { useEffect, useRef } from "react"
import { cn } from "@/utils/utils"
import { AIChatMessage } from "./ai-chat-message"
import { AIChatInput } from "./ai-chat-input"

interface AIPanelProps{
    open: boolean
    onClose: ()=> void
}

const SUGGESTIONS= [
    'Summarise today\'s unread messages',
    'Show overdue invoices',
    'Which customers are active?',
    'Open marketing'
]


export function AIPanel({open, onClose}:AIPanelProps){
    const{
        messages,
        loading,
        sendMessage,
        confirmAction,
        cancelAction,
        clearMessages,
        stopStreaming
    }= useAIChat()

    const bottomRef= useRef<HTMLDivElement>(null)

    useEffect(()=>{
        bottomRef?.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages])

    return (
        <>
        {/* mobile only */}
        {open &&
        (
            <div
                className= "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                onClick= {onClose}
            />
        )}

        {/* Panel */}
        <div
            className={cn(
                'fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out md:w-[420px]',
                open ? 'translate-x-0' : 'translate-x-full'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary"/>
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-none">AI Assistant</p>
                        <p className="text-xs text-muted-foreground">Ask anything about your business</p>
                    </div>
                </div>
                <div className="flex items-center gap-1" >
                    {
                        messages.length> 0 &&(
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={clearMessages}
                                title="Clear conversation"
                            >
                                <Trash2 className="h-3.5 w-35"/>
                            </Button>
                        )
                    }
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="h-4 w-4"/>
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 overflow-auto">
                <div className="py-4 space-y-4">
                    {messages.length===0? (
                        <EmptyState onSuggestion= {sendMessage}/>
                    ):(
                        messages.map((msg)=>(
                            <AIChatMessage
                            key={msg.id}
                            message={msg}
                            onConfirm={(action)=> confirmAction(msg.id, action)}
                            onCancel={()=> cancelAction(msg.id)}
                            />
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {/* Stop button while streaming */}
            {loading && (
                <div className="flex justify-center px-4 pb-2">
                    <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={stopStreaming}
                    >
                        <StopCircle className="h-3 w-3" />
                        Stop
                    </Button>
                </div>
            )}

            {/* Input */}
            <div className="border-t p-3">
                <AIChatInput onSend={sendMessage} loading={loading} />

            </div>
        </div>

        </>
    )
}


function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Bot className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">How can I help?</p>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          Ask me about your customers, invoices, campaigns, or tell me to open a module.
        </p>
      </div>
      <div className="grid w-full gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-lg border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}