"use client"

import { useRef } from "react"
import { useUserStore } from "@/store/use-user-store"
import type { User } from "@/types/user"

export default function StoreInitializer({ user }: { user: User | null }) {
  const did = useRef(false)
  if (!did.current) {
    useUserStore.setState({ user, isLoading: false })
    did.current = true
  }
  return null
}
