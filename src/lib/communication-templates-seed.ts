import type { MessageTemplate } from "@/lib/communication-types"

const now = new Date().toISOString()

export const MESSAGE_TEMPLATE_SEED: MessageTemplate[] = [
  {
    id: "tpl-1",
    name: "Quote follow-up",
    channel: "email",
    subject: "Following up on your quote",
    body: "Hi {{contact_name}},\n\nI wanted to follow up on the quote we sent. Do you have any questions or would you like to schedule the work?\n\nBest regards",
    updatedAt: now,
  },
  {
    id: "tpl-2",
    name: "Invoice reminder",
    channel: "email",
    subject: "Reminder: Invoice {{invoice_number}}",
    body: "Hi {{contact_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} is due on {{due_date}}. Please let us know if you have any questions.\n\nThank you",
    updatedAt: now,
  },
  {
    id: "tpl-3",
    name: "Appointment confirmation (SMS)",
    channel: "sms",
    subject: "",
    body: "Hi {{contact_name}}, your appointment is confirmed for {{date}} at {{time}}. Reply with any questions.",
    updatedAt: now,
  },
  {
    id: "tpl-4",
    name: "Job completed",
    channel: "sms",
    subject: "",
    body: "Your job has been completed. We hope you're satisfied. Thank you for choosing us.",
    updatedAt: now,
  },
]
