'use client'
import { createContext, useCallback, useContext, useState } from "react"
import type {ReactNode} from "react"
import { AIPanel } from "./ai-panel"

interface AIPanelContextValue{
    open: boolean
    toggle:()=>void
    openPanel:()=>void
    closePanel: ()=>void
}

const AIPanelContext= createContext<AIPanelContextValue | null>(null)

export function AIPanelProvider({children}: {children: ReactNode}){
    const [open, setOpen]= useState(false)

    const toggle= useCallback(()=> setOpen((prev)=>!prev), [])
    const openPanel= useCallback(()=>setOpen(true), [])
    const closePanel= useCallback(()=>setOpen(false), [])

    return(
        <AIPanelContext.Provider value= {{open, toggle, openPanel, closePanel}}>
            {children}
            <AIPanel open={open} onClose={closePanel}/>
        </AIPanelContext.Provider>
    )
}

export function useAIPanel(){
    const ctx= useContext(AIPanelContext)
    if(!ctx)
        throw new Error('useAiPanel must be used within AIPanelProvider')
    return ctx 
}