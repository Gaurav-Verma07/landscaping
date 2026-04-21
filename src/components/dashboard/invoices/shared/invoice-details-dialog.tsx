"use client"

import * as React from "react"
import { useMemo } from "react"
import { Download, FileText, Send, CreditCard, Trash2 } from "lucide-react"

import type { Invoice } from "@/types/invoice.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/dashboard/invoices/shared/invoice-status-badge"
import { money, shortDate } from "@/components/dashboard/invoices/shared/format"

export function InvoiceDetailsDialog({
  open,
  onOpenChange,
  invoice,
  onSendReminder,
  onRecordPayment,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSendReminder?: (invoice: Invoice) => void
  onRecordPayment?: (invoice: Invoice) => void
  onDelete?: (invoice: Invoice) => void
}) {
  const totals = useMemo(() => {
    if (!invoice) return null
    return {
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      balance: invoice.balance,
    }
  }, [invoice])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>{invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice"}</span>
            {invoice ? <InvoiceStatusBadge status={invoice.status} /> : null}
          </DialogTitle>
          <DialogDescription>
            {invoice ? `${invoice.clientName}${invoice.projectName ? ` • ${invoice.projectName}` : ""}` : ""}
          </DialogDescription>
        </DialogHeader>

        {invoice ? (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Line items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[90px] text-right">Qty</TableHead>
                        <TableHead className="w-[110px] text-right">Rate</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.length ? (
                        invoice.lineItems.map((li) => (
                          <TableRow key={li.id}>
                            <TableCell>
                              <div className="font-medium">{li.description || "—"}</div>
                              <div className="text-xs text-muted-foreground">{li.unit}</div>
                            </TableCell>
                            <TableCell className="text-right">{li.quantity}</TableCell>
                            <TableCell className="text-right">{money(li.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{money(li.totalPrice)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No line items.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {invoice.notes ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {invoice.notes}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Issue</span>
                    <span className="font-medium">{shortDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due</span>
                    <span className="font-medium">{shortDate(invoice.dueDate)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{money(totals?.subtotal ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{money(totals?.tax ?? 0)}</span>
                  </div>
                  {invoice.discount ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium">-{money(invoice.discount)}</span>
                    </div>
                  ) : null}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-lg font-semibold">{money(totals?.total ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-medium">{money(totals?.balance ?? 0)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-2">
                <Button variant="outline" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF (stub)
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => invoice && onSendReminder?.(invoice)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send reminder
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => invoice && onRecordPayment?.(invoice)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record payment
                </Button>
                <Button
                  variant="destructive"
                  className="justify-start"
                  onClick={() => invoice && onDelete?.(invoice)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

