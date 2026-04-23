"use client"

import { CommunicationStoreProvider } from "@/lib/communication-store"
import { CustomerStoreProvider } from "@/lib/customer-store"
import { ProjectStoreProvider } from "@/lib/project-store"
import { BillingStoreProvider } from "@/lib/billing-store"

export function CustomerStoreWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomerStoreProvider>
      <ProjectStoreProvider>
        <BillingStoreProvider>
          <CommunicationStoreProvider>{children}</CommunicationStoreProvider>
        </BillingStoreProvider>
      </ProjectStoreProvider>
    </CustomerStoreProvider>
  )
}
