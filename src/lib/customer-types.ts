export type CustomerStatus = "Lead" | "Active" | "Past" | "Maintenance"

export type LeadSource =
  | "referral"
  | "partner"
  | "LinkedIn"
  | "website"
  | "cold_outreach"
  | "other"

export interface CustomerNote {
  id: string
  content: string
  createdAt: string
  createdBy?: string
}

export interface CustomerTimelineEvent {
  id: string
  type: "communication" | "document"
  title: string
  date: string
  description?: string
}

export interface CustomerAttachment {
  id: string
  name: string
  size: number
  uploadedAt: string
  url: string
}

export interface Customer {
  id: string
  name: string
  companyName: string
  phones: string[]
  emails: string[]
  addresses: string[]
  tags: string[]
  leadSource: LeadSource | string
  partnerReferralName: string
  status: CustomerStatus
  reviewStatus: string
  seasonalServiceEligibility: boolean
  notes: CustomerNote[]
  timeline: CustomerTimelineEvent[]
  attachments: CustomerAttachment[]
  createdAt: string
  updatedAt: string
}

export type CustomerFormData = {
  name: string
  companyName: string
  phones: string[]
  emails: string[]
  addresses: string[]
  tags: string[]
  leadSource: string
  partnerReferralName: string
  status: CustomerStatus
  reviewStatus: string
  seasonalServiceEligibility: boolean
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  Lead: "Lead",
  Active: "Active",
  Past: "Past",
  Maintenance: "Maintenance",
}

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  referral: "Referral",
  partner: "Partner",
  LinkedIn: "LinkedIn",
  website: "Website",
  cold_outreach: "Cold outreach",
  other: "Other",
}
