"use client"

import { CommunicationStoreProvider } from "@/lib/communication-store"
import { CustomerStoreProvider } from "@/lib/customer-store"
import { ProjectStoreProvider } from "@/lib/project-store"
import { BillingStoreProvider } from "@/lib/billing-store"
import { AppointmentStoreProvider } from "@/lib/appointment-store"
import { LaborStoreProvider } from "@/lib/labor-store"
import { DocumentStoreProvider } from "@/lib/document-store"

export function CustomerStoreWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomerStoreProvider>
      <ProjectStoreProvider>
        <BillingStoreProvider>
          <AppointmentStoreProvider>
            <LaborStoreProvider>
              <DocumentStoreProvider>
                <CommunicationStoreProvider>{children}</CommunicationStoreProvider>
              </DocumentStoreProvider>
            </LaborStoreProvider>
          </AppointmentStoreProvider>
        </BillingStoreProvider>
      </ProjectStoreProvider>
    </CustomerStoreProvider>
  )
}
