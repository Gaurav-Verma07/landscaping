'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { OutreachProspect, OutreachStage } from '@/lib/outreach-types'
import {
  getProspects, createProspect as createAction,
  createProspects as createProspectsAction,
  updateProspect as updateAction, deleteProspect as deleteAction,
  moveProspectStage as moveStageAction,
} from '@/lib/actions/outreach'

type OutreachStoreValue = {
  prospects: OutreachProspect[]
  loading: boolean
  createProspect: (input: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>) => Promise<OutreachProspect | undefined>
  createProspects: (inputs: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>
  updateProspect: (id: string, patch: Partial<Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteProspect: (id: string) => Promise<void>
  moveProspectStage: (id: string, stage: OutreachStage) => Promise<void>
  refresh: () => Promise<void>
}

const OutreachStoreContext = createContext<OutreachStoreValue | null>(null)

export function OutreachStoreProvider({ children }: { children: React.ReactNode }) {
  const [prospects, setProspects] = useState<OutreachProspect[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getProspects()
    setProspects(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const createProspect = useCallback(async (input: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createAction(input)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const createProspects = useCallback(async (
    inputs: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => {
    await createProspectsAction(inputs)
    await refresh()
  }, [refresh])

  const updateProspect = useCallback(async (id: string, patch: Partial<Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateAction(id, patch)
    await refresh()
  }, [refresh])

  const deleteProspect = useCallback(async (id: string) => {
    await deleteAction(id)
    setProspects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const moveProspectStage = useCallback(async (id: string, stage: OutreachStage) => {
    await moveStageAction(id, stage)
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, stage } : p))
  }, [])

  const value: OutreachStoreValue = {
    prospects, loading,createProspects,
    createProspect, updateProspect, deleteProspect, moveProspectStage, refresh,
  }

  return <OutreachStoreContext.Provider value={value}>{children}</OutreachStoreContext.Provider>
}

export function useOutreachStore(): OutreachStoreValue {
  const ctx = useContext(OutreachStoreContext)
  if (!ctx) throw new Error('useOutreachStore must be used within OutreachStoreProvider')
  return ctx
}