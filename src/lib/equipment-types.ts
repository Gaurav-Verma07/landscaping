export type EquipmentStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "out_of_service"

export type BookingStatus = "scheduled" | "in_use" | "completed" | "cancelled"

export interface EquipmentAsset {
  id: string
  name: string
  type: string
  status: EquipmentStatus
  notes: string
  lastMaintenanceAt: string | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentBooking {
  id: string
  assetId: string
  projectId: string | null
  appointmentId: string | null
  startAt: string
  endAt: string
  status: BookingStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: "Available",
  in_use: "In use",
  maintenance: "Maintenance",
  out_of_service: "Out of service",
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: "Scheduled",
  in_use: "In use",
  completed: "Completed",
  cancelled: "Cancelled",
}
