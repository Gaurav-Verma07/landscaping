'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getQuotes, createQuote as createQuoteAction, updateQuote as updateQuoteAction,
  deleteQuote as deleteQuoteAction, acceptQuote as acceptQuoteAction,
  getContracts, createContract as createContractAction, updateContract as updateContractAction,
  signContract as signContractAction, deleteContract as deleteContractAction,
  getInvoices, createInvoice as createInvoiceAction, updateInvoice as updateInvoiceAction,
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
import type {
  Quote, Contract, Invoice, InvoiceType,
  Supplier, MaterialCatalogItem, PredefinedItem, ContractTemplate,
} from '@/types/quote-types'

// ============================================
// QUERY KEYS
// ============================================

export const billingKeys = {
  quotes: ['quotes'] as const,
  contracts: ['contracts'] as const,
  invoices: ['invoices'] as const,
  suppliers: ['suppliers'] as const,
  materials: ['materials'] as const,
  predefinedItems: ['predefined-items'] as const,
  contractTemplates: ['contract-templates'] as const,
}

// ============================================
// QUERIES — each fetches independently,
// only when a component using it mounts
// ============================================

export function useQuotes() {
  return useQuery({ queryKey: billingKeys.quotes, queryFn: getQuotes })
}
export function useContracts() {
  return useQuery({ queryKey: billingKeys.contracts, queryFn: getContracts })
}
export function useInvoices() {
  return useQuery({ queryKey: billingKeys.invoices, queryFn: getInvoices })
}
export function useSuppliers() {
  return useQuery({ queryKey: billingKeys.suppliers, queryFn: getSuppliers })
}
export function useMaterials() {
  return useQuery({ queryKey: billingKeys.materials, queryFn: getMaterials })
}
export function usePredefinedItems() {
  return useQuery({ queryKey: billingKeys.predefinedItems, queryFn: getPredefinedItems })
}
export function useContractTemplates() {
  return useQuery({ queryKey: billingKeys.contractTemplates, queryFn: getContractTemplates })
}

// ============================================
// HELPER — invalidate a set of keys at once
// ============================================

function useInvalidate(...keys: (keyof typeof billingKeys)[]) {
  const queryClient = useQueryClient()
  return () => Promise.all(keys.map((k) => queryClient.invalidateQueries({ queryKey: billingKeys[k] })))
}

// ============================================
// QUOTE MUTATIONS
// ============================================

export function useCreateQuote() {
  const invalidate = useInvalidate('quotes')
  return useMutation({
    mutationFn: (data: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) =>
      createQuoteAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdateQuote() {
  const invalidate = useInvalidate('quotes')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateQuoteAction(id, data),
    onSuccess: invalidate,
  })
}
export function useDeleteQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQuoteAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.quotes })
      const previous = queryClient.getQueryData<Quote[]>(billingKeys.quotes)
      queryClient.setQueryData<Quote[]>(billingKeys.quotes, (old) => old?.filter((q) => q.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.quotes, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.quotes }),
  })
}
export function useAcceptQuote() {
  const invalidate = useInvalidate('quotes', 'contracts')
  return useMutation({
    mutationFn: ({ quoteId, title, content }: { quoteId: string; title: string; content: string }) =>
      acceptQuoteAction(quoteId, title, content),
    onSuccess: invalidate,
  })
}

// ============================================
// CONTRACT MUTATIONS
// ============================================

export function useCreateContract() {
  const invalidate = useInvalidate('contracts')
  return useMutation({
    mutationFn: (data: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>) =>
      createContractAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdateContract() {
  const invalidate = useInvalidate('contracts')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateContractAction(id, data),
    onSuccess: invalidate,
  })
}
export function useSignContract() {
  const invalidate = useInvalidate('contracts')
  return useMutation({
    mutationFn: ({ id, signedBy }: { id: string; signedBy: string }) => signContractAction(id, signedBy),
    onSuccess: invalidate,
  })
}
export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContractAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.contracts })
      const previous = queryClient.getQueryData<Contract[]>(billingKeys.contracts)
      queryClient.setQueryData<Contract[]>(billingKeys.contracts, (old) => old?.filter((c) => c.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.contracts, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.contracts }),
  })
}

// ============================================
// INVOICE MUTATIONS
// ============================================

export function useCreateInvoice() {
  const invalidate = useInvalidate('invoices')
  return useMutation({
    mutationFn: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments' | 'paidAmount'>) =>
      createInvoiceAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdateInvoice() {
  const invalidate = useInvalidate('invoices')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateInvoiceAction(id, data),
    onSuccess: invalidate,
  })
}
export function useRecordPayment() {
  const invalidate = useInvalidate('invoices')
  return useMutation({
    mutationFn: ({ invoiceId, amount, method, reference }: {
      invoiceId: string; amount: number; method: string; reference?: string
    }) => recordPaymentAction(invoiceId, amount, method, reference),
    onSuccess: invalidate,
  })
}
export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInvoiceAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.invoices })
      const previous = queryClient.getQueryData<Invoice[]>(billingKeys.invoices)
      queryClient.setQueryData<Invoice[]>(billingKeys.invoices, (old) => old?.filter((i) => i.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.invoices, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.invoices }),
  })
}
export function useCreatePaymentSchedule() {
  const invalidate = useInvalidate('invoices')
  return useMutation({
    mutationFn: ({ quoteId, entries }: {
      quoteId: string
      entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[]
    }) => createPaymentScheduleFromQuoteAction(quoteId, entries),
    onSuccess: invalidate,
  })
}

// ============================================
// SUPPLIER MUTATIONS
// ============================================

export function useCreateSupplier() {
  const invalidate = useInvalidate('suppliers')
  return useMutation({
    mutationFn: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => createSupplierAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdateSupplier() {
  const invalidate = useInvalidate('suppliers')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateSupplierAction(id, data),
    onSuccess: invalidate,
  })
}
export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSupplierAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<Supplier[]>(billingKeys.suppliers)
      queryClient.setQueryData<Supplier[]>(billingKeys.suppliers, (old) => old?.filter((s) => s.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.suppliers, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.suppliers }),
  })
}

// ============================================
// MATERIAL MUTATIONS
// ============================================

export function useCreateMaterial() {
  const invalidate = useInvalidate('materials')
  return useMutation({
    mutationFn: (data: Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => createMaterialAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdateMaterial() {
  const invalidate = useInvalidate('materials')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateMaterialAction(id, data),
    onSuccess: invalidate,
  })
}
export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMaterialAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<MaterialCatalogItem[]>(billingKeys.materials)
      queryClient.setQueryData<MaterialCatalogItem[]>(billingKeys.materials, (old) => old?.filter((m) => m.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.materials, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.materials }),
  })
}

// ============================================
// PREDEFINED ITEM MUTATIONS
// ============================================

export function useCreatePredefinedItem() {
  const invalidate = useInvalidate('predefinedItems')
  return useMutation({
    mutationFn: (data: Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>) => createPredefinedItemAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdatePredefinedItem() {
  const invalidate = useInvalidate('predefinedItems')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updatePredefinedItemAction(id, data),
    onSuccess: invalidate,
  })
}
export function useDeletePredefinedItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePredefinedItemAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<PredefinedItem[]>(billingKeys.predefinedItems)
      queryClient.setQueryData<PredefinedItem[]>(billingKeys.predefinedItems, (old) => old?.filter((p) => p.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.predefinedItems, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.predefinedItems }),
  })
}

// ============================================
// CONTRACT TEMPLATE MUTATIONS
// ============================================

