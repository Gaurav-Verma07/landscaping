"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { AuditEntry, AuditAction } from "@/lib/audit-types"

const STORAGE_KEY = "landscaping-v2-audit"
const MAX_ENTRIES = 500

function loadFromStorage(): AuditEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "") return []
    const parsed = JSON.parse(raw) as AuditEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(list: AuditEntry[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)))
  } catch {}
}

function createId() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type AuditStoreValue = {
  entries: AuditEntry[]
  log: (action: AuditAction, entityType: AuditEntry["entityType"], entityId: string, details?: string) => void
  clear: () => void
}

const AuditStoreContext = createContext<AuditStoreValue | null>(null)

export function AuditStoreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    setEntries(loadFromStorage())
  }, [])

  const persist = useCallback((list: AuditEntry[]) => {
    setEntries(list)
    saveToStorage(list)
  }, [])

  const log = useCallback(
    (action: AuditAction, entityType: AuditEntry["entityType"], entityId: string, details = "") => {
      const entry: AuditEntry = {
        id: createId(),
        timestamp: new Date().toISOString(),
        action,
        entityType,
        entityId,
        details,
      }
      setEntries((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES)
        saveToStorage(next)
        return next
      })
    },
    [],
  )

  const clear = useCallback(() => persist([]), [persist])

  const value: AuditStoreValue = { entries, log, clear }

  return <AuditStoreContext.Provider value={value}>{children}</AuditStoreContext.Provider>
}

export function useAuditStore(): AuditStoreValue {
  const ctx = useContext(AuditStoreContext)
  if (!ctx) throw new Error("useAuditStore must be used within AuditStoreProvider")
  return ctx
}
