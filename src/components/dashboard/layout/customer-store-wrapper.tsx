"use client"

import { CommunicationStoreProvider } from "@/lib/communication-store"
import { CustomerStoreProvider } from "@/lib/customer-store"

export function CustomerStoreWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomerStoreProvider>
      <CommunicationStoreProvider>{children}</CommunicationStoreProvider>
    </CustomerStoreProvider>
  )
}