export function useCreateContractTemplate() {
  const invalidate = useInvalidate('contractTemplates')
  return useMutation({
    mutationFn: (data: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => createContractTemplateAction(data),
    onSuccess: invalidate,
  })
}
export function useUpdateContractTemplate() {
  const invalidate = useInvalidate('contractTemplates')
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      updateContractTemplateAction(id, data),
    onSuccess: invalidate,
  })
}
export function useDeleteContractTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContractTemplateAction(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<ContractTemplate[]>(billingKeys.contractTemplates)
      queryClient.setQueryData<ContractTemplate[]>(billingKeys.contractTemplates, (old) => old?.filter((t) => t.id !== id) ?? [])
      return { previous }
    },
    onError: (_e, _id, ctx) => { if (ctx?.previous) queryClient.setQueryData(billingKeys.contractTemplates, ctx.previous) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingKeys.contractTemplates }),
  })
}

// ============================================
// BACKWARD COMPATIBILITY SHIM
// Drop-in for useBillingStore() — no component changes needed
// Remove once components import hooks directly
// ============================================

export function useBillingStore() {
  const queryClient = useQueryClient()

  const { data: quotes = [], isLoading: quotesLoading } = useQuotes()
  const { data: contracts = [] } = useContracts()
  const { data: invoices = [] } = useInvoices()
  const { data: suppliers = [] } = useSuppliers()
  const { data: materials = [] } = useMaterials()
  const { data: predefinedItems = [] } = usePredefinedItems()
  const { data: contractTemplates = [] } = useContractTemplates()

  const createQuoteMut = useCreateQuote()
  const updateQuoteMut = useUpdateQuote()
  const deleteQuoteMut = useDeleteQuote()
  const acceptQuoteMut = useAcceptQuote()
  const createContractMut = useCreateContract()
  const updateContractMut = useUpdateContract()
  const signContractMut = useSignContract()
  const deleteContractMut = useDeleteContract()
  const createInvoiceMut = useCreateInvoice()
  const updateInvoiceMut = useUpdateInvoice()
  const recordPaymentMut = useRecordPayment()
  const deleteInvoiceMut = useDeleteInvoice()
  const createScheduleMut = useCreatePaymentSchedule()
  const createSupplierMut = useCreateSupplier()
  const updateSupplierMut = useUpdateSupplier()
  const deleteSupplierMut = useDeleteSupplier()
  const createMaterialMut = useCreateMaterial()
  const updateMaterialMut = useUpdateMaterial()
  const deleteMaterialMut = useDeleteMaterial()
  const createPredefinedMut = useCreatePredefinedItem()
  const updatePredefinedMut = useUpdatePredefinedItem()
  const deletePredefinedMut = useDeletePredefinedItem()
  const createTemplateMut = useCreateContractTemplate()
  const updateTemplateMut = useUpdateContractTemplate()
  const deleteTemplateMut = useDeleteContractTemplate()

  const refresh = () => Promise.all(
    Object.values(billingKeys).map((key) => queryClient.invalidateQueries({ queryKey: key }))
  ).then(() => {})

  return {
    quotes, contracts, invoices, suppliers, materials, predefinedItems, contractTemplates,
    loading: quotesLoading,

    // Quotes
    getQuote: (id: string) => quotes.find((q) => q.id === id),
    getQuotesByCustomerId: (cid: string) => quotes.filter((q) => q.customerId === cid),
    createQuote: async (data: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => {
      const result = await createQuoteMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<Quote[]>(billingKeys.quotes)?.find((q) => q.id === (result as any).data?.id)
    },
    updateQuote: (id: string, data: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateQuoteMut.mutateAsync({ id, data }).then(() => {}),
    deleteQuote: (id: string) => deleteQuoteMut.mutateAsync(id).then(() => {}),
    acceptQuote: async (quoteId: string, title: string, content: string) => {
      const result = await acceptQuoteMut.mutateAsync({ quoteId, title, content })
      if ('error' in result || !result.data) return null
      return queryClient.getQueryData<Contract[]>(billingKeys.contracts)?.find((c) => c.id === result.data?.id) ?? null
    },

    // Contracts
    getContract: (id: string) => contracts.find((c) => c.id === id),
    getContractsByCustomerId: (cid: string) => contracts.filter((c) => c.customerId === cid),
    getContractByQuoteId: (qid: string) => contracts.find((c) => c.quoteId === qid),
    createContract: async (data: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>) => {
      const result = await createContractMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<Contract[]>(billingKeys.contracts)?.find((c) => c.id === (result as any).data?.id)
    },
    updateContract: (id: string, data: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateContractMut.mutateAsync({ id, data }).then(() => {}),
    signContract: (id: string, signedBy: string) =>
      signContractMut.mutateAsync({ id, signedBy }).then(() => {}),
    deleteContract: (id: string) => deleteContractMut.mutateAsync(id).then(() => {}),

    // Invoices
    getInvoice: (id: string) => invoices.find((i) => i.id === id),
    getInvoicesByCustomerId: (cid: string) => invoices.filter((i) => i.customerId === cid),
    getInvoicesByProjectId: (pid: string) => invoices.filter((i) => i.projectId === pid),
    getInvoicesByQuoteId: (qid: string) => invoices.filter((i) => i.quoteId === qid),
    createInvoice: async (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments' | 'paidAmount'>) => {
      const result = await createInvoiceMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<Invoice[]>(billingKeys.invoices)?.find((i) => i.id === (result as any).data?.id)
    },
    updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateInvoiceMut.mutateAsync({ id, data }).then(() => {}),
    recordPayment: (invoiceId: string, amount: number, method: string, reference?: string) =>
      recordPaymentMut.mutateAsync({ invoiceId, amount, method, reference }).then(() => {}),
    deleteInvoice: (id: string) => deleteInvoiceMut.mutateAsync(id).then(() => {}),
    createPaymentScheduleFromQuote: async (
      quoteId: string,
      entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[]
    ) => {
      const result = await createScheduleMut.mutateAsync({ quoteId, entries })
      if ('error' in result) return null
      return (result as any).data ?? null
    },

    // Suppliers
    createSupplier: async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createSupplierMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<Supplier[]>(billingKeys.suppliers)?.find((s) => s.id === (result as any).data?.id)
    },
    updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateSupplierMut.mutateAsync({ id, data }).then(() => {}),
    deleteSupplier: (id: string) => deleteSupplierMut.mutateAsync(id).then(() => {}),

    // Materials
    createMaterial: async (data: Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createMaterialMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<MaterialCatalogItem[]>(billingKeys.materials)?.find((m) => m.id === (result as any).data?.id)
    },
    updateMaterial: (id: string, data: Partial<Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateMaterialMut.mutateAsync({ id, data }).then(() => {}),
    deleteMaterial: (id: string) => deleteMaterialMut.mutateAsync(id).then(() => {}),

    // Predefined items
    createPredefinedItem: async (data: Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createPredefinedMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<PredefinedItem[]>(billingKeys.predefinedItems)?.find((p) => p.id === (result as any).data?.id)
    },
    updatePredefinedItem: (id: string, data: Partial<Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updatePredefinedMut.mutateAsync({ id, data }).then(() => {}),
    deletePredefinedItem: (id: string) => deletePredefinedMut.mutateAsync(id).then(() => {}),

    // Contract templates
    createContractTemplate: async (data: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createTemplateMut.mutateAsync(data)
      if ('error' in result) return undefined
      return queryClient.getQueryData<ContractTemplate[]>(billingKeys.contractTemplates)?.find((t) => t.id === (result as any).data?.id)
    },
    updateContractTemplate: (id: string, data: Partial<Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>>) =>
      updateTemplateMut.mutateAsync({ id, data }).then(() => {}),
    deleteContractTemplate: (id: string) => deleteTemplateMut.mutateAsync(id).then(() => {}),

    refresh,
  }
}