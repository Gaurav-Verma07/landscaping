import type {
  Quote,
  Contract,
  Invoice,
  Supplier,
  MaterialCatalogItem,
  PredefinedItem,
  ContractTemplate,
} from "@/lib/quote-types"

const now = new Date().toISOString()
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

export const SUPPLIER_SEED: Supplier[] = [
  {
    id: "sup-1",
    name: "GreenScape Supplies Ltd",
    contactPhone: "+44 20 7946 0958",
    contactEmail: "orders@greenscape.co.uk",
    address: "10 Industrial Way, London",
    notes: "Primary mulch and soil supplier",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sup-2",
    name: "Turf & Stone Co",
    contactPhone: "+44 161 234 5678",
    contactEmail: "sales@turfstone.co.uk",
    address: "45 Deansgate, Manchester",
    notes: "",
    createdAt: now,
    updatedAt: now,
  },
]

export const MATERIAL_CATALOG_SEED: MaterialCatalogItem[] = [
  { id: "mat-1", name: "Topsoil", unit: "tonne", defaultPrice: 45, supplierId: "sup-1", sku: "TS-001", notes: "", createdAt: now, updatedAt: now },
  { id: "mat-2", name: "Mulch", unit: "bag", defaultPrice: 8.5, supplierId: "sup-1", sku: "ML-001", notes: "", createdAt: now, updatedAt: now },
  { id: "mat-3", name: "Turf", unit: "m²", defaultPrice: 6, supplierId: "sup-2", sku: null, notes: "", createdAt: now, updatedAt: now },
]

export const PREDEFINED_ITEMS_SEED: PredefinedItem[] = [
  { id: "item-1", name: "Labour - hourly", description: "Standard labour rate", unit: "hour", defaultPrice: 45, createdAt: now, updatedAt: now },
  { id: "item-2", name: "Site clearance", description: "Per m²", unit: "m²", defaultPrice: 12, createdAt: now, updatedAt: now },
  { id: "item-3", name: "Design consultation", description: "One-off", unit: "item", defaultPrice: 150, createdAt: now, updatedAt: now },
]

export const CONTRACT_TEMPLATES_SEED: ContractTemplate[] = [
  {
    id: "tpl-1",
    name: "Standard landscape contract",
    content: "This agreement is made between {{company_name}} and {{customer_name}}.\n\nScope: {{scope_summary}}\nTotal: {{total}}\n\nPayment terms: {{payment_terms}}\n\nBy signing below, both parties agree to the terms.",
    createdAt: now,
    updatedAt: now,
  },
]

export const QUOTE_SEED: Quote[] = [
  {
    id: "quote-1",
    quoteNumber: "Q-001",
    customerId: "seed-1",
    projectId: null,
    status: "sent",
    lineItems: [
      { id: "li-1", description: "Lawn preparation and turf", quantity: 50, unit: "m²", unitPrice: 25, amount: 1250, sortOrder: 0 },
      { id: "li-2", description: "Mulch and edging", quantity: 20, unit: "bag", unitPrice: 10, amount: 200, sortOrder: 1 },
    ],
    subtotal: 1450,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 1450,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: "Valid 30 days.",
    templateId: null,
    createdAt: lastWeek,
    updatedAt: now,
  },
  {
    id: "quote-2",
    quoteNumber: "Q-002",
    customerId: "seed-2",
    projectId: null,
    status: "draft",
    lineItems: [
      { id: "li-3", description: "Monthly maintenance", quantity: 12, unit: "month", unitPrice: 180, amount: 2160, sortOrder: 0 },
    ],
    subtotal: 2160,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 2160,
    validUntil: null,
    notes: "",
    templateId: null,
    createdAt: now,
    updatedAt: now,
  },
]

export const CONTRACT_SEED: Contract[] = [
  {
    id: "contract-1",
    contractNumber: "C-001",
    quoteId: "quote-1",
    customerId: "seed-1",
    projectId: "proj-seed-1",
    status: "signed",
    title: "Landscape works - Kensington",
    content: "This agreement is made between Landscaping and James Wilson.\n\nScope: Lawn and garden installation.\nTotal: £1,450\n\nPayment terms: 50% deposit, 50% on completion.\n\nSigned.",
    templateId: "tpl-1",
    signedAt: lastWeek,
    signedBy: "James Wilson",
    createdAt: lastWeek,
    updatedAt: lastWeek,
  },
]

export const INVOICE_SEED: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-001",
    customerId: "seed-1",
    projectId: "proj-seed-1",
    quoteId: "quote-1",
    type: "deposit",
    status: "paid",
    lineItems: [
      { id: "invli-1", description: "Deposit 50%", quantity: 1, unit: "item", unitPrice: 725, amount: 725, sortOrder: 0 },
    ],
    subtotal: 725,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 725,
    dueDate: lastWeek.slice(0, 10),
    paidAmount: 725,
    payments: [{ id: "pay-1", amount: 725, paidAt: lastWeek, method: "Bank transfer", reference: "REF-001" }],
    paymentTermsDays: 14,
    notes: "",
    createdAt: lastWeek,
    updatedAt: now,
  },
]
