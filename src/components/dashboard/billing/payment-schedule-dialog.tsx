"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Field, FieldLabel } from "@/components/ui/field"
import type { Quote } from "@/types/quote-types"
import { INVOICE_TYPES, type InvoiceType } from "@/types/quote-types"
import { useBillingStore } from "@/lib/stores"

const DEFAULT_ENTRIES = [
  { percent: 30, type: "deposit" as InvoiceType, dueOffsetDays: 0 },
  { percent: 40, type: "progress" as InvoiceType, dueOffsetDays: 30 },
  { percent: 30, type: "final" as InvoiceType, dueOffsetDays: 60 },
]

interface PaymentScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote | null
  onCreated?: () => void
}

export function PaymentScheduleDialog({
  open,
  onOpenChange,
  quote,
  onCreated,
}: PaymentScheduleDialogProps) {
  const { createPaymentScheduleFromQuote } = useBillingStore()
  const [entries, setEntries] = useState<{ percent: number; type: InvoiceType; dueOffsetDays: number }[]>([])

  useEffect(() => {
    if (open) setEntries([...DEFAULT_ENTRIES])
  }, [open])

  const totalPercent = entries.reduce((s, e) => s + e.percent, 0)
  const valid = totalPercent === 100 && entries.length > 0 && entries.every((e) => e.percent > 0 && e.dueOffsetDays >= 0)

  const updateEntry = (index: number, patch: Partial<typeof entries[0]>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  const addEntry = () => {
    setEntries((prev) => [...prev, { percent: 0, type: "progress", dueOffsetDays: 0 }])
  }

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit =async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!quote || !valid) {
      if (totalPercent !== 100) toast.error("Percents must total 100%.")
      return
    }
    const created =await createPaymentScheduleFromQuote(
      quote.id,
      entries.map((e) => ({ percent: e.percent, type: e.type, dueOffsetDays: e.dueOffsetDays })),
    )
    if (!created) {
      toast.error("Could not create schedule. Check that percents total 100%.")
      return
    }
    toast.success(`Created ${created.length} invoice(s) from quote.`)
    onOpenChange(false)
    onCreated?.()
  }

  if (!quote) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create payment schedule</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Split quote {quote.quoteNumber} (total £{quote.total.toFixed(2)}) into multiple invoices with due date offsets.
          </p>
        </DialogHeader>
        <form id="payment-schedule-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">%</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-28">Due in (days)</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        className="h-8"
                        value={entry.percent}
                        onChange={(e) => updateEntry(i, { percent: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={entry.type} onValueChange={(v) => updateEntry(i, { type: v as InvoiceType })}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVOICE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8"
                        value={entry.dueOffsetDays}
                        onChange={(e) => updateEntry(i, { dueOffsetDays: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeEntry(i)}
                        disabled={entries.length <= 1}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={addEntry}>
              <Plus className="size-4 mr-1" />
              Add row
            </Button>
            <span className={totalPercent === 100 ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
              Total: {totalPercent}%
            </span>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="payment-schedule-form" disabled={!valid}>
            Create invoices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
