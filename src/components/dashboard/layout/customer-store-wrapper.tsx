"use client"

import { CommunicationStoreProvider } from "@/lib/communication-store"
import { CustomerStoreProvider } from "@/lib/customer-store"
import { ProjectStoreProvider } from "@/lib/project-store"

export function CustomerStoreWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomerStoreProvider>
      <ProjectStoreProvider>
        <CommunicationStoreProvider>{children}</CommunicationStoreProvider>
      </ProjectStoreProvider>
    </CustomerStoreProvider>
  )
}
