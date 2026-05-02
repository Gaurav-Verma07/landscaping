'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Quote,
  Contract,
  Invoice,
  InvoicePayment,
  InvoiceStatus,
  InvoiceType,
  Supplier,
  MaterialCatalogItem,
  PredefinedItem,
  ContractTemplate,
} from '@/types/quote-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function nextNumber(prefix: string, existing: string[]): string {
  const nums = existing
    .map((n) => n.replace(/^\D+/, ''))
    .filter(Boolean)
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n))
  const next = nums.length === 0 ? 1 : Math.max(...nums) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function recalcTotals(lineItems: Quote['lineItems'], taxRatePercent: number) {
  const items = lineItems.map((l) => ({
    ...l,
    amount: Math.round(l.quantity * l.unitPrice * (1 - (l.discountPercent ?? 0) / 100) * 100) / 100,
  }))
  const subtotal = items.reduce((s, l) => s + l.amount, 0)
  const taxAmount = (subtotal * taxRatePercent) / 100
  return { items, subtotal, taxAmount, total: subtotal + taxAmount }
}

// ============================================
// QUOTES
// ============================================

export async function getQuotes(): Promise<Quote[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('quotes')
    .select('*, quote_line_items(*)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []).map(mapQuote)
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('quotes')
    .select('*, quote_line_items(*)')
    .eq('id', id)
    .single()
  return data ? mapQuote(data) : null
}

export async function getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('quotes')
    .select('*, quote_line_items(*)')
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
  return (data ?? []).map(mapQuote)
}

export async function createQuote(
  input: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('profile_id', user.id)

  const quoteNumber = nextNumber('Q', (existing ?? []).map((q) => q.quote_number))
  const { items, subtotal, taxAmount, total } = recalcTotals(input.lineItems, input.taxRatePercent)

  const { data: created, error } = await supabase
    .from('quotes')
    .insert({
      profile_id: user.id,
      customer_id: input.customerId,
      project_id: input.projectId,
      quote_number: quoteNumber,
      status: input.status,
      subtotal,
      tax_rate_percent: input.taxRatePercent,
      tax_amount: taxAmount,
      total,
      valid_until: input.validUntil,
      notes: input.notes,
      template_id: input.templateId,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (items.length) {
    await supabase.from('quote_line_items').insert(
      items.map((l) => ({
        quote_id: created.id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unitPrice,
        discount_percent: l.discountPercent ?? 0,
        amount: l.amount,
        sort_order: l.sortOrder,
      }))
    )
  }

  revalidatePath('/dashboard/quotes')
  return { data: created }
}

export async function updateQuote(
  id: string,
  patch: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const now = new Date().toISOString()

  if (patch.lineItems) {
    const { items, subtotal, taxAmount, total } = recalcTotals(
      patch.lineItems,
      patch.taxRatePercent ?? 0
    )
    await supabase.from('quote_line_items').delete().eq('quote_id', id)
    await supabase.from('quote_line_items').insert(
      items.map((l) => ({
        quote_id: id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unitPrice,
        discount_percent: l.discountPercent ?? 0,
        amount: l.amount,
        sort_order: l.sortOrder,
      }))
    )
    patch = { ...patch, subtotal, taxAmount, total }
  }

  const { error } = await supabase
    .from('quotes')
    .update({
      customer_id: patch.customerId,
      project_id: patch.projectId,
      status: patch.status,
      subtotal: patch.subtotal,
      tax_rate_percent: patch.taxRatePercent,
      tax_amount: patch.taxAmount,
      total: patch.total,
      valid_until: patch.validUntil,
      notes: patch.notes,
      updated_at: now,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
  return { success: true }
}

export async function deleteQuote(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
  return { success: true }
}

export async function acceptQuote(
  quoteId: string,
  contractTitle: string,
  contractContent: string
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (!quote || quote.status !== 'sent') return { error: 'Quote not found or not in sent state' }

  const { data: existing } = await supabase
    .from('contracts')
    .select('contract_number')
    .eq('profile_id', user.id)

  const contractNumber = nextNumber('C', (existing ?? []).map((c) => c.contract_number))
  const now = new Date().toISOString()

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      profile_id: user.id,
      quote_id: quoteId,
      customer_id: quote.customer_id,
      project_id: quote.project_id,
      contract_number: contractNumber,
      title: contractTitle,
      content: contractContent,
      status: 'pending_signature',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase
    .from('quotes')
    .update({ status: 'accepted', updated_at: now })
    .eq('id', quoteId)

  revalidatePath('/dashboard/quotes')
  revalidatePath('/dashboard/contracts')
  return { data: contract }
}

// ============================================
// CONTRACTS
// ============================================

export async function getContracts(): Promise<Contract[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('contracts')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapContract)
}

export async function getContract(id: string): Promise<Contract | null> {
  const { supabase } = await getUser()
  const { data } = await supabase.from('contracts').select('*').eq('id', id).single()
  return data ? mapContract(data) : null
}

export async function getContractsByCustomerId(customerId: string): Promise<Contract[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('contracts')
    .select('*')
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
  return (data ?? []).map(mapContract)
}

export async function getContractByQuoteId(quoteId: string): Promise<Contract | null> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('contracts')
    .select('*')
    .eq('quote_id', quoteId)
    .single()
  return data ? mapContract(data) : null
}

export async function createContract(
  input: Omit<Contract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('contracts')
    .select('contract_number')
    .eq('profile_id', user.id)

  const contractNumber = nextNumber('C', (existing ?? []).map((c) => c.contract_number))

  const { data: created, error } = await supabase
    .from('contracts')
    .insert({
      profile_id: user.id,
      customer_id: input.customerId,
      project_id: input.projectId,
      quote_id: input.quoteId,
      template_id: input.templateId,
      contract_number: contractNumber,
      title: input.title,
      content: input.content,
      status: input.status,
      signed_at: input.signedAt,
      signed_by: input.signedBy,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contracts')
  return { data: created }
}

export async function updateContract(
  id: string,
  patch: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('contracts')
    .update({
      title: patch.title,
      content: patch.content,
      status: patch.status,
      signed_at: patch.signedAt,
      signed_by: patch.signedBy,
      template_id: patch.templateId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contracts')
  return { success: true }
}

export async function signContract(contractId: string, signedBy: string) {
  return updateContract(contractId, {
    status: 'signed',
    signedAt: new Date().toISOString(),
    signedBy,
  })
}

export async function deleteContract(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contracts')
  return { success: true }
}

// ============================================
// INVOICES
// ============================================

export async function getInvoices(): Promise<Invoice[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), invoice_payments(*)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapInvoice)
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), invoice_payments(*)')
    .eq('id', id)
    .single()
  return data ? mapInvoice(data) : null
}

export async function getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), invoice_payments(*)')
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
  return (data ?? []).map(mapInvoice)
}

export async function getInvoicesByProjectId(projectId: string): Promise<Invoice[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), invoice_payments(*)')
    .eq('profile_id', user.id)
    .eq('project_id', projectId)
  return (data ?? []).map(mapInvoice)
}

