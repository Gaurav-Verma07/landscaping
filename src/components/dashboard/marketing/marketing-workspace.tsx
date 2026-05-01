'use client'

import { useEffect, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMarketingStore } from '@/lib/marketing-store'
import { MarketingStats } from './marketing-stats'
import { CampaignTable } from './campaign-table'
import { CampaignBuilderDialog } from './campaign-builder-dialog'
import { CampaignSendsDialog } from './campaign-sends-dialog'
import type { Campaign } from '@/lib/marketing-types'

let initialized = false

export function MarketingWorkspace() {
  const { campaigns, refresh } = useMarketingStore()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [viewingSends, setViewingSends] = useState<Campaign | null>(null)
  const [sendsOpen, setSendsOpen] = useState(false)

  useEffect(() => {
    if (initialized) return
    initialized = true
    refresh()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground text-sm">
            AI-powered campaigns to attract, re-engage, and retain clients.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setBuilderOpen(true) }}>
          <IconPlus className="mr-2 size-4" />
          New campaign
        </Button>
      </div>

      {/* Stats */}
      <MarketingStats campaigns={campaigns} />

      {/* Campaigns table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignTable
            campaigns={campaigns}
            onEdit={(c) => { setEditing(c); setBuilderOpen(true) }}
            onViewSends={(c) => { setViewingSends(c); setSendsOpen(true) }}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CampaignBuilderDialog
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open)
          if (!open) setEditing(null)
        }}
        campaign={editing}
      />
      <CampaignSendsDialog
        open={sendsOpen}
        onOpenChange={(open) => {
          setSendsOpen(open)
          if (!open) setViewingSends(null)
        }}
        campaign={viewingSends}
      />
    </div>
  )
}