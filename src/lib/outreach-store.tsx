"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { OutreachProspect, OutreachStage, OutreachTargetType } from "@/lib/outreach-types"

const STORAGE_KEY = "landscaping-v2-outreach"

function loadFromStorage(): OutreachProspect[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "") return []
    const parsed = JSON.parse(raw) as OutreachProspect[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(list: OutreachProspect[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function createId() {
  return `outreach-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type OutreachStoreValue = {
  prospects: OutreachProspect[]
  createProspect: (input: Omit<OutreachProspect, "id" | "createdAt" | "updatedAt">) => OutreachProspect
  updateProspect: (id: string, patch: Partial<Omit<OutreachProspect, "id" | "createdAt" | "updatedAt">>) => void
  deleteProspect: (id: string) => void
  moveProspectStage: (id: string, stage: OutreachStage) => void
}

const OutreachStoreContext = createContext<OutreachStoreValue | null>(null)

export function OutreachStoreProvider({ children }: { children: React.ReactNode }) {
  const [prospects, setProspects] = useState<OutreachProspect[]>([])

  useEffect(() => {
    setProspects(loadFromStorage())
  }, [])

  const persist = useCallback((list: OutreachProspect[]) => {
    setProspects(list)
    saveToStorage(list)
  }, [])

  const createProspect = useCallback(
    (input: Omit<OutreachProspect, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const full: OutreachProspect = {
        ...input,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      }
      const next = [full, ...prospects]
      persist(next)
      return full
    },
    [prospects, persist],
  )

  const updateProspect = useCallback(
    (id: string, patch: Partial<Omit<OutreachProspect, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      persist(
        prospects.map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                updatedAt: now,
              }
            : p,
        ),
      )
    },
    [prospects, persist],
  )

  const deleteProspect = useCallback(
    (id: string) => {
      persist(prospects.filter((p) => p.id !== id))
    },
    [prospects, persist],
  )

  const moveProspectStage = useCallback(
    (id: string, stage: OutreachStage) => {
      updateProspect(id, { stage })
    },
    [updateProspect],
  )

  const value: OutreachStoreValue = {
    prospects,
    createProspect,
    updateProspect,
    deleteProspect,
    moveProspectStage,
  }

  return (
    <OutreachStoreContext.Provider value={value}>
      {children}
    </OutreachStoreContext.Provider>
  )
}

export function useOutreachStore(): OutreachStoreValue {
  const ctx = useContext(OutreachStoreContext)
  if (!ctx) throw new Error("useOutreachStore must be used within OutreachStoreProvider")
  return ctx
}

