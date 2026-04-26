'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Customer, CustomerTimelineEvent } from '@/lib/customer-types'
import {
  getCustomers, createCustomer as createCustomerAction,
  updateCustomer as updateCustomerAction, deleteCustomer as deleteCustomerAction,
  mergeCustomers as mergeCustomersAction, addNote as addNoteAction,
  addTimelineEvent as addTimelineEventAction, addAttachment as addAttachmentAction,
  removeAttachment as removeAttachmentAction,
} from '@/lib/actions/customers'

type CreateCustomerData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'timeline' | 'attachments'>

type CustomerStoreValue = {
  customers: Customer[]
  loading: boolean
  getCustomer: (id: string) => Customer | undefined
  createCustomer: (data: CreateCustomerData) => Promise<Customer | undefined>
  createCustomerWithAttachments: (data: CreateCustomerData, files: File[]) => Promise<Customer | undefined>
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'notes' | 'timeline' | 'attachments'>>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  mergeCustomers: (primaryId: string, secondaryId: string) => Promise<void>
  searchCustomers: (query: string) => Customer[]
  addNote: (customerId: string, content: string, createdBy?: string) => Promise<void>
  addTimelineEvent: (customerId: string, event: Omit<CustomerTimelineEvent, 'id'>) => Promise<void>
  addAttachment: (customerId: string, file: File) => Promise<void>
  removeAttachment: (customerId: string, attachmentId: string) => Promise<void>
  refresh: () => Promise<void>
}

const CustomerStoreContext = createContext<CustomerStoreValue | null>(null)

export function CustomerStoreProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getCustomers()
    setCustomers(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers])

  const createCustomer = useCallback(async (data: CreateCustomerData) => {
    const result = await createCustomerAction(data)
    if ('error' in result) return undefined
    await refresh()
    return customers.find((c) => c.id === result.data?.id)
  }, [customers, refresh])

  const createCustomerWithAttachments = useCallback(async (data: CreateCustomerData, files: File[]) => {
    const result = await createCustomerAction(data)
    if ('error' in result || !result.data) return undefined
    await Promise.all(files.map((f) => {
      const formData = new FormData()
      formData.append('file', f)
      return addAttachmentAction(result.data.id, formData)
    }))
    await refresh()
    return customers.find((c) => c.id === result.data?.id)
  }, [customers, refresh])
  
  const addAttachment = useCallback(async (customerId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    await addAttachmentAction(customerId, formData)
    await refresh()
  }, [refresh])

  const updateCustomer = useCallback(async (id: string, data: Partial<Omit<Customer, 'id' | 'notes' | 'timeline' | 'attachments'>>) => {
    await updateCustomerAction(id, data)
    await refresh()
  }, [refresh])

  const deleteCustomer = useCallback(async (id: string) => {
    await deleteCustomerAction(id)
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const mergeCustomers = useCallback(async (primaryId: string, secondaryId: string) => {
    await mergeCustomersAction(primaryId, secondaryId)
    await refresh()
  }, [refresh])

  const searchCustomers = useCallback((query: string) => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      const combined = [c.name, c.companyName, ...c.phones, ...c.emails, ...c.addresses, ...c.tags, ...c.notes.map((n) => n.content)].join(' ').toLowerCase()
      return combined.includes(q)
    })
  }, [customers])

  const addNote = useCallback(async (customerId: string, content: string, createdBy?: string) => {
    await addNoteAction(customerId, content, createdBy)
    await refresh()
  }, [refresh])

  const addTimelineEvent = useCallback(async (customerId: string, event: Omit<CustomerTimelineEvent, 'id'>) => {
    await addTimelineEventAction(customerId, event)
    await refresh()
  }, [refresh])



  const removeAttachment = useCallback(async (customerId: string, attachmentId: string) => {
    await removeAttachmentAction(customerId, attachmentId)
    await refresh()
  }, [refresh])

  const value = useMemo<CustomerStoreValue>(() => ({
    customers, loading, getCustomer, createCustomer, createCustomerWithAttachments,
    updateCustomer, deleteCustomer, mergeCustomers, searchCustomers,
    addNote, addTimelineEvent, addAttachment, removeAttachment, refresh,
  }), [customers, loading, getCustomer, createCustomer, createCustomerWithAttachments,
    updateCustomer, deleteCustomer, mergeCustomers, searchCustomers,
    addNote, addTimelineEvent, addAttachment, removeAttachment, refresh])

  return <CustomerStoreContext.Provider value={value}>{children}</CustomerStoreContext.Provider>
}

export function useCustomerStore() {
  const ctx = useContext(CustomerStoreContext)
  if (!ctx) throw new Error('useCustomerStore must be used within CustomerStoreProvider')
  return ctx
}