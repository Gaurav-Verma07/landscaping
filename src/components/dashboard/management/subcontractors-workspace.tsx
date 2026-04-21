"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import type { Subcontractor } from "@/lib/mock/backend"
import { newId, removeById, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/dashboard/invoices/shared/confirm-dialog"

function complianceBadge(sub: Subcontractor) {
  if (!sub.insured || !sub.w9OnFile) return <Badge variant="destructive">needs docs</Badge>
  return <Badge variant="secondary">ok</Badge>
}

export function SubcontractorsWorkspace() {
  const db = useMockDb()
  const subs = db.management.subcontractors

  const [query, setQuery] = useState("")
  const [trade, setTrade] = useState<Subcontractor["trade"] | "all">("all")

  const [upsertOpen, setUpsertOpen] = useState(false)
  const [active, setActive] = useState<Subcontractor | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return subs.filter((s) => {
      const matchesText =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.notes ?? "").toLowerCase().includes(q)
      const matchesTrade = trade === "all" ? true : s.trade === trade
      return matchesText && matchesTrade
    })
  }, [subs, query, trade])

  const stats = useMemo(() => {
    const activeCount = subs.filter((s) => s.active).length
    const complianceIssues = subs.filter((s) => s.active && (!s.insured || !s.w9OnFile)).length
    return { activeCount, complianceIssues }
  }, [subs])

  const beginAdd = () => {
    const now = new Date().toISOString()
    setActive({
      id: newId("sub"),
      name: "",
      trade: "Roofing",
      insured: false,
      w9OnFile: false,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    setUpsertOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subcontractors</h1>
          <p className="text-muted-foreground">Directory + compliance (insured/W9) for crews and partner trades.</p>
        </div>
        <Button onClick={beginAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add subcontractor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active subs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <div className="text-xs text-muted-foreground">Available vendors/crews</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceIssues}</div>
            <div className="text-xs text-muted-foreground">Missing insurance and/or W9</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Directory</CardTitle>
          <CardDescription>Search and filter by trade. Edit in place.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="subs-q">
                Search
              </Label>
              <Input id="subs-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email..." />
            </div>
            <div>
              <Label className="sr-only">Trade</Label>
              <Select value={trade} onValueChange={(v) => setTrade(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trades</SelectItem>
                  <SelectItem value="Roofing">Roofing</SelectItem>
                  <SelectItem value="Gutters">Gutters</SelectItem>
                  <SelectItem value="Siding">Siding</SelectItem>
                  <SelectItem value="Interior">Interior</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end text-sm text-muted-foreground">{filtered.length} results</div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3">Subcontractor</TableHead>
                    <TableHead className="px-2 py-3">Trade</TableHead>
                    <TableHead className="px-2 py-3">Compliance</TableHead>
                    <TableHead className="px-2 py-3">Active</TableHead>
                    <TableHead className="w-32 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell className="px-2 py-3">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.phone ? <span className="mr-2">{s.phone}</span> : null}
                            {s.email ? <span>{s.email}</span> : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-3">
                          <Badge variant="outline">{s.trade}</Badge>
                        </TableCell>
                        <TableCell className="px-2 py-3">{complianceBadge(s)}</TableCell>
                        <TableCell className="px-2 py-3">{s.active ? <Badge variant="secondary">active</Badge> : <Badge variant="outline">inactive</Badge>}</TableCell>
                        <TableCell className="px-2 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActive({ ...s })
                                setUpsertOpen(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActive(s)
                                setDeleteOpen(true)
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No subcontractors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={upsertOpen} onOpenChange={setUpsertOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name ? "Edit subcontractor" : "Add subcontractor"}</DialogTitle>
            <DialogDescription>Stored in unified mock DB (localStorage).</DialogDescription>
          </DialogHeader>

          {active ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="s-name">Name</Label>
                <Input id="s-name" value={active.name} onChange={(e) => setActive({ ...active, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="s-phone">Phone</Label>
                  <Input id="s-phone" value={active.phone ?? ""} onChange={(e) => setActive({ ...active, phone: e.target.value || undefined })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s-email">Email</Label>
                  <Input id="s-email" value={active.email ?? ""} onChange={(e) => setActive({ ...active, email: e.target.value || undefined })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Trade</Label>
                <Select value={active.trade} onValueChange={(v) => setActive({ ...active, trade: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Roofing">Roofing</SelectItem>
                    <SelectItem value="Gutters">Gutters</SelectItem>
                    <SelectItem value="Siding">Siding</SelectItem>
                    <SelectItem value="Interior">Interior</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="grid gap-1">
                    <Label>Active</Label>
                    <div className="text-xs text-muted-foreground">Hide inactive subs from assignment pickers.</div>
                  </div>
                  <Switch checked={active.active} onCheckedChange={(v) => setActive({ ...active, active: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="grid gap-1">
                    <Label>Insured</Label>
                    <div className="text-xs text-muted-foreground">Required for most job sites.</div>
                  </div>
                  <Switch checked={active.insured} onCheckedChange={(v) => setActive({ ...active, insured: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="grid gap-1">
                    <Label>W9 on file</Label>
                    <div className="text-xs text-muted-foreground">Needed for 1099/tax reporting.</div>
                  </div>
                  <Switch checked={active.w9OnFile} onCheckedChange={(v) => setActive({ ...active, w9OnFile: v })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="s-notes">Notes</Label>
                <Textarea id="s-notes" value={active.notes ?? ""} onChange={(e) => setActive({ ...active, notes: e.target.value || undefined })} rows={4} />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpsertOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!active) return
                if (!active.name.trim()) return
                const now = new Date().toISOString()
                const toSave: Subcontractor = { ...active, name: active.name.trim(), updatedAt: now }
                setMockDb((prev) => ({
                  ...prev,
                  management: { ...prev.management, subcontractors: upsertById(prev.management.subcontractors, toSave) },
                }))
                setUpsertOpen(false)
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
        title="Remove subcontractor?"
        description="This removes the subcontractor from your directory (mock DB)."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!active) return
          setMockDb((prev) => ({
            ...prev,
            management: { ...prev.management, subcontractors: removeById(prev.management.subcontractors, active.id) },
          }))
          setDeleteOpen(false)
          setActive(null)
        }}
      />
    </div>
  )
}

