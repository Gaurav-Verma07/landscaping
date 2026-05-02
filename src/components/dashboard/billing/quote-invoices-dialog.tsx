"use client"

import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useBillingStore } from "@/lib/stores"
import { INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS } from "@/types/quote-types"
import type { Quote } from "@/types/quote-types"
import type { Invoice } from "@/types/quote-types"

interface QuoteInvoicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote | null
  onEditInvoice?: (invoice: Invoice) => void
}

export function QuoteInvoicesDialog({
  open,
  onOpenChange,
  quote,
  onEditInvoice,
}: QuoteInvoicesDialogProps) {
  const { getInvoicesByQuoteId } = useBillingStore()
  const invoices = quote && open ? getInvoicesByQuoteId(quote.id) : []

  if (!quote) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoices for {quote.quoteNumber}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invoices created from this quote. View or edit from here.
          </p>
        </DialogHeader>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No invoices linked to this quote yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-24">Due</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{INVOICE_TYPE_LABELS[inv.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">£{inv.total.toFixed(2)}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/invoices/${inv.id}`}>View</Link>
                        </Button>
                        {onEditInvoice && (
                          <Button variant="ghost" size="sm" onClick={() => { onEditInvoice(inv); onOpenChange(false) }}>
                            Edit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
