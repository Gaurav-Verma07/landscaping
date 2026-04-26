'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AuditEntry, AuditAction } from '@/lib/audit-types'
import {
  getAuditLog, logAudit as logAction, clearAuditLog as clearAction,
} from '@/lib/actions/audit'

type AuditStoreValue = {
  entries: AuditEntry[]
  loading: boolean
  log: (action: AuditAction, entityType: AuditEntry['entityType'], entityId: string, details?: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const AuditStoreContext = createContext<AuditStoreValue | null>(null)

export function AuditStoreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getAuditLog()
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const log = useCallback(async (
    action: AuditAction,
    entityType: AuditEntry['entityType'],
    entityId: string,
    details = ''
  ) => {
    await logAction(action, entityType, entityId, details)
    // Optimistic prepend
    setEntries((prev) => [{
      id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action, entityType, entityId, details,
    }, ...prev].slice(0, 500))
  }, [])

  const clear = useCallback(async () => {
    await clearAction()
    setEntries([])
  }, [])

  const value: AuditStoreValue = { entries, loading, log, clear, refresh }

  return <AuditStoreContext.Provider value={value}>{children}</AuditStoreContext.Provider>
}

export function useAuditStore(): AuditStoreValue {
  const ctx = useContext(AuditStoreContext)
  if (!ctx) throw new Error('useAuditStore must be used within AuditStoreProvider')
  return ctx
}