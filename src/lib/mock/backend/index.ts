export * from "@/lib/mock/backend/types"
export { createSeedDb } from "@/lib/mock/backend/seed"
export {
  getMockDb,
  resetMockDb,
  setMockDb,
  subscribeMockDb,
  upsertById,
  removeById,
} from "@/lib/mock/backend/store"
export { setMockContext, readMockContext, clearMockContext } from "@/lib/mock/backend/context"

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`
}

