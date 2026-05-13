'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCampaigns, createCampaign as createCampaignAction,
  updateCampaign as updateCampaignAction, deleteCampaign as deleteCampaignAction,
  sendCampaign as sendCampaignAction,
} from '@/lib/actions/marketing'
import type { Campaign, AudienceType, AudienceFilters } from '@/types/marketing-types'
import { useLogAudit } from '@/lib/hooks/use-audit'

export const marketingKeys = {
  campaigns: ['campaigns'] as const,
}

export function useCampaigns() {
  return useQuery({
    queryKey: marketingKeys.campaigns,
    queryFn: getCampaigns,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (input: {
      name: string; subject: string; body: string
      audienceType: AudienceType; audienceFilters: AudienceFilters
      scheduledAt?: string | null
    }) => createCampaignAction(input),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'campaign_created', entityType: 'campaign', entityId: id, details: variables.name })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: {
      id: string
      input: Partial<{
        name: string; subject: string; body: string
        audienceType: AudienceType; audienceFilters: AudienceFilters
        scheduledAt: string | null
      }>
    }) => updateCampaignAction(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns }),
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteCampaignAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: marketingKeys.campaigns })
      const previous = queryClient.getQueryData<Campaign[]>(marketingKeys.campaigns)
      queryClient.setQueryData<Campaign[]>(marketingKeys.campaigns, (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(marketingKeys.campaigns, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns })
      void logAudit.mutateAsync({ action: 'campaign_deleted', entityType: 'campaign', entityId: id })
    },
  })
}

export function useSendCampaign() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => sendCampaignAction(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns })
      void logAudit.mutateAsync({ action: 'campaign_sent', entityType: 'campaign', entityId: id })
    },
  })
}

// Backward compatibility shim
export function useMarketingStore() {
  const queryClient = useQueryClient()
  const { data: campaigns = [], isLoading: loading } = useCampaigns()
  const createMutation = useCreateCampaign()
  const updateMutation = useUpdateCampaign()
  const deleteMutation = useDeleteCampaign()
  const sendMutation = useSendCampaign()

  return {
    campaigns,
    loading,
    refresh: () => queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns }).then(() => {}),
    createCampaign: async (input: Parameters<typeof createCampaignAction>[0]) => {
      const result = await createMutation.mutateAsync(input)
      if ('error' in result) return undefined
      return (result as any).data as Campaign | undefined
    },
    updateCampaign: (id: string, input: Parameters<typeof updateCampaignAction>[1]) =>
      updateMutation.mutateAsync({ id, input }).then(() => {}),
    deleteCampaign: (id: string) => deleteMutation.mutateAsync(id).then(() => {}),
    sendCampaign: (id: string) => sendMutation.mutateAsync(id),
  }
}