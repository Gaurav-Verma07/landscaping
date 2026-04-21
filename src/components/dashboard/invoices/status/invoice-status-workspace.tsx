"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, Plus } from "lucide-react"

import type { Invoice } from "@/types/invoice.types"
import { removeById, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/dashboard/invoices/shared/invoice-status-badge"
import { InvoiceDetailsDialog } from "@/components/dashboard/invoices/shared/invoice-details-dialog"
import { SendReminderDialog } from "@/components/dashboard/invoices/shared/send-reminder-dialog"
import { RecordPaymentDialog } from "@/components/dashboard/invoices/shared/record-payment-dialog"
import { ConfirmDialog } from "@/components/dashboard/invoices/shared/confirm-dialog"
import { money, shortDate, daysUntil } from "@/components/dashboard/invoices/shared/format"

type StatusFilter = "all" | Invoice["status"] | "unpaid"

export function InvoiceStatusWorkspace() {
  const db = useMockDb()
  const invoices = db.invoices
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const active = useMemo(
    () => invoices.find((i) => i.id === activeInvoiceId) ?? null,
    [invoices, activeInvoiceId]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((inv) => {
      const matchesText =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.projectName ?? "").toLowerCase().includes(q)

      const matchesStatus =
        status === "all"
          ? true
          : status === "unpaid"
          ? inv.status === "sent" || inv.status === "overdue"
          : inv.status === status

      const matchesDate =
        !dateFrom ||
        !dateTo ||
        (new Date(inv.issueDate) >= new Date(dateFrom) && new Date(inv.issueDate) <= new Date(dateTo))

      return matchesText && matchesStatus && matchesDate
    })
  }, [invoices, query, status, dateFrom, dateTo])

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid")
    const unpaid = invoices.filter((i) => i.status === "sent" || i.status === "overdue")
    const overdue = invoices.filter((i) => i.status === "overdue")
    const disputed = invoices.filter((i) => i.status === "disputed")
    return {
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      overdueCount: overdue.length,
      disputedCount: disputed.length,
      paidTotal: paid.reduce((a, i) => a + i.total, 0),
      unpaidTotal: unpaid.reduce((a, i) => a + i.balance, 0),
    }
  }, [invoices])

  const openInvoice = (inv: Invoice) => {
    setActiveInvoiceId(inv.id)
    setDetailsOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Status</h1>
          <p className="text-muted-foreground">Payments, overdue tracking, reminders, and disputes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => console.log("Export CSV (stub)")}>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidCount}</div>
            <div className="text-sm text-muted-foreground">{money(stats.paidTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unpaidCount}</div>
            <div className="text-sm text-muted-foreground">{money(stats.unpaidTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueCount}</div>
            <div className="text-sm text-muted-foreground">Needs follow-up</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disputed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disputedCount}</div>
            <div className="text-sm text-muted-foreground">In review</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Browse</CardTitle>
          <CardDescription>Filter by status/date and open invoices to take action.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="sr-only" htmlFor="status-search">
                Search
              </Label>
              <Input
                id="status-search"
                placeholder="Search invoice #, client, project..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Label className="sr-only">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Invoice</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Client</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Status</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap">Due</TableHead>
                    <TableHead className="px-2 py-3 whitespace-nowrap text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((inv) => {
                      const due = daysUntil(inv.dueDate)
                      const dueText =
                        due === null ? "—" : due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `${due}d`
                      return (
                        <TableRow key={inv.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openInvoice(inv)}>
                          <TableCell className="px-2 py-3">
                            <div className="font-medium">{inv.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">Issued {shortDate(inv.issueDate)}</div>
                          </TableCell>
                          <TableCell className="px-2 py-3">{inv.clientName}</TableCell>
                          <TableCell className="px-2 py-3">
                            <InvoiceStatusBadge status={inv.status} />
                          </TableCell>
                          <TableCell className="px-2 py-3">
                            <div className="text-sm">{shortDate(inv.dueDate)}</div>
                            <div className="text-xs text-muted-foreground">{dueText}</div>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right font-medium">{money(inv.balance)}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
        invoice={active}
        onSendReminder={() => setReminderOpen(true)}
        onRecordPayment={() => setPaymentOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <SendReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        invoice={active}
        onSend={(args) => console.log("Send reminder:", args)}
      />

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoice={active}
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
                { id: `pay-${Math.random().toString(16).slice(2, 10)}`, amount, date: now, method: "other", status: "completed" },
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
          setDeleteOpen(false)
          setDetailsOpen(false)
          setActiveInvoiceId(null)
        }}
      />
    </div>
  )
}

