"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type {
  Customer,
  CustomerAttachment,
  CustomerNote,
  CustomerTimelineEvent,
} from "@/lib/customer-types"
import { CUSTOMER_SEED_DATA } from "@/lib/customer-seed"

const STORAGE_KEY = "landscaping-v2-customers"

function loadFromStorage(): Customer[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "") return [...CUSTOMER_SEED_DATA]
    const parsed = JSON.parse(raw) as Customer[]
    return Array.isArray(parsed) ? parsed : [...CUSTOMER_SEED_DATA]
  } catch {
    return [...CUSTOMER_SEED_DATA]
  }
}

function saveToStorage(customers: Customer[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
  } catch {}
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type CreateCustomerData = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt" | "notes" | "timeline" | "attachments"
>

type CustomerStoreValue = {
  customers: Customer[]
  getCustomer: (id: string) => Customer | undefined
  createCustomer: (data: CreateCustomerData) => Customer
  createCustomerWithAttachments: (
    data: CreateCustomerData,
    files: File[],
  ) => Promise<Customer>
  updateCustomer: (
    id: string,
    data: Partial<
      Omit<Customer, "id" | "notes" | "timeline" | "attachments">
    >,
  ) => void
  deleteCustomer: (id: string) => void
  mergeCustomers: (primaryId: string, secondaryId: string) => void
  searchCustomers: (query: string) => Customer[]
  addNote: (customerId: string, content: string, createdBy?: string) => void
  addTimelineEvent: (
    customerId: string,
    event: Omit<CustomerTimelineEvent, "id">,
  ) => void
  addAttachment: (customerId: string, file: File) => void
  removeAttachment: (customerId: string, attachmentId: string) => void
}

const CustomerStoreContext = createContext<CustomerStoreValue | null>(null)

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function CustomerStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [customers, setCustomers] = useState<Customer[]>(() => [])

  useEffect(() => {
    setCustomers(loadFromStorage())
  }, [])

  const saveCustomers = useCallback((list: Customer[]) => {
    setCustomers(list)
    saveToStorage(list)
  }, [])

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  )

  const createCustomer = useCallback(
    (data: CreateCustomerData) => {
      const now = new Date().toISOString()
      const customer: Customer = {
        ...data,
        id: createId(),
        notes: [],
        timeline: [],
        attachments: [],
        createdAt: now,
        updatedAt: now,
      }
      saveCustomers([...customers, customer])
      return customer
    },
    [customers, saveCustomers],
  )

  const createCustomerWithAttachments = useCallback(
    async (
      data: CreateCustomerData,
      files: File[],
    ): Promise<Customer> => {
      const now = new Date().toISOString()
      const attachments: CustomerAttachment[] = await Promise.all(
        files.map(async (file) => ({
          id: createId(),
          name: file.name,
          size: file.size,
          uploadedAt: now,
          url: await readFileAsDataUrl(file),
        })),
      )
      const customer: Customer = {
        ...data,
        id: createId(),
        notes: [],
        timeline: [],
        attachments,
        createdAt: now,
        updatedAt: now,
      }
      saveCustomers([...customers, customer])
      return customer
    },
    [customers, saveCustomers],
  )

  const updateCustomer = useCallback(
    (
      id: string,
      data: Partial<
        Omit<Customer, "id" | "notes" | "timeline" | "attachments">
      >,
    ) => {
      const next = customers.map((c) =>
        c.id === id
          ? { ...c, ...data, updatedAt: new Date().toISOString() }
          : c,
      )
      saveCustomers(next)
    },
    [customers, saveCustomers],
  )

  const deleteCustomer = useCallback(
    (id: string) => {
      saveCustomers(customers.filter((c) => c.id !== id))
    },
    [customers, saveCustomers],
  )

  const mergeCustomers = useCallback(
    (primaryId: string, secondaryId: string) => {
      const primary = customers.find((c) => c.id === primaryId)
      const secondary = customers.find((c) => c.id === secondaryId)
      if (!primary || !secondary || primaryId === secondaryId) return

      const merged: Customer = {
        ...primary,
        name: primary.name || secondary.name,
        companyName: primary.companyName || secondary.companyName,
        phones: [...new Set([...primary.phones, ...secondary.phones])],
        emails: [...new Set([...primary.emails, ...secondary.emails])],
        addresses: [...new Set([...primary.addresses, ...secondary.addresses])],
        tags: [...new Set([...primary.tags, ...secondary.tags])],
        leadSource: primary.leadSource || secondary.leadSource,
        partnerReferralName:
          primary.partnerReferralName || secondary.partnerReferralName,
        status: primary.status,
        reviewStatus: primary.reviewStatus || secondary.reviewStatus,
        seasonalServiceEligibility:
          primary.seasonalServiceEligibility ||
          secondary.seasonalServiceEligibility,
        notes: [...primary.notes, ...secondary.notes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
        timeline: [...primary.timeline, ...secondary.timeline].sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
        attachments: [...primary.attachments, ...secondary.attachments],
        updatedAt: new Date().toISOString(),
      }

      saveCustomers([
        ...customers.filter(
          (c) => c.id !== primaryId && c.id !== secondaryId,
        ),
        merged,
      ])
    },
    [customers, saveCustomers],
  )

  const searchCustomers = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return customers
      return customers.filter((c) => {
        const name = c.name?.toLowerCase() ?? ""
        const company = c.companyName?.toLowerCase() ?? ""
        const phones = c.phones.join(" ").toLowerCase()
        const emails = c.emails.join(" ").toLowerCase()
        const addresses = c.addresses.join(" ").toLowerCase()
        const tags = c.tags.join(" ").toLowerCase()
        const notes = c.notes.map((n) => n.content).join(" ").toLowerCase()
        const combined = [name, company, phones, emails, addresses, tags, notes].join(" ")
        return combined.includes(q)
      })
    },
    [customers],
  )

  const addNote = useCallback(
    (customerId: string, content: string, createdBy?: string) => {
      const note: CustomerNote = {
        id: createId(),
        content,
        createdAt: new Date().toISOString(),
        createdBy,
      }
      const next = customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              notes: [note, ...c.notes],
              updatedAt: new Date().toISOString(),
            }
          : c,
      )
      saveCustomers(next)
    },
    [customers, saveCustomers],
  )

  const addTimelineEvent = useCallback(
    (customerId: string, event: Omit<CustomerTimelineEvent, "id">) => {
      const full: CustomerTimelineEvent = { ...event, id: createId() }
      const next = customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              timeline: [full, ...c.timeline].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              ),
              updatedAt: new Date().toISOString(),
            }
          : c,
      )
      saveCustomers(next)
    },
    [customers, saveCustomers],
  )

  const addAttachment = useCallback(
    (customerId: string, file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        const url = reader.result as string
        const att: CustomerAttachment = {
          id: createId(),
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          url,
        }
        const next = customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                attachments: [...c.attachments, att],
                updatedAt: new Date().toISOString(),
              }
            : c,
        )
        saveCustomers(next)
      }
      reader.readAsDataURL(file)
    },
    [customers, saveCustomers],
  )

  const removeAttachment = useCallback(
    (customerId: string, attachmentId: string) => {
      const next = customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              attachments: c.attachments.filter((a) => a.id !== attachmentId),
              updatedAt: new Date().toISOString(),
            }
          : c,
      )
      saveCustomers(next)
    },
    [customers, saveCustomers],
  )

  const value = useMemo<CustomerStoreValue>(
    () => ({
      customers,
      getCustomer,
      createCustomer,
      createCustomerWithAttachments,
      updateCustomer,
      deleteCustomer,
      mergeCustomers,
      searchCustomers,
      addNote,
      addTimelineEvent,
      addAttachment,
      removeAttachment,
    }),
    [
      customers,
      getCustomer,
      createCustomer,
      createCustomerWithAttachments,
      updateCustomer,
      deleteCustomer,
      mergeCustomers,
      searchCustomers,
      addNote,
      addTimelineEvent,
      addAttachment,
      removeAttachment,
    ],
  )

  return (
    <CustomerStoreContext.Provider value={value}>
      {children}
    </CustomerStoreContext.Provider>
  )
}

export function useCustomerStore() {
  const ctx = useContext(CustomerStoreContext)
  if (!ctx)
    throw new Error(
      "useCustomerStore must be used within CustomerStoreProvider",
    )
  return ctx
}
