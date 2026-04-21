import type { MockDb } from "@/lib/mock/backend/types"
import { createSeedDb } from "@/lib/mock/backend/seed"

const STORAGE_KEY = "landscaping.mockdb.v1"

let cache: MockDb | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

function safeParse(raw: string | null) {
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockDb
  } catch {
    return null
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function persist(db: MockDb) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function getMockDb(): MockDb {
  if (cache) return cache
  if (!canUseStorage()) {
    cache = createSeedDb()
    return cache
  }

  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY))
  cache = parsed?.version === 1 ? parsed : createSeedDb()
  if (!parsed) persist(cache)
  return cache
}

export function setMockDb(updater: (db: MockDb) => MockDb) {
  const next = updater(getMockDb())
  cache = next
  persist(next)
  notify()
}

export function resetMockDb() {
  const next = createSeedDb()
  cache = next
  persist(next)
  notify()
}

export function subscribeMockDb(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function upsertById<T extends { id: string }>(rows: T[], row: T): T[] {
  const idx = rows.findIndex((r) => r.id === row.id)
  if (idx === -1) return [row, ...rows]
  const copy = rows.slice()
  copy[idx] = row
  return copy
}

export function removeById<T extends { id: string }>(rows: T[], id: string): T[] {
  return rows.filter((r) => r.id !== id)
}

