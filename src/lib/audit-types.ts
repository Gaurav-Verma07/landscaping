export type AuditAction =
  | "quote_created"
  | "quote_sent"
  | "quote_accepted"
  | "quote_rejected"
  | "contract_signed"
  | "invoice_created"
  | "invoice_sent"
  | "payment_recorded"
  | "project_created"
  | "project_status_changed"
  | "appointment_created"
  | "appointment_cancelled"
  | "customer_created"
  | "automation_triggered"

export interface AuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  entityType: "quote" | "contract" | "invoice" | "customer" | "project" | "appointment" | "automation"
  entityId: string
  details: string
  userId?: string
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  quote_created: "Quote created",
  quote_sent: "Quote sent",
  quote_accepted: "Quote accepted",
  quote_rejected: "Quote rejected",
  contract_signed: "Contract signed",
  invoice_created: "Invoice created",
  invoice_sent: "Invoice sent",
  payment_recorded: "Payment recorded",
  project_created: "Project created",
  project_status_changed: "Project status changed",
  appointment_created: "Appointment created",
  appointment_cancelled: "Appointment cancelled",
  customer_created: "Customer created",
  automation_triggered: "Automation triggered",
}
