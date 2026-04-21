"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Plus, Trash2, Pencil } from "lucide-react"

import type { Material } from "@/types/invoice.types"
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
import { MaterialUpsertDialog } from "@/components/dashboard/invoices/materials/material-upsert-dialog"
import { money } from "@/components/dashboard/invoices/shared/format"

type Filters = {
  vendorId: "all" | string
  unit: "all" | string
  stock: "all" | "in" | "low" | "out"
}

function stockStatus(stock: number, reorder: number) {
  if (stock <= 0) return { label: "out", variant: "destructive" as const }
  if (stock <= reorder) return { label: "low", variant: "secondary" as const }
  return { label: "in", variant: "outline" as const }
}

export function MaterialsWorkspace() {
  const db = useMockDb()
  const materials = db.materials
  const vendors = db.vendors
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({ vendorId: "all", unit: "all", stock: "all" })

  const [upsertOpen, setUpsertOpen] = useState(false)
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return materials.filter((m) => {
      const matchesText =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        m.vendorName.toLowerCase().includes(q) ||
        (m.sku ?? "").toLowerCase().includes(q)

      const matchesVendor = filters.vendorId === "all" ? true : m.vendorId === filters.vendorId
      const matchesUnit = filters.unit === "all" ? true : m.unit === filters.unit

      const s = stockStatus(m.stock, m.reorderLevel).label
      const matchesStock = filters.stock === "all" ? true : s === filters.stock

      return matchesText && matchesVendor && matchesUnit && matchesStock
    })
  }, [materials, query, filters])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground">Your materials pricebook (costs, vendors, and stock).</p>
        </div>
        <Button
          onClick={() => {
            setActiveMaterial(null)
            setUpsertOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add material
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Browse</CardTitle>
          <CardDescription>Search and filter materials. Edit in-place via dialogs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="mat-search">
                Search
              </Label>
              <Input
                id="mat-search"
                placeholder="Search name, vendor, sku..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="sr-only">Vendor</Label>
              <Select value={filters.vendorId} onValueChange={(v) => setFilters((p) => ({ ...p, vendorId: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="sr-only">Stock</Label>
              <Select value={filters.stock} onValueChange={(v) => setFilters((p) => ({ ...p, stock: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock</SelectItem>
                  <SelectItem value="in">In stock</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="out">Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3">Name</TableHead>
                    <TableHead className="px-2 py-3">Vendor</TableHead>
                    <TableHead className="px-2 py-3">Unit</TableHead>
                    <TableHead className="px-2 py-3 text-right">Price</TableHead>
                    <TableHead className="px-2 py-3 text-right">Stock</TableHead>
                    <TableHead className="px-2 py-3">Status</TableHead>
                    <TableHead className="w-24 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((m) => {
                      const st = stockStatus(m.stock, m.reorderLevel)
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/50">
                          <TableCell className="px-2 py-3">
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {m.sku ? <span className="mr-2">SKU {m.sku}</span> : null}
                              {m.description ?? ""}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3">{m.vendorName}</TableCell>
                          <TableCell className="px-2 py-3">
                            <Badge variant="outline">{m.unit}</Badge>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right font-medium">{money(m.unitPrice)}</TableCell>
                          <TableCell className="px-2 py-3 text-right">{m.stock}</TableCell>
                          <TableCell className="px-2 py-3">
                            <Badge variant={st.variant} className="capitalize">
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveMaterial(m)
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
                                  setActiveMaterial(m)
                                  setDeleteOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No materials found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <MaterialUpsertDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        material={activeMaterial}
        onSave={(mat) => {
          setMockDb((prev) => ({ ...prev, materials: upsertById(prev.materials, mat) }))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete material?"
        description="This removes the item from the pricebook (local only for now)."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!activeMaterial) return
          setMockDb((prev) => ({ ...prev, materials: removeById(prev.materials, activeMaterial.id) }))
          setDeleteOpen(false)
          setActiveMaterial(null)
        }}
      />
    </div>
  )
}

