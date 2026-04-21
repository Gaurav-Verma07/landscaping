"use client"

import * as React from "react"
import type { MockDb } from "@/lib/mock/backend/types"
import { getMockDb, subscribeMockDb } from "@/lib/mock/backend/store"

export function useMockDb() {
  const [db, setDb] = React.useState<MockDb>(() => getMockDb())

  React.useEffect(() => {
    return subscribeMockDb(() => setDb(getMockDb()))
  }, [])

  return db
}

