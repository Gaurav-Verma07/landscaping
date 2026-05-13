'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDocuments,
  createDocument as createAction,
  updateDocument as updateAction,
  deleteDocument as deleteAction,
  uploadDocument as uploadAction,
} from '@/lib/actions/documents'
import type { DocumentRecord, CreateDocumentData } from '@/types/document-types'
import { useLogAudit } from '@/lib/hooks/use-audit'

export const documentKeys = {
  all: ['documents'] as const,
}

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: getDocuments,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (data: CreateDocumentData) => createAction(data),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'document_created', entityType: 'document', entityId: id, details: variables.name ?? '' })
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: Omit<CreateDocumentData, 'fileUrl'> }) =>
      uploadAction(file, meta),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all })
      const id = (result as any)?.data?.id ?? 'unknown'
      void logAudit.mutateAsync({ action: 'document_created', entityType: 'document', entityId: id, details: variables.file.name })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDocumentData> }) =>
      updateAction(id, data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const logAudit = useLogAudit()
  return useMutation({
    mutationFn: (id: string) => deleteAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.all })
      const previous = queryClient.getQueryData<DocumentRecord[]>(documentKeys.all)
      queryClient.setQueryData<DocumentRecord[]>(documentKeys.all, (old) =>
        old?.filter((d) => d.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(documentKeys.all, ctx.previous)
    },
    onSettled: (_result, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all })
      void logAudit.mutateAsync({ action: 'document_deleted', entityType: 'document', entityId: id })
    },
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// ============================================

export function useDocumentStore() {
  const queryClient = useQueryClient()
  const { data: documents = [], isLoading: loading } = useDocuments()

  const createMutation = useCreateDocument()
  const uploadMutation = useUploadDocument()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()

  return {
    documents,
    loading,

    getDocument: (id: string) => documents.find((d) => d.id === id),

    getDocumentsByCustomerId: (customerId: string) =>
      documents
        .filter((d) => d.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

    getDocumentsByProjectId: (projectId: string) =>
      documents
        .filter((d) => d.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

    createDocument: async (data: CreateDocumentData) => {
      const result = await createMutation.mutateAsync(data)
      if ('error' in result) return undefined
      return (result as any).data as DocumentRecord | undefined
    },

    uploadDocument: async (file: File, meta: Omit<CreateDocumentData, 'fileUrl'>) => {
      const result = await uploadMutation.mutateAsync({ file, meta })
      if ('error' in result) return undefined
      return (result as any).data as DocumentRecord | undefined
    },

    updateDocument: (id: string, data: Partial<CreateDocumentData>) =>
      updateMutation.mutateAsync({ id, data }).then(() => {}),

    deleteDocument: (id: string) => deleteMutation.mutateAsync(id).then(() => {}),

    refresh: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.all }).then(() => {}),
  }
}