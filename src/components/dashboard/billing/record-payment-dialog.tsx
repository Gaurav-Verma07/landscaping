"use client"

import { useState } from "react"
import { toast } from "sonner"
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
import { Field, FieldLabel } from "@/components/ui/field"
import type { Invoice } from "@/lib/quote-types"
import { useBillingStore } from "@/lib/billing-store"

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onRecorded?: () => void
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onRecorded,
}: RecordPaymentDialogProps) {
  const { recordPayment } = useBillingStore()
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Bank transfer")
  const [reference, setReference] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount.")
      return
    }
    const remaining = invoice.total - invoice.paidAmount
    if (amt > remaining) {
      toast.error(`Amount cannot exceed remaining £${remaining.toFixed(2)}.`)
      return
    }
    recordPayment(invoice.id, amt, method.trim(), reference.trim() || undefined)
    toast.success("Payment recorded.")
    setAmount("")
    setReference("")
    onOpenChange(false)
    onRecorded?.()
  }

  if (!invoice) return null

  const remaining = invoice.total - invoice.paidAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNumber} — Total £{invoice.total.toFixed(2)}, paid £{invoice.paidAmount.toFixed(2)}, remaining £{remaining.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Field>
            <FieldLabel>Amount (£)</FieldLabel>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining.toFixed(2)}
            />
          </Field>
          <Field>
            <FieldLabel>Method</FieldLabel>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. Bank transfer" />
          </Field>
          <Field>
            <FieldLabel>Reference</FieldLabel>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Payment reference" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Record payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
