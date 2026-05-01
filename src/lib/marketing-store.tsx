'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import {
  getCampaigns, createCampaign as createCampaignAction,
  updateCampaign as updateCampaignAction, deleteCampaign as deleteCampaignAction,
  sendCampaign as sendCampaignAction,
} from '@/lib/actions/marketing'
import { Campaign, AudienceType, AudienceFilters} from './marketing-types'

type MarketingStoreValue = {
  campaigns: Campaign[]
  loading: boolean
  refresh: () => Promise<void>
  createCampaign: (input: {
    name: string
    subject: string
    body: string
    audienceType: AudienceType
    audienceFilters: AudienceFilters
    scheduledAt?: string | null
  }) => Promise<Campaign | undefined>
  updateCampaign: (id: string, input: Partial<{
    name: string
    subject: string
    body: string
    audienceType: AudienceType
    audienceFilters: AudienceFilters
    scheduledAt: string | null
  }>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  sendCampaign: (id: string) => Promise<{ sent: number; failed: number; error?: string }>
}

const MarketingStoreContext = createContext<MarketingStoreValue | null>(null)

export function MarketingStoreProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getCampaigns()
    setCampaigns(data)
    setLoading(false)
  }, [])

  const createCampaign = useCallback(async (input: Parameters<MarketingStoreValue['createCampaign']>[0]) => {
    const result = await createCampaignAction(input)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateCampaign = useCallback(async (id: string, input: Parameters<MarketingStoreValue['updateCampaign']>[1]) => {
    await updateCampaignAction(id, input)
    await refresh()
  }, [refresh])

  const deleteCampaign = useCallback(async (id: string) => {
    await deleteCampaignAction(id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }, [])

  const sendCampaign = useCallback(async (id: string) => {
    const result = await sendCampaignAction(id)
    await refresh()
    return result
  }, [refresh])

  const value: MarketingStoreValue = {
    campaigns, loading, refresh,
    createCampaign, updateCampaign, deleteCampaign, sendCampaign,
  }

  return (
    <MarketingStoreContext.Provider value={value}>
      {children}
    </MarketingStoreContext.Provider>
  )
}

export function useMarketingStore() {
  const ctx = useContext(MarketingStoreContext)
  if (!ctx) throw new Error('useMarketingStore must be used within MarketingStoreProvider')
  return ctx
}