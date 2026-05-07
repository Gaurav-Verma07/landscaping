'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Employee, TimeEntry, CreateEmployeeData, CreateTimeEntryData } from '@/types/labor-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// ============================================
// EMPLOYEES
// ============================================

export async function getEmployees(): Promise<Employee[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapEmployee)
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { supabase } = await getUser()
  const { data } = await supabase.from('employees').select('*').eq('id', id).single()
  return data ? mapEmployee(data) : null
}

export async function createEmployee(data: CreateEmployeeData) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: created, error } = await supabase
    .from('employees')
    .insert({
      profile_id: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      skill_level: data.skillLevel,
      certifications: data.certifications,
      availability: data.availability,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { data: created }
}

export async function updateEmployee(id: string, data: Partial<CreateEmployeeData>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('employees')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      skill_level: data.skillLevel,
      certifications: data.certifications,
      availability: data.availability,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const { supabase } = await getUser()
  // time_entries cascade delete via FK
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { success: true }
}

// ============================================
// TIME ENTRIES
// ============================================

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('time_entries')
    .select('*, employees!inner(profile_id)')
    .eq('employees.profile_id', user.id)
    .order('clock_in_at', { ascending: false })
  return (data ?? []).map(mapTimeEntry)
}



export async function getTimeEntriesByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .order('clock_in_at', { ascending: false })
  return (data ?? []).map(mapTimeEntry)
}

export async function getTimeEntriesByProjectId(projectId: string): Promise<TimeEntry[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('clock_in_at', { ascending: false })
  return (data ?? []).map(mapTimeEntry)
}

/** Returns all currently-clocked-in entries for the authenticated user's org. */
export async function getActiveTimeEntries(): Promise<TimeEntry[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('time_entries')
    .select('*, employees!inner(profile_id)')
    .eq('employees.profile_id', user.id)
    .is('clock_out_at', null)
    .order('clock_in_at', { ascending: false })
  return (data ?? []).map(mapTimeEntry)
}

export async function getActiveTimeEntry(employeeId: string): Promise<TimeEntry | null> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .is('clock_out_at', null)
    .limit(1)
    .single()
  return data ? mapTimeEntry(data) : null
}

export async function clockIn(
  employeeId: string,
  projectId: string,
  gpsVerified = false,
  gpsData?: {
    lat: number
    lng: number
    accuracyMeters: number
    distanceMeters: number | null
  },
  notes = '',
) {
  const { supabase } = await getUser()
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      employee_id: employeeId,
      project_id: projectId,
      clock_in_at: new Date().toISOString(),
      clock_out_at: null,
      gps_verified: gpsVerified,
      supervisor_override: false,
      notes,
      // GPS columns (nullable if no location captured)
      lat: gpsData?.lat ?? null,
      lng: gpsData?.lng ?? null,
      accuracy_meters: gpsData?.accuracyMeters ?? null,
      distance_meters: gpsData?.distanceMeters ?? null,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { data: mapTimeEntry(data) }
}

export async function clockOut(timeEntryId: string) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('time_entries')
    .update({
      clock_out_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', timeEntryId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { success: true }
}

export async function supervisorOverride(timeEntryId: string, reason: string) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('time_entries')
    .update({
      supervisor_override: true,
      override_by: user.id,
      override_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', timeEntryId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { success: true }
}

export async function createTimeEntry(data: CreateTimeEntryData) {
  const { supabase } = await getUser()
  const { data: created, error } = await supabase
    .from('time_entries')
    .insert({
      employee_id: data.employeeId,
      project_id: data.projectId,
      clock_in_at: data.clockInAt,
      clock_out_at: data.clockOutAt,
      gps_verified: data.gpsVerified,
      supervisor_override: data.supervisorOverride,
      lat: data.lat,
      lng: data.lng,
      accuracy_meters: data.accuracyMeters,
      distance_meters: data.distanceMeters,
      override_by: data.overrideBy,
      override_reason: data.overrideReason,
      notes: data.notes,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { data: mapTimeEntry(created) }
}

export async function updateTimeEntry(id: string, data: Partial<CreateTimeEntryData>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('time_entries')
    .update({
      project_id: data.projectId,
      clock_in_at: data.clockInAt,
      clock_out_at: data.clockOutAt,
      gps_verified: data.gpsVerified,
      supervisor_override: data.supervisorOverride,
      lat: data.lat,
      lng: data.lng,
      accuracy_meters: data.accuracyMeters,
      distance_meters: data.distanceMeters,
      override_by: data.overrideBy,
      override_reason: data.overrideReason,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { success: true }
}

export async function deleteTimeEntry(id: string) {
  const { supabase } = await getUser()
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/crew')
  return { success: true }
}

// ============================================
// MAPPERS
// ============================================

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    role: row.role as Employee['role'],
    skillLevel: row.skill_level as Employee['skillLevel'],
    certifications: (row.certifications as string[]) ?? [],
    availability: (row.availability as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapTimeEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    employeeId: row.employee_id as string,
    projectId: row.project_id as string,
    clockInAt: row.clock_in_at as string,
    clockOutAt: (row.clock_out_at as string) ?? null,

    lat: (row.lat as number) ?? null,
    lng: (row.lng as number) ?? null,
    accuracyMeters: (row.accuracy_meters as number) ?? null,
    distanceMeters: (row.distance_meters as number) ?? null,
    gpsVerified: (row.gps_verified as boolean) ?? false,

    supervisorOverride: (row.supervisor_override as boolean) ?? false,
    overrideBy: (row.override_by as string) ?? null,
    overrideReason: (row.override_reason as string) ?? null,

    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}