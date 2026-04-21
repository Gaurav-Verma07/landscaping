export interface Profile {
  id: string
  email: string | null
  fullName: string | null
  avatarUrl: string | null
  updatedAt: string | null
  role: string
  teamName: string | null
  teamLogoUrl: string | null
  companyPhone: string | null
  companyEmail: string | null
  companyAddress: string | null
  invoicePrefix: string | null
  paymentTermsDays: number
  warrantyBlurb: string | null
  notifyEmail: boolean
  notifySms: boolean
  voiceAssistantEnabled: boolean
  voiceWakeWord: string | null
  theme: string | null
  brandColor: string | null
}
