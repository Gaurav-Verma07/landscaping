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
  gpsVerified: boolean
  supervisorOverride: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export type CreateEmployeeData = Omit<Employee, "id" | "createdAt" | "updatedAt">
export type CreateTimeEntryData = Omit<TimeEntry, "id" | "createdAt" | "updatedAt">
