export type CommunicationChannel = "email" | "sms" | "call"
export type CommunicationContactType = "customer" | "prospect"

export interface Communication {
  id: string
  channel: CommunicationChannel
  subject: string
  body: string
  contactName: string
  contactId: string | null       // customerId when contact_type = 'customer'
  prospectId?: string | null     // prospectId when contact_type = 'prospect'
  contactType?: CommunicationContactType
  contactEmail?: string
  contactPhone?: string
  direction: "inbound" | "outbound"
  read: boolean
  createdAt: string
  metadata?: Record<string, string>
}

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  email: "Email",
  sms: "SMS",
  call: "Call",
}

export interface MessageTemplate {
  id: string
  name: string
  channel: CommunicationChannel
  subject: string
  body: string
  updatedAt: string
}

export type AutomationTrigger =
  | "quote_sent"
  | "quote_accepted"
  | "invoice_due"
  | "invoice_overdue"
  | "appointment_reminder"
  | "post_project"

export interface AutomationRule {
  id: string
  name: string
  trigger: AutomationTrigger
  delayDays: number
  templateId: string
  enabled: boolean
  createdAt: string
}

export interface FollowUpSequenceStep {
  delayDays: number
  templateId: string
}

export interface FollowUpSequence {
  id: string
  name: string
  steps: FollowUpSequenceStep[]
  createdAt: string
}

export type ScheduledMessageStatus = "pending" | "sent" | "cancelled"

export interface ScheduledMessage {
  id: string
  contactId: string
  contactName: string
  templateId: string
  sendAt: string
  status: ScheduledMessageStatus
  ruleId?: string
  sequenceId?: string
  createdAt: string
}

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  quote_sent: "Quote sent",
  quote_accepted: "Quote accepted",
  invoice_due: "Invoice due",
  invoice_overdue: "Invoice overdue",
  appointment_reminder: "Appointment reminder",
  post_project: "Post-project check-in",
}