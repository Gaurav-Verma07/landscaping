export const EMPLOYEE_ROLES = ["Crew", "Supervisor", "Driver", "Office"] as const
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

export const SKILL_LEVELS = ["Trainee", "Standard", "Lead", "Specialist"] as const
export type SkillLevel = (typeof SKILL_LEVELS)[number]

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: EmployeeRole
  skillLevel: SkillLevel
  certifications: string[]
  availability: string
  createdAt: string
  updatedAt: string
}

export interface TimeEntry {
  id: string
  employeeId: string
  projectId: string
  clockInAt: string
  clockOutAt: string | null

  //GPS fields
  lat: number | null
  lng: number | null
  accuracyMeters: number | null
  distanceMeters: number | null
  gpsVerified: boolean

  //supervisor override
  supervisorOverride: boolean
  overrideBy: string | null
  overrideReason: string | null

  notes: string
  createdAt: string
  updatedAt: string
}

export type GpsStatus= 
  | 'verified'
  | 'unverified'
  | 'overridden'
  | 'no_coords'
  | 'no_gps'

export function getGpsStatus(entry: TimeEntry): GpsStatus{
  if(entry.lat===null)return 'no_gps'
  if(entry.gpsVerified)return 'verified'
  if(entry.supervisorOverride) return 'overridden'
  return 'unverified'
}

export type CreateEmployeeData = Omit<Employee, "id" | "createdAt" | "updatedAt">
export type CreateTimeEntryData = Omit<TimeEntry, "id" | "createdAt" | "updatedAt">
