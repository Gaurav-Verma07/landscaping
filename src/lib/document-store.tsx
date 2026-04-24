"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { DocumentRecord, CreateDocumentData } from "@/lib/document-types"

const STORAGE_KEY = "landscaping-v2-documents"

function loadFromStorage(): DocumentRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "") return []
    const parsed = JSON.parse(raw) as DocumentRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(list: DocumentRecord[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function createId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type DocumentStoreValue = {
  documents: DocumentRecord[]
  getDocument: (id: string) => DocumentRecord | undefined
  getDocumentsByCustomerId: (customerId: string) => DocumentRecord[]
  getDocumentsByProjectId: (projectId: string) => DocumentRecord[]
  createDocument: (data: CreateDocumentData) => DocumentRecord
  updateDocument: (id: string, data: Partial<CreateDocumentData>) => void
  deleteDocument: (id: string) => void
}

const DocumentStoreContext = createContext<DocumentStoreValue | null>(null)

export function DocumentStoreProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])

  useEffect(() => {
    setDocuments(loadFromStorage())
  }, [])

  const persist = useCallback((list: DocumentRecord[]) => {
    setDocuments(list)
    saveToStorage(list)
  }, [])

  const getDocument = useCallback((id: string) => documents.find((d) => d.id === id), [documents])
  const getDocumentsByCustomerId = useCallback(
    (customerId: string) => documents.filter((d) => d.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [documents],
  )
  const getDocumentsByProjectId = useCallback(
    (projectId: string) => documents.filter((d) => d.projectId === projectId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [documents],
  )

  const createDocument = useCallback(
    (data: CreateDocumentData) => {
      const now = new Date().toISOString()
      const doc: DocumentRecord = { ...data, id: createId(), createdAt: now, updatedAt: now }
      persist([...documents, doc])
      return doc
    },
    [documents, persist],
  )

  const updateDocument = useCallback(
    (id: string, data: Partial<CreateDocumentData>) => {
      const now = new Date().toISOString()
      persist(documents.map((d) => (d.id === id ? { ...d, ...data, updatedAt: now } : d)))
    },
    [documents, persist],
  )

  const deleteDocument = useCallback(
    (id: string) => persist(documents.filter((d) => d.id !== id)),
    [documents, persist],
  )

  const value: DocumentStoreValue = {
    documents,
    getDocument,
    getDocumentsByCustomerId,
    getDocumentsByProjectId,
    createDocument,
    updateDocument,
    deleteDocument,
  }

  return (
    <DocumentStoreContext.Provider value={value}>
      {children}
    </DocumentStoreContext.Provider>
  )
}

export function useDocumentStore(): DocumentStoreValue {
  const ctx = useContext(DocumentStoreContext)
  if (!ctx) throw new Error("useDocumentStore must be used within DocumentStoreProvider")
  return ctx
}
