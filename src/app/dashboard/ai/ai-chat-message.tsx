'use client'

import { Button } from "@/components/ui/button"
import type { PendingAction } from "@/lib/ai/tool-executor"
import type { ChatMessage } from "@/lib/hooks/use-ai-chat"
import { Bot, CheckCircle2, Loader2, User, XCircle } from "lucide-react"
import React, { useState } from "react"
import { cn } from "@/utils/utils"

interface AIChatMessageProps{
    message: ChatMessage
    onConfirm: (action: PendingAction)=> void
    onCancel: () => void
}

export function AIChatMessage({message, onConfirm, onCancel}: AIChatMessageProps){
    const isUser= message.role==='user'
    const isStreaming = message.streaming

    return(
        <div className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
            {/* Avatar */}
            <div
            className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
            >
                {isUser ?(
                    <User className="h-3.5 w-3.5"/>
                ):(
                <Bot className="h-3.5 w-3.5 text-muted-foreground"/>
                )}  
            </div>

            {/* Bubble */}
            <div className={cn('flex max-w-[85%] flex-col gap-2', isUser && 'items-end')} >
                <div
                    className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                        isUser
                            ? 'rounded-tr-sm bg-primary text-primary-foreground'
                            : 'rounded-tl-sm bg-muted text-foreground'
                    )}
                >
                    {isStreaming && !message.content ?(
                        <TypingIndicator/>
                    ): (
                        <MessageContent content={message.content}/>
                    )}
                    {isStreaming && message.content && (
                        <span className="ml-1 inline-block h-3 w-1 animate-pulse rounded-full bg-current opacity-60"/>
                    )}
                </div>

                {/* Approval card */}
                {message.pendingAction &&(
                    <ApprovalCard
                        action={message.pendingAction}
                        onConfirm={()=>onConfirm(message.pendingAction)}
                        onCancel={onCancel}
                    />
                )}
            </div>
        </div>
    )
}

function MessageContent({content}:{content: string}){
    return(
        <>
            {content.split('\n').map((line, i:number)=>(
                <React.Fragment key= {i}>
                    {line}
                    {i< content.split('\n').length -1 && <br/>}
                </React.Fragment>
            ))}
        </>
    )
}

function TypingIndicator(){
    return(
        <div className="flex items-center gap-1 py-0.5">
            {[0, 1, 2].map((i)=>(
                <span
                    key= {i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{animationDelay: `${i*150}ms`}}
                />
            ))}
        </div>
    )
}

interface ApprovalCardProps{
    action: PendingAction
    onConfirm: ()=> void
    onCancel: ()=> void
}

function ApprovalCard({action, onConfirm, onCancel}: ApprovalCardProps){
    const [confirming, setConfirming]= useState(false)

    const handleConfirm= async()=>{
        setConfirming(true)
        onConfirm()
    }

    return(
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50  dark:border-amber-900/50 dark:bg-amber-950/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 border-b obrder-amber-200 dark:border-amber-900/50 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"/>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                        Requires your approval
                    </p>
                </div>

                {/* Preview */}
                <div className="px-3 py-2.5">
                    <pre className="whitespace-pre-wrap text-xs text-amber-900 dark:text-amber-300 font-mono leading-relaxed">
                        {action.preview}
                    </pre>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-amber-200 dark:border-amber-900/50 px-3 py-2">
                    <Button
                    size="sm"
                    className="h-7 flex-1 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
                    onClick={handleConfirm}
                    disabled={confirming}
                    >
                        {confirming ? (
                            <Loader2 className="h-3 w-3 animate-spin"/>
                        ):(
                            <CheckCircle2 className="h-3 w-3"/>
                        )}
                        {confirming?'Executing...':'Confirm'}
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 gap-1.5 text-xs border-amber-300 dark:border-amber-800"
                    onClick={onCancel}
                    disabled={confirming}
                    >
                        <XCircle className="h-3 w-3"/>
                        Cancel
                    </Button>
                </div>
            </div>
    )
}