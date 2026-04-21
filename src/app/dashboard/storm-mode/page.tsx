"use client"

import * as React from "react"
import Link from "next/link"
import { useMemo } from "react"
import { CloudLightning, Users, MapPin, DollarSign, Calculator, TrendingUp, ArrowRight, AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { setMockDb } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export default function StormModePage() {
  const db = useMockDb()
  const enabled = db.storm.enabled

  const totals = useMemo(() => {
    const deals = db.storm.deals.filter((d) => d.stage === "Complete").length
    const pending = db.storm.payouts
      .filter((p) => p.status !== "paid")
      .reduce((acc, p) => acc + (p.amount || 0), 0)
    return { deals, pending }
  }, [db.storm.deals, db.storm.payouts])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storm Mode</h1>
          <p className="text-muted-foreground">
            High-tempo operations during storms: reps, territory coverage, deals, commissions, and payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="storm-toggle" className="text-sm text-muted-foreground">
            Storm Mode
          </Label>
          <Switch
            id="storm-toggle"
            checked={enabled}
            onCheckedChange={(v) => setMockDb((prev) => ({ ...prev, storm: { ...prev.storm, enabled: v } }))}
          />
        </div>
      </div>

      {enabled ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <CloudLightning className="h-5 w-5" />
              Storm Mode Active
              <Badge variant="outline" className="ml-2 border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                Emergency ops
              </Badge>
            </CardTitle>
            <CardDescription>
              Use this area to prioritize leads, adjust commission policies, and track payouts due.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-background p-4 dark:border-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Ops checklist (starter)</div>
                <div className="text-muted-foreground">
                  Confirm territory coverage, enable storm lead intake, and set commission policy for emergency jobs.
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Deals won
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.deals}</div>
                  <div className="text-xs text-muted-foreground">Across storm-assigned reps</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Payouts due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{money(totals.pending)}</div>
                  <div className="text-xs text-muted-foreground">Pending commissions (starter)</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Active reps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {db.storm.reps.filter((r) => r.active && (r.status ?? "offline") !== "offline").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Available / busy</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudLightning className="h-5 w-5 text-muted-foreground" />
              Storm Mode is off
            </CardTitle>
            <CardDescription>
              Enable Storm Mode when severe weather hits to access storm ops screens.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              You can still view storm dashboards, but actions are treated as “planning mode”.
            </div>
            <Button
              variant="outline"
              onClick={() => setMockDb((prev) => ({ ...prev, storm: { ...prev.storm, enabled: true } }))}
            >
              Enable Storm Mode
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Reps & Territory
            </CardTitle>
            <CardDescription>Coverage and assignments by region.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/storm-mode/reps">
                Open
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Deals Closed
            </CardTitle>
            <CardDescription>Track wins, conversion, and totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/storm-mode/deals">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Commission Calculator
            </CardTitle>
            <CardDescription>Estimate payouts quickly and consistently.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/storm-mode/commission">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payouts Due
            </CardTitle>
            <CardDescription>Review and approve commission payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/storm-mode/payouts">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rep snapshot</CardTitle>
          <CardDescription>Quick read of current storm team status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {db.storm.reps.map((rep) => {
            const dealsWon = db.storm.deals.filter((d) => d.repId === rep.id && d.stage === "Complete").length
            const pendingPayout = db.storm.payouts
              .filter((p) => p.repId === rep.id && p.status !== "paid")
              .reduce((acc, p) => acc + (p.amount || 0), 0)

            return (
            <Card key={rep.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{rep.name}</span>
                  <Badge variant={(rep.status ?? "offline") === "busy" ? "destructive" : "secondary"}>
                    {rep.status ?? "offline"}
                  </Badge>
                </CardTitle>
                <CardDescription>{rep.territory ?? "—"} territory</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deals won</span>
                  <span className="font-medium">{dealsWon}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending payout</span>
                  <span className="font-medium">{money(pendingPayout)}</span>
                </div>
              </CardContent>
            </Card>
          )})}
        </CardContent>
      </Card>
    </div>
  )
}

