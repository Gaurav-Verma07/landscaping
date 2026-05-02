'use client'

import { useEffect, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BarChart2, Send, Share2, CalendarDays } from 'lucide-react'
import { useMarketingStore } from '@/lib/marketing-store'
import { MarketingStats } from './marketing-stats'
import { CampaignTable } from './campaign-table'
import { CampaignBuilderDialog } from './campaign-builder-dialog'
import { CampaignSendsDialog } from './campaign-sends-dialog'
import { CampaignCharts } from './campaign-charts'
import { SocialPostGenerator } from './social-post-generator'
import type { Campaign } from '@/lib/marketing-types'
import type { Platform } from '@/lib/actions/social-posts'
import { ContentCalendar } from './content-calender'

let initialized = false

export function MarketingWorkspace() {
  const { campaigns, refresh } = useMarketingStore()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [viewingSends, setViewingSends] = useState<Campaign | null>(null)
  const [sendsOpen, setSendsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  // Bridge: Social tab → Calendar tab
  const [pendingPost, setPendingPost] = useState<{
    platform: Platform; content: string; hashtags: string[]
  } | null>(null)

  useEffect(() => {
    if (initialized) return
    initialized = true
    refresh()
  }, [])

  const handleSaveToCalendar = (post: { platform: Platform; content: string; hashtags: string[] }) => {
    setPendingPost(post)
    setActiveTab('calendar')
  }

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
        {activeTab === 'campaigns' && (
          <Button size="sm" onClick={() => { setEditing(null); setBuilderOpen(true) }}>
            <IconPlus className="mr-2 size-4" />
            New campaign
          </Button>
        )}
      </div>

      {/* Stats */}
      <MarketingStats campaigns={campaigns} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="size-3.5" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart2 className="size-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="size-3.5" />
            Social
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
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
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <CampaignCharts campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <SocialPostGenerator onSaveToCalendar={handleSaveToCalendar} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <ContentCalendar
            pendingPost={pendingPost}
            onPendingPostConsumed={() => setPendingPost(null)}
          />
        </TabsContent>
      </Tabs>

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