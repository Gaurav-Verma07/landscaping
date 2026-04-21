"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Plus, Trash2, Pencil } from "lucide-react"

import type { LaborRate } from "@/types/invoice.types"
import { mockCrewAssignments } from "@/lib/mock/invoice-mock-data"
import { removeById, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/dashboard/invoices/shared/confirm-dialog"
import { LaborRateUpsertDialog } from "@/components/dashboard/invoices/labor/labor-rate-upsert-dialog"
import { money } from "@/components/dashboard/invoices/shared/format"

type Filters = {
  rateType: "all" | "hourly" | "daily" | "fixed"
  crewId: "all" | string
}

export function LaborWorkspace() {
  const db = useMockDb()
  const rates = db.laborRates
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({ rateType: "all", crewId: "all" })

  const [upsertOpen, setUpsertOpen] = useState(false)
  const [activeRate, setActiveRate] = useState<LaborRate | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rates.filter((r) => {
      const matchesText = !q || r.roleName.toLowerCase().includes(q)
      const matchesRateType = filters.rateType === "all" ? true : r.rateType === filters.rateType
      const matchesCrew =
        filters.crewId === "all"
          ? true
          : (r.defaultCrew ?? []).includes(filters.crewId)
      return matchesText && matchesRateType && matchesCrew
    })
  }, [rates, query, filters])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Labor</h1>
          <p className="text-muted-foreground">Default labor rates used in invoices and estimating.</p>
        </div>
        <Button
          onClick={() => {
            setActiveRate(null)
            setUpsertOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add rate
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Browse</CardTitle>
          <CardDescription>Search and filter labor rates by role and type.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="labor-search">
                Search
              </Label>
              <Input
                id="labor-search"
                placeholder="Search role name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="sr-only">Rate type</Label>
              <Select value={filters.rateType} onValueChange={(v) => setFilters((p) => ({ ...p, rateType: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Rate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="sr-only">Crew</Label>
              <Select value={filters.crewId} onValueChange={(v) => setFilters((p) => ({ ...p, crewId: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Crew" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All crews</SelectItem>
                  {mockCrewAssignments.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3">Role</TableHead>
                    <TableHead className="px-2 py-3">Type</TableHead>
                    <TableHead className="px-2 py-3 text-right">Rate</TableHead>
                    <TableHead className="px-2 py-3 text-right">Overtime</TableHead>
                    <TableHead className="px-2 py-3">Default crew</TableHead>
                    <TableHead className="w-24 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell className="px-2 py-3 font-medium">{r.roleName}</TableCell>
                        <TableCell className="px-2 py-3">
                          <Badge variant="outline" className="capitalize">
                            {r.rateType}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-3 text-right">{money(r.rate)}</TableCell>
                        <TableCell className="px-2 py-3 text-right">{r.overtimeRate ? money(r.overtimeRate) : "—"}</TableCell>
                        <TableCell className="px-2 py-3">
                          {(r.defaultCrew ?? []).length ? (
                            <div className="flex flex-wrap gap-1">
                              {r.defaultCrew?.slice(0, 2).map((id) => {
                                const c = mockCrewAssignments.find((x) => x.id === id)
                                return c ? (
                                  <Badge key={id} variant="secondary">
                                    {c.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveRate(r)
                                setUpsertOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveRate(r)
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No labor rates found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <LaborRateUpsertDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        rate={activeRate}
        onSave={(rate) => {
          setMockDb((prev) => ({ ...prev, laborRates: upsertById(prev.laborRates, rate) }))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete labor rate?"
        description="This removes the rate from the list (local only for now)."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!activeRate) return
          setMockDb((prev) => ({ ...prev, laborRates: removeById(prev.laborRates, activeRate.id) }))
          setDeleteOpen(false)
          setActiveRate(null)
        }}
      />
    </div>
  )
}

