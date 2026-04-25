"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type {
  Quote,
  QuoteLineItem,
  QuoteStatus,
  Contract,
  ContractStatus,
  Invoice,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceStatus,
  InvoiceType,
  Supplier,
  MaterialCatalogItem,
  PredefinedItem,
  ContractTemplate,
} from "@/lib/quote-types"
import {
  QUOTE_SEED,
  CONTRACT_SEED,
  INVOICE_SEED,
  SUPPLIER_SEED,
  MATERIAL_CATALOG_SEED,
  PREDEFINED_ITEMS_SEED,
  CONTRACT_TEMPLATES_SEED,
} from "@/lib/billing-seed"

const STORAGE_KEY = "landscaping-v2-billing"

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, data: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nextNumber(prefix: string, existing: { quoteNumber?: string; contractNumber?: string; invoiceNumber?: string }[], field: "quoteNumber" | "contractNumber" | "invoiceNumber"): string {
  const nums = existing
    .map((x) => (x[field] ?? "").replace(/^\D+/, ""))
    .filter(Boolean)
    .map((n) => parseInt(n, 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length === 0 ? 1 : Math.max(...nums) + 1
  return `${prefix}-${String(next).padStart(3, "0")}`
}

type BillingData = {
  quotes: Quote[]
  contracts: Contract[]
  invoices: Invoice[]
  suppliers: Supplier[]
  materials: MaterialCatalogItem[]
  predefinedItems: PredefinedItem[]
  contractTemplates: ContractTemplate[]
}

const defaultData: BillingData = {
  quotes: QUOTE_SEED,
  contracts: CONTRACT_SEED,
  invoices: INVOICE_SEED,
  suppliers: SUPPLIER_SEED,
  materials: MATERIAL_CATALOG_SEED,
  predefinedItems: PREDEFINED_ITEMS_SEED,
  contractTemplates: CONTRACT_TEMPLATES_SEED,
}

function loadBilling(): BillingData {
  const stored = loadJson<BillingData>(STORAGE_KEY, defaultData)
  return {
    quotes: Array.isArray(stored.quotes) ? stored.quotes : defaultData.quotes,
    contracts: Array.isArray(stored.contracts) ? stored.contracts : defaultData.contracts,
    invoices: Array.isArray(stored.invoices) ? stored.invoices : defaultData.invoices,
    suppliers: Array.isArray(stored.suppliers) ? stored.suppliers : defaultData.suppliers,
    materials: Array.isArray(stored.materials) ? stored.materials : defaultData.materials,
    predefinedItems: Array.isArray(stored.predefinedItems) ? stored.predefinedItems : defaultData.predefinedItems,
    contractTemplates: Array.isArray(stored.contractTemplates) ? stored.contractTemplates : defaultData.contractTemplates,
  }
}

function lineAmountAfterDiscount(l: QuoteLineItem): number {
  const base = l.quantity * l.unitPrice
  const pct = l.discountPercent ?? 0
  return Math.round(base * (1 - pct / 100) * 100) / 100
}

function invoiceLineAmountAfterDiscount(l: InvoiceLineItem): number {
  const base = l.quantity * l.unitPrice
  const pct = l.discountPercent ?? 0
  return Math.round(base * (1 - pct / 100) * 100) / 100
}

function recalcQuoteTotals(q: Quote): Quote {
  const lineItems = q.lineItems.map((l) => ({ ...l, amount: lineAmountAfterDiscount(l) }))
  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0)
  const taxAmount = (subtotal * q.taxRatePercent) / 100
  const total = subtotal + taxAmount
  return { ...q, lineItems, subtotal, taxAmount, total }
}

function recalcInvoiceTotals(inv: Invoice): Invoice {
  const lineItems = inv.lineItems.map((l) => ({ ...l, amount: invoiceLineAmountAfterDiscount(l) }))
  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0)
  const taxAmount = (subtotal * inv.taxRatePercent) / 100
  const total = subtotal + taxAmount
  return { ...inv, lineItems, subtotal, taxAmount, total }
}

