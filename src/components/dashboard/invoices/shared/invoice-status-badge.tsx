"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { InvoiceStatus } from "@/types/invoice.types"

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-foreground",
  sent: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  paid: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200",
  overdue: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200",
  disputed: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
  cancelled: "bg-muted text-muted-foreground",
}

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <Badge className={cn("capitalize", STATUS_STYLES[status], className)} variant="secondary">
      {status}
    </Badge>
  )
}

