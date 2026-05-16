"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { IconPlus, IconDotsVertical, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useBillingStore } from "@/lib/stores"
import type { MaterialCatalogItem } from "@/types/quote-types"
import { MaterialFormDialog } from "./material-form-dialog"
import { DEFAULT_CURRENCY } from "@/enums/currency-enums"

export function MaterialsWorkspace() {
  const { materials, suppliers, deleteMaterial, loading: billsLoading } = useBillingStore()
  const getSupplier = (id: string) => suppliers.find((s) => s.id === id)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [materialFormOpen, setMaterialFormOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialCatalogItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return materials
    return materials.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.unit.toLowerCase().includes(q) ||
      (m.sku != null && m.sku.toLowerCase().includes(q)) ||
      (m.supplierId ? (getSupplier(m.supplierId)?.name ?? "").toLowerCase().includes(q) : false) ||
      (m.notes != null && m.notes.toLowerCase().includes(q))
    )
  }, [materials, suppliers, search])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const paged = useMemo(() => {
    const start = pageIndex * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pageIndex, pagination.pageSize])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground text-sm">
            Material catalog with default prices for quotes and invoices. Link materials to suppliers.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingMaterial(null); setMaterialFormOpen(true) }}>
          <IconPlus className="size-4 mr-2" />
          Add material
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Search by name, unit, SKU, supplier, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Material catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {billsLoading?
            <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
            Loading materials...
          </div>  
            : paged.length !== 0 ?(
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Default price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.unit}</TableCell>
                      <TableCell className="text-right">{DEFAULT_CURRENCY}{m.defaultPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.supplierId ? (
                          <Link href="/dashboard/suppliers" className="hover:underline">
                            {getSupplier(m.supplierId)?.name ?? "—"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.sku ?? "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingMaterial(m); setMaterialFormOpen(true) }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMaterial(m.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {filtered.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}–
                    {Math.min((pageIndex + 1) * pagination.pageSize, filtered.length)}
                  </span>{" "}
                  of <span className="font-medium text-foreground">{filtered.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pagination.pageSize)}
                    onValueChange={(v) => setPagination((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }))}
                  >
                    <SelectTrigger className="h-8 w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Page {pageIndex + 1} of {pageCount}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((prev) => ({ ...prev, pageIndex: 0 }))}
                      disabled={pageIndex === 0}
                      aria-label="First page"
                    >
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageIndex - 1) }))}
                      disabled={pageIndex === 0}
                      aria-label="Previous page"
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.min(pageCount - 1, pageIndex + 1) }))}
                      disabled={pageIndex >= pageCount - 1}
                      aria-label="Next page"
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((prev) => ({ ...prev, pageIndex: pageCount - 1 }))}
                      disabled={pageIndex >= pageCount - 1}
                      aria-label="Last page"
                    >
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )
        : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {filtered.length === 0 ? (search ? "No materials match your search." : "No materials in catalog.") : "No results on this page."}
          </p>
        )}
        </CardContent>
      </Card>

      <MaterialFormDialog open={materialFormOpen} onOpenChange={setMaterialFormOpen} material={editingMaterial} onSaved={() => setEditingMaterial(null)} />
    </div>
  )
}
