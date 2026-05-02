'use client'

import { QueryClient } from '@tanstack/react-query'

// Singleton — shared across the app, created once on the client
let queryClient: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Data considered fresh for 2 minutes — no refetch on window focus within this window
          staleTime: 2 * 60 * 1000,
          // Keep unused data in cache for 5 minutes before garbage collecting
          gcTime: 5 * 60 * 1000,
          // Don't retry on 4xx errors — only on network failures
          retry: (failureCount, error: unknown) => {
            if (error instanceof Error && error.message.includes('Not authenticated')) return false
            return failureCount < 2
          },
          refetchOnWindowFocus: false,
        },
        mutations: {
          // Don't retry mutations — they may have already partially succeeded
          retry: false,
        },
      },
    })
  }
  return queryClient
}