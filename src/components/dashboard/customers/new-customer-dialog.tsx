"use client"

import { toast } from "sonner"
import { CustomerForm } from "@/components/dashboard/customers/customer-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCustomerStore } from "@/lib/stores"
import { useAuditStore } from "@/lib/stores"
import { addAttachment ,createCustomer as createCustomerAction } from "@/lib/actions/customers"

const NEW_CUSTOMER_FORM_ID = "new-customer-form"

interface NewCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerAdded?: () => void
}

export function NewCustomerDialog({
  open,
  onOpenChange,
  onCustomerAdded,
}: NewCustomerDialogProps) {
  const { createCustomer, refresh } = useCustomerStore()
  const { log: auditLog } = useAuditStore()

  const handleSubmit = async (
    data: Parameters<typeof createCustomer>[0],
    initialFiles?: File[],
  ) => {
    const result = await createCustomerAction(data)
    if ('error' in result || !result.data) {
      toast.error("Failed to create customer.")
      return
    }
  
    const customerId = result.data.id
    const customerName = result.data.name || result.data.company_name || customerId
  
    if (initialFiles?.length) {
      for (const file of initialFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await addAttachment(customerId, formData)
        if (res && 'error' in res) {
          toast.error(`Failed to upload ${file.name}: ${res.error}`)
        }
      }
    }
  
    await refresh()
    auditLog("customer_created", "customer", customerId, customerName)
    toast.success("Customer created.")
    onOpenChange(false)
    onCustomerAdded?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to your system
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <CustomerForm
              customer={null}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              submitLabel="Save Customer"
              showActions={false}
              formId={NEW_CUSTOMER_FORM_ID}
            />
          </div>
          <DialogFooter className="px-6 py-4 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form={NEW_CUSTOMER_FORM_ID}>
              Save Customer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}