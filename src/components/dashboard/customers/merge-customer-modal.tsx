"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useCustomerStore } from "@/lib/customer-store"

type MergeCustomerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCustomerId: string
  onMerged: () => void
}

export function MergeCustomerModal({
  open,
  onOpenChange,
  currentCustomerId,
  onMerged,
}: MergeCustomerModalProps) {
  const { customers, getCustomer, mergeCustomers } = useCustomerStore()
  const [selectedId, setSelectedId] = useState("")
  const current = getCustomer(currentCustomerId)
  const others = customers.filter((c) => c.id !== currentCustomerId)

  const handleMerge = () => {
    if (!selectedId) return
    mergeCustomers(currentCustomerId, selectedId)
    onMerged()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merge customer</DialogTitle>
          <DialogDescription>
            Merge another customer into{" "}
            <strong>{current?.name || "this customer"}</strong>. Their notes,
            timeline, and attachments will be combined. The other record will be
            removed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="merge-select">
            Select customer to merge into this one
          </Label>
          <select
            id="merge-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Choose…</option>
            {others.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "Unnamed"}{" "}
                {c.companyName ? `(${c.companyName})` : ""}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={!selectedId}>
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
