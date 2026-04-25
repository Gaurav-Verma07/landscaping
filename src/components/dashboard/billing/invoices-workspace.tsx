"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { IconDotsVertical, IconPlus, IconFileExport } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useBillingStore } from "@/lib/billing-store"
import { useCustomerStore } from "@/lib/customer-store"
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, INVOICE_TYPES, INVOICE_TYPE_LABELS } from "@/lib/quote-types"
import { InvoiceFormDialog } from "./invoice-form-dialog"
import { RecordPaymentDialog } from "./record-payment-dialog"
import type { Invoice } from "@/lib/quote-types"

export function InvoicesWorkspace() {
  const { invoices, getInvoice, deleteInvoice } = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const customer = getCustomer(inv.customerId)
      const numberMatch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
      const customerMatch = !search || customer?.name?.toLowerCase().includes(search.toLowerCase())
      const statusMatch = statusFilter === "all" || inv.status === statusFilter
      const typeMatch = typeFilter === "all" || inv.type === typeFilter
      return (numberMatch || customerMatch) && statusMatch && typeMatch
    })
  }, [invoices, search, statusFilter, typeFilter, getCustomer])

  const exportCsv = () => {
    const header = "invoiceNumber,customerName,type,status,total,paidAmount,dueDate,createdAt"
    const rows = filtered.map((inv) => {
      const customer = getCustomer(inv.customerId)
      const name = (customer?.name || customer?.companyName || "").replace(/"/g, '""')
      return [inv.invoiceNumber, `"${name}"`, inv.type, inv.status, inv.total, inv.paidAmount, inv.dueDate, inv.createdAt].join(",")
    })
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            Deposit, progress, and final invoices. Record payments and track status.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <IconFileExport className="mr-2 size-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <IconFileExport className="mr-2 size-4" />
          Export CSV
        </Button>
        <Button size="sm" onClick={() => { setEditingInvoice(null); setFormOpen(true) }}>
          <IconPlus className="mr-2 size-4" />
          New invoice
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {INVOICE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{INVOICE_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((inv) => {
          const customer = getCustomer(inv.customerId)
          const remaining = inv.total - inv.paidAmount
          return (
            <Card key={inv.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {customer?.name ?? customer?.companyName ?? "—"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${inv.id}`}>View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingInvoice(inv); setFormOpen(true) }}>
                        Edit
                      </DropdownMenuItem>
                      {remaining > 0 && (
                        <DropdownMenuItem onClick={() => setPaymentInvoice(inv)}>
                          Record payment
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteInvoice(inv.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline">{INVOICE_TYPE_LABELS[inv.type]}</Badge>
                  <Badge variant={inv.status === "paid" ? "default" : "secondary"}>{INVOICE_STATUS_LABELS[inv.status]}</Badge>
                  <span className="text-sm font-medium">£{inv.total.toFixed(2)}</span>
                  {inv.paidAmount > 0 && <span className="text-xs text-muted-foreground">Paid £{inv.paidAmount.toFixed(2)}</span>}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Due {inv.dueDate}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {invoices.length === 0 ? "No invoices yet." : "No invoices match your filters."}
            </p>
            {invoices.length === 0 && (
              <Button className="mt-4" onClick={() => setFormOpen(true)}>
                <IconPlus className="mr-2 size-4" />
                New invoice
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} invoice={editingInvoice} onSaved={() => setEditingInvoice(null)} />
      <RecordPaymentDialog open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)} invoice={paymentInvoice} onRecorded={() => setPaymentInvoice(null)} />
    </div>
  )
}
