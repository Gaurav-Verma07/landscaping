import type { UserState } from '@/types/user'
import { create } from 'zustand'

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  isLoading: true,
  setIsLoading: (load) => set({ isLoading: load }),
}))
