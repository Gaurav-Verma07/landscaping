"use client"

import { CustomerStoreProvider } from "@/lib/customer-store"

export function CustomerStoreWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <CustomerStoreProvider>{children}</CustomerStoreProvider>
}