type BillingStoreValue = {
  quotes: Quote[]
  contracts: Contract[]
  invoices: Invoice[]
  suppliers: Supplier[]
  materials: MaterialCatalogItem[]
  predefinedItems: PredefinedItem[]
  contractTemplates: ContractTemplate[]
  getQuote: (id: string) => Quote | undefined
  getQuotesByCustomerId: (customerId: string) => Quote[]
  createQuote: (data: Omit<Quote, "id" | "quoteNumber" | "createdAt" | "updatedAt">) => Quote
  updateQuote: (id: string, data: Partial<Omit<Quote, "id" | "createdAt" | "updatedAt">>) => void
  deleteQuote: (id: string) => void
  acceptQuote: (quoteId: string, contractTitle: string, contractContent: string) => Contract | null
  getContract: (id: string) => Contract | undefined
  getContractsByCustomerId: (customerId: string) => Contract[]
  getContractByQuoteId: (quoteId: string) => Contract | undefined
  createContract: (data: Omit<Contract, "id" | "contractNumber" | "createdAt" | "updatedAt">) => Contract
  updateContract: (id: string, data: Partial<Omit<Contract, "id" | "createdAt" | "updatedAt">>) => void
  signContract: (contractId: string, signedBy: string) => void
  deleteContract: (id: string) => void
  getInvoice: (id: string) => Invoice | undefined
  getInvoicesByCustomerId: (customerId: string) => Invoice[]
  getInvoicesByProjectId: (projectId: string) => Invoice[]
  getInvoicesByQuoteId: (quoteId: string) => Invoice[]
  createInvoice: (data: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt" | "payments" | "paidAmount">) => Invoice
  updateInvoice: (id: string, data: Partial<Omit<Invoice, "id" | "createdAt" | "updatedAt">>) => void
  recordPayment: (invoiceId: string, amount: number, method: string, reference?: string) => void
  deleteInvoice: (id: string) => void
  /** Create multiple invoices from a quote (e.g. deposit %, progress %, final %) with due date offsets. */
  createPaymentScheduleFromQuote: (
    quoteId: string,
    entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[],
  ) => Invoice[] | null
  createSupplier: (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Supplier
  updateSupplier: (id: string, data: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>) => void
  deleteSupplier: (id: string) => void
  createMaterial: (data: Omit<MaterialCatalogItem, "id" | "createdAt" | "updatedAt">) => MaterialCatalogItem
  updateMaterial: (id: string, data: Partial<Omit<MaterialCatalogItem, "id" | "createdAt" | "updatedAt">>) => void
  deleteMaterial: (id: string) => void
  createPredefinedItem: (data: Omit<PredefinedItem, "id" | "createdAt" | "updatedAt">) => PredefinedItem
  updatePredefinedItem: (id: string, data: Partial<Omit<PredefinedItem, "id" | "createdAt" | "updatedAt">>) => void
  deletePredefinedItem: (id: string) => void
  createContractTemplate: (data: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">) => ContractTemplate
  updateContractTemplate: (id: string, data: Partial<Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">>) => void
  deleteContractTemplate: (id: string) => void
}

const BillingStoreContext = createContext<BillingStoreValue | null>(null)

export function BillingStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BillingData>(defaultData)

  useEffect(() => {
    setData(loadBilling())
  }, [])

  const persist = useCallback((next: BillingData) => {
    setData(next)
    saveJson(STORAGE_KEY, next)
  }, [])

  const getQuote = useCallback((id: string) => data.quotes.find((q) => q.id === id), [data.quotes])
  const getQuotesByCustomerId = useCallback((customerId: string) => data.quotes.filter((q) => q.customerId === customerId), [data.quotes])

  const createQuote = useCallback(
    (input: Omit<Quote, "id" | "quoteNumber" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const quoteNumber = nextNumber("Q", data.quotes, "quoteNumber")
      const quote: Quote = recalcQuoteTotals({ ...input, id: createId(), quoteNumber, createdAt: now, updatedAt: now })
      persist({ ...data, quotes: [quote, ...data.quotes] })
      return quote
    },
    [data, persist],
  )

  const updateQuote = useCallback(
    (id: string, patch: Partial<Omit<Quote, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const quotes = data.quotes.map((q) =>
        q.id === id ? recalcQuoteTotals({ ...q, ...patch, updatedAt: now }) : q,
      )
      persist({ ...data, quotes })
    },
    [data, persist],
  )

  const deleteQuote = useCallback(
    (id: string) => {
      persist({ ...data, quotes: data.quotes.filter((q) => q.id !== id) })
    },
    [data, persist],
  )

  const acceptQuote = useCallback(
    (quoteId: string, contractTitle: string, contractContent: string): Contract | null => {
      const quote = data.quotes.find((q) => q.id === quoteId)
      if (!quote || quote.status !== "sent") return null
      const now = new Date().toISOString()
      const contractNumber = nextNumber("C", data.contracts, "contractNumber")
      const contract: Contract = {
        id: createId(),
        contractNumber,
        quoteId: quote.id,
        customerId: quote.customerId,
        projectId: quote.projectId,
        status: "pending_signature",
        title: contractTitle,
        content: contractContent,
        templateId: null,
        signedAt: null,
        signedBy: null,
        createdAt: now,
        updatedAt: now,
      }
      persist({
        ...data,
        quotes: data.quotes.map((q) => (q.id === quoteId ? { ...q, status: "accepted" as QuoteStatus, updatedAt: now } : q)),
        contracts: [contract, ...data.contracts],
      })
      return contract
    },
    [data, persist],
  )

  const getContract = useCallback((id: string) => data.contracts.find((c) => c.id === id), [data.contracts])
  const getContractsByCustomerId = useCallback((customerId: string) => data.contracts.filter((c) => c.customerId === customerId), [data.contracts])
  const getContractByQuoteId = useCallback((quoteId: string) => data.contracts.find((c) => c.quoteId === quoteId), [data.contracts])

  const createContract = useCallback(
    (input: Omit<Contract, "id" | "contractNumber" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const contractNumber = nextNumber("C", data.contracts, "contractNumber")
      const contract: Contract = { ...input, id: createId(), contractNumber, createdAt: now, updatedAt: now }
      persist({ ...data, contracts: [contract, ...data.contracts] })
      return contract
    },
    [data, persist],
  )

  const updateContract = useCallback(
    (id: string, patch: Partial<Omit<Contract, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const contracts = data.contracts.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now } : c))
      persist({ ...data, contracts })
    },
    [data, persist],
  )

  const signContract = useCallback(
    (contractId: string, signedBy: string) => {
      const now = new Date().toISOString()
      updateContract(contractId, { status: "signed", signedAt: now, signedBy })
    },
    [updateContract],
  )

  const deleteContract = useCallback(
    (id: string) => persist({ ...data, contracts: data.contracts.filter((c) => c.id !== id) }),
    [data, persist],
  )

  const getInvoice = useCallback((id: string) => data.invoices.find((i) => i.id === id), [data.invoices])
  const getInvoicesByCustomerId = useCallback((customerId: string) => data.invoices.filter((i) => i.customerId === customerId), [data.invoices])
  const getInvoicesByProjectId = useCallback((projectId: string) => data.invoices.filter((i) => i.projectId === projectId), [data.invoices])
  const getInvoicesByQuoteId = useCallback((quoteId: string) => data.invoices.filter((i) => i.quoteId === quoteId), [data.invoices])

  const createInvoice = useCallback(
    (input: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt" | "payments" | "paidAmount">) => {
      const now = new Date().toISOString()
      const invoiceNumber = nextNumber("INV", data.invoices, "invoiceNumber")
      const invoice: Invoice = recalcInvoiceTotals({
        ...input,
        id: createId(),
        invoiceNumber,
        payments: [],
        paidAmount: 0,
        createdAt: now,
        updatedAt: now,
      })
      persist({ ...data, invoices: [invoice, ...data.invoices] })
      return invoice
    },
    [data, persist],
  )

  const updateInvoice = useCallback(
    (id: string, patch: Partial<Omit<Invoice, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const invoices = data.invoices.map((i) => (i.id === id ? recalcInvoiceTotals({ ...i, ...patch, updatedAt: now }) : i))
      persist({ ...data, invoices })
    },
    [data, persist],
  )

  const recordPayment = useCallback(
    (invoiceId: string, amount: number, method: string, reference?: string) => {
      const inv = data.invoices.find((i) => i.id === invoiceId)
      if (!inv) return
      const now = new Date().toISOString()
      const payment: InvoicePayment = { id: createId(), amount, paidAt: now, method, reference: reference ?? null }
      const payments = [...inv.payments, payment]
      const paidAmount = payments.reduce((s, p) => s + p.amount, 0)
      const status: InvoiceStatus = paidAmount >= inv.total ? "paid" : "partial"
      const invoices = data.invoices.map((i) =>
        i.id === invoiceId ? { ...i, payments, paidAmount, status, updatedAt: now } : i,
      )
      persist({ ...data, invoices })
    },
    [data, persist],
  )

  const deleteInvoice = useCallback(
    (id: string) => persist({ ...data, invoices: data.invoices.filter((i) => i.id !== id) }),
    [data, persist],
  )

  const createPaymentScheduleFromQuote = useCallback(
    (
      quoteId: string,
      entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[],
    ): Invoice[] | null => {
      const quote = data.quotes.find((q) => q.id === quoteId)
      if (!quote || entries.length === 0) return null
      const totalPct = entries.reduce((s, e) => s + e.percent, 0)
      if (Math.abs(totalPct - 100) > 0.01) return null
      const now = new Date().toISOString()
      const baseDate = new Date()
      let nextInvNum = data.invoices
        .map((i) => (i.invoiceNumber ?? "").replace(/^\D+/, ""))
        .filter(Boolean)
        .map((n) => parseInt(n, 10))
        .filter((n) => !Number.isNaN(n))
      const nextNum = nextInvNum.length === 0 ? 1 : Math.max(...nextInvNum) + 1
      const created: Invoice[] = []
      let invIndex = 0
      for (const entry of entries) {
        const amount = Math.round((quote.total * entry.percent) / 100 * 100) / 100
        const dueDate = new Date(baseDate)
        dueDate.setDate(dueDate.getDate() + entry.dueOffsetDays)
        const label = entry.label ?? `${entry.type} (${entry.percent}%)`
        const lineItem: InvoiceLineItem = {
          id: createId(),
          description: label,
          quantity: 1,
          unit: "item",
          unitPrice: amount,
          amount,
          sortOrder: 0,
        }
        const invoiceNumber = `INV-${String(nextNum + invIndex).padStart(3, "0")}`
        const invoice: Invoice = recalcInvoiceTotals({
          id: createId(),
          invoiceNumber,
          customerId: quote.customerId,
          projectId: quote.projectId,
          quoteId: quote.id,
          type: entry.type,
          status: "draft",
          lineItems: [lineItem],
          subtotal: amount,
          taxRatePercent: 0,
          taxAmount: 0,
          total: amount,
          dueDate: dueDate.toISOString().slice(0, 10),
          paidAmount: 0,
          payments: [],
          paymentTermsDays: 30,
          notes: `From quote ${quote.quoteNumber}; ${entry.percent}% of total.`,
          createdAt: now,
          updatedAt: now,
        })
        created.push(invoice)
        invIndex += 1
      }
      persist({ ...data, invoices: [...created, ...data.invoices] })
      return created
    },
    [data, persist],
  )

  const createSupplier = useCallback(
    (input: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const supplier: Supplier = { ...input, id: createId(), createdAt: now, updatedAt: now }
      persist({ ...data, suppliers: [...data.suppliers, supplier] })
      return supplier
    },
    [data, persist],
  )
  const updateSupplier = useCallback(
    (id: string, patch: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const suppliers = data.suppliers.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now } : s))
      persist({ ...data, suppliers })
    },
    [data, persist],
  )
  const deleteSupplier = useCallback((id: string) => persist({ ...data, suppliers: data.suppliers.filter((s) => s.id !== id) }), [data, persist])

  const createMaterial = useCallback(
    (input: Omit<MaterialCatalogItem, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const material: MaterialCatalogItem = { ...input, id: createId(), createdAt: now, updatedAt: now }
      persist({ ...data, materials: [...data.materials, material] })
      return material
    },
    [data, persist],
  )
  const updateMaterial = useCallback(
    (id: string, patch: Partial<Omit<MaterialCatalogItem, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const materials = data.materials.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: now } : m))
      persist({ ...data, materials })
    },
    [data, persist],
  )
  const deleteMaterial = useCallback((id: string) => persist({ ...data, materials: data.materials.filter((m) => m.id !== id) }), [data, persist])

  const createPredefinedItem = useCallback(
    (input: Omit<PredefinedItem, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const item: PredefinedItem = { ...input, id: createId(), createdAt: now, updatedAt: now }
      persist({ ...data, predefinedItems: [...data.predefinedItems, item] })
      return item
    },
    [data, persist],
  )
  const updatePredefinedItem = useCallback(
    (id: string, patch: Partial<Omit<PredefinedItem, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const predefinedItems = data.predefinedItems.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now } : p))
      persist({ ...data, predefinedItems })
    },
    [data, persist],
  )
  const deletePredefinedItem = useCallback((id: string) => persist({ ...data, predefinedItems: data.predefinedItems.filter((p) => p.id !== id) }), [data, persist])

  const createContractTemplate = useCallback(
    (input: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const template: ContractTemplate = { ...input, id: createId(), createdAt: now, updatedAt: now }
      persist({ ...data, contractTemplates: [...data.contractTemplates, template] })
      return template
    },
    [data, persist],
  )
  const updateContractTemplate = useCallback(
    (id: string, patch: Partial<Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">>) => {
      const now = new Date().toISOString()
      const contractTemplates = data.contractTemplates.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now } : t))
      persist({ ...data, contractTemplates })
    },
    [data, persist],
  )
  const deleteContractTemplate = useCallback((id: string) => persist({ ...data, contractTemplates: data.contractTemplates.filter((t) => t.id !== id) }), [data, persist])

  const value: BillingStoreValue = {
    quotes: data.quotes,
    contracts: data.contracts,
    invoices: data.invoices,
    suppliers: data.suppliers,
    materials: data.materials,
    predefinedItems: data.predefinedItems,
    contractTemplates: data.contractTemplates,
    getQuote,
    getQuotesByCustomerId,
    createQuote,
    updateQuote,
    deleteQuote,
    acceptQuote,
    getContract,
    getContractsByCustomerId,
    getContractByQuoteId,
    createContract,
    updateContract,
    signContract,
    deleteContract,
    getInvoice,
    getInvoicesByCustomerId,
    getInvoicesByProjectId,
    getInvoicesByQuoteId,
    createInvoice,
    updateInvoice,
    recordPayment,
    deleteInvoice,
    createPaymentScheduleFromQuote,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    createPredefinedItem,
    updatePredefinedItem,
    deletePredefinedItem,
    createContractTemplate,
    updateContractTemplate,
    deleteContractTemplate,
  }

  return <BillingStoreContext.Provider value={value}>{children}</BillingStoreContext.Provider>
}

export function useBillingStore() {
  const ctx = useContext(BillingStoreContext)
  if (!ctx) throw new Error("useBillingStore must be used within BillingStoreProvider")
  return ctx
}
