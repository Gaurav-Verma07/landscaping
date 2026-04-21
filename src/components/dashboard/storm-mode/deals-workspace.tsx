"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { CalendarPlus, CheckCircle2, FileText, Plus, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { StormDeal, StormDealStage } from "@/lib/mock/backend"
import { newId, setMockContext, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

type DealRow = StormDeal & {
  clientName: string
  address: string
  territory: string
  repName: string
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function stageLabel(s: StormDealStage) {
  switch (s) {
    case "New Lead":
      return "New lead"
    case "Inspected":
      return "Inspected"
    case "Filed Claim":
      return "Filed claim"
    case "Approved":
      return "Approved"
    case "Scheduled":
      return "Scheduled"
    case "In Progress":
      return "In progress"
    case "Complete":
      return "Complete"
    case "Lost":
      return "Lost"
  }
}

function stageBadge(s: StormDealStage) {
  if (s === "Complete") return <Badge variant="secondary">complete</Badge>
  if (s === "Lost") return <Badge variant="destructive">lost</Badge>
  if (s === "Approved" || s === "In Progress") return <Badge>active</Badge>
  return <Badge variant="outline">{stageLabel(s).toLowerCase()}</Badge>
}

export function StormDealsWorkspace() {
  const router = useRouter()
  const db = useMockDb()
  const deals = useMemo<DealRow[]>(() => {
    return db.storm.deals.map((d) => {
      const client = db.clients.find((c) => c.id === d.clientId)
      const rep = d.repId ? db.storm.reps.find((r) => r.id === d.repId) : undefined
      return {
        ...d,
        clientName: client?.name ?? d.clientId,
        address: client?.propertyAddress ?? "—",
        territory: rep?.territory ?? "—",
        repName: rep?.name ?? "Unassigned",
      }
    })
  }, [db.storm.deals, db.clients, db.storm.reps])
  const [query, setQuery] = useState("")
  const [territory, setTerritory] = useState("all")
  const [stage, setStage] = useState<StormDealStage | "all">("all")

  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const territories = useMemo(() => Array.from(new Set(deals.map((d) => d.territory))).sort(), [deals])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return deals.filter((d) => {
      const matchesText =
        !q ||
        d.clientName.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.repName.toLowerCase().includes(q) ||
        d.dealNumber.toLowerCase().includes(q)
      const matchesTerritory = territory === "all" ? true : d.territory === territory
      const matchesStage = stage === "all" ? true : d.stage === stage
      return matchesText && matchesTerritory && matchesStage
    })
  }, [deals, query, territory, stage])

  const active = useMemo(() => deals.find((d) => d.id === activeId) ?? null, [deals, activeId])

  const funnel = useMemo(() => {
    const inProgress = deals.filter((d) => d.stage !== "Complete" && d.stage !== "Lost").length
    const complete = deals.filter((d) => d.stage === "Complete").length
    const supplements = deals.filter((d) => d.supplementPotential > 0).length
    const est = deals.reduce((a, d) => a + d.estimatedTotal, 0)
    return { inProgress, complete, supplements, est }
  }, [deals])

  const openDeal = (d: DealRow) => {
    setActiveId(d.id)
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals Closed</h1>
          <p className="text-muted-foreground">
            Storm lead workflow from inspection → estimate → contract → supplement → install → invoice.
          </p>
        </div>
        <Button
          onClick={() => {
            const now = new Date().toISOString()
            const id = newId("deal")
            const dealNumber = `ST-${Math.random().toString(10).slice(2, 6)}`
            const defaultClientId = db.clients[0]?.id ?? "client-001"
            const defaultRepId = db.storm.reps.find((r) => r.active)?.id ?? db.storm.reps[0]?.id

            const toAdd: StormDeal = {
              id,
              dealNumber,
              clientId: defaultClientId,
              projectId: undefined,
              repId: defaultRepId,
              stage: "New Lead",
              estimatedTotal: 0,
              supplementPotential: 0,
              lastTouchAt: now,
              notes: "",
              createdAt: now,
              updatedAt: now,
            }

            setMockDb((prev) => ({
              ...prev,
              storm: { ...prev.storm, deals: upsertById(prev.storm.deals, toAdd) },
            }))
            setActiveId(toAdd.id)
            setOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add deal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnel.inProgress}</div>
            <div className="text-xs text-muted-foreground">active (not complete/lost)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnel.complete}</div>
            <div className="text-xs text-muted-foreground">completed jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              Supplements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnel.supplements}</div>
            <div className="text-xs text-muted-foreground">needs adjuster follow-up</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(funnel.est)}</div>
            <div className="text-xs text-muted-foreground">pipeline value (starter)</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Browse</CardTitle>
          <CardDescription>Filter by territory and stage. Open a deal to update progress.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="deal-search">
                Search deals
              </Label>
              <Input
                id="deal-search"
                placeholder="Search client, address, rep..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={territory} onValueChange={setTerritory}>
                <SelectTrigger>
                  <SelectValue placeholder="Territory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All territories</SelectItem>
                  {territories.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={stage} onValueChange={(v) => setStage(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  <SelectItem value="New Lead">New lead</SelectItem>
                  <SelectItem value="Inspected">Inspected</SelectItem>
                  <SelectItem value="Filed Claim">Filed claim</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In progress</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3">Client</TableHead>
                    <TableHead className="px-2 py-3">Territory</TableHead>
                    <TableHead className="px-2 py-3">Rep</TableHead>
                    <TableHead className="px-2 py-3">Stage</TableHead>
                    <TableHead className="px-2 py-3">Last touch</TableHead>
                    <TableHead className="px-2 py-3 text-right">Est</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((d) => (
                      <TableRow
                        key={d.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => openDeal(d)}
                      >
                        <TableCell className="px-2 py-3">
                          <div className="font-medium">{d.clientName}</div>
                          <div className="text-xs text-muted-foreground">{d.address || "—"}</div>
                        </TableCell>
                        <TableCell className="px-2 py-3">{d.territory}</TableCell>
                        <TableCell className="px-2 py-3">{d.repName}</TableCell>
                        <TableCell className="px-2 py-3">{stageBadge(d.stage)}</TableCell>
                        <TableCell className="px-2 py-3">{(d.lastTouchAt ?? "").slice(0, 10) || "—"}</TableCell>
                        <TableCell className="px-2 py-3 text-right font-medium">{money(d.estimatedTotal)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No deals found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-auto">
          <SheetHeader>
            <SheetTitle>{active ? active.clientName : "Deal"}</SheetTitle>
            <SheetDescription>{active ? active.address || "Address not set" : ""}</SheetDescription>
          </SheetHeader>

          {active ? (
            <div className="mt-4 grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2">
                    <Label>Stage</Label>
                    <Select
                      value={active.stage}
                      onValueChange={(v) => {
                        const now = new Date().toISOString()
                        setMockDb((prev) => {
                          const current = prev.storm.deals.find((d) => d.id === active.id)
                          if (!current) return prev
                          const next: StormDeal = {
                            ...current,
                            stage: v as StormDealStage,
                            lastTouchAt: now,
                            updatedAt: now,
                          }
                          return { ...prev, storm: { ...prev.storm, deals: upsertById(prev.storm.deals, next) } }
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New Lead">New lead</SelectItem>
                        <SelectItem value="Inspected">Inspected</SelectItem>
                        <SelectItem value="Filed Claim">Filed claim</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="In Progress">In progress</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Assigned rep</Label>
                    <Select
                      value={active.repId ?? "unassigned"}
                      onValueChange={(v) => {
                        const now = new Date().toISOString()
                        setMockDb((prev) => {
                          const current = prev.storm.deals.find((d) => d.id === active.id)
                          if (!current) return prev
                          const next: StormDeal = {
                            ...current,
                            repId: v === "unassigned" ? undefined : v,
                            lastTouchAt: now,
                            updatedAt: now,
                          }
                          return { ...prev, storm: { ...prev.storm, deals: upsertById(prev.storm.deals, next) } }
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {db.storm.reps.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} {r.territory ? `(${r.territory})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Estimate</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="deal-est">Estimated total</Label>
                    <Input
                      id="deal-est"
                      inputMode="decimal"
                      value={String(active.estimatedTotal)}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0
                        const now = new Date().toISOString()
                        setMockDb((prev) => {
                          const current = prev.storm.deals.find((d) => d.id === active.id)
                          if (!current) return prev
                          const next: StormDeal = { ...current, estimatedTotal: v, lastTouchAt: now, updatedAt: now }
                          return { ...prev, storm: { ...prev.storm, deals: upsertById(prev.storm.deals, next) } }
                        })
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMockContext({ source: "storm", clientId: active.clientId, projectId: active.projectId, dealId: active.id })
                        router.push("/dashboard/schedule/assign")
                      }}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Schedule inspection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMockContext({ source: "storm", clientId: active.clientId, projectId: active.projectId, dealId: active.id })
                        router.push("/dashboard/estimates/full")
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate estimate
                    </Button>
                    <Button
                      onClick={() => {
                        const now = new Date().toISOString()
                        setMockDb((prev) => {
                          const current = prev.storm.deals.find((d) => d.id === active.id)
                          if (!current) return prev
                          const next: StormDeal = { ...current, stage: "Complete", lastTouchAt: now, updatedAt: now }
                          return { ...prev, storm: { ...prev.storm, deals: upsertById(prev.storm.deals, next) } }
                        })
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark won
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Textarea
                    value={active.notes ?? ""}
                    onChange={(e) =>
                      setMockDb((prev) => {
                        const current = prev.storm.deals.find((d) => d.id === active.id)
                        if (!current) return prev
                        const now = new Date().toISOString()
                        const next: StormDeal = { ...current, notes: e.target.value, lastTouchAt: now, updatedAt: now }
                        return { ...prev, storm: { ...prev.storm, deals: upsertById(prev.storm.deals, next) } }
                      })
                    }
                    rows={5}
                    placeholder="Inspection findings, adjuster notes, supplement strategy..."
                  />
                </CardContent>
              </Card>

              <Separator />
              <div className="text-sm text-muted-foreground">This is backed by the unified mock DB (localStorage).</div>
            </div>
          ) : null}

          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

