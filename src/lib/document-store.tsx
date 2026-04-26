'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { DocumentRecord, CreateDocumentData } from '@/lib/document-types'
import {
  getDocuments,
  getDocumentsByCustomerId as getByCustomerIdAction,
  getDocumentsByProjectId as getByProjectIdAction,
  createDocument as createAction,
  updateDocument as updateAction,
  deleteDocument as deleteAction,
  uploadDocument as uploadAction,
} from '@/lib/actions/documents'

type DocumentStoreValue = {
  documents: DocumentRecord[]
  loading: boolean
  getDocument: (id: string) => DocumentRecord | undefined
  getDocumentsByCustomerId: (customerId: string) => DocumentRecord[]
  getDocumentsByProjectId: (projectId: string) => DocumentRecord[]
  createDocument: (data: CreateDocumentData) => Promise<DocumentRecord | undefined>
  uploadDocument: (file: File, meta: Omit<CreateDocumentData, 'fileUrl'>) => Promise<DocumentRecord | undefined>
  updateDocument: (id: string, data: Partial<CreateDocumentData>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const DocumentStoreContext = createContext<DocumentStoreValue | null>(null)

export function DocumentStoreProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getDocuments()
    setDocuments(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const getDocument = useCallback((id: string) => documents.find((d) => d.id === id), [documents])

  const getDocumentsByCustomerId = useCallback(
    (customerId: string) =>
      documents
        .filter((d) => d.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [documents]
  )

  const getDocumentsByProjectId = useCallback(
    (projectId: string) =>
      documents
        .filter((d) => d.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [documents]
  )

  const createDocument = useCallback(async (data: CreateDocumentData) => {
    const result = await createAction(data)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const uploadDocument = useCallback(async (file: File, meta: Omit<CreateDocumentData, 'fileUrl'>) => {
    const result = await uploadAction(file, meta)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateDocument = useCallback(async (id: string, data: Partial<CreateDocumentData>) => {
    await updateAction(id, data)
    await refresh()
  }, [refresh])

  const deleteDocument = useCallback(async (id: string) => {
    await deleteAction(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const value: DocumentStoreValue = {
    documents, loading,
    getDocument, getDocumentsByCustomerId, getDocumentsByProjectId,
    createDocument, uploadDocument, updateDocument, deleteDocument, refresh,
  }

  return <DocumentStoreContext.Provider value={value}>{children}</DocumentStoreContext.Provider>
}

export function useDocumentStore(): DocumentStoreValue {
  const ctx = useContext(DocumentStoreContext)
  if (!ctx) throw new Error('useDocumentStore must be used within DocumentStoreProvider')
  return ctx
}