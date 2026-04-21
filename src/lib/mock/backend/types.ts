import type { Invoice, LaborRate, Material } from "@/types/invoice.types"

export type ISODateString = string

export type ClientStatus =
  | "New Lead"
  | "In Progress"
  | "Estimate Sent"
  | "Scheduled"
  | "Completed"
  | "Overdue"

export interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  leadSource?: string
  status: ClientStatus
  propertyAddress: string
  billingAddress?: string
  homeType?: string
  roofType?: string
  roofAge?: string
  carrier?: string
  policyNo?: string
  claimNo?: string
  adjusterName?: string
  adjusterPhone?: string
  rep?: string
  preferredContact?: string
  internalNotes?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type ProjectStatus = "Active" | "Pending" | "Completed" | "On Hold"
export type WeatherRisk = "Low" | "Medium" | "High"

export interface Project {
  id: string
  clientId: string
  name: string
  status: ProjectStatus
  scheduledDate?: ISODateString
  crew?: string
  location: string
  estValue: number
  overdue: boolean
  weatherRisk: WeatherRisk
  tags: string[]
  description?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface Vendor {
  id: string
  name: string
  description?: string
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type EstimateTemplateCategory = "Roof Replacement" | "Repair" | "Gutters" | "Commercial" | "Other"

export interface EstimateTemplate {
  id: string
  name: string
  category: EstimateTemplateCategory
  notes?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface StaffRole {
  id: string
  name: string
  description?: string
}

export interface StaffUser {
  id: string
  name: string
  email: string
  roleId: string
  roleName: string
  active: boolean
  twoFactorEnabled: boolean
  phone?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface Subcontractor {
  id: string
  name: string
  phone?: string
  email?: string
  trade: "Roofing" | "Gutters" | "Siding" | "Interior" | "Other"
  insured: boolean
  w9OnFile: boolean
  active: boolean
  notes?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface PricingSettings {
  materialMarkupPct: number
  laborMarkupPct: number
  overheadPct: number
  profitPct: number
  salesTaxRatePct: number
  salesTaxAppliesTo: "materials_only" | "labor_only" | "materials_and_labor"
  stormModeBonusPct: number
  rounding: "none" | "nearest_1" | "nearest_5" | "nearest_10"
  updatedAt: ISODateString
}

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

export interface StormRep {
  id: string
  name: string
  phone?: string
  email?: string
  territory?: string
  status?: "available" | "busy" | "offline"
  stormCertified?: boolean
  active: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type StormDealStage =
  | "New Lead"
  | "Inspected"
  | "Filed Claim"
  | "Approved"
  | "Scheduled"
  | "In Progress"
  | "Complete"
  | "Lost"

export interface StormDeal {
  id: string
  dealNumber: string
  clientId: string
  projectId?: string
  repId?: string
  stage: StormDealStage
  estimatedTotal: number
  supplementPotential: number
  lastTouchAt?: ISODateString
  notes?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface CommissionPlan {
  id: string
  name: string
  basePct: number
  supplementPct: number
  stormBonusPct: number
  minimumPayout: number
  active: boolean
  updatedAt: ISODateString
}

export interface StormPayout {
  id: string
  repId: string
  dealId: string
  planId: string
  amount: number
  status: "due" | "pending" | "approved" | "paid"
  reference?: string
  createdAt: ISODateString
  updatedAt: ISODateString
  paidAt?: ISODateString
}

export interface MockDb {
  version: 1
  clients: Client[]
  projects: Project[]
  invoices: Invoice[]
  materials: Material[]
  laborRates: LaborRate[]
  vendors: Vendor[]
  estimates: {
    templates: EstimateTemplate[]
  }
  storm: {
    enabled: boolean
    reps: StormRep[]
    deals: StormDeal[]
    commissionPlans: CommissionPlan[]
    payouts: StormPayout[]
  }
  management: {
    roles: StaffRole[]
    users: StaffUser[]
    subcontractors: Subcontractor[]
    integrations: Integration[]
    pricing: PricingSettings
    settings: CompanySettings
  }
}