export async function getInvoicesByQuoteId(quoteId: string): Promise<Invoice[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), invoice_payments(*)')
    .eq('profile_id', user.id)
    .eq('quote_id', quoteId)
  return (data ?? []).map(mapInvoice)
}

export async function createInvoice(
  input: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments' | 'paidAmount'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('profile_id', user.id)

  const invoiceNumber = nextNumber('INV', (existing ?? []).map((i) => i.invoice_number))
  const { items, subtotal, taxAmount, total } = recalcTotals(input.lineItems, input.taxRatePercent)

  const { data: created, error } = await supabase
    .from('invoices')
    .insert({
      profile_id: user.id,
      customer_id: input.customerId,
      project_id: input.projectId,
      quote_id: input.quoteId,
      invoice_number: invoiceNumber,
      type: input.type,
      status: input.status,
      subtotal,
      tax_rate_percent: input.taxRatePercent,
      tax_amount: taxAmount,
      total,
      paid_amount: 0,
      due_date: input.dueDate,
      payment_terms_days: input.paymentTermsDays,
      notes: input.notes,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (items.length) {
    await supabase.from('invoice_line_items').insert(
      items.map((l) => ({
        invoice_id: created.id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unitPrice,
        discount_percent: l.discountPercent ?? 0,
        amount: l.amount,
        sort_order: l.sortOrder,
      }))
    )
  }

  revalidatePath('/dashboard/invoices')
  return { data: created }
}

export async function updateInvoice(
  id: string,
  patch: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const now = new Date().toISOString()

  if (patch.lineItems) {
    const { items, subtotal, taxAmount, total } = recalcTotals(
      patch.lineItems,
      patch.taxRatePercent ?? 0
    )
    await supabase.from('invoice_line_items').delete().eq('invoice_id', id)
    await supabase.from('invoice_line_items').insert(
      items.map((l) => ({
        invoice_id: id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unit_price: l.unitPrice,
        discount_percent: l.discountPercent ?? 0,
        amount: l.amount,
        sort_order: l.sortOrder,
      }))
    )
    patch = { ...patch, subtotal, taxAmount, total }
  }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: patch.status,
      subtotal: patch.subtotal,
      tax_rate_percent: patch.taxRatePercent,
      tax_amount: patch.taxAmount,
      total: patch.total,
      due_date: patch.dueDate,
      payment_terms_days: patch.paymentTermsDays,
      notes: patch.notes,
      updated_at: now,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
  reference?: string
) {
  const { supabase } = await getUser()

  const { error: payError } = await supabase.from('invoice_payments').insert({
    invoice_id: invoiceId,
    amount,
    method,
    reference: reference ?? null,
  })
  if (payError) return { error: payError.message }

  // Recalc paid_amount + status
  const { data: payments } = await supabase
    .from('invoice_payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('total')
    .eq('id', invoiceId)
    .single()

  const paidAmount = (payments ?? []).reduce((s, p) => s + p.amount, 0)
  const status: InvoiceStatus = paidAmount >= (invoice?.total ?? 0) ? 'paid' : 'partial'

  await supabase
    .from('invoices')
    .update({ paid_amount: paidAmount, status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function createPaymentScheduleFromQuote(
  quoteId: string,
  entries: { percent: number; type: InvoiceType; dueOffsetDays: number; label?: string }[]
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const totalPct = entries.reduce((s, e) => s + e.percent, 0)
  if (Math.abs(totalPct - 100) > 0.01) return { error: 'Percentages must sum to 100' }

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()
  if (!quote) return { error: 'Quote not found' }

  const { data: existing } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('profile_id', user.id)

  const existingNums = (existing ?? [])
    .map((i) => i.invoice_number.replace(/^\D+/, ''))
    .filter(Boolean)
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n))

  let nextNum = existingNums.length === 0 ? 1 : Math.max(...existingNums) + 1
  const now = new Date().toISOString()
  const created: Invoice[] = []

  for (const entry of entries) {
    const amount = Math.round((quote.total * entry.percent) / 100 * 100) / 100
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + entry.dueOffsetDays)
    const label = entry.label ?? `${entry.type} (${entry.percent}%)`
    const invoiceNumber = `INV-${String(nextNum).padStart(3, '0')}`

    const { data: inv, error } = await supabase
      .from('invoices')
      .insert({
        profile_id: user.id,
        customer_id: quote.customer_id,
        project_id: quote.project_id,
        quote_id: quote.id,
        invoice_number: invoiceNumber,
        type: entry.type,
        status: 'draft',
        subtotal: amount,
        tax_rate_percent: 0,
        tax_amount: 0,
        total: amount,
        paid_amount: 0,
        due_date: dueDate.toISOString().slice(0, 10),
        payment_terms_days: 30,
        notes: `From quote ${quote.quote_number}; ${entry.percent}% of total.`,
      })
      .select()
      .single()

    if (error) continue

    await supabase.from('invoice_line_items').insert({
      invoice_id: inv.id,
      description: label,
      quantity: 1,
      unit: 'item',
      unit_price: amount,
      discount_percent: 0,
      amount,
      sort_order: 0,
    })

    created.push(mapInvoice({ ...inv, invoice_line_items: [], invoice_payments: [] }))
    nextNum++
  }

  revalidatePath('/dashboard/invoices')
  return { data: created }
}

// ============================================
// SUPPLIERS
// ============================================

export async function getSuppliers(): Promise<Supplier[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapSupplier)
}

export async function createSupplier(input: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      profile_id: user.id,
      name: input.name,
      contact_phone: input.contactPhone,
      contact_email: input.contactEmail,
      address: input.address,
      notes: input.notes,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/suppliers')
  return { data }
}

export async function updateSupplier(
  id: string,
  patch: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('suppliers')
    .update({
      name: patch.name,
      contact_phone: patch.contactPhone,
      contact_email: patch.contactEmail,
      address: patch.address,
      notes: patch.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/suppliers')
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/suppliers')
  return { success: true }
}

// ============================================
// MATERIALS
// ============================================

export async function getMaterials(): Promise<MaterialCatalogItem[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('material_catalog')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapMaterial)
}

export async function createMaterial(
  input: Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('material_catalog')
    .insert({
      profile_id: user.id,
      supplier_id: input.supplierId,
      name: input.name,
      unit: input.unit,
      default_price: input.defaultPrice,
      sku: input.sku,
      notes: input.notes,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/materials')
  return { data }
}

export async function updateMaterial(
  id: string,
  patch: Partial<Omit<MaterialCatalogItem, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('material_catalog')
    .update({
      supplier_id: patch.supplierId,
      name: patch.name,
      unit: patch.unit,
      default_price: patch.defaultPrice,
      sku: patch.sku,
      notes: patch.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/materials')
  return { success: true }
}

export async function deleteMaterial(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('material_catalog').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/materials')
  return { success: true }
}

// ============================================
// PREDEFINED ITEMS
// ============================================

export async function getPredefinedItems(): Promise<PredefinedItem[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('predefined_items')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapPredefinedItem)
}

export async function createPredefinedItem(
  input: Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('predefined_items')
    .insert({
      profile_id: user.id,
      name: input.name,
      description: input.description,
      unit: input.unit,
      default_price: input.defaultPrice,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/management/settings')
  return { data }
}

export async function updatePredefinedItem(
  id: string,
  patch: Partial<Omit<PredefinedItem, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('predefined_items')
    .update({
      name: patch.name,
      description: patch.description,
      unit: patch.unit,
      default_price: patch.defaultPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deletePredefinedItem(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('predefined_items').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================================
// CONTRACT TEMPLATES
// ============================================

export async function getContractTemplates(): Promise<ContractTemplate[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapContractTemplate)
}

export async function createContractTemplate(
  input: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('contract_templates')
    .insert({
      profile_id: user.id,
      name: input.name,
      content: input.content,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contracts')
  return { data }
}

export async function updateContractTemplate(
  id: string,
  patch: Partial<Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('contract_templates')
    .update({
      name: patch.name,
      content: patch.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteContractTemplate(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('contract_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================================
// MAPPERS
// ============================================

function mapQuote(row: Record<string, unknown>): Quote {
  const lineItems = (row.quote_line_items as Record<string, unknown>[] ?? [])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((l) => ({
      id: l.id as string,
      description: (l.description as string) ?? '',
      quantity: l.quantity as number,
      unit: (l.unit as string) ?? '',
      unitPrice: l.unit_price as number,
      discountPercent: (l.discount_percent as number) ?? 0,
      amount: l.amount as number,
      sortOrder: l.sort_order as number,
    }))

  return {
    id: row.id as string,
    quoteNumber: row.quote_number as string,
    customerId: row.customer_id as string,
    projectId: (row.project_id as string) ?? null,
    status: row.status as Quote['status'],
    lineItems,
    subtotal: row.subtotal as number,
    taxRatePercent: row.tax_rate_percent as number,
    taxAmount: row.tax_amount as number,
    total: row.total as number,
    validUntil: (row.valid_until as string) ?? null,
    notes: (row.notes as string) ?? '',
    templateId: (row.template_id as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapContract(row: Record<string, unknown>): Contract {
  return {
    id: row.id as string,
    contractNumber: row.contract_number as string,
    quoteId: row.quote_id as string,
    customerId: row.customer_id as string,
    projectId: (row.project_id as string) ?? null,
    status: row.status as Contract['status'],
    title: (row.title as string) ?? '',
    content: (row.content as string) ?? '',
    templateId: (row.template_id as string) ?? null,
    signedAt: (row.signed_at as string) ?? null,
    signedBy: (row.signed_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  const lineItems = (row.invoice_line_items as Record<string, unknown>[] ?? [])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((l) => ({
      id: l.id as string,
      description: (l.description as string) ?? '',
      quantity: l.quantity as number,
      unit: (l.unit as string) ?? '',
      unitPrice: l.unit_price as number,
      discountPercent: (l.discount_percent as number) ?? 0,
      amount: l.amount as number,
      sortOrder: l.sort_order as number,
    }))

  const payments: InvoicePayment[] = (row.invoice_payments as Record<string, unknown>[] ?? [])
    .map((p) => ({
      id: p.id as string,
      amount: p.amount as number,
      paidAt: p.paid_at as string,
      method: (p.method as string) ?? '',
      reference: (p.reference as string) ?? null,
    }))

  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    customerId: row.customer_id as string,
    projectId: (row.project_id as string) ?? null,
    quoteId: (row.quote_id as string) ?? null,
    type: row.type as Invoice['type'],
    status: row.status as Invoice['status'],
    lineItems,
    subtotal: row.subtotal as number,
    taxRatePercent: row.tax_rate_percent as number,
    taxAmount: row.tax_amount as number,
    total: row.total as number,
    dueDate: row.due_date as string,
    paidAmount: row.paid_amount as number,
    payments,
    paymentTermsDays: row.payment_terms_days as number,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    name: row.name as string,
    contactPhone: (row.contact_phone as string) ?? '',
    contactEmail: (row.contact_email as string) ?? '',
    address: (row.address as string) ?? '',
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapMaterial(row: Record<string, unknown>): MaterialCatalogItem {
  return {
    id: row.id as string,
    name: row.name as string,
    unit: (row.unit as string) ?? '',
    defaultPrice: row.default_price as number,
    supplierId: (row.supplier_id as string) ?? null,
    sku: (row.sku as string) ?? null,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapPredefinedItem(row: Record<string, unknown>): PredefinedItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    unit: (row.unit as string) ?? '',
    defaultPrice: row.default_price as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapContractTemplate(row: Record<string, unknown>): ContractTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    content: (row.content as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}