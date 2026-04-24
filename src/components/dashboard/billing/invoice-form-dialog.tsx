"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Invoice, InvoiceLineItem, InvoiceType } from "@/lib/quote-types"
import { INVOICE_TYPES, INVOICE_TYPE_LABELS } from "@/lib/quote-types"
import { useBillingStore } from "@/lib/billing-store"
import { useCustomerStore } from "@/lib/customer-store"

const FORM_ID = "invoice-form"

function createEmptyLineItem(sortOrder: number): InvoiceLineItem {
  return {
    id: `invli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "",
    quantity: 1,
    unit: "item",
    unitPrice: 0,
    amount: 0,
    sortOrder,
  }
}

function recalcLineAmount(line: InvoiceLineItem): InvoiceLineItem {
  return { ...line, amount: line.quantity * line.unitPrice }
}

interface InvoiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  defaultCustomerId?: string
  defaultQuoteId?: string
  onSaved?: () => void
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  defaultCustomerId,
  defaultQuoteId,
  onSaved,
}: InvoiceFormDialogProps) {
  const { createInvoice, updateInvoice, getQuote, quotes } = useBillingStore()
  const { customers } = useCustomerStore()
  const isEdit = !!invoice
  const customerQuotes = quotes.filter((q) => q.customerId === customerId && (q.status === "accepted" || q.status === "sent"))

  const [customerId, setCustomerId] = useState("")
  const [quoteId, setQuoteId] = useState<string | null>(null)
  const [type, setType] = useState<InvoiceType>("final")
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
  const [taxRatePercent, setTaxRatePercent] = useState(0)
  const [dueDate, setDueDate] = useState("")
  const [paymentTermsDays, setPaymentTermsDays] = useState(14)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customerId)
      setQuoteId(invoice.quoteId)
      setType(invoice.type)
      setLineItems(invoice.lineItems.length ? invoice.lineItems : [createEmptyLineItem(0)])
      setTaxRatePercent(invoice.taxRatePercent)
      setDueDate(invoice.dueDate)
      setPaymentTermsDays(invoice.paymentTermsDays)
      setNotes(invoice.notes)
    } else {
      setCustomerId(defaultCustomerId ?? "")
      setQuoteId(defaultQuoteId ?? null)
      setType("final")
      setLineItems([createEmptyLineItem(0)])
      setTaxRatePercent(0)
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setDueDate(d.toISOString().slice(0, 10))
      setPaymentTermsDays(14)
      setNotes("")
    }
  }, [invoice, defaultCustomerId, defaultQuoteId, open])

  useEffect(() => {
    if (!open || isEdit || !quoteId) return
    const quote = getQuote(quoteId)
    if (quote) {
      setCustomerId(quote.customerId)
      setLineItems(
        quote.lineItems.map((l, i) => ({
          id: `invli-${l.id}-${i}`,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unitPrice: l.unitPrice,
          amount: l.amount,
          sortOrder: i,
        })),
      )
    }
  }, [quoteId, open, isEdit, getQuote])

  const updateLine = (id: string, patch: Partial<InvoiceLineItem>) => {
    setLineItems((prev) =>
      prev.map((l) => (l.id === id ? recalcLineAmount({ ...l, ...patch }) : l)),
    )
  }

  const addLine = () => {
    setLineItems((prev) => [...prev, createEmptyLineItem(prev.length)])
  }

  const removeLine = (id: string) => {
    setLineItems((prev) => prev.filter((l) => l.id !== id))
  }

  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0)
  const taxAmount = (subtotal * taxRatePercent) / 100
  const total = subtotal + taxAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast.error("Select a customer.")
      return
    }
    const validLines = lineItems.filter((l) => l.description.trim() || l.amount !== 0)
    if (validLines.length === 0) {
      toast.error("Add at least one line item.")
      return
    }
    if (!dueDate) {
      toast.error("Set a due date.")
      return
    }

    const linesWithOrder = validLines.map((l, i) => ({ ...l, sortOrder: i }))

    if (isEdit && invoice) {
      updateInvoice(invoice.id, {
        customerId,
        quoteId: quoteId ?? undefined,
        type,
        lineItems: linesWithOrder,
        subtotal,
        taxRatePercent,
        taxAmount,
        total,
        dueDate,
        paymentTermsDays,
        notes,
      })
      toast.success("Invoice updated.")
    } else {
      createInvoice({
        customerId,
        projectId: null,
        quoteId,
        type,
        status: "draft",
        lineItems: linesWithOrder,
        subtotal,
        taxRatePercent,
        taxAmount,
        total,
        dueDate,
        paymentTermsDays,
        notes,
      })
      toast.success("Invoice created.")
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{isEdit ? "Edit invoice" : "New invoice"}</DialogTitle>
          <DialogDescription>
            Deposit, progress, or final invoice. Add line items and set due date.
          </DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setQuoteId(null) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.companyName || c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {!isEdit && customerId && customerQuotes.length > 0 && (
                <Field>
                  <FieldLabel>Create from quote</FieldLabel>
                  <Select value={quoteId ?? "none"} onValueChange={(v) => setQuoteId(v === "none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {customerQuotes.map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.quoteNumber} — £{q.total.toFixed(2)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select value={type} onValueChange={(v) => setType(v as InvoiceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{INVOICE_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Line items</FieldLabel>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="size-4 mr-1" />
                  Add line
                </Button>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-24">Unit</TableHead>
                      <TableHead className="w-28">Unit price</TableHead>
                      <TableHead className="w-28">Amount</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, { description: e.target.value })}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="h-8 w-24"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-24"
                            value={line.unit}
                            onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="h-8 w-28"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{line.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(line.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Tax rate %</FieldLabel>
                <Input type="number" min={0} max={100} step={0.1} value={taxRatePercent} onChange={(e) => setTaxRatePercent(Number(e.target.value) || 0)} />
              </Field>
              <Field>
                <FieldLabel>Due date</FieldLabel>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Payment terms (days)</FieldLabel>
                <Input type="number" min={0} value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(Number(e.target.value) || 0)} />
              </Field>
            </div>

            <div className="flex justify-end gap-4 text-sm">
              <span>Subtotal: £{subtotal.toFixed(2)}</span>
              {taxRatePercent > 0 && <span>Tax: £{taxAmount.toFixed(2)}</span>}
              <span className="font-semibold">Total: £{total.toFixed(2)}</span>
            </div>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </Field>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" form={FORM_ID}>{isEdit ? "Save changes" : "Create invoice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
