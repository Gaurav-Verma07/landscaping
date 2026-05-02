export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'

export type AudienceType =
  | 'all_customers'
  | 'active_customers'
  | 'past_customers'
  | 'leads'
  | 'all_prospects'
  | 'contacted_prospects'
  | 'responded_prospects'
  | 'custom_segment'

export interface AudienceFilters {
  tags?: string[]
  leadSource?: string
  location?: string
  status?: string
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  audienceType: AudienceType
  audienceFilters: AudienceFilters
  status: CampaignStatus
  scheduledAt?: string | null
  sentAt?: string | null
  totalRecipients: number
  totalSent: number
  totalFailed: number
  createdAt: string
  updatedAt: string
}

export interface CampaignSend {
  id: string
  campaignId: string
  recipientEmail: string
  recipientName?: string
  status: 'sent' | 'failed'
  error?: string
  sentAt: string
}

export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all_customers: 'All customers',
  active_customers: 'Active customers',
  past_customers: 'Past customers',
  leads: 'Leads (customers)',
  all_prospects: 'All prospects',
  contacted_prospects: 'Contacted prospects',
  responded_prospects: 'Responded prospects',
  custom_segment: 'Custom segment',
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
}