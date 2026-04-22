export type MockNavContext = {
  source?: "customers" | "communications"
  customerId?: string
  communicationId?: string
}

const KEY = "landscaping.mockctx.v1"

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function setMockContext(ctx: MockNavContext) {
  if (!canUseStorage()) return
  window.localStorage.setItem(KEY, JSON.stringify(ctx))
}

export function readMockContext(): MockNavContext | null {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockNavContext
  } catch {
    return null
  }
}

export function clearMockContext() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(KEY)
}

