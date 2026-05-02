'use client'

import { useMemo } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { format, parseISO, subDays } from 'date-fns'
import type { Campaign } from '@/lib/marketing-types'
import { AUDIENCE_TYPE_LABELS } from '@/lib/marketing-types'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

const CHART_COLORS = {
  purple: 'rgba(127, 119, 221, 0.85)',
  purpleLight: 'rgba(127, 119, 221, 0.15)',
  teal: 'rgba(29, 158, 117, 0.85)',
  tealLight: 'rgba(29, 158, 117, 0.15)',
  amber: 'rgba(186, 117, 23, 0.85)',
  red: 'rgba(226, 75, 74, 0.85)',
  gray: 'rgba(136, 135, 128, 0.85)',
  grayLight: 'rgba(136, 135, 128, 0.15)',
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 } }, beginAtZero: true },
  },
}

interface CampaignChartsProps {
  campaigns: Campaign[]
}

export function CampaignCharts({ campaigns }: CampaignChartsProps) {
  const sentCampaigns = campaigns.filter(c => c.status === 'sent')

  // 1. Sent vs Failed bar chart — per campaign
  const sentVsFailed = useMemo(() => {
    const top = [...sentCampaigns].slice(-8) // last 8
    return {
      labels: top.map(c => c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name),
      datasets: [
        {
          label: 'Sent',
          data: top.map(c => c.totalSent),
          backgroundColor: CHART_COLORS.teal,
          borderRadius: 4,
        },
        {
          label: 'Failed',
          data: top.map(c => c.totalFailed),
          backgroundColor: CHART_COLORS.red,
          borderRadius: 4,
        },
      ],
    }
  }, [sentCampaigns])

  // 2. Emails sent over time — line chart (last 30 days)
  const emailsOverTime = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i)
      return format(d, 'MMM d')
    })
    const counts = days.map(label => {
      const d = new Date(label + ' ' + new Date().getFullYear())
      return sentCampaigns
        .filter(c => c.sentAt && format(parseISO(c.sentAt), 'MMM d') === label)
        .reduce((sum, c) => sum + c.totalSent, 0)
    })
    return {
      labels: days,
      datasets: [{
        label: 'Emails sent',
        data: counts,
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_COLORS.purpleLight,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: CHART_COLORS.purple,
      }],
    }
  }, [sentCampaigns])

  // 3. Audience segment breakdown — doughnut
  const audienceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    campaigns.forEach(c => {
      counts[c.audienceType] = (counts[c.audienceType] || 0) + 1
    })
    const entries = Object.entries(counts)
    return {
      labels: entries.map(([k]) => AUDIENCE_TYPE_LABELS[k as keyof typeof AUDIENCE_TYPE_LABELS] ?? k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: [
          CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.amber,
          CHART_COLORS.red, CHART_COLORS.gray, 'rgba(212,83,126,0.85)',
          'rgba(55,138,221,0.85)', 'rgba(99,153,34,0.85)',
        ],
        borderWidth: 0,
      }],
    }
  }, [campaigns])

  // 4. Delivery rate bar
  const deliveryRate = useMemo(() => {
    return sentCampaigns.map(c => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name,
      rate: c.totalRecipients > 0
        ? Math.round((c.totalSent / c.totalRecipients) * 100)
        : 0,
    })).slice(-6)
  }, [sentCampaigns])

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        No campaign data yet. Send your first campaign to see charts.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">

      {/* Emails sent over time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Emails sent over time</CardTitle>
          <CardDescription>Last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <Line
              data={emailsOverTime}
              options={{
                ...baseOptions,
                plugins: { ...baseOptions.plugins, legend: { display: false } },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sent vs Failed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sent vs failed</CardTitle>
          <CardDescription>Per campaign (last 8)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            {sentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground pt-6 text-center">No sent campaigns yet.</p>
            ) : (
              <Bar
                data={sentVsFailed}
                options={{
                  ...baseOptions,
                  plugins: {
                    ...baseOptions.plugins,
                    legend: { display: true, position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
                  },
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audience breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience breakdown</CardTitle>
          <CardDescription>Campaigns by segment</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="h-48 w-48 shrink-0">
            <Doughnut
              data={audienceBreakdown}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: 'index' as const, intersect: true },
                },
                cutout: '65%',
              }}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            {audienceBreakdown.labels.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: audienceBreakdown.datasets[0].backgroundColor[i] as string }}
                />
                <span className="truncate text-muted-foreground">{label}</span>
                <span className="font-medium ml-auto pl-2">{audienceBreakdown.datasets[0].data[i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery rate */}
      {deliveryRate.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Delivery rate</CardTitle>
            <CardDescription>% successfully delivered per campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveryRate.map(({ name, rate }) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-36 shrink-0 truncate">{name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: rate >= 90 ? CHART_COLORS.teal : rate >= 70 ? CHART_COLORS.amber : CHART_COLORS.red,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{rate}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}