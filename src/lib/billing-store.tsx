'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type {
  Quote, Contract, Invoice, InvoiceType,
  Supplier, MaterialCatalogItem, PredefinedItem, ContractTemplate,
} from '@/lib/quote-types'
import {
  getQuotes, getQuote as getQuoteAction, getQuotesByCustomerId as getQuotesByCustomerIdAction,
  createQuote as createQuoteAction, updateQuote as updateQuoteAction,
  deleteQuote as deleteQuoteAction, acceptQuote as acceptQuoteAction,
  getContracts, getContract as getContractAction,
  getContractsByCustomerId as getContractsByCustomerIdAction,
  getContractByQuoteId as getContractByQuoteIdAction,
  createContract as createContractAction, updateContract as updateContractAction,
  signContract as signContractAction, deleteContract as deleteContractAction,
  getInvoices, getInvoice as getInvoiceAction,
  getInvoicesByCustomerId as getInvoicesByCustomerIdAction,
  getInvoicesByProjectId as getInvoicesByProjectIdAction,
  getInvoicesByQuoteId as getInvoicesByQuoteIdAction,
  createInvoice as createInvoiceAction, updateInvoice as updateInvoiceAction,
  recordPayment as recordPaymentAction, deleteInvoice as deleteInvoiceAction,
  createPaymentScheduleFromQuote as createPaymentScheduleFromQuoteAction,
  getSuppliers, createSupplier as createSupplierAction,
  updateSupplier as updateSupplierAction, deleteSupplier as deleteSupplierAction,
  getMaterials, createMaterial as createMaterialAction,
  updateMaterial as updateMaterialAction, deleteMaterial as deleteMaterialAction,
  getPredefinedItems, createPredefinedItem as createPredefinedItemAction,
  updatePredefinedItem as updatePredefinedItemAction, deletePredefinedItem as deletePredefinedItemAction,
  getContractTemplates, createContractTemplate as createContractTemplateAction,
  updateContractTemplate as updateContractTemplateAction, deleteContractTemplate as deleteContractTemplateAction,
} from '@/lib/actions/billing'

type BillingStoreValue = {
  quotes: Quote[]
  contracts: Contract[]
  invoices: Invoice[]
  suppliers: Supplier[]
  materials: MaterialCatalogItem[]
  predefinedItems: PredefinedItem[]
  contractTemplates: ContractTemplate[]
  loading: boolean
  getQuote: (id: string) => Quote | undefined
  getQuotesByCustomerId: (customerId: string) => Quote[]
  createQuote: (data: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => Promise<Quote | undefined>
  updateQuote: (id: string, data: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
  acceptQuote: (quoteId: string, contractTitle: string, contractContent: string) => Promise<Contract | null>
  getContract: (id: string) => Contract | undefined
  getContractsByCustomerId: (customerId: string) => Contract[]
  getContractByQuoteId: (quoteId: string) => Contract | undefined
  createContract: (data: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>) => Promise<Contract | undefined>
  updateContract: (id: string, data: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  signContract: (contractId: string, signedBy: string) => Promise<void>
  deleteContract: (id: string) => Promise<void>
  getInvoice: (id: string) => Invoice | undefined
  getInvoicesByCustomerId: (customerId: string) => Invoice[]
  getInvoicesByProjectId: (projectId: string) => Invoice[]
  getInvoicesByQuoteId: (quoteId: string) => Invoice[]
  createInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments' | 'paidAmount'>) => Promise<Invoice | undefined>
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  recordPayment: (invoiceId: string, amount: number, method: string, reference?: string) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  createPaymentScheduleFromQuote: (quoteId: string, entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[]) => Promise<Invoice[] | null>
  createSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Supplier | undefined>
  updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  createMaterial: (data: Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MaterialCatalogItem | undefined>
  updateMaterial: (id: string, data: Partial<Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  createPredefinedItem: (data: Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PredefinedItem | undefined>
  updatePredefinedItem: (id: string, data: Partial<Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deletePredefinedItem: (id: string) => Promise<void>
  createContractTemplate: (data: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContractTemplate | undefined>
  updateContractTemplate: (id: string, data: Partial<Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteContractTemplate: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const BillingStoreContext = createContext<BillingStoreValue | null>(null)

export function BillingStoreProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>([])
  const [predefinedItems, setPredefinedItems] = useState<PredefinedItem[]>([])
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [q, c, i, s, m, p, t] = await Promise.all([
      getQuotes(), getContracts(), getInvoices(),
      getSuppliers(), getMaterials(), getPredefinedItems(), getContractTemplates(),
    ])
    setQuotes(q)
    setContracts(c)
    setInvoices(i)
    setSuppliers(s)
    setMaterials(m)
    setPredefinedItems(p)
    setContractTemplates(t)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  // Quotes
  const getQuote = useCallback((id: string) => quotes.find((q) => q.id === id), [quotes])
  const getQuotesByCustomerId = useCallback((cid: string) => quotes.filter((q) => q.customerId === cid), [quotes])
  const createQuote = useCallback(async (data: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => {
    const result = await createQuoteAction(data)
    if ('error' in result) return undefined
    await refresh()
    return quotes.find((q) => q.id === result.data?.id)
  }, [quotes, refresh])
  const updateQuote = useCallback(async (id: string, data: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateQuoteAction(id, data)
    await refresh()
  }, [refresh])
  const deleteQuote = useCallback(async (id: string) => {
    await deleteQuoteAction(id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }, [])
  const acceptQuote = useCallback(async (quoteId: string, title: string, content: string) => {
    const result = await acceptQuoteAction(quoteId, title, content)
    if ('error' in result || !result.data) return null
    await refresh()
    return contracts.find((c) => c.id === result.data?.id) ?? null
  }, [contracts, refresh])

  // Contracts
  const getContract = useCallback((id: string) => contracts.find((c) => c.id === id), [contracts])
  const getContractsByCustomerId = useCallback((cid: string) => contracts.filter((c) => c.customerId === cid), [contracts])
  const getContractByQuoteId = useCallback((qid: string) => contracts.find((c) => c.quoteId === qid), [contracts])
  const createContract = useCallback(async (data: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>) => {
    const result = await createContractAction(data)
    if ('error' in result) return undefined
    await refresh()
    return contracts.find((c) => c.id === result.data?.id)
  }, [contracts, refresh])
  const updateContract = useCallback(async (id: string, data: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateContractAction(id, data)
    await refresh()
  }, [refresh])
  const signContract = useCallback(async (id: string, signedBy: string) => {
    await signContractAction(id, signedBy)
    await refresh()
  }, [refresh])
  const deleteContract = useCallback(async (id: string) => {
    await deleteContractAction(id)
    setContracts((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // Invoices
  const getInvoice = useCallback((id: string) => invoices.find((i) => i.id === id), [invoices])
  const getInvoicesByCustomerId = useCallback((cid: string) => invoices.filter((i) => i.customerId === cid), [invoices])
  const getInvoicesByProjectId = useCallback((pid: string) => invoices.filter((i) => i.projectId === pid), [invoices])
  const getInvoicesByQuoteId = useCallback((qid: string) => invoices.filter((i) => i.quoteId === qid), [invoices])
  const createInvoice = useCallback(async (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments' | 'paidAmount'>) => {
    const result = await createInvoiceAction(data)
    if ('error' in result) return undefined
    await refresh()
    return invoices.find((i) => i.id === result.data?.id)
  }, [invoices, refresh])
  const updateInvoice = useCallback(async (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateInvoiceAction(id, data)
    await refresh()
  }, [refresh])
  const recordPayment = useCallback(async (invoiceId: string, amount: number, method: string, reference?: string) => {
    await recordPaymentAction(invoiceId, amount, method, reference)
    await refresh()
  }, [refresh])
  const deleteInvoice = useCallback(async (id: string) => {
    await deleteInvoiceAction(id)
    setInvoices((prev) => prev.filter((i) => i.id !== id))
  }, [])
  const createPaymentScheduleFromQuote = useCallback(async (
    quoteId: string,
    entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[]
  ) => {
    const result = await createPaymentScheduleFromQuoteAction(quoteId, entries)
    if ('error' in result) return null
    await refresh()
    return result.data ?? null
  }, [refresh])

  // Suppliers
  const createSupplier = useCallback(async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createSupplierAction(data)
    if ('error' in result) return undefined
    await refresh()
    return suppliers.find((s) => s.id === result.data?.id)
  }, [suppliers, refresh])
  const updateSupplier = useCallback(async (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateSupplierAction(id, data)
    await refresh()
  }, [refresh])
  const deleteSupplier = useCallback(async (id: string) => {
    await deleteSupplierAction(id)
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
  }, [])

  // Materials
  const createMaterial = useCallback(async (data: Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createMaterialAction(data)
    if ('error' in result) return undefined
    await refresh()
    return materials.find((m) => m.id === result.data?.id)
  }, [materials, refresh])
  const updateMaterial = useCallback(async (id: string, data: Partial<Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateMaterialAction(id, data)
    await refresh()
  }, [refresh])
  const deleteMaterial = useCallback(async (id: string) => {
    await deleteMaterialAction(id)
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }, [])

  // Predefined items
  const createPredefinedItem = useCallback(async (data: Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createPredefinedItemAction(data)
    if ('error' in result) return undefined
    await refresh()
    return predefinedItems.find((p) => p.id === result.data?.id)
  }, [predefinedItems, refresh])
  const updatePredefinedItem = useCallback(async (id: string, data: Partial<Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updatePredefinedItemAction(id, data)
    await refresh()
  }, [refresh])
  const deletePredefinedItem = useCallback(async (id: string) => {
    await deletePredefinedItemAction(id)
    setPredefinedItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Contract templates
  const createContractTemplate = useCallback(async (data: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await createContractTemplateAction(data)
    if ('error' in result) return undefined
    await refresh()
    return contractTemplates.find((t) => t.id === result.data?.id)
  }, [contractTemplates, refresh])
  const updateContractTemplate = useCallback(async (id: string, data: Partial<Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateContractTemplateAction(id, data)
    await refresh()
  }, [refresh])
  const deleteContractTemplate = useCallback(async (id: string) => {
    await deleteContractTemplateAction(id)
    setContractTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: BillingStoreValue = {
    quotes, contracts, invoices, suppliers, materials, predefinedItems, contractTemplates, loading,
    getQuote, getQuotesByCustomerId, createQuote, updateQuote, deleteQuote, acceptQuote,
    getContract, getContractsByCustomerId, getContractByQuoteId, createContract, updateContract, signContract, deleteContract,
    getInvoice, getInvoicesByCustomerId, getInvoicesByProjectId, getInvoicesByQuoteId,
    createInvoice, updateInvoice, recordPayment, deleteInvoice, createPaymentScheduleFromQuote,
    createSupplier, updateSupplier, deleteSupplier,
    createMaterial, updateMaterial, deleteMaterial,
    createPredefinedItem, updatePredefinedItem, deletePredefinedItem,
    createContractTemplate, updateContractTemplate, deleteContractTemplate,
    refresh,
  }

  return <BillingStoreContext.Provider value={value}>{children}</BillingStoreContext.Provider>
}

export function useBillingStore() {
  const ctx = useContext(BillingStoreContext)
  if (!ctx) throw new Error('useBillingStore must be used within BillingStoreProvider')
  return ctx
}