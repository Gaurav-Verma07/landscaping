export type OutreachTargetType =
  | "Realtor"
  | "Contractor"
  | "Landscape Designer"
  | "Lawn Care Company"
  | "Other"

export type OutreachStage =
  | "New"
  | "Contacted"
  | "Responded"
  | "Qualified"
  | "Partner"
  | "Archived"

export interface OutreachProspect {
  id: string
  name: string
  company: string
  targetType: OutreachTargetType
  location: string
  industry: string
  companySize: string
  email?: string
  phone?: string
  notes: string
  stage: OutreachStage
  leadSource: string
  createdAt: string
  updatedAt: string
}

export const OUTREACH_TARGET_TYPE_LABELS: Record<OutreachTargetType, string> = {
  Realtor: "Realtor",
  Contractor: "Contractor",
  "Landscape Designer": "Landscape designer",
  "Lawn Care Company": "Lawn care company",
  Other: "Other",
}

export const OUTREACH_STAGE_LABELS: Record<OutreachStage, string> = {
  New: "New",
  Contacted: "Contacted",
  Responded: "Responded",
  Qualified: "Qualified",
  Partner: "Partner",
  Archived: "Archived",
}

