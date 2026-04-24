export const DOCUMENT_TYPES = [
  "contract",
  "quote",
  "invoice",
  "photo",
  "design",
  "receipt",
  "permit",
  "other",
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface DocumentRecord {
  id: string
  customerId: string | null
  projectId: string | null
  type: DocumentType
  name: string
  fileUrl: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type CreateDocumentData = Omit<DocumentRecord, "id" | "createdAt" | "updatedAt">

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  contract: "Contract",
  quote: "Quote",
  invoice: "Invoice",
  photo: "Photo",
  design: "Design",
  receipt: "Receipt",
  permit: "Permit",
  other: "Other",
}
