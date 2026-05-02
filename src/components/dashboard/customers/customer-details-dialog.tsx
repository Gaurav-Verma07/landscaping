"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/types/customer-types"
import {
  CUSTOMER_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/customer-types"

function CustomerStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5">
      {CUSTOMER_STATUS_LABELS[status as keyof typeof CUSTOMER_STATUS_LABELS] ?? status}
    </Badge>
  )
}

interface CustomerDetailsDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMerge?: (customer: Customer) => void
}

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
  onMerge,
}: CustomerDetailsDialogProps) {
  const router = useRouter()

  if (!customer) return null

  const hasNotes = customer.notes?.length > 0
  const latestNote = hasNotes ? customer.notes[0] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="truncate">{customer.name || "Unnamed customer"}</span>
            <CustomerStatusBadge status={customer.status} />
          </DialogTitle>
          <DialogDescription className="truncate">
            {customer.companyName || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="text-sm">
              <div>{customer.phones?.length ? customer.phones.join(", ") : "—"}</div>
              <div className="text-muted-foreground">
                {customer.emails?.length ? customer.emails.join(", ") : "—"}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Lead & Status</div>
            <div className="text-sm">
              <div>
                {LEAD_SOURCE_LABELS[customer.leadSource] ?? customer.leadSource ?? "—"}
              </div>
              <div className="text-muted-foreground">
                {customer.partnerReferralName || "—"}
              </div>
              <div className="text-muted-foreground">
                Review: {customer.reviewStatus || "—"}
              </div>
              <div className="text-muted-foreground">
                Seasonal: {customer.seasonalServiceEligibility ? "Yes" : "No"}
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="text-xs text-muted-foreground">Address(es)</div>
            <div className="text-sm">
              {customer.addresses?.length
                ? customer.addresses.join(" · ")
                : "—"}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="text-xs text-muted-foreground">Tags</div>
            <div className="text-sm">
              {customer.tags?.length ? customer.tags.join(", ") : "—"}
            </div>
          </div>
        </div>

        {latestNote ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Notes</div>
            <div className="text-sm whitespace-pre-wrap line-clamp-3">
              {latestNote.content}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              router.push(`/dashboard/customers/${customer.id}`)
            }}
          >
            View full profile
          </Button>
          {onMerge ? (
            <Button variant="outline" onClick={() => onMerge(customer)}>
              Merge customer
            </Button>
          ) : null}
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push(`/dashboard/customers/${customer.id}/edit`)
            }}
          >
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
