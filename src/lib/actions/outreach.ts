'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OutreachProspect, OutreachStage } from '@/types/outreach-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getProspects(): Promise<OutreachProspect[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('outreach_prospects')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapProspect)
}

export async function createProspect(
  input: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('outreach_prospects')
    .insert({
      profile_id: user.id,
      name: input.name,
      company: input.company,
      target_type: input.targetType,
      location: input.location,
      industry: input.industry,
      company_size: input.companySize,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      stage: input.stage,
      lead_source: input.leadSource,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/outreach')
  return { data: mapProspect(data) }
}

export async function createProspects(
  inputs: Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>[]
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  if (inputs.length === 0) return { data: [] }

  const { data, error } = await supabase
    .from('outreach_prospects')
    .insert(
      inputs.map((input) => ({
        profile_id: user.id,
        name: input.name,
        company: input.company,
        target_type: input.targetType,
        location: input.location,
        industry: input.industry,
        company_size: input.companySize,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        stage: input.stage,
        lead_source: input.leadSource,
      }))
    )
    .select()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/outreach')
  return { data: data.map(mapProspect) }
}

export async function updateProspect(
  id: string,
  patch: Partial<Omit<OutreachProspect, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('outreach_prospects')
    .update({
      name: patch.name,
      company: patch.company,
      target_type: patch.targetType,
      location: patch.location,
      industry: patch.industry,
      company_size: patch.companySize,
      email: patch.email,
      phone: patch.phone,
      notes: patch.notes,
      stage: patch.stage,
      lead_source: patch.leadSource,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/outreach')
  return { success: true }
}

export async function deleteProspect(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('outreach_prospects').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/outreach')
  return { success: true }
}

export async function moveProspectStage(id: string, stage: OutreachStage) {
  return updateProspect(id, { stage })
}

export async function bulkUpdateProspects(
  ids: string[],
  data: Partial<{
    stage: string
    target_type: string
    lead_source: string
    notes: string
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('outreach_prospects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function bulkDeleteProspects(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('outreach_prospects')
    .delete()
    .in('id', ids)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

function mapProspect(row: Record<string, unknown>): OutreachProspect {
  return {
    id: row.id as string,
    name: row.name as string,
    company: (row.company as string) ?? '',
    targetType: row.target_type as OutreachProspect['targetType'],
    location: (row.location as string) ?? '',
    industry: (row.industry as string) ?? '',
    companySize: (row.company_size as string) ?? '',
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    notes: (row.notes as string) ?? '',
    stage: row.stage as OutreachProspect['stage'],
    leadSource: (row.lead_source as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}