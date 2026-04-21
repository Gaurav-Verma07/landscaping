import { create } from 'zustand'
import type { User } from '@/types/user'

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  isLoading: true,
  setIsLoading: (load) => set({ isLoading: load }),
}))
