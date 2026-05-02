"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Customer } from "@/types/customer-types"

type CustomerActionsDropdownProps = {
  customer: Customer
  onView?: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerActionsDropdown({
  customer,
  onView,
  onDelete,
}: CustomerActionsDropdownProps) {
  const router = useRouter()

  const handleView = () => {
    if (onView) onView(customer)
    else router.push(`/dashboard/customers/${customer.id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Actions"
          className="data-[state=open]:bg-accent"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={handleView}>
          <User className="size-4 mr-2" />
          View customer
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/customers/${customer.id}/edit`)
          }
        >
          <Pencil className="size-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(customer)}
        >
          <Trash2 className="size-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
