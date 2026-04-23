"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useBillingStore } from "@/lib/billing-store"
import { useCustomerStore } from "@/lib/customer-store"
import { INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS } from "@/lib/quote-types"
import { RecordPaymentDialog } from "@/components/dashboard/billing/record-payment-dialog"

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { getInvoice } = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const invoice = getInvoice(id)
  const [paymentOpen, setPaymentOpen] = useState(false)

  if (!invoice) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/invoices">Back to invoices</Link>
        </Button>
      </div>
    )
  }

  const customer = getCustomer(invoice.customerId)
  const remaining = invoice.total - invoice.paidAmount

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="size-4" />
            Back to invoices
          </Link>
        </Button>
        {remaining > 0 && (
          <Button size="sm" onClick={() => setPaymentOpen(true)}>
            <Banknote className="size-4 mr-2" />
            Record payment
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
        <Badge variant="outline">{INVOICE_TYPE_LABELS[invoice.type]}</Badge>
        <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
          {INVOICE_STATUS_LABELS[invoice.status]}
        </Badge>
        {customer && <span className="text-muted-foreground text-sm">· {customer.name || customer.companyName}</span>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{line.unit}</TableCell>
                  <TableCell className="text-right">£{line.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">£{line.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end gap-6 mt-4 text-sm">
            <span>Subtotal: £{invoice.subtotal.toFixed(2)}</span>
            {invoice.taxRatePercent > 0 && <span>Tax: £{invoice.taxAmount.toFixed(2)}</span>}
            <span className="font-semibold">Total: £{invoice.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment</CardTitle>
          <p className="text-sm text-muted-foreground">
            Due {invoice.dueDate} · Paid £{invoice.paidAmount.toFixed(2)} of £{invoice.total.toFixed(2)}
            {remaining > 0 && ` · £${remaining.toFixed(2)} remaining`}
          </p>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>£{p.amount.toFixed(2)} · {p.method} · {new Date(p.paidAt).toLocaleDateString()}</span>
                  {p.reference && <span className="text-muted-foreground">{p.reference}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} invoice={invoice} onRecorded={() => setPaymentOpen(false)} />
    </div>
  )
}
