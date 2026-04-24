import type { Appointment } from "@/lib/appointment-types"

const now = new Date().toISOString()
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
tomorrow.setHours(10, 0, 0, 0)
const tomorrowEnd = new Date(tomorrow)
tomorrowEnd.setHours(11, 30, 0, 0)
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
nextWeek.setHours(14, 0, 0, 0)
const nextWeekEnd = new Date(nextWeek)
nextWeekEnd.setHours(16, 0, 0, 0)

export const APPOINTMENT_SEED: Appointment[] = [
  {
    id: "apt-1",
    customerId: "seed-1",
    projectId: "proj-seed-1",
    address: "123 Garden Lane, London",
    startAt: tomorrow.toISOString(),
    endAt: tomorrowEnd.toISOString(),
    assignedUserIds: ["user-1"],
    equipmentRequired: ["Shovel", "Wheelbarrow"],
    notes: "Site visit and measure",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "apt-2",
    customerId: "seed-2",
    projectId: null,
    address: "45 Oak Street, Manchester",
    startAt: nextWeek.toISOString(),
    endAt: nextWeekEnd.toISOString(),
    assignedUserIds: ["user-1"],
    equipmentRequired: [],
    notes: "Quote follow-up",
    createdAt: now,
    updatedAt: now,
  },
]
