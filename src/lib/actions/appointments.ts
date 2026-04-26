'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Appointment, CreateAppointmentData } from '@/lib/appointment-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getAppointments(): Promise<Appointment[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('profile_id', user.id)
    .order('start_at', { ascending: true })
  return (data ?? []).map(mapAppointment)
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { supabase } = await getUser()
  const { data } = await supabase.from('appointments').select('*').eq('id', id).single()
  return data ? mapAppointment(data) : null
}

export async function getAppointmentsByCustomerId(customerId: string): Promise<Appointment[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
    .order('start_at', { ascending: true })
  return (data ?? []).map(mapAppointment)
}

export async function getAppointmentsByProjectId(projectId: string): Promise<Appointment[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('profile_id', user.id)
    .eq('project_id', projectId)
    .order('start_at', { ascending: true })
  return (data ?? []).map(mapAppointment)
}

export async function createAppointment(data: CreateAppointmentData) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: created, error } = await supabase
    .from('appointments')
    .insert({
      profile_id: user.id,
      customer_id: data.customerId,
      project_id: data.projectId,
      address: data.address,
      start_at: data.startAt,
      end_at: data.endAt,
      assigned_user_ids: data.assignedUserIds,
      equipment_required: data.equipmentRequired,
      notes: data.notes,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/appointments')
  return { data: created }
}

export async function updateAppointment(id: string, data: Partial<CreateAppointmentData>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('appointments')
    .update({
      customer_id: data.customerId,
      project_id: data.projectId,
      address: data.address,
      start_at: data.startAt,
      end_at: data.endAt,
      assigned_user_ids: data.assignedUserIds,
      equipment_required: data.equipmentRequired,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

export async function deleteAppointment(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

function mapAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    projectId: (row.project_id as string) ?? null,
    address: (row.address as string) ?? '',
    startAt: row.start_at as string,
    endAt: row.end_at as string,
    assignedUserIds: (row.assigned_user_ids as string[]) ?? [],
    equipmentRequired: (row.equipment_required as string[]) ?? [],
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}