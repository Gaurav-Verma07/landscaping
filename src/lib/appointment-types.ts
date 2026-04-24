export interface Appointment {
  id: string
  customerId: string
  projectId: string | null
  address: string
  startAt: string
  endAt: string
  assignedUserIds: string[]
  equipmentRequired: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type CreateAppointmentData = Omit<Appointment, "id" | "createdAt" | "updatedAt">
