'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Project,
  CreateProjectData,
  TimelineMilestone,
  SupervisorReport,
  TimelineMilestoneType,
} from '@/types/project-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// ============================================
// PROJECTS
// ============================================

export async function getProjects(): Promise<Project[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('projects')
    .select(`*, project_timeline_milestones(*)`)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []).map(mapProject)
}

export async function getProject(id: string): Promise<Project | null> {
  const { supabase } = await getUser()

  const { data } = await supabase
    .from('projects')
    .select(`*, project_timeline_milestones(*)`)
    .eq('id', id)
    .single()

  return data ? mapProject(data) : null
}

export async function getProjectsByCustomerId(customerId: string): Promise<Project[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('projects')
    .select(`*, project_timeline_milestones(*)`)
    .eq('profile_id', user.id)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return (data ?? []).map(mapProject)
}

export async function createProject(data: CreateProjectData) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: created, error } = await supabase
    .from('projects')
    .insert({
      profile_id: user.id,
      customer_id: data.customerId,
      name: data.name,
      project_type: data.projectType,
      status: data.status,
      priority: data.priority,
      property_size: data.propertySize,
      estimated_landscape_sqft: data.estimatedLandscapeSqFt,
      remaining_sqft: data.remainingSqFt,
      estimated_property_value: data.estimatedPropertyValue,
      terrain_type: data.terrainType,
      access_notes: data.accessNotes,
      duration_estimate: data.durationEstimate,
      required_materials: data.requiredMaterials,
      equipment: data.equipment,
      assigned_crew: data.assignedCrew,
      dependency_project_ids: data.dependencyProjectIds,
      site_lat: data.siteLat ?? null,
      site_lng: data.siteLng ?? null,
      gps_radius_meters: data.gpsRadiusMeters ?? 200,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Insert initial timeline milestones if provided
  if (data.timeline?.length) {
    await supabase.from('project_timeline_milestones').insert(
      data.timeline.map((m, i) => ({
        project_id: created.id,
        type: m.type,
        title: m.title,
        due_date: m.dueDate,
        completed_at: m.completedAt,
        sort_order: m.order ?? i,
        notes: m.notes,
      }))
    )
  }

  revalidatePath('/dashboard/projects')
  return { data: created }
}

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>>
) {
  const { supabase } = await getUser()

  const { error } = await supabase
    .from('projects')
    .update({
      customer_id: data.customerId,
      name: data.name,
      project_type: data.projectType,
      status: data.status,
      priority: data.priority,
      property_size: data.propertySize,
      estimated_landscape_sqft: data.estimatedLandscapeSqFt,
      remaining_sqft: data.remainingSqFt,
      estimated_property_value: data.estimatedPropertyValue,
      terrain_type: data.terrainType,
      access_notes: data.accessNotes,
      duration_estimate: data.durationEstimate,
      required_materials: data.requiredMaterials,
      equipment: data.equipment,
      assigned_crew: data.assignedCrew,
      dependency_project_ids: data.dependencyProjectIds,
      site_lat: data.siteLat,
      site_lng: data.siteLng,
      gps_radius_meters: data.gpsRadiusMeters,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
  return { success: true }
}

export async function updateProjectStatus(id: string, status: Project['status']) {
  return updateProject(id, { status })
}

//manually set or correct the GPS site location for a project

export async function updateProjectSiteCoords(
  projectId: string,
  coords: { siteLat: number; siteLng: number; gpsRadiusMeters?: number },
) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('projects')
    .update({
      site_lat: coords.siteLat,
      site_lng: coords.siteLng,
      ...(coords.gpsRadiusMeters != null && { gps_radius_meters: coords.gpsRadiusMeters }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/crew')
  return { success: true }
}

export async function deleteProject(id: string) {
  const { supabase } = await getUser()
  // Milestones + reports cascade delete via FK
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
  return { success: true }
}

// ============================================
// TIMELINE MILESTONES
// ============================================

export async function addTimelineMilestone(
  projectId: string,
  milestone: Omit<TimelineMilestone, 'id' | 'order'>
) {
  const { supabase } = await getUser()

  // Get current max order
  const { data: existing } = await supabase
    .from('project_timeline_milestones')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('project_timeline_milestones').insert({
    project_id: projectId,
    type: milestone.type,
    title: milestone.title,
    due_date: milestone.dueDate,
    completed_at: milestone.completedAt,
    sort_order: nextOrder,
    notes: milestone.notes,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
  return { success: true }
}

export async function updateTimelineMilestone(
  projectId: string,
  milestoneId: string,
  patch: Partial<TimelineMilestone>
) {
  const { supabase } = await getUser()

  const { error } = await supabase
    .from('project_timeline_milestones')
    .update({
      type: patch.type,
      title: patch.title,
      due_date: patch.dueDate,
      completed_at: patch.completedAt,
      sort_order: patch.order,
      notes: patch.notes,
    })
    .eq('id', milestoneId)
    .eq('project_id', projectId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
  return { success: true }
}

export async function reorderTimeline(projectId: string, milestoneIds: string[]) {
  const { supabase } = await getUser()

  // Update each milestone's sort_order in parallel
  await Promise.all(
    milestoneIds.map((id, i) =>
      supabase
        .from('project_timeline_milestones')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('project_id', projectId)
    )
  )

  revalidatePath('/dashboard/projects')
  return { success: true }
}

// ============================================
// SUPERVISOR REPORTS
// ============================================

export async function getSupervisorReports(projectId: string): Promise<SupervisorReport[]> {
  const { supabase } = await getUser()

  const { data } = await supabase
    .from('supervisor_reports')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false })

  return (data ?? []).map(mapReport)
}

export async function addSupervisorReport(
  report: Omit<SupervisorReport, 'id' | 'submittedAt'>
) {
  const { supabase } = await getUser()

  const { data: created, error } = await supabase
    .from('supervisor_reports')
    .insert({
      project_id: report.projectId,
      date: report.date,
      progress_notes: report.progressNotes,
      photo_urls: report.photoUrls,
      submitted_by: report.submittedBy,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Auto-adjust timeline if report is late
  await shiftTimelineDueDates(report)

  revalidatePath('/dashboard/projects')
  return { data: created }
}

// ============================================
// TIMELINE AUTO-ADJUSTMENT (late report logic)
// ============================================

function inferMilestoneTypeFromNotes(notes: string): TimelineMilestoneType | null {
  const q = (notes || '').toLowerCase()
  if (q.includes('deposit') || q.includes('down payment') || q.includes('initial payment')) return 'deposit_payment'
  if (q.includes('supplier') || q.includes('vendor')) return 'supplier_scheduling'
  if (q.includes('material') || q.includes('plants') || q.includes('mulch') || q.includes('order')) return 'material_ordering'
  if (q.includes('crew') || q.includes('team') || q.includes('staff')) return 'crew_assignment'
  if (q.includes('equipment') || q.includes('truck') || q.includes('excavator') || q.includes('machine')) return 'equipment_scheduling'
  if (q.includes('rental') || q.includes('renting') || q.includes('hire')) return 'rental_scheduling'
  if (q.includes('walkthrough') || q.includes('final') || q.includes('handover')) return 'final_walkthrough'
  if (q.includes('phase') || q.includes('work') || q.includes('install') || q.includes('construction')) return 'work_phase'
  return null
}

async function shiftTimelineDueDates(report: Omit<SupervisorReport, 'id' | 'submittedAt'>) {
  const { supabase } = await getUser()

  const { data: milestones } = await supabase
    .from('project_timeline_milestones')
    .select('*')
    .eq('project_id', report.projectId)
    .order('sort_order', { ascending: true })

  if (!milestones?.length) return

  const reportDate = new Date(report.date)
  if (isNaN(reportDate.getTime())) return

  const targetType = inferMilestoneTypeFromNotes(report.progressNotes)
  const incomplete = milestones.filter((m) => !m.completed_at)
  if (!incomplete.length) return

  const targetMilestone =
    (targetType ? incomplete.find((m) => m.type === targetType) : null) ?? incomplete[0]
  if (!targetMilestone) return

  const dueDateMs = targetMilestone.due_date ? new Date(targetMilestone.due_date).getTime() : null
  const reportMs = reportDate.getTime()
  const dayMs = 24 * 60 * 60 * 1000

  if (!dueDateMs) {
    await supabase
      .from('project_timeline_milestones')
      .update({ due_date: report.date.slice(0, 10) })
      .eq('id', targetMilestone.id)
    return
  }

  if (reportMs <= dueDateMs) return

  const deltaDays = Math.round((reportMs - dueDateMs) / dayMs)
  const targetOrder = targetMilestone.sort_order

  const toUpdate = milestones.filter(
    (m) => !m.completed_at && m.sort_order >= targetOrder && m.due_date
  )

  await Promise.all(
    toUpdate.map((m) => {
      const shifted = new Date(new Date(m.due_date).getTime() + deltaDays * dayMs)
        .toISOString()
        .slice(0, 10)
      return supabase
        .from('project_timeline_milestones')
        .update({ due_date: shifted })
        .eq('id', m.id)
    })
  )
}

// ============================================
// MAPPERS
// ============================================

function mapProject(row: Record<string, unknown>): Project {
  const milestones = (
    (row.project_timeline_milestones as Record<string, unknown>[]) ?? []
  )
    .map(mapMilestone)
    .sort((a, b) => a.order - b.order)

  return {
    id: row.id as string,
    name: row.name as string,
    customerId: (row.customer_id as string) ?? '',
    projectType: row.project_type as Project['projectType'],
    status: row.status as Project['status'],
    priority: row.priority as Project['priority'],
    propertySize: (row.property_size as string) ?? '',
    estimatedLandscapeSqFt: row.estimated_landscape_sqft as number | null,
    remainingSqFt: row.remaining_sqft as number | null,
    estimatedPropertyValue: row.estimated_property_value as number | null,
    terrainType: (row.terrain_type as string) ?? '',
    accessNotes: (row.access_notes as string) ?? '',
    durationEstimate: (row.duration_estimate as string) ?? '',
    requiredMaterials: (row.required_materials as string[]) ?? [],
    equipment: (row.equipment as string[]) ?? [],
    assignedCrew: (row.assigned_crew as string) ?? '',
    dependencyProjectIds: (row.dependency_project_ids as string[]) ?? [],
    timeline: milestones,
    siteLat: (row.site_lat as number) ?? null,
    siteLng: (row.site_lng as number) ?? null,
    gpsRadiusMeters: (row.gps_radius_meters as number) ?? 200,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapMilestone(row: Record<string, unknown>): TimelineMilestone {
  return {
    id: row.id as string,
    type: row.type as TimelineMilestone['type'],
    title: row.title as string,
    dueDate: (row.due_date as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    order: (row.sort_order as number) ?? 0,
    notes: (row.notes as string) ?? undefined,
  }
}

function mapReport(row: Record<string, unknown>): SupervisorReport {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    date: row.date as string,
    progressNotes: (row.progress_notes as string) ?? '',
    photoUrls: (row.photo_urls as string[]) ?? [],
    submittedAt: row.submitted_at as string,
    submittedBy: (row.submitted_by as string) ?? undefined,
  }
}