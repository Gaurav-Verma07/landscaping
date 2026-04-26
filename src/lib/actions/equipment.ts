'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EquipmentAsset, EquipmentBooking } from '@/lib/equipment-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(aEnd).getTime() > new Date(bStart).getTime()
}

// ============================================
// ASSETS
// ============================================

export async function getAssets(): Promise<EquipmentAsset[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('equipment_assets')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapAsset)
}

export async function createAsset(
  data: Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>
) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: created, error } = await supabase
    .from('equipment_assets')
    .insert({
      profile_id: user.id,
      name: data.name,
      type: data.type,
      status: data.status,
      notes: data.notes,
      last_maintenance_at: data.lastMaintenanceAt,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipment')
  return { data: created }
}

export async function updateAsset(
  id: string,
  data: Partial<Omit<EquipmentAsset, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('equipment_assets')
    .update({
      name: data.name,
      type: data.type,
      status: data.status,
      notes: data.notes,
      last_maintenance_at: data.lastMaintenanceAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipment')
  return { success: true }
}

export async function deleteAsset(id: string) {
  const { supabase } = await getUser()
  // bookings cascade via FK
  const { error } = await supabase.from('equipment_assets').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipment')
  return { success: true }
}

// ============================================
// BOOKINGS
// ============================================

export async function getBookings(): Promise<EquipmentBooking[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('equipment_bookings')
    .select('*, equipment_assets!inner(profile_id)')
    .eq('equipment_assets.profile_id', user.id)
    .order('start_at', { ascending: true })
  return (data ?? []).map(mapBooking)
}

export async function getBookingsByAssetId(assetId: string): Promise<EquipmentBooking[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('equipment_bookings')
    .select('*')
    .eq('asset_id', assetId)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true })
  return (data ?? []).map(mapBooking)
}

export async function getBookingsByProjectId(projectId: string): Promise<EquipmentBooking[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('equipment_bookings')
    .select('*')
    .eq('project_id', projectId)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true })
  return (data ?? []).map(mapBooking)
}

export async function getConflictingBookings(
  assetId: string,
  startAt: string,
  endAt: string,
  excludeBookingId?: string
): Promise<EquipmentBooking[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('equipment_bookings')
    .select('*')
    .eq('asset_id', assetId)
    .neq('status', 'cancelled')

  return (data ?? [])
    .filter((b) => {
      if (excludeBookingId && b.id === excludeBookingId) return false
      return rangesOverlap(b.start_at, b.end_at, startAt, endAt)
    })
    .map(mapBooking)
}

export async function createBooking(
  data: Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>
) {
  const { supabase } = await getUser()
  const { data: created, error } = await supabase
    .from('equipment_bookings')
    .insert({
      asset_id: data.assetId,
      project_id: data.projectId,
      appointment_id: data.appointmentId,
      start_at: data.startAt,
      end_at: data.endAt,
      status: data.status,
      notes: data.notes,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipment')
  return { data: mapBooking(created) }
}

export async function updateBooking(
  id: string,
  data: Partial<Omit<EquipmentBooking, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('equipment_bookings')
    .update({
      asset_id: data.assetId,
      project_id: data.projectId,
      appointment_id: data.appointmentId,
      start_at: data.startAt,
      end_at: data.endAt,
      status: data.status,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipment')
  return { success: true }
}

export async function deleteBooking(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('equipment_bookings').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipment')
  return { success: true }
}

// ============================================
// MAPPERS
// ============================================

function mapAsset(row: Record<string, unknown>): EquipmentAsset {
  return {
    id: row.id as string,
    name: row.name as string,
    type: (row.type as string) ?? '',
    status: row.status as EquipmentAsset['status'],
    notes: (row.notes as string) ?? '',
    lastMaintenanceAt: (row.last_maintenance_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapBooking(row: Record<string, unknown>): EquipmentBooking {
  return {
    id: row.id as string,
    assetId: row.asset_id as string,
    projectId: (row.project_id as string) ?? null,
    appointmentId: (row.appointment_id as string) ?? null,
    startAt: row.start_at as string,
    endAt: row.end_at as string,
    status: row.status as EquipmentBooking['status'],
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}