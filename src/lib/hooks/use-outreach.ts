'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProspects,
  createProspect as createAction,
  createProspects as createProspectsAction,
  updateProspect as updateAction,
  deleteProspect as deleteAction,
  moveProspectStage as moveStageAction,
  bulkDeleteProspects,
  bulkUpdateProspects,
} from '@/lib/actions/outreach'
import type { OutreachProspect, OutreachStage } from '@/types/outreach-types'
import { useLogAudit } from '@/lib/hooks/use-audit'

export const outreachKeys = {
  all: ['prospects'] as const,
}

export function useProspects() {
  return useQuery({
    queryKey: outreachKeys.all,
    queryFn: getProspects,
  })
}

export function useCreateProspect() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (input: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>) =>
      createAction(input),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.all })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'prospect_created', entityType: 'prospect', entityId: id, details: variables.name })
    },
  })
}

export function useCreateProspects() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (inputs: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>[]) =>
      createProspectsAction(inputs),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.all })
      void logAudit.mutateAsync({ action: 'prospect_created', entityType: 'prospect', entityId: 'bulk', details: `${variables.length} prospects imported` })
    },
  })
}

export function useUpdateProspect() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>>
    }) => updateAction(id, patch),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.all })
      void logAudit.mutateAsync({ action: 'prospect_updated', entityType: 'prospect', entityId: variables.id })
    },
  })
}

export function useDeleteProspect() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: outreachKeys.all })
      const previous = queryClient.getQueryData<OutreachProspect[]>(outreachKeys.all)
      queryClient.setQueryData<OutreachProspect[]>(outreachKeys.all, (old) =>
        old?.filter((p) => p.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(outreachKeys.all, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.all })
      void logAudit.mutateAsync({ action: 'prospect_deleted', entityType: 'prospect', entityId: id })
    },
  })
}

export function useMoveProspectStage() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: OutreachStage }) =>
      moveStageAction(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: outreachKeys.all })
      const previous = queryClient.getQueryData<OutreachProspect[]>(outreachKeys.all)
      queryClient.setQueryData<OutreachProspect[]>(outreachKeys.all, (old) =>
        old?.map((p) => (p.id === id ? { ...p, stage } : p)) ?? []
      )
      return { previous }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(outreachKeys.all, ctx.previous)
    },
    onSettled: (_result, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.all })
      void logAudit.mutateAsync({ action: 'prospect_updated', entityType: 'prospect', entityId: variables.id, details: `Stage → ${variables.stage}` })
    },
  })
}

export function useBulkUpdateProspects() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<OutreachProspect> }) => {
      const dbData: Record<string, unknown> = {}
      if (data.stage !== undefined) dbData.stage = data.stage
      if (data.targetType !== undefined) dbData.target_type = data.targetType
      if (data.leadSource !== undefined) dbData.lead_source = data.leadSource
      if (data.notes !== undefined) dbData.notes = data.notes
      return bulkUpdateProspects(ids, dbData)
    },
    onMutate: async ({ ids, data }) => {
      await queryClient.cancelQueries({ queryKey: outreachKeys.all })
      const previous = queryClient.getQueryData<OutreachProspect[]>(outreachKeys.all)
      queryClient.setQueryData<OutreachProspect[]>(outreachKeys.all, (old) =>
        old?.map((p) => (ids.includes(p.id) ? { ...p, ...data } : p)) ?? []
      )
      return { previous }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(outreachKeys.all, ctx.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: outreachKeys.all }),
  })
}

export function useBulkDeleteProspects() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteProspects(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: outreachKeys.all })
      const previous = queryClient.getQueryData<OutreachProspect[]>(outreachKeys.all)
      queryClient.setQueryData<OutreachProspect[]>(outreachKeys.all, (old) =>
        old?.filter((p) => !ids.includes(p.id)) ?? []
      )
      return { previous }
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(outreachKeys.all, ctx.previous)
    },
    onSettled: (_result, _error, ids) => {
      void queryClient.invalidateQueries({ queryKey: outreachKeys.all })
      void logAudit.mutateAsync({ action: 'prospect_deleted', entityType: 'prospect', entityId: 'bulk', details: `${ids.length} prospects deleted` })
    },
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useOutreachStore() {
  const queryClient = useQueryClient()
  const { data: prospects = [], isLoading: loading } = useProspects()

  const createMutation = useCreateProspect()
  const createManyMutation = useCreateProspects()
  const updateMutation = useUpdateProspect()
  const deleteMutation = useDeleteProspect()
  const moveStageMutation = useMoveProspectStage()
  const bulkUpdateMutation = useBulkUpdateProspects()
  const bulkDeleteMutation = useBulkDeleteProspects()

  return {
    prospects,
    loading,

    createProspect: async (input: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createMutation.mutateAsync(input)
      if ('error' in result) return undefined
      return (result as any).data as OutreachProspect | undefined
    },

    createProspects: (inputs: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>[]) =>
      createManyMutation.mutateAsync(inputs).then(() => {}),

    updateProspect: (
      id: string,
      patch: Partial<Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>>
    ) => updateMutation.mutateAsync({ id, patch }).then(() => {}),

    deleteProspect: (id: string) => deleteMutation.mutateAsync(id).then(() => {}),

    moveProspectStage: (id: string, stage: OutreachStage) =>
      moveStageMutation.mutateAsync({ id, stage }).then(() => {}),

    bulkUpdate: (ids: string[], data: Partial<OutreachProspect>) =>
      bulkUpdateMutation.mutateAsync({ ids, data }).then(() => {}),

    bulkDelete: (ids: string[]) => bulkDeleteMutation.mutateAsync(ids).then(() => {}),

    refresh: () =>
      queryClient.invalidateQueries({ queryKey: outreachKeys.all }).then(() => {}),
  }
}