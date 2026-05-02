"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { CustomerForm } from "@/components/dashboard/customers/customer-form"
import { Button } from "@/components/ui/button"
import { useCustomerStore } from "@/lib/stores"

export default function NewCustomerPage() {
  const router = useRouter()
  const { createCustomer, createCustomerWithAttachments } = useCustomerStore()

  const handleSubmit = async (
    data: Parameters<typeof createCustomer>[0],
    initialFiles?: File[],
  ) => {
    if (initialFiles?.length) {
      await createCustomerWithAttachments(data, initialFiles)
    } else {
      createCustomer(data)
    }
    toast.success("Customer created.")
    router.push("/dashboard/customers")
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/customers">
          <ArrowLeft className="size-4" />
          Back to customers
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create customer
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a new customer record. You can attach files here or add more
          notes, timeline events, and attachments on the customer detail page.
        </p>
      </div>
      <div className="mt-4">
        <CustomerForm
          customer={null}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard/customers")}
          submitLabel="Create customer"
        />
      </div>
    </div>
  )
}
