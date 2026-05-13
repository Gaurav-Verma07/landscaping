export type AuditAction =
  // Billing — Quotes
  | "quote_created"
  | "quote_sent"
  | "quote_accepted"
  | "quote_rejected"
  // Billing — Contracts
  | "contract_signed"
  // Billing — Invoices
  | "invoice_created"
  | "invoice_sent"
  | "payment_recorded"
  // Billing — Materials / Suppliers
  | "material_created"
  | "material_updated"
  | "material_deleted"
  | "supplier_created"
  | "supplier_updated"
  | "supplier_deleted"
  // Projects
  | "project_created"
  | "project_updated"
  | "project_status_changed"
  | "project_deleted"
  // Appointments
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled"
  // Customers
  | "customer_created"
  | "customer_updated"
  | "customer_deleted"
  // Equipment
  | "equipment_asset_created"
  | "equipment_asset_updated"
  | "equipment_asset_deleted"
  | "equipment_booking_created"
  | "equipment_booking_updated"
  | "equipment_booking_deleted"
  // Documents
  | "document_created"
  | "document_deleted"
  // Communications
  | "communication_sent"
  | "communication_template_created"
  | "communication_template_updated"
  | "communication_template_deleted"
  | "communication_rule_created"
  | "communication_rule_updated"
  | "communication_rule_deleted"
  | "communication_sequence_created"
  | "communication_sequence_deleted"
  | "automation_triggered"
  // Outreach / Prospects
  | "prospect_created"
  | "prospect_updated"
  | "prospect_deleted"
  | "prospect_converted"
  | "prospect_message_sent"
  // Crew / Labor
  | "employee_created"
  | "employee_updated"
  | "employee_deleted"
  | "employee_clocked_in"
  | "employee_clocked_out"
  // Marketing
  | "campaign_created"
  | "campaign_sent"
  | "campaign_deleted"

export type AuditEntityType =
  | "quote"
  | "contract"
  | "invoice"
  | "material"
  | "supplier"
  | "customer"
  | "project"
  | "appointment"
  | "equipment"
  | "booking"
  | "document"
  | "communication"
  | "template"
  | "rule"
  | "sequence"
  | "automation"
  | "prospect"
  | "employee"
  | "campaign"

export interface AuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  entityType: AuditEntityType
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
  material_created: "Material created",
  material_updated: "Material updated",
  material_deleted: "Material deleted",
  supplier_created: "Supplier created",
  supplier_updated: "Supplier updated",
  supplier_deleted: "Supplier deleted",
  project_created: "Project created",
  project_updated: "Project updated",
  project_status_changed: "Project status changed",
  project_deleted: "Project deleted",
  appointment_created: "Appointment created",
  appointment_updated: "Appointment updated",
  appointment_cancelled: "Appointment cancelled",
  customer_created: "Customer created",
  customer_updated: "Customer updated",
  customer_deleted: "Customer deleted",
  equipment_asset_created: "Equipment added",
  equipment_asset_updated: "Equipment updated",
  equipment_asset_deleted: "Equipment deleted",
  equipment_booking_created: "Equipment booked",
  equipment_booking_updated: "Equipment booking updated",
  equipment_booking_deleted: "Equipment booking cancelled",
  document_created: "Document uploaded",
  document_deleted: "Document deleted",
  communication_sent: "Message sent",
  communication_template_created: "Template created",
  communication_template_updated: "Template updated",
  communication_template_deleted: "Template deleted",
  communication_rule_created: "Automation rule created",
  communication_rule_updated: "Automation rule updated",
  communication_rule_deleted: "Automation rule deleted",
  communication_sequence_created: "Follow-up sequence created",
  communication_sequence_deleted: "Follow-up sequence deleted",
  automation_triggered: "Automation triggered",
  prospect_created: "Prospect created",
  prospect_updated: "Prospect updated",
  prospect_deleted: "Prospect deleted",
  prospect_converted: "Prospect converted to customer",
  prospect_message_sent: "Outreach message sent",
  employee_created: "Employee added",
  employee_updated: "Employee updated",
  employee_deleted: "Employee removed",
  employee_clocked_in: "Employee clocked in",
  employee_clocked_out: "Employee clocked out",
  campaign_created: "Campaign created",
  campaign_sent: "Campaign sent",
  campaign_deleted: "Campaign deleted",
}