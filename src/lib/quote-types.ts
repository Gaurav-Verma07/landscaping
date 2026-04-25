export const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected"] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export interface QuoteLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  /** Optional discount applied to this line (0–100). */
  discountPercent?: number
  amount: number
  sortOrder: number
}

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  projectId: string | null
  status: QuoteStatus
  lineItems: QuoteLineItem[]
  subtotal: number
  taxRatePercent: number
  taxAmount: number
  total: number
  validUntil: string | null
  notes: string
  templateId: string | null
  createdAt: string
  updatedAt: string
}

export const CONTRACT_STATUSES = ["draft", "pending_signature", "signed"] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export interface Contract {
  id: string
  contractNumber: string
  quoteId: string
  customerId: string
  projectId: string | null
  status: ContractStatus
  title: string
  content: string
  templateId: string | null
  signedAt: string | null
  signedBy: string | null
  createdAt: string
  updatedAt: string
}

export const INVOICE_TYPES = ["deposit", "progress", "final"] as const
export type InvoiceType = (typeof INVOICE_TYPES)[number]

export const INVOICE_STATUSES = ["draft", "sent", "partial", "paid", "overdue"] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  /** Optional discount applied to this line (0–100). */
  discountPercent?: number
  amount: number
  sortOrder: number
}

export interface InvoicePayment {
  id: string
  amount: number
  paidAt: string
  method: string
  reference: string | null
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  projectId: string | null
  quoteId: string | null
  type: InvoiceType
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRatePercent: number
  taxAmount: number
  total: number
  dueDate: string
  paidAmount: number
  payments: InvoicePayment[]
  paymentTermsDays: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  contactPhone: string
  contactEmail: string
  address: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface MaterialCatalogItem {
  id: string
  name: string
  unit: string
  defaultPrice: number
  supplierId: string | null
  sku: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PredefinedItem {
  id: string
  name: string
  description: string
  unit: string
  defaultPrice: number
  createdAt: string
  updatedAt: string
}

export interface ContractTemplate {
  id: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  pending_signature: "Pending signature",
  signed: "Signed",
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  deposit: "Deposit",
  progress: "Progress",
  final: "Final",
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
}
