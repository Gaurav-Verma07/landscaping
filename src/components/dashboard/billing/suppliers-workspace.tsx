"use client"

import { useState, useMemo, useEffect } from "react"
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
import type { Supplier } from "@/types/quote-types"
import { SupplierFormDialog } from "./supplier-form-dialog"

export function SuppliersWorkspace() {
  const { suppliers, deleteSupplier } = useBillingStore()
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return suppliers
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactPhone.toLowerCase().includes(q) ||
        s.contactEmail.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    )
  }, [suppliers, search])

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
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground text-sm">
            Supplier directory for pricing and sourcing. Add, edit, and search suppliers.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingSupplier(null); setSupplierFormOpen(true) }}>
          <IconPlus className="size-4 mr-2" />
          Add supplier
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Search by name, phone, email, address, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supplier directory</CardTitle>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {filtered.length === 0 ? (search ? "No suppliers match your search." : "No suppliers yet.") : "No results on this page."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm">{s.contactPhone} · {s.contactEmail}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.address}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingSupplier(s); setSupplierFormOpen(true) }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteSupplier(s.id)}>Delete</DropdownMenuItem>
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
          )}
        </CardContent>
      </Card>

      <SupplierFormDialog open={supplierFormOpen} onOpenChange={setSupplierFormOpen} supplier={editingSupplier} onSaved={() => setEditingSupplier(null)} />
    </div>
  )
}
