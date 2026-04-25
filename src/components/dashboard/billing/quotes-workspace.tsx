"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { IconDotsVertical, IconPlus } from "@tabler/icons-react"
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
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/quote-types"
import { QuoteFormDialog } from "./quote-form-dialog"
import { AcceptQuoteDialog } from "./accept-quote-dialog"
import { PaymentScheduleDialog } from "./payment-schedule-dialog"
import { QuoteInvoicesDialog } from "./quote-invoices-dialog"
import { InvoiceFormDialog } from "./invoice-form-dialog"
import type { Quote } from "@/lib/quote-types"
import type { Invoice } from "@/lib/quote-types"

export function QuotesWorkspace() {
  const { quotes, getQuote, deleteQuote, getInvoicesByQuoteId } = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [acceptQuote, setAcceptQuote] = useState<Quote | null>(null)
  const [scheduleQuote, setScheduleQuote] = useState<Quote | null>(null)
  const [viewInvoicesQuote, setViewInvoicesQuote] = useState<Quote | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const customer = getCustomer(q.customerId)
      const nameMatch = !search || q.quoteNumber.toLowerCase().includes(search.toLowerCase())
      const customerMatch = !search || customer?.name?.toLowerCase().includes(search.toLowerCase())
      const statusMatch = statusFilter === "all" || q.status === statusFilter
      return (nameMatch || customerMatch) && statusMatch
    })
  }, [quotes, search, statusFilter, getCustomer])

  const handleDelete = (id: string) => {
    deleteQuote(id)
    setEditingQuote(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground text-sm">
            Create and send quotes. Accept a quote to generate a contract.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingQuote(null); setFormOpen(true) }}>
          <IconPlus className="mr-2 size-4" />
          New quote
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
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {QUOTE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((quote) => {
          const customer = getCustomer(quote.customerId)
          return (
            <Card key={quote.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">
                      {quote.quoteNumber}
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
                      <DropdownMenuItem onClick={() => { setEditingQuote(quote); setFormOpen(true) }}>
                        Edit
                      </DropdownMenuItem>
                      {quote.status === "sent" && (
                        <DropdownMenuItem onClick={() => setAcceptQuote(quote)}>
                          Accept quote
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/contracts?quoteId=${quote.id}`}>View contract</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setScheduleQuote(quote)}>
                        Create payment schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewInvoicesQuote(quote)}>
                        View invoices
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(quote.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline">{QUOTE_STATUS_LABELS[quote.status]}</Badge>
                  <span className="text-sm font-medium">£{quote.total.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {quote.lineItems.length} line item(s)
                {quote.validUntil && ` · Valid until ${quote.validUntil}`}
                {getInvoicesByQuoteId(quote.id).length > 0 && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="underline hover:no-underline"
                      onClick={() => setViewInvoicesQuote(quote)}
                    >
                      {getInvoicesByQuoteId(quote.id).length} invoice(s)
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {quotes.length === 0 ? "No quotes yet." : "No quotes match your filters."}
            </p>
            {quotes.length === 0 && (
              <Button className="mt-4" onClick={() => setFormOpen(true)}>
                <IconPlus className="mr-2 size-4" />
                New quote
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <QuoteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        quote={editingQuote}
        onSaved={() => setEditingQuote(null)}
      />
      <AcceptQuoteDialog
        open={!!acceptQuote}
        onOpenChange={(open) => !open && setAcceptQuote(null)}
        quote={acceptQuote}
        onAccepted={() => setAcceptQuote(null)}
      />
      <PaymentScheduleDialog
        open={!!scheduleQuote}
        onOpenChange={(open) => !open && setScheduleQuote(null)}
        quote={scheduleQuote}
        onCreated={() => setScheduleQuote(null)}
      />
      <QuoteInvoicesDialog
        open={!!viewInvoicesQuote}
        onOpenChange={(open) => !open && setViewInvoicesQuote(null)}
        quote={viewInvoicesQuote}
        onEditInvoice={(inv) => { setEditingInvoice(inv); setInvoiceFormOpen(true) }}
      />
      <InvoiceFormDialog
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        invoice={editingInvoice}
        onSaved={() => setEditingInvoice(null)}
      />
    </div>
  )
}
