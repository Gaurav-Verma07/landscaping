import type { Profile } from "./types"

const store = new Map<string, Profile>()

function defaultProfile(id: string, overrides: Partial<Profile> = {}): Profile {
  return {
    id,
    email: null,
    fullName: null,
    avatarUrl: null,
    updatedAt: new Date().toISOString(),
    role: "owner",
    teamName: null,
    teamLogoUrl: null,
    companyPhone: null,
    companyEmail: null,
    companyAddress: null,
    invoicePrefix: "INV-",
    paymentTermsDays: 30,
    warrantyBlurb: null,
    notifyEmail: true,
    notifySms: false,
    voiceAssistantEnabled: true,
    voiceWakeWord: "Landscaping",
    theme: "system",
    brandColor: null,
    ...overrides,
  }
}

export function getProfileById(userId: string): Profile | null {
  return store.get(userId) ?? null
}

export function setProfile(userId: string, data: Partial<Profile>): void {
  const existing = store.get(userId) ?? defaultProfile(userId)
  const updated: Profile = {
    ...existing,
    ...data,
    id: userId,
    updatedAt: new Date().toISOString(),
  }
  store.set(userId, updated)
}

export function createProfile(userId: string, data: Partial<Profile>): void {
  if (store.has(userId)) return
  store.set(userId, defaultProfile(userId, data))
}
