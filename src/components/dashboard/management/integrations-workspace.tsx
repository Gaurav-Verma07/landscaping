"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  Cloud,
  CreditCard,
  Link2,
  MapPinned,
  MessageSquare,
  Mountain,
  Radar,
  Camera,
  Boxes,
} from "lucide-react"

import type { Integration } from "@/lib/mock/backend"
import { setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

function statusBadge(connected: boolean) {
  return connected ? (
    <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200">connected</Badge>
  ) : (
    <Badge variant="outline">not connected</Badge>
  )
}

export function IntegrationsWorkspace() {
  const db = useMockDb()
  const integrations = db.management.integrations
  const [query, setQuery] = useState("")

  const iconByKey = useMemo(
    () => ({
      quickbooks: CreditCard,
      stripe: CreditCard,
      companycam: Camera,
      hover: Mountain,
      twilio: MessageSquare,
      google_calendar: MapPinned,
      google_drive: Cloud,
      eagleview: Radar,
      pix4d: Boxes,
    }),
    []
  )

  const iconByCategory = useMemo(
    () => ({
      Accounting: CreditCard,
      Payments: CreditCard,
      Messaging: MessageSquare,
      Scheduling: MapPinned,
      Measurements: Radar,
      Photos: Camera,
      Storage: Cloud,
      "Drone Mapping": Boxes,
    }),
    []
  )

  const integrationsWithPix4d = useMemo(() => {
    const hasPix4d = integrations.some((integration) => integration.key === "pix4d")
    if (hasPix4d) {
      return integrations
    }
    const now = new Date().toISOString()
    const pix4dPlaceholder: Integration = {
      id: "int-pix4d-placeholder",
      key: "pix4d",
      name: "Pix4D",
      category: "Drone Mapping",
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    }
    return [
      ...integrations,
      pix4dPlaceholder,
    ]
  }, [integrations])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return integrationsWithPix4d.filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q)
    )
  }, [integrationsWithPix4d, query])

  const connectedCount = useMemo(() => integrations.filter((i) => i.connected).length, [integrations])
  const enabledCount = useMemo(() => integrations.filter((i) => i.enabledInWorkflows).length, [integrations])

  const update = (integration: Integration, patch: Partial<Integration>) => {
    const now = new Date().toISOString()
    const next: Integration = { ...integration, ...patch, updatedAt: now }
    setMockDb((prev) => ({
      ...prev,
      management: { ...prev.management, integrations: upsertById(prev.management.integrations, next) },
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Connect tools and control which workflows can use them (mock DB backed).</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <div className="text-xs text-muted-foreground">Accounts authorized</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enabled in workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledCount}</div>
            <div className="text-xs text-muted-foreground">Used by the app (estimates, invoices, messaging)</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Catalog</CardTitle>
          <CardDescription>Search, connect, and enable integrations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="int-q">
                Search
              </Label>
              <Input id="int-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search integrations..." />
            </div>
            <div className="md:col-span-2 flex items-center justify-end text-sm text-muted-foreground">{filtered.length} results</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.length ? (
              filtered.map((i) => {
                const Icon = iconByKey[i.key] ?? iconByCategory[i.category]
                return (
                  <Card key={i.id} className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                      <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/50">
                        {Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : null}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{i.name}</CardTitle>
                        <CardDescription className="text-xs">{i.key}</CardDescription>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{i.category}</Badge>
                          {statusBadge(i.connected)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Enable in workflows</div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={i.enabledInWorkflows}
                            onCheckedChange={(v) => update(i, { enabledInWorkflows: v })}
                            disabled={!i.connected}
                          />
                          <span className="text-xs text-muted-foreground">{i.enabledInWorkflows ? "on" : "off"}</span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {i.connected ? (
                          <Button variant="outline" size="sm" onClick={() => update(i, { connected: false, enabledInWorkflows: false })}>
                            Disconnect
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => update(i, { connected: true })}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">No integrations found.</CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

