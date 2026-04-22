import type { MockDb } from "@/lib/mock/backend/types"

function nowIso() {
  return new Date().toISOString()
}

export function createSeedDb(): MockDb {
  const now = nowIso()

  const integrations = [
    {
      id: "int-quickbooks",
      key: "quickbooks" as const,
      name: "QuickBooks Online",
      category: "Accounting" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
    {
      id: "int-stripe",
      key: "stripe" as const,
      name: "Stripe",
      category: "Payments" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
    {
      id: "int-companycam",
      key: "companycam" as const,
      name: "CompanyCam",
      category: "Photos" as const,
      connected: true,
      enabledInWorkflows: true,
      updatedAt: now,
    },
    {
      id: "int-hover",
      key: "hover" as const,
      name: "HOVER",
      category: "Measurements" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
    {
      id: "int-pix4d",
      key: "pix4d" as const,
      name: "Pix4D",
      category: "Drone Mapping" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
  ]

  const settings = {
    companyName: "Landscaping",
    phone: "(555) 300-0000",
    email: "ops@landscaping.app",
    address: "123 Roofing Way, Springfield, IL",
    invoicePrefix: "INV",
    paymentTermsDays: 15,
    warrantyBlurb: "Workmanship warranty: 5 years. Manufacturer warranty per product.",
    notifyEmail: true,
    notifySms: false,
    voiceAssistantEnabled: true,
    voiceWakeWord: "Landscaping",
    theme: "system" as const,
    brandColor: "#0ea5e9",
    updatedAt: now,
  }

  return {
    version: 1,
    management: {
      integrations,
      settings,
    },
  }
}
