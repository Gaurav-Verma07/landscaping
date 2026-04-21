"use client"

import * as React from "react"
import { useState } from "react"

import type { Invoice, ReminderType } from "@/types/invoice.types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function SendReminderDialog({
  open,
  onOpenChange,
  invoice,
  onSend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSend: (args: { invoiceId: string; type: ReminderType; message: string }) => void
}) {
  const [type, setType] = useState<ReminderType>("email")
  const [message, setMessage] = useState("")

  React.useEffect(() => {
    if (!open) return
    setType("email")
    setMessage("")
  }, [open])

  const canSubmit = invoice && message.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send reminder</DialogTitle>
          <DialogDescription>
            {invoice ? `Invoice ${invoice.invoiceNumber} • ${invoice.clientName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Channel</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminder-message">Message</Label>
            <Textarea
              id="reminder-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! Just a friendly reminder that your invoice is due..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!invoice) return
              onSend({ invoiceId: invoice.id, type, message: message.trim() })
              onOpenChange(false)
            }}
            disabled={!canSubmit}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

