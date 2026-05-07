
export const PROJECT_TYPES = [
  "New Construction",
  "Remodel",
  "Maintenance",
  "Irrigation",
  "Installation",
  "Repair",
  "Snow Removal",
  "Hardscape",
  "Drainage",
  "Lighting",
  "Seasonal Cleanup",
  "Turf Install",
  "Retaining Wall",
  "Outdoor Kitchen",
  "Custom",
] as const

export type ProjectType = (typeof PROJECT_TYPES)[number]

export const PROJECT_STATUSES = [
  "Planned",
  "Awaiting Deposit",
  "Materials Ordered",
  "Scheduled",
  "In Progress",
  "Inspection",
  "Completed",
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number]

export const TIMELINE_MILESTONE_TYPES = [
  "deposit_payment",
  "material_ordering",
  "supplier_scheduling",
  "crew_assignment",
  "equipment_scheduling",
  "rental_scheduling",
  "work_phase",
  "final_walkthrough",
] as const

export type TimelineMilestoneType = (typeof TIMELINE_MILESTONE_TYPES)[number]

export interface TimelineMilestone {
  id: string
  type: TimelineMilestoneType
  title: string
  dueDate: string | null
  completedAt: string | null
  order: number
  notes?: string
}

export interface SupervisorReport {
  id: string
  projectId: string
  date: string
  progressNotes: string
  photoUrls: string[]
  submittedAt: string
  submittedBy?: string
}

export interface Project {
  id: string
  name: string
  customerId: string
  projectType: ProjectType
  status: ProjectStatus
  priority: ProjectPriority
  propertySize: string
  estimatedLandscapeSqFt: number | null
  remainingSqFt: number | null
  estimatedPropertyValue: number | null
  terrainType: string
  accessNotes: string
  durationEstimate: string
  requiredMaterials: string[]
  equipment: string[]
  assignedCrew: string
  dependencyProjectIds: string[]
  timeline: TimelineMilestone[]

  // GPS site location — auto-populated from customer address on first crew clock-in,
  // or manually set via updateProjectSiteCoords()
  siteLat: number | null
  siteLng: number | null
  /** Radius in metres within which GPS is considered "on site". Default 200. */
  gpsRadiusMeters: number

  createdAt: string
  updatedAt: string
}

export type CreateProjectData = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "timeline"
> & { timeline?: TimelineMilestone[]
  //site coords
  siteLat?: number | null
  siteLng?: number | null
  gpsRadiusMeters?: number
 }

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Planned: "Planned",
  "Awaiting Deposit": "Awaiting Deposit",
  "Materials Ordered": "Materials Ordered",
  Scheduled: "Scheduled",
  "In Progress": "In Progress",
  Inspection: "Inspection",
  Completed: "Completed",
}

export const MILESTONE_TYPE_LABELS: Record<TimelineMilestoneType, string> = {
  deposit_payment: "Deposit payment",
  material_ordering: "Material ordering",
  supplier_scheduling: "Supplier scheduling",
  crew_assignment: "Crew assignment",
  equipment_scheduling: "Equipment scheduling",
  rental_scheduling: "Rental scheduling",
  work_phase: "Work phase",
  final_walkthrough: "Final walkthrough",
}
