"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Download } from "lucide-react"

import type { Invoice } from "@/types/invoice.types"
import { removeById, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceOverviewCards } from "@/components/dashboard/invoices/invoice-overview-cards"
import { InvoiceStatusBadge } from "@/components/dashboard/invoices/shared/invoice-status-badge"
import { InvoiceDetailsDialog } from "@/components/dashboard/invoices/shared/invoice-details-dialog"
import { SendReminderDialog } from "@/components/dashboard/invoices/shared/send-reminder-dialog"
import { RecordPaymentDialog } from "@/components/dashboard/invoices/shared/record-payment-dialog"
import { ConfirmDialog } from "@/components/dashboard/invoices/shared/confirm-dialog"
import { money, shortDate, daysUntil } from "@/components/dashboard/invoices/shared/format"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Filters = {
  status: "all" | Invoice["status"]
  clientId: "all" | string
  dateFrom: string
  dateTo: string
}

export function InvoicesWorkspace() {
  const db = useMockDb()
  const invoices = db.invoices
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    clientId: "all",
    dateFrom: "",
    dateTo: "",
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)

  const [reminderOpen, setReminderOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const activeInvoice = useMemo(
    () => invoices.find((i) => i.id === activeInvoiceId) ?? null,
    [invoices, activeInvoiceId]
  )

  const clientOptions = useMemo(() => {
    return db.clients.map((c) => ({ id: c.id, name: c.name }))
  }, [db.clients])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((inv) => {
      const matchesText =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.projectName ?? "").toLowerCase().includes(q)

      const matchesStatus = filters.status === "all" ? true : inv.status === filters.status
      const matchesClient = filters.clientId === "all" ? true : inv.clientId === filters.clientId

      const matchesDate =
        (!filters.dateFrom && !filters.dateTo) ||
        (filters.dateFrom.length > 0 &&
          filters.dateTo.length > 0 &&
          new Date(inv.issueDate) >= new Date(filters.dateFrom) &&
          new Date(inv.issueDate) <= new Date(filters.dateTo))

      return matchesText && matchesStatus && matchesClient && matchesDate
    })
  }, [invoices, query, filters])

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((i) => i.id) : [])
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  const openInvoice = (inv: Invoice) => {
    setActiveInvoiceId(inv.id)
    setDetailsOpen(true)
  }

  const bulkExport = () => {
    // stub
    console.log("Export invoices:", selectedIds)
  }

  const bulkSendReminders = () => {
    console.log("Send reminders:", selectedIds)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Track billing, outstanding balances, and payment activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkExport} disabled={selectedIds.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/invoices/create">
              <Plus className="mr-2 h-4 w-4" />
              New invoice
            </Link>
          </Button>
        </div>
      </div>

      <InvoiceOverviewCards invoices={filtered} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Browse</CardTitle>
          <CardDescription>Search and filter. Select rows for bulk actions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="inv-search">
                Search invoices
              </Label>
              <Input
                id="inv-search"
                placeholder="Search by invoice #, client, project..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="sr-only">Status</Label>
              <Select value={filters.status} onValueChange={(v: Invoice["status"] | "all") => setFilters((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="sr-only">Client</Label>
              <Select value={filters.clientId} onValueChange={(v: string) => setFilters((p) => ({ ...p, clientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clientOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2 flex items-center gap-2">
              {selectedIds.length ? (
                <>
                  <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                  <Button variant="outline" size="sm" onClick={bulkSendReminders}>
                    Send reminders (stub)
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Select invoices to enable bulk actions.</span>
              )}
            </div>
            <div>
              <Label className="sr-only" htmlFor="date-from">
                Date from
              </Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label className="sr-only" htmlFor="date-to">
                Date to
              </Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 px-2 py-3">
                      <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(!!v)} aria-label="Select all" />
                    </TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Invoice</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Client</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Project</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Status</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Due</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap text-right">Total</TableHead>
                    <TableHead className="w-12 px-2 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((inv) => {
                      const due = daysUntil(inv.dueDate)
                      const dueText =
                        due === null ? "—" : due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `${due}d`

                      return (
                        <TableRow key={inv.id} className="hover:bg-muted/50">
                          <TableCell className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(inv.id)}
                              onCheckedChange={(v) => toggleOne(inv.id, !!v)}
                              aria-label="Select invoice"
                            />
                          </TableCell>
                          <TableCell className="px-2 py-3">
                            <button className="text-left w-full" onClick={() => openInvoice(inv)}>
                              <div className="font-medium">{inv.invoiceNumber}</div>
                              <div className="text-xs text-muted-foreground">Issued {shortDate(inv.issueDate)}</div>
                            </button>
                          </TableCell>
                          <TableCell className="px-2 py-3">{inv.clientName}</TableCell>
                          <TableCell className="px-2 py-3">{inv.projectName || "—"}</TableCell>
                          <TableCell className="px-2 py-3">
                            <InvoiceStatusBadge status={inv.status} />
                          </TableCell>
                          <TableCell className="px-2 py-3">
                            <div className="text-sm">{shortDate(inv.dueDate)}</div>
                            <div className="text-xs text-muted-foreground">{dueText}</div>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right font-medium">{money(inv.total)}</TableCell>
                          <TableCell className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openInvoice(inv)}>View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActiveInvoiceId(inv.id); setReminderOpen(true) }}>
                                  Send reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActiveInvoiceId(inv.id); setPaymentOpen(true) }}>
                                  Record payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setActiveInvoiceId(inv.id); setDeleteOpen(true) }}>
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <InvoiceDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        invoice={activeInvoice}
        onSendReminder={() => setReminderOpen(true)}
        onRecordPayment={() => setPaymentOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <SendReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        invoice={activeInvoice}
        onSend={(args) => console.log("Send reminder:", args)}
      />

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoice={activeInvoice}
        onRecord={({ invoiceId, amount }) => {
          const now = new Date().toISOString().slice(0, 10)
          setMockDb((prev) => {
            const inv = prev.invoices.find((i) => i.id === invoiceId)
            if (!inv) return prev
            const nextBalance = Math.max(0, inv.balance - amount)
            const next: Invoice = {
              ...inv,
              balance: nextBalance,
              status: nextBalance === 0 ? "paid" : inv.status,
              paymentHistory: [
                ...inv.paymentHistory,
                { id: `pay-${inv.id}-${inv.paymentHistory.length}`, amount, date: now, method: "other", status: "completed" },
              ],
            }
            return { ...prev, invoices: upsertById(prev.invoices, next) }
          })
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete invoice?"
        description="This will remove the invoice from the list (local only for now)."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!activeInvoiceId) return
          setMockDb((prev) => ({ ...prev, invoices: removeById(prev.invoices, activeInvoiceId) }))
          setSelectedIds((prev) => prev.filter((id) => id !== activeInvoiceId))
          setDeleteOpen(false)
          setDetailsOpen(false)
          setActiveInvoiceId(null)
        }}
      />
    </div>
  )
}

