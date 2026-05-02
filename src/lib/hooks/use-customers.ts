'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCustomers,
  createCustomer as createCustomerAction,
  updateCustomer as updateCustomerAction,
  deleteCustomer as deleteCustomerAction,
  mergeCustomers as mergeCustomersAction,
  addNote as addNoteAction,
  addTimelineEvent as addTimelineEventAction,
  addAttachment as addAttachmentAction,
  removeAttachment as removeAttachmentAction,
} from '@/lib/actions/customers'
import type { Customer, CustomerTimelineEvent } from '@/types/customer-types'

// ============================================
// QUERY KEYS
// Centralised so invalidation is consistent
// ============================================

export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: string) => ['customers', id] as const,
}

// ============================================
// QUERY — fetch all customers
// Only runs when a component that calls useCustomers() mounts
// ============================================

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: getCustomers,
  })
}

// Convenience selector — get one customer from the cached list
export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: getCustomers,
    select: (customers) => customers.find((c) => c.id === id),
    enabled: !!id,
  })
}

// ============================================
// MUTATIONS
// Each mutation invalidates the customers cache
// so any component using useCustomers() re-fetches
// ============================================

type CreateCustomerData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'timeline' | 'attachments'>

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCustomerData) => createCustomerAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useCreateCustomerWithAttachments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ data, files }: { data: CreateCustomerData; files: File[] }) => {
      const result = await createCustomerAction(data)
      if ('error' in result || !result.data) throw new Error('error' in result ? result.error : 'Failed to create customer')
      await Promise.all(
        files.map((f) => {
          const formData = new FormData()
          formData.append('file', f)
          return addAttachmentAction(result.data.id, formData)
        })
      )
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Customer, 'id' | 'notes' | 'timeline' | 'attachments'>>
    }) => updateCustomerAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCustomerAction(id),
    // Optimistic update — remove from cache immediately, revert on error
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.all })
      const previous = queryClient.getQueryData<Customer[]>(customerKeys.all)
      queryClient.setQueryData<Customer[]>(customerKeys.all, (old) =>
        old ? old.filter((c) => c.id !== id) : []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(customerKeys.all, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useMergeCustomers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ primaryId, secondaryId }: { primaryId: string; secondaryId: string }) =>
      mergeCustomersAction(primaryId, secondaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      customerId,
      content,
      createdBy,
    }: {
      customerId: string
      content: string
      createdBy?: string
    }) => addNoteAction(customerId, content, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useAddTimelineEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      customerId,
      event,
    }: {
      customerId: string
      event: Omit<CustomerTimelineEvent, 'id'>
    }) => addTimelineEventAction(customerId, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useAddAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, file }: { customerId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      return addAttachmentAction(customerId, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useRemoveAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, attachmentId }: { customerId: string; attachmentId: string }) =>
      removeAttachmentAction(customerId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

// ============================================
// SEARCH — purely derived from cached data, no extra fetch
// ============================================

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: getCustomers,
    select: (customers) => {
      const q = query.trim().toLowerCase()
      if (!q) return customers
      return customers.filter((c) => {
        const combined = [
          c.name,
          c.companyName,
          ...c.phones,
          ...c.emails,
          ...c.addresses,
          ...c.tags,
          ...c.notes.map((n) => n.content),
        ]
          .join(' ')
          .toLowerCase()
        return combined.includes(q)
      })
    },
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// Drop-in replacement for useCustomerStore() —
// lets existing components work without changes.
// Remove once all components are migrated to hooks.
// ============================================

export function useCustomerStore() {
  const queryClient = useQueryClient()
  const { data: customers = [], isLoading: loading } = useCustomers()

  const createCustomerMutation = useCreateCustomer()
  const createWithAttachmentsMutation = useCreateCustomerWithAttachments()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()
  const mergeMutation = useMergeCustomers()
  const addNoteMutation = useAddNote()
  const addTimelineMutation = useAddTimelineEvent()
  const addAttachmentMutation = useAddAttachment()
  const removeAttachmentMutation = useRemoveAttachment()

  return {
    customers,
    loading,

    getCustomer: (id: string) => customers.find((c) => c.id === id),

    searchCustomers: (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return customers
      return customers.filter((c) => {
        const combined = [c.name, c.companyName, ...c.phones, ...c.emails, ...c.addresses, ...c.tags]
          .join(' ')
          .toLowerCase()
        return combined.includes(q)
      })
    },

    createCustomer: async (data: CreateCustomerData) => {
      const result = await createCustomerMutation.mutateAsync(data)
      if ('error' in result) return undefined
      const updated = queryClient.getQueryData<Customer[]>(customerKeys.all)
      return updated?.find((c) => c.id === (result as any).data?.id)
    },

    createCustomerWithAttachments: async (data: CreateCustomerData, files: File[]) => {
      return createWithAttachmentsMutation.mutateAsync({ data, files })
    },

    updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'notes' | 'timeline' | 'attachments'>>) =>
      updateMutation.mutateAsync({ id, data }).then(() => {}),

    deleteCustomer: (id: string) => deleteMutation.mutateAsync(id).then(() => {}),

    mergeCustomers: (primaryId: string, secondaryId: string) =>
      mergeMutation.mutateAsync({ primaryId, secondaryId }).then(() => {}),

    addNote: (customerId: string, content: string, createdBy?: string) =>
      addNoteMutation.mutateAsync({ customerId, content, createdBy }).then(() => {}),

    addTimelineEvent: (customerId: string, event: Omit<CustomerTimelineEvent, 'id'>) =>
      addTimelineMutation.mutateAsync({ customerId, event }).then(() => {}),

    addAttachment: (customerId: string, file: File) =>
      addAttachmentMutation.mutateAsync({ customerId, file }).then(() => {}),

    removeAttachment: (customerId: string, attachmentId: string) =>
      removeAttachmentMutation.mutateAsync({ customerId, attachmentId }).then(() => {}),

    refresh: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }).then(() => {}),
  }
}