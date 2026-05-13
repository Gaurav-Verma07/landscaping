'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCommunications, addCommunication as addCommunicationAction,
  markRead as markReadAction,
  getTemplates as getTemplatesAction, addTemplate as addTemplateAction,
  updateTemplate as updateTemplateAction, deleteTemplate as deleteTemplateAction,
  getRules, addRule as addRuleAction, updateRule as updateRuleAction, deleteRule as deleteRuleAction,
  getSequences, addSequence as addSequenceAction,
  updateSequence as updateSequenceAction, deleteSequence as deleteSequenceAction,
  getScheduledMessages, addScheduledMessage as addScheduledMessageAction,
  updateScheduledStatus as updateScheduledStatusAction,
  runDueScheduledMessages as runDueAction,
  triggerAutomation as triggerAutomationAction,
} from '@/lib/actions/communications'
import type {
  Communication, MessageTemplate, AutomationRule,
  FollowUpSequence, ScheduledMessage, AutomationTrigger,
} from '@/types/communication-types'
import { useLogAudit } from '@/lib/hooks/use-audit'

export const communicationKeys = {
  communications: ['communications'] as const,
  templates: ['communication-templates'] as const,
  rules: ['communication-rules'] as const,
  sequences: ['communication-sequences'] as const,
  scheduled: ['communication-scheduled'] as const,
}

// ============================================
// QUERIES
// ============================================

export function useCommunications() {
  return useQuery({ queryKey: communicationKeys.communications, queryFn: getCommunications })
}
export function useCommunicationTemplates() {
  return useQuery({ queryKey: communicationKeys.templates, queryFn: getTemplatesAction })
}
export function useCommunicationRules() {
  return useQuery({ queryKey: communicationKeys.rules, queryFn: getRules })
}
export function useCommunicationSequences() {
  return useQuery({ queryKey: communicationKeys.sequences, queryFn: getSequences })
}
export function useScheduledMessages() {
  return useQuery({ queryKey: communicationKeys.scheduled, queryFn: getScheduledMessages })
}

// ============================================
// MUTATIONS
// ============================================

export function useAddCommunication() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (comm: Omit<Communication, 'id'>) => addCommunicationAction(comm),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.communications })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'communication_sent', entityType: 'communication', entityId: id, details: `${variables.channel} to ${variables.contactName}` })
    },
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markReadAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: communicationKeys.communications })
      const previous = queryClient.getQueryData<Communication[]>(communicationKeys.communications)
      queryClient.setQueryData<Communication[]>(communicationKeys.communications, (old) =>
        old?.map((c) => c.id === id ? { ...c, read: true } : c) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(communicationKeys.communications, ctx.previous)
    },
  })
}

export function useAddTemplate() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (t: Omit<MessageTemplate, 'id' | 'updatedAt'>) => addTemplateAction(t),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.templates })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'communication_template_created', entityType: 'template', entityId: id, details: variables.name })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ id, t }: { id: string; t: Partial<MessageTemplate> }) => updateTemplateAction(id, t),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.templates })
      void logAudit.mutateAsync({ action: 'communication_template_updated', entityType: 'template', entityId: variables.id })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteTemplateAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<MessageTemplate[]>(communicationKeys.templates)
      queryClient.setQueryData<MessageTemplate[]>(communicationKeys.templates, (old) =>
        old?.filter((t) => t.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(communicationKeys.templates, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.templates })
      void logAudit.mutateAsync({ action: 'communication_template_deleted', entityType: 'template', entityId: id })
    },
  })
}

export function useAddRule() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (r: Omit<AutomationRule, 'id' | 'createdAt'>) => addRuleAction(r),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.rules })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'communication_rule_created', entityType: 'rule', entityId: id, details: variables.name })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ id, r }: { id: string; r: Partial<AutomationRule> }) => updateRuleAction(id, r),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.rules })
      void logAudit.mutateAsync({ action: 'communication_rule_updated', entityType: 'rule', entityId: variables.id })
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteRuleAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<AutomationRule[]>(communicationKeys.rules)
      queryClient.setQueryData<AutomationRule[]>(communicationKeys.rules, (old) =>
        old?.filter((r) => r.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(communicationKeys.rules, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.rules })
      void logAudit.mutateAsync({ action: 'communication_rule_deleted', entityType: 'rule', entityId: id })
    },
  })
}

export function useAddSequence() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (s: Omit<FollowUpSequence, 'id' | 'createdAt'>) => addSequenceAction(s),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.sequences })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'communication_sequence_created', entityType: 'sequence', entityId: id, details: variables.name })
    },
  })
}

export function useUpdateSequence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, s }: { id: string; s: Partial<FollowUpSequence> }) => updateSequenceAction(id, s),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communicationKeys.sequences }),
  })
}

export function useDeleteSequence() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteSequenceAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<FollowUpSequence[]>(communicationKeys.sequences)
      queryClient.setQueryData<FollowUpSequence[]>(communicationKeys.sequences, (old) =>
        old?.filter((s) => s.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(communicationKeys.sequences, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.sequences })
      void logAudit.mutateAsync({ action: 'communication_sequence_deleted', entityType: 'sequence', entityId: id })
    },
  })
}

export function useAddScheduledMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (s: Omit<ScheduledMessage, 'id' | 'createdAt'>) => addScheduledMessageAction(s),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communicationKeys.scheduled }),
  })
}

