'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAuditLog, logAudit as logAction, clearAuditLog as clearAction,
} from '@/lib/actions/audit'
import type { AuditEntry, AuditAction, AuditEntityType } from '@/types/audit-types'

export const auditKeys = {
  all: ['audit-log'] as const,
}

export function useAuditLog() {
  return useQuery({
    queryKey: auditKeys.all,
    queryFn: getAuditLog,
    staleTime: 30 * 1000,
  })
}

export function useLogAudit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      action, entityType, entityId, details,
    }: {
      action: AuditAction
      entityType: AuditEntityType
      entityId: string
      details?: string
    }) => logAction(action, entityType, entityId, details ?? ''),
    onMutate: async ({ action, entityType, entityId, details = '' }) => {
      await queryClient.cancelQueries({ queryKey: auditKeys.all })
      const previous = queryClient.getQueryData<AuditEntry[]>(auditKeys.all)
      queryClient.setQueryData<AuditEntry[]>(auditKeys.all, (old) =>
        [{
          id: `temp-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action, entityType, entityId, details,
        }, ...(old ?? [])].slice(0, 500)
      )
      return { previous }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(auditKeys.all, ctx.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: auditKeys.all }),
  })
}

export function useClearAuditLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearAction(),
    onSuccess: () => queryClient.setQueryData(auditKeys.all, []),
  })
}

// Backward compatibility shim
export function useAuditStore() {
  const queryClient = useQueryClient()
  const { data: entries = [], isLoading: loading } = useAuditLog()
  const logMutation = useLogAudit()
  const clearMutation = useClearAuditLog()

  return {
    entries,
    loading,
    log: (action: AuditAction, entityType: AuditEntityType, entityId: string, details = '') =>
      logMutation.mutateAsync({ action, entityType, entityId, details }).then(() => {}),
    clear: () => clearMutation.mutateAsync().then(() => {}),
    refresh: () => queryClient.invalidateQueries({ queryKey: auditKeys.all }).then(() => {}),
  }
}