"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Customer } from "@/types/customer-types"

type DeleteCustomerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onConfirm: () => void
}

export function DeleteCustomerModal({
  open,
  onOpenChange,
  customer,
  onConfirm,
}: DeleteCustomerModalProps) {
  const name = customer?.name || "Unknown"

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete customer?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete customer <span className="font-bold">&quot;{name}&quot;</span>?
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
