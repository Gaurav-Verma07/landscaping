"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Plus, Pencil, MapPin, Users, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/dashboard/invoices/shared/confirm-dialog"
import type { StormRep } from "@/lib/mock/backend"
import { newId, removeById, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

type RepStatus = NonNullable<StormRep["status"]>
type RepRow = StormRep
type RepWithStats = RepRow & {
  leadsAssigned: number
  inspectionsToday: number
  dealsWon: number
  pendingPayout: number
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function statusBadge(status: RepStatus) {
  if (status === "available") return <Badge variant="secondary">available</Badge>
  if (status === "busy") return <Badge variant="destructive">busy</Badge>
  return <Badge variant="outline">offline</Badge>
}

export function StormRepsWorkspace() {
  const db = useMockDb()
  const reps = useMemo<RepWithStats[]>(() => {
    const today = new Date().toISOString().slice(0, 10)
    return db.storm.reps.map((rep) => {
      const deals = db.storm.deals.filter((d) => d.repId === rep.id)
      const payouts = db.storm.payouts.filter((p) => p.repId === rep.id)

      const leadsAssigned = deals.filter((d) => d.stage !== "Lost").length
      const inspectionsToday = deals.filter((d) => (d.lastTouchAt ?? "").slice(0, 10) === today).length
      const dealsWon = deals.filter((d) => d.stage === "Complete").length
      const pendingPayout = payouts
        .filter((p) => p.status !== "paid")
        .reduce((a, p) => a + (p.amount || 0), 0)

      return {
        ...rep,
        territory: rep.territory ?? "—",
        status: (rep.status ?? "offline") as RepStatus,
        stormCertified: rep.stormCertified ?? false,
        leadsAssigned,
        inspectionsToday,
        dealsWon,
        pendingPayout,
      }
    })
  }, [db.storm.reps, db.storm.deals, db.storm.payouts])
  const [query, setQuery] = useState("")
  const [territory, setTerritory] = useState<string>("all")
  const [status, setStatus] = useState<RepStatus | "all">("all")

  const [editOpen, setEditOpen] = useState(false)
  const [active, setActive] = useState<RepWithStats | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const territories = useMemo(() => {
    const set = new Set(reps.map((r) => r.territory))
    return Array.from(set.values()).sort()
  }, [reps])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reps.filter((r) => {
      const matchesText = !q || r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)
      const matchesTerritory = territory === "all" ? true : r.territory === territory
      const matchesStatus = status === "all" ? true : r.status === status
      return matchesText && matchesTerritory && matchesStatus
    })
  }, [reps, query, territory, status])

  const totals = useMemo(() => {
    const activeReps = reps.filter((r) => r.status !== "offline" && r.active).length
    const leads = reps.reduce((a, r) => a + r.leadsAssigned, 0)
    const due = reps.reduce((a, r) => a + r.pendingPayout, 0)
    return { activeReps, leads, due }
  }, [reps])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reps & Territory</h1>
          <p className="text-muted-foreground">
            Assign storm leads fast, keep coverage balanced, and track rep readiness.
          </p>
        </div>
        <Button
          onClick={() => {
            const now = new Date().toISOString()
            setActive({
              id: newId("rep"),
              name: "",
              territory: "Central",
              phone: "",
              status: "available",
              stormCertified: false,
              leadsAssigned: 0,
              inspectionsToday: 0,
              dealsWon: 0,
              pendingPayout: 0,
              active: true,
              createdAt: now,
              updatedAt: now,
            })
            setEditOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add rep
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Active reps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.activeReps}</div>
            <div className="text-xs text-muted-foreground">available / busy</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Leads assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.leads}</div>
            <div className="text-xs text-muted-foreground">storm intake load</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Payouts due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(totals.due)}</div>
            <div className="text-xs text-muted-foreground">pending commissions</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Roster</CardTitle>
          <CardDescription>Search and filter. Edit rep profile and territory.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="rep-search">
                Search reps
              </Label>
              <Input
                id="rep-search"
                placeholder="Search by name or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="sr-only">Territory</Label>
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
              <Label className="sr-only">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3">Rep</TableHead>
                    <TableHead className="px-2 py-3">Territory</TableHead>
                    <TableHead className="px-2 py-3">Status</TableHead>
                    <TableHead className="px-2 py-3 text-right">Leads</TableHead>
                    <TableHead className="px-2 py-3 text-right">Inspections</TableHead>
                    <TableHead className="px-2 py-3 text-right">Won</TableHead>
                    <TableHead className="px-2 py-3 text-right">Payout due</TableHead>
                    <TableHead className="w-24 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell className="px-2 py-3">
                          <div className="font-medium">{r.name || "Unnamed rep"}</div>
                          <div className="text-xs text-muted-foreground">{r.phone}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.stormCertified ? (
                              <span className="text-green-700 dark:text-green-300">Storm certified</span>
                            ) : (
                              <span>Not certified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-3">{r.territory}</TableCell>
                        <TableCell className="px-2 py-3">{statusBadge(r.status)}</TableCell>
                        <TableCell className="px-2 py-3 text-right">{r.leadsAssigned}</TableCell>
                        <TableCell className="px-2 py-3 text-right">{r.inspectionsToday}</TableCell>
                        <TableCell className="px-2 py-3 text-right">{r.dealsWon}</TableCell>
                        <TableCell className="px-2 py-3 text-right font-medium">{money(r.pendingPayout)}</TableCell>
                        <TableCell className="px-2 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActive(r)
                                setEditOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActive(r)
                                setDeleteOpen(true)
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No reps found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name ? `Edit ${active.name}` : "Add rep"}</DialogTitle>
            <DialogDescription>Keep rep status and territory accurate during storms.</DialogDescription>
          </DialogHeader>

          {active ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rep-name">Name</Label>
                <Input
                  id="rep-name"
                  value={active.name}
                  onChange={(e) => setActive({ ...active, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rep-phone">Phone</Label>
                <Input
                  id="rep-phone"
                  value={active.phone}
                  onChange={(e) => setActive({ ...active, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Territory</Label>
                  <Select value={active.territory} onValueChange={(v) => setActive({ ...active, territory: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["North", "Central", "South", "West", "East"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={active.status} onValueChange={(v) => setActive({ ...active, status: v as RepStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <Label>Storm certified</Label>
                  <div className="text-xs text-muted-foreground">Mark reps trained for storm volume + insurance workflow.</div>
                </div>
                <Switch checked={active.stormCertified} onCheckedChange={(v) => setActive({ ...active, stormCertified: v })} />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!active) return
                const now = new Date().toISOString()
                const { leadsAssigned, inspectionsToday, dealsWon, pendingPayout, ...rep } = active
                setMockDb((prev) => ({
                  ...prev,
                  storm: {
                    ...prev.storm,
                    reps: upsertById(prev.storm.reps, { ...rep, updatedAt: now }),
                  },
                }))
                setEditOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete rep?"
        description="This removes the rep from the roster (local only for now)."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!active) return
          setMockDb((prev) => ({
            ...prev,
            storm: { ...prev.storm, reps: removeById(prev.storm.reps, active.id) },
          }))
          setDeleteOpen(false)
          setActive(null)
        }}
      />
    </div>
  )
}