export function useUpdateScheduledStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScheduledMessage['status'] }) =>
      updateScheduledStatusAction(id, status),
    onMutate: async ({ id, status }) => {
      const previous = queryClient.getQueryData<ScheduledMessage[]>(communicationKeys.scheduled)
      queryClient.setQueryData<ScheduledMessage[]>(communicationKeys.scheduled, (old) =>
        old?.map((s) => s.id === id ? { ...s, status } : s) ?? []
      )
      return { previous }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(communicationKeys.scheduled, ctx.previous)
    },
  })
}

export function useRunDueScheduledMessages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runDueAction(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communicationKeys.scheduled }),
  })
}

export function useTriggerAutomation() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ trigger, opts }: {
      trigger: AutomationTrigger
      opts: {
        contactId: string; contactName: string; contactEmail?: string
        contactPhone?: string; extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
      }
    }) => triggerAutomationAction(trigger, opts),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: communicationKeys.communications })
      void logAudit.mutateAsync({ action: 'automation_triggered', entityType: 'automation', entityId: variables.opts.contactId, details: `Trigger: ${variables.trigger} for ${variables.opts.contactName}` })
    },
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useCommunicationStore() {
  const queryClient = useQueryClient()
  const { data: communications = [], isLoading: loading } = useCommunications()
  const { data: templates = [] } = useCommunicationTemplates()
  const { data: rules = [] } = useCommunicationRules()
  const { data: sequences = [] } = useCommunicationSequences()
  const { data: scheduledMessages = [] } = useScheduledMessages()

  const addCommMut = useAddCommunication()
  const markReadMut = useMarkRead()
  const addTemplateMut = useAddTemplate()
  const updateTemplateMut = useUpdateTemplate()
  const deleteTemplateMut = useDeleteTemplate()
  const addRuleMut = useAddRule()
  const updateRuleMut = useUpdateRule()
  const deleteRuleMut = useDeleteRule()
  const addSeqMut = useAddSequence()
  const updateSeqMut = useUpdateSequence()
  const deleteSeqMut = useDeleteSequence()
  const addSchedMut = useAddScheduledMessage()
  const updateSchedStatusMut = useUpdateScheduledStatus()
  const runDueMut = useRunDueScheduledMessages()
  const triggerAutoMut = useTriggerAutomation()

  const refresh = () =>
    Promise.all(
      Object.values(communicationKeys).map((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      )
    ).then(() => {})

  return {
    communications, templates, rules, sequences, scheduledMessages, loading,

    addCommunication: async (comm: Omit<Communication, 'id'>) => {
      const result = await addCommMut.mutateAsync(comm)
      if ('error' in result) return undefined
      return (result as any).data as Communication | undefined
    },

    markRead: (id: string) => markReadMut.mutateAsync(id).then(() => {}),

    getTemplates: () => templates,

    addTemplate: async (t: Omit<MessageTemplate, 'id' | 'updatedAt'>) => {
      const result = await addTemplateMut.mutateAsync(t)
      if ('error' in result) return undefined
      return (result as any).data as MessageTemplate | undefined
    },

    updateTemplate: (id: string, t: Partial<MessageTemplate>) =>
      updateTemplateMut.mutateAsync({ id, t }).then(() => {}),

    deleteTemplate: (id: string) => deleteTemplateMut.mutateAsync(id).then(() => {}),

    searchCommunications: (query: string) => {
      const q = query.toLowerCase().trim()
      if (!q) return communications.slice(0, 10)
      return communications.filter((c) =>
        c.subject.toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        (c.contactEmail?.toLowerCase().includes(q) ?? false) ||
        (c.contactPhone?.includes(q) ?? false)
      ).slice(0, 10)
    },

    getCommunicationsByContactId: (contactId: string) =>
      communications.filter((c) => c.contactId === contactId),

    addRule: async (r: Omit<AutomationRule, 'id' | 'createdAt'>) => {
      const result = await addRuleMut.mutateAsync(r)
      if ('error' in result) return undefined
      return (result as any).data as AutomationRule | undefined
    },

    updateRule: (id: string, r: Partial<AutomationRule>) =>
      updateRuleMut.mutateAsync({ id, r }).then(() => {}),

    deleteRule: (id: string) => deleteRuleMut.mutateAsync(id).then(() => {}),

    addSequence: (s: Omit<FollowUpSequence, 'id' | 'createdAt'>) =>
      addSeqMut.mutateAsync(s).then(() => {}),

    updateSequence: (id: string, s: Partial<FollowUpSequence>) =>
      updateSeqMut.mutateAsync({ id, s }).then(() => {}),

    deleteSequence: (id: string) => deleteSeqMut.mutateAsync(id).then(() => {}),

    addScheduledMessage: async (s: Omit<ScheduledMessage, 'id' | 'createdAt'>) => {
      const result = await addSchedMut.mutateAsync(s)
      if ('error' in result) return undefined
      return (result as any).data as ScheduledMessage | undefined
    },

    updateScheduledStatus: (id: string, status: ScheduledMessage['status']) =>
      updateSchedStatusMut.mutateAsync({ id, status }).then(() => {}),

    runDueScheduledMessages: () => runDueMut.mutateAsync(),

    triggerAutomation: (trigger: AutomationTrigger, opts: {
      contactId: string; contactName: string; contactEmail?: string
      contactPhone?: string; extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
    }) => triggerAutoMut.mutateAsync({ trigger, opts }).then(() => {}),

    refresh,
  }
}