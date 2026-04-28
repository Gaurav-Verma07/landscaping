'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OutreachStatsProps {
  total: number
  contacted: number
  qualified: number
  partners: number
}

export function OutreachStats({ total, contacted, qualified, partners }: OutreachStatsProps) {
  const stats = [
    { label: 'Total prospects', value: total },
    { label: 'Contacted', value: contacted },
    { label: 'Qualified', value: qualified },
    { label: 'Partners', value: partners },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}