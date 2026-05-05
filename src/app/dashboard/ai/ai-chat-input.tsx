import { Textarea } from "@/components/ui/textarea"
import {useRef, useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import { cn } from "../../../../utils/utils"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"

interface AIChatInputProps{
    onSend: (text:string)=>void
    loading: boolean
}

export function AIChatInput({onSend, loading}: AIChatInputProps){
    const [value, setValue]= useState('')
    const textareaRef= useRef<HTMLTextAreaElement>(null)

    const handleSend= ()=>{
        const text= value.trim()
        if(!text || loading) return
        setValue('')
        onSend(text)
        //Reset height

        if(textareaRef.current){
            textareaRef.current.style.height= 'auto'
        }
    }

    const handleKeyDown= (e: KeyboardEvent<HTMLTextAreaElement>)=>{
        if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput= (e: ChangeEvent<HTMLTextAreaElement>)=>{
        setValue(e.target.value)

        const el= e.target
        el.style.height= 'auto'
        el.style.height= `${Math.min(el.scrollHeight, 120)}px`

    }

    return(
        <div  className="flex items-end gap-2">
            <Textarea
            ref= {textareaRef}
            value= {value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Anything... (Enter to send, Shift+Enter for new line)"
            className={cn(
                'min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border-muted-foreground/20 bg-muted/50 py-2.5 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50'
            )}
            rows={1}
            disabled={loading}
            />
                <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={handleSend}
                    disabled={!value.trim() || loading}
                >
                    {loading?(
                        <Loader2 className="h-4 w-4 animate-spin"/>
                    ): (
                        <Send className="h-4 w-4"/>
                    )}
                </Button>
        </div>
    )
}