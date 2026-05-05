export type User = {
  id: string
  email?: string | null
}

export interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}
