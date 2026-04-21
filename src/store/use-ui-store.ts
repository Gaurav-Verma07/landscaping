import { create } from 'zustand'

interface UIState {
  isGlobalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (g) => set({ isGlobalLoading: g }),
  sidebarOpen: true,
  setSidebarOpen: (o) => set({ sidebarOpen: o }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
