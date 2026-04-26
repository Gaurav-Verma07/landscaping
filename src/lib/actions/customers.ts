'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Customer, CustomerNote, CustomerTimelineEvent } from '@/lib/customer-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getCustomers(): Promise<Customer[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      customer_notes(*),
      customer_timeline_events(*),
      customer_attachments(*)
    `)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (customers ?? []).map(mapCustomer)
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { supabase } = await getUser()

  const { data } = await supabase
    .from('customers')
    .select(`
      *,
      customer_notes(*),
      customer_timeline_events(*),
      customer_attachments(*)
    `)
    .eq('id', id)
    .single()

  return data ? mapCustomer(data) : null
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'timeline' | 'attachments'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: created, error } = await supabase
    .from('customers')
    .insert({
      profile_id: user.id,
      name: data.name,
      company_name: data.companyName,
      phones: data.phones,
      emails: data.emails,
      addresses: data.addresses,
      tags: data.tags,
      lead_source: data.leadSource,
      partner_referral_name: data.partnerReferralName,
      status: data.status,
      review_status: data.reviewStatus,
      seasonal_service_eligibility: data.seasonalServiceEligibility,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { data: created }
}

export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'notes' | 'timeline' | 'attachments'>>) {
  const { supabase } = await getUser()

  const { error } = await supabase
    .from('customers')
    .update({
      name: data.name,
      company_name: data.companyName,
      phones: data.phones,
      emails: data.emails,
      addresses: data.addresses,
      tags: data.tags,
      lead_source: data.leadSource,
      partner_referral_name: data.partnerReferralName,
      status: data.status,
      review_status: data.reviewStatus,
      seasonal_service_eligibility: data.seasonalServiceEligibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function deleteCustomer(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function mergeCustomers(primaryId: string, secondaryId: string) {
  const { supabase } = await getUser()

  // Re-point child records to primary
  await supabase.from('customer_notes').update({ customer_id: primaryId }).eq('customer_id', secondaryId)
  await supabase.from('customer_timeline_events').update({ customer_id: primaryId }).eq('customer_id', secondaryId)
  await supabase.from('customer_attachments').update({ customer_id: primaryId }).eq('customer_id', secondaryId)
  await supabase.from('projects').update({ customer_id: primaryId }).eq('customer_id', secondaryId)
  await supabase.from('appointments').update({ customer_id: primaryId }).eq('customer_id', secondaryId)
  await supabase.from('communications').update({ customer_id: primaryId }).eq('customer_id', secondaryId)

  // Merge array fields
  const { data: primary } = await supabase.from('customers').select('*').eq('id', primaryId).single()
  const { data: secondary } = await supabase.from('customers').select('*').eq('id', secondaryId).single()

  if (primary && secondary) {
    await supabase.from('customers').update({
      phones: [...new Set([...primary.phones, ...secondary.phones])],
      emails: [...new Set([...primary.emails, ...secondary.emails])],
      addresses: [...new Set([...primary.addresses, ...secondary.addresses])],
      tags: [...new Set([...primary.tags, ...secondary.tags])],
      updated_at: new Date().toISOString(),
    }).eq('id', primaryId)
  }

  await supabase.from('customers').delete().eq('id', secondaryId)
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function addNote(customerId: string, content: string, createdBy?: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('customer_notes').insert({
    customer_id: customerId,
    content,
    created_by: createdBy,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function addTimelineEvent(customerId: string, event: Omit<CustomerTimelineEvent, 'id'>) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('customer_timeline_events').insert({
    customer_id: customerId,
    type: event.type,
    title: event.title,
    description: event.description,
    date: event.date,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function addAttachment(customerId: string, formData: FormData) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/customers/${customerId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, file)

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path)

  const { error } = await supabase.from('customer_attachments').insert({
    customer_id: customerId,
    name: file.name,
    size: file.size,
    url: publicUrl,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function removeAttachment(customerId: string, attachmentId: string) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('customer_attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('customer_id', customerId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

// Maps DB snake_case row → Customer type
function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    companyName: (row.company_name as string) ?? '',
    phones: (row.phones as string[]) ?? [],
    emails: (row.emails as string[]) ?? [],
    addresses: (row.addresses as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    leadSource: (row.lead_source as string) ?? 'other',
    partnerReferralName: (row.partner_referral_name as string) ?? '',
    status: row.status as Customer['status'],
    reviewStatus: (row.review_status as string) ?? '',
    seasonalServiceEligibility: (row.seasonal_service_eligibility as boolean) ?? false,
    notes: ((row.customer_notes as Record<string, unknown>[]) ?? []).map((n) => ({
      id: n.id as string,
      content: n.content as string,
      createdAt: n.created_at as string,
      createdBy: n.created_by as string | undefined,
    })) as CustomerNote[],
    timeline: ((row.customer_timeline_events as Record<string, unknown>[]) ?? []).map((e) => ({
      id: e.id as string,
      type: e.type as CustomerTimelineEvent['type'],
      title: e.title as string,
      date: e.date as string,
      description: e.description as string | undefined,
    })) as CustomerTimelineEvent[],
    attachments: ((row.customer_attachments as Record<string, unknown>[]) ?? []).map((a) => ({
      id: a.id as string,
      name: a.name as string,
      size: a.size as number,
      url: a.url as string,
      uploadedAt: a.uploaded_at as string,
    })),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}