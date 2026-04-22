export type ISODateString = string

export interface CompanySettings {
  companyName: string
  phone?: string
  email?: string
  address?: string
  invoicePrefix: string
  paymentTermsDays: number
  warrantyBlurb?: string
  notifyEmail: boolean
  notifySms: boolean
  voiceAssistantEnabled: boolean
  voiceWakeWord?: string
  theme: "light" | "dark" | "system"
  brandColor?: string
  updatedAt: ISODateString
}

export type IntegrationKey =
  | "quickbooks"
  | "stripe"
  | "twilio"
  | "google_calendar"
  | "eagleview"
  | "hover"
  | "companycam"
  | "google_drive"
  | "pix4d"

export interface Integration {
  id: string
  key: IntegrationKey
  name: string
  category:
    | "Accounting"
    | "Payments"
    | "Messaging"
    | "Scheduling"
    | "Measurements"
    | "Photos"
    | "Storage"
    | "Drone Mapping"
  connected: boolean
  enabledInWorkflows: boolean
  updatedAt: ISODateString
}

export interface MockDb {
  version: 1
  management: {
    integrations: Integration[]
    settings: CompanySettings
  }
}
