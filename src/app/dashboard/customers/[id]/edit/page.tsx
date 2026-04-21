"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { CustomerForm } from "@/components/dashboard/customers/customer-form"
import { Button } from "@/components/ui/button"
import { useCustomerStore } from "@/lib/customer-store"

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { getCustomer, updateCustomer } = useCustomerStore()
  const customer = getCustomer(id)

  if (!customer) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/customers">Back to customers</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = (
    data: Parameters<typeof updateCustomer>[1],
  ) => {
    updateCustomer(id, data)
    toast.success("Customer updated.")
    router.push(`/dashboard/customers/${id}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/customers/${id}`}>
          <ArrowLeft className="size-4" />
          Back to customer
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit customer
        </h1>
        <p className="text-muted-foreground text-sm">
          Update customer details. Notes, timeline, and attachments are managed
          on the customer detail page.
        </p>
      </div>
      <div className="mt-4">
        <CustomerForm
          customer={customer}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/dashboard/customers/${id}`)}
          submitLabel="Save changes"
        />
      </div>
    </div>
  )
}
