'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, FileText, CheckCircle2, Users } from 'lucide-react'
import type { Campaign } from '@/types/marketing-types'

interface MarketingStatsProps {
  campaigns: Campaign[]
}

export function MarketingStats({ campaigns }: MarketingStatsProps) {
  const total = campaigns.length
  const sent = campaigns.filter(c => c.status === 'sent').length
  const drafts = campaigns.filter(c => c.status === 'draft').length
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.totalSent, 0)

  const stats = [
    { label: 'Total campaigns', value: total, icon: FileText },
    { label: 'Sent', value: sent, icon: CheckCircle2 },
    { label: 'Drafts', value: drafts, icon: FileText },
    { label: 'Emails sent', value: totalEmailsSent.toLocaleString(), icon: Send },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}