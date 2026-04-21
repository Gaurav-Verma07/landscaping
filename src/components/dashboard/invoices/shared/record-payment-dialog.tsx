"use client"

import * as React from "react"
import { useMemo, useState } from "react"

import type { Invoice, PaymentMethod } from "@/types/invoice.types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { money } from "@/components/dashboard/invoices/shared/format"

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onRecord,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onRecord: (args: { invoiceId: string; amount: number; date: string; method: PaymentMethod; reference?: string }) => void
}) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState<PaymentMethod>("check")
  const [reference, setReference] = useState("")

  const defaultAmount = useMemo(() => invoice?.balance ?? 0, [invoice])

  React.useEffect(() => {
    if (!open) return
    setAmount(defaultAmount ? String(defaultAmount) : "")
    setDate(new Date().toISOString().slice(0, 10))
    setMethod("check")
    setReference("")
  }, [open, defaultAmount])

  const canSubmit = invoice && Number(amount) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {invoice ? `Invoice ${invoice.invoiceNumber} • Balance ${money(invoice.balance)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={defaultAmount ? String(defaultAmount) : "0"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pay-date">Date</Label>
            <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pay-ref">Reference (optional)</Label>
            <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Check #1234" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!invoice) return
              onRecord({ invoiceId: invoice.id, amount: Number(amount), date, method, reference: reference || undefined })
              onOpenChange(false)
            }}
            disabled={!canSubmit}
          >
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

