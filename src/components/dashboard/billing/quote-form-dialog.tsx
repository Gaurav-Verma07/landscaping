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
import type { Quote, QuoteLineItem, QuoteStatus } from "@/lib/quote-types"
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/quote-types"
import { useBillingStore } from "@/lib/billing-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useCommunicationStore } from "@/lib/communication-store"
import { useAuditStore } from "@/lib/audit-store"

const FORM_ID = "quote-form"

function createEmptyLineItem(sortOrder: number): QuoteLineItem {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "",
    quantity: 1,
    unit: "item",
    unitPrice: 0,
    discountPercent: 0,
    amount: 0,
    sortOrder,
  }
}

function recalcLineAmount(line: QuoteLineItem): QuoteLineItem {
  const base = line.quantity * line.unitPrice
  const pct = line.discountPercent ?? 0
  const amount = Math.round(base * (1 - pct / 100) * 100) / 100
  return { ...line, amount }
}

interface QuoteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote | null
  defaultCustomerId?: string
  onSaved?: () => void
}

export function QuoteFormDialog({
  open,
  onOpenChange,
  quote,
  defaultCustomerId,
  onSaved,
}: QuoteFormDialogProps) {
  const { createQuote, updateQuote } = useBillingStore()
  const { customers } = useCustomerStore()
  const { triggerAutomation } = useCommunicationStore()
  const { log: auditLog } = useAuditStore()
  const isEdit = !!quote

  const [customerId, setCustomerId] = useState("")
  const [status, setStatus] = useState<QuoteStatus>("draft")
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([])
  const [taxRatePercent, setTaxRatePercent] = useState(0)
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (quote) {
      setCustomerId(quote.customerId)
      setStatus(quote.status)
      setLineItems(quote.lineItems.length ? quote.lineItems : [createEmptyLineItem(0)])
      setTaxRatePercent(quote.taxRatePercent)
      setValidUntil(quote.validUntil ?? "")
      setNotes(quote.notes)
    } else {
      setCustomerId(defaultCustomerId ?? "")
      setStatus("draft")
      setLineItems([createEmptyLineItem(0)])
      setTaxRatePercent(0)
      setValidUntil("")
      setNotes("")
    }
  }, [quote, defaultCustomerId, open])

  const updateLine = (id: string, patch: Partial<QuoteLineItem>) => {
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

  const handleSubmit =async (e: React.SubmitEvent) => {
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

    const linesWithOrder = validLines.map((l, i) => ({ ...l, sortOrder: i }))

    if (isEdit && quote) {
      updateQuote(quote.id, {
        customerId,
        status,
        lineItems: linesWithOrder,
        subtotal,
        taxRatePercent,
        taxAmount,
        total,
        validUntil: validUntil || null,
        notes,
      })
      toast.success("Quote updated.")
      const becameSent = quote.status !== "sent" && status === "sent"
      if (becameSent) {
        auditLog("quote_sent", "quote", quote.id, quote.quoteNumber)
        const customer = customers.find((c) => c.id === customerId)
        if (customer) {
          triggerAutomation("quote_sent", {
            contactId: customer.id,
            contactName: customer.name || customer.companyName || "Customer",
            contactEmail: customer.emails[0],
            contactPhone: customer.phones[0],
          })
        }
      }
    } else {
      const createdQuote =await createQuote({
        customerId,
        projectId: null,
        status,
        lineItems: linesWithOrder,
        subtotal,
        taxRatePercent,
        taxAmount,
        total,
        validUntil: validUntil || null,
        notes,
        templateId: null,
      })
      toast.success("Quote created.")
      auditLog("quote_created", "quote", createdQuote.id, createdQuote.quoteNumber)
      if (status === "sent") {
        auditLog("quote_sent", "quote", createdQuote.id, createdQuote.quoteNumber)
      }
      if (status === "sent") {
        const customer = customers.find((c) => c.id === customerId)
        if (customer) {
          triggerAutomation("quote_sent", {
            contactId: customer.id,
            contactName: customer.name || customer.companyName || "Customer",
            contactEmail: customer.emails[0],
            contactPhone: customer.phones[0],
          })
        }
      }
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{isEdit ? "Edit quote" : "New quote"}</DialogTitle>
          <DialogDescription>
            Add line items. Amount = quantity × unit price. Tax is applied to subtotal.
          </DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <Select value={customerId} onValueChange={setCustomerId}>
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
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</SelectItem>
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
                      <TableHead className="w-20">Disc. %</TableHead>
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
                            placeholder="item"
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
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            className="h-8 w-20"
                            value={line.discountPercent ?? 0}
                            onChange={(e) => updateLine(line.id, { discountPercent: Number(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{line.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeLine(line.id)}
                          >
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
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value) || 0)}
                />
              </Field>
              <Field>
                <FieldLabel>Valid until</FieldLabel>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-4 text-sm">
              <span>Subtotal: £{subtotal.toFixed(2)}</span>
              {taxRatePercent > 0 && <span>Tax: £{taxAmount.toFixed(2)}</span>}
              <span className="font-semibold">Total: £{total.toFixed(2)}</span>
            </div>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" />
            </Field>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID}>
              {isEdit ? "Save changes" : "Create quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
