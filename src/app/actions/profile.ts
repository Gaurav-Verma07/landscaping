'use server'

import { getProfileById, setProfile, createProfile } from '@/lib/db'

export async function getProfile(userId: string) {
  return getProfileById(userId)
}

export async function upsertProfile(
  uid: string,
  d: Partial<{
    email: string | null
    fullName: string | null
    avatarUrl: string | null
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
    voiceWakeWord: string
    theme: string
    brandColor: string | null
  }>
) {
  const ex = getProfileById(uid)
  const p = { ...d, updatedAt: new Date().toISOString() }
  if (ex) {
    setProfile(uid, p)
  } else {
    createProfile(uid, { id: uid, role: 'owner', ...p })
  }
}
