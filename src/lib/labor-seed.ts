import type { Employee, TimeEntry } from "@/lib/labor-types"

const now = new Date().toISOString()
const today = new Date()
today.setHours(8, 0, 0, 0)
const todayEnd = new Date()
todayEnd.setHours(16, 30, 0, 0)

export const EMPLOYEE_SEED: Employee[] = [
  {
    id: "emp-1",
    name: "James Wilson",
    email: "james.w@example.com",
    phone: "+44 7700 900001",
    role: "Supervisor",
    skillLevel: "Lead",
    certifications: ["First Aid", "CPCS"],
    availability: "Mon–Fri",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "emp-2",
    name: "Mike Brown",
    email: "mike.b@example.com",
    phone: "+44 7700 900002",
    role: "Crew",
    skillLevel: "Standard",
    certifications: [],
    availability: "Mon–Sat",
    createdAt: now,
    updatedAt: now,
  },
]

export const TIME_ENTRY_SEED: TimeEntry[] = [
  {
    id: "te-1",
    employeeId: "emp-1",
    projectId: "proj-seed-1",
    clockInAt: today.toISOString(),
    clockOutAt: null,
    gpsVerified: true,
    supervisorOverride: false,
    notes: "",
    createdAt: now,
    updatedAt: now,
  },
]
