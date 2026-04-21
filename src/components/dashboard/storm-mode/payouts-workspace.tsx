"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { CheckCircle2, Download, DollarSign } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { StormPayout } from "@/lib/mock/backend"
import { setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"

type PayoutStatus = StormPayout["status"]
type PayoutRow = StormPayout & { repName: string; territory: string }

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function statusBadge(s: PayoutStatus) {
  if (s === "paid") return <Badge variant="secondary">paid</Badge>
  if (s === "approved") return <Badge>approved</Badge>
  if (s === "pending") return <Badge variant="outline">pending</Badge>
  return <Badge variant="destructive">due</Badge>
}

export function StormPayoutsWorkspace() {
  const db = useMockDb()
  const payouts = useMemo<PayoutRow[]>(() => {
    return db.storm.payouts.map((p) => {
      const rep = db.storm.reps.find((r) => r.id === p.repId)
      return {
        ...p,
        repName: rep?.name ?? p.repId,
        territory: rep?.territory ?? "—",
      }
    })
  }, [db.storm.payouts, db.storm.reps])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<PayoutStatus | "all">("all")

  const [recordOpen, setRecordOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [paidRef, setPaidRef] = useState("")

  const active = useMemo(() => payouts.find((p) => p.id === activeId) ?? null, [payouts, activeId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payouts.filter((p) => {
      const matchesText =
        !q ||
        p.repName.toLowerCase().includes(q) ||
        p.dealId.toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q)
      const matchesStatus = status === "all" ? true : p.status === status
      return matchesText && matchesStatus
    })
  }, [payouts, query, status])

  const totals = useMemo(() => {
    const due = payouts.filter((p) => p.status !== "paid").reduce((a, p) => a + p.amount, 0)
    const pending = payouts.filter((p) => p.status === "pending").length
    const approved = payouts.filter((p) => p.status === "approved").length
    return { due, pending, approved }
  }, [payouts])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts Due</h1>
          <p className="text-muted-foreground">Approve and record commission payouts for storm volume.</p>
        </div>
        <Button variant="outline" onClick={() => console.log("Export payouts (stub)")}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Due (unpaid)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(totals.due)}</div>
            <div className="text-xs text-muted-foreground">pending + approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.pending}</div>
            <div className="text-xs text-muted-foreground">review required</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.approved}</div>
            <div className="text-xs text-muted-foreground">ready to pay</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Queue</CardTitle>
          <CardDescription>Filter and take action on payouts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="pay-search">
                Search payouts
              </Label>
              <Input id="pay-search" placeholder="Search rep, deal, memo..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
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
                    <TableHead className="px-2 py-3">Deal</TableHead>
                    <TableHead className="px-2 py-3">Status</TableHead>
                    <TableHead className="px-2 py-3">Due</TableHead>
                    <TableHead className="px-2 py-3 text-right">Amount</TableHead>
                    <TableHead className="w-52 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell className="px-2 py-3">
                          <div className="font-medium">{p.repName}</div>
                          <div className="text-xs text-muted-foreground">{p.territory} territory</div>
                        </TableCell>
                        <TableCell className="px-2 py-3">{p.dealId}</TableCell>
                        <TableCell className="px-2 py-3">{statusBadge(p.status)}</TableCell>
                        <TableCell className="px-2 py-3">{(p.createdAt ?? "").slice(0, 10) || "—"}</TableCell>
                        <TableCell className="px-2 py-3 text-right font-medium">{money(p.amount)}</TableCell>
                        <TableCell className="px-2 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {p.status === "pending" || p.status === "due" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const now = new Date().toISOString()
                                  setMockDb((prev) => {
                                    const current = prev.storm.payouts.find((x) => x.id === p.id)
                                    if (!current) return prev
                                    return {
                                      ...prev,
                                      storm: {
                                        ...prev.storm,
                                        payouts: upsertById(prev.storm.payouts, { ...current, status: "approved", updatedAt: now }),
                                      },
                                    }
                                  })
                                }}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {p.status !== "paid" ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveId(p.id)
                                  setPaidRef("")
                                  setRecordOpen(true)
                                }}
                              >
                                Record paid
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No payouts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              {active ? `${active.repName} • ${money(active.amount)} • ${active.dealId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pay-ref">Reference (optional)</Label>
              <Input id="pay-ref" value={paidRef} onChange={(e) => setPaidRef(e.target.value)} placeholder="ACH # / Check # / Memo" />
            </div>
            <div className="text-xs text-muted-foreground">
              In production, this would create a payment record and sync to payroll/accounting.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!activeId) return
                const now = new Date().toISOString()
                setMockDb((prev) => {
                  const current = prev.storm.payouts.find((p) => p.id === activeId)
                  if (!current) return prev
                  const next: StormPayout = {
                    ...current,
                    status: "paid",
                    reference: paidRef || current.reference,
                    paidAt: now,
                    updatedAt: now,
                  }
                  return { ...prev, storm: { ...prev.storm, payouts: upsertById(prev.storm.payouts, next) } }
                })
                setRecordOpen(false)
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator />
      <div className="text-sm text-muted-foreground">
        Tip: Many roofing companies batch payouts weekly during storms; use “Approved” as your staging state.
      </div>
    </div>
  )
}

