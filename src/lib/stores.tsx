'use client'
import React from 'react'

export { useCustomerStore } from '@/lib/hooks/use-customers'
export { useProjectStore } from '@/lib/hooks/use-projects'
export { useBillingStore } from '@/lib/hooks/use-billing'
export { useAppointmentStore } from '@/lib/hooks/use-appointments'
export { useOutreachStore } from '@/lib/hooks/use-outreach'
export { useLaborStore } from '@/lib/hooks/use-labor'
export { useDocumentStore } from '@/lib/hooks/use-document'
export { useEquipmentStore } from '@/lib/hooks/use-equipment'
export { useCommunicationStore } from '@/lib/hooks/use-communications'
export { useAuditStore } from '@/lib/hooks/use-audit'
export { useMarketingStore } from '@/lib/hooks/use-marketing'

// No-op providers — QueryProvider in layout.tsx handles the cache
const NoOp = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const CustomerStoreProvider = NoOp
export const CustomerStoreWrapper = NoOp
export const ProjectStoreProvider = NoOp
export const BillingStoreProvider = NoOp
export const AppointmentStoreProvider = NoOp
export const OutreachStoreProvider = NoOp
export const LaborStoreProvider = NoOp
export const DocumentStoreProvider = NoOp
export const EquipmentStoreProvider = NoOp
export const CommunicationStoreProvider = NoOp
export const AuditStoreProvider = NoOp
export const MarketingStoreProvider = NoOp