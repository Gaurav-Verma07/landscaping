import { getCustomers } from '@/lib/actions/customers'
import { getCampaigns, createCampaign, sendCampaign } from '@/lib/actions/marketing'
import { getCommunications, addCommunication } from '@/lib/actions/communications'
import { getProjects } from '@/lib/actions/projects'
import { getInvoices } from '@/lib/actions/billing'
import { getAppointments } from '@/lib/actions/appointments'

export type ToolResult =
  | { type: 'data'; data: unknown }
  | { type: 'requires_approval'; action: PendingAction }
  | { type: 'error'; message: string }

export interface PendingAction {
  tool: string
  input: Record<string, unknown>
  preview: string
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (toolName) {

      // ─── CUSTOMERS ─────────────────────────────────────────────────────────

      case 'get_customers': {
        const customers = await getCustomers()
        const status = input.status as string | undefined
        const filtered = status
          ? customers.filter((c) => c.status === status)
          : customers
        // Return full records — AI needs all fields for complex queries
        return {
          type: 'data',
          data: filtered.map((c) => ({
            id: c.id,
            name: c.name,
            companyName: c.companyName,
            status: c.status,
            email: c.emails[0] ?? null,
            phone: c.phones[0] ?? null,
            address: c.addresses[0] ?? null,
            tags: c.tags,
            leadSource: c.leadSource,
            notes: c.notes?.map((n) => n.content) ?? [],
            createdAt: c.createdAt,
          })),
        }
      }

      case 'get_customer': {
        const customers = await getCustomers()
        const query = (input.customer_id as string ?? '').toLowerCase()
        const customer = customers.find(
          (c) =>
            c.id === query ||
            c.name.toLowerCase().includes(query) ||
            c.companyName?.toLowerCase().includes(query)
        )
        if (!customer) return { type: 'error', message: `Customer not found: ${input.customer_id}` }
        return {
          type: 'data',
          data: {
            id: customer.id,
            name: customer.name,
            companyName: customer.companyName,
            status: customer.status,
            emails: customer.emails,
            phones: customer.phones,
            addresses: customer.addresses,
            tags: customer.tags,
            leadSource: customer.leadSource,
            notes: customer.notes,
            timeline: customer.timeline,
            createdAt: customer.createdAt,
          },
        }
      }

      // ─── COMMUNICATIONS ────────────────────────────────────────────────────

      case 'get_communications': {
        const comms = await getCommunications()
        const direction = input.direction as string | undefined
        const unreadOnly = input.unread_only as boolean | undefined
        const contactId = input.contact_id as string | undefined

        let filtered = comms
        if (direction) filtered = filtered.filter((c) => c.direction === direction)
        if (unreadOnly) filtered = filtered.filter((c) => !c.read)
        if (contactId) filtered = filtered.filter((c) => c.contactId === contactId)

        // Return full body so AI can summarise content
        return {
          type: 'data',
          data: filtered.map((c) => ({
            id: c.id,
            channel: c.channel,
            direction: c.direction,
            subject: c.subject,
            body: c.body,
            contactName: c.contactName,
            contactId: c.contactId,
            contactEmail: c.contactEmail,
            read: c.read,
            createdAt: c.createdAt,
          })),
        }
      }

      // ─── PROJECTS ──────────────────────────────────────────────────────────

      case 'get_projects': {
        const projects = await getProjects()
        const status = input.status as string | undefined
        const filtered = status
          ? projects.filter((p) => p.status === status)
          : projects

        return {
          type: 'data',
          data: filtered.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            priority: p.priority,
            customerId: p.customerId,
          })),
        }
      }

      // ─── INVOICES ──────────────────────────────────────────────────────────

      case 'get_invoices': {
        const invoices = await getInvoices()
        const status = input.status as string | undefined
        const filtered = status
          ? invoices.filter((i) => i.status === status)
          : invoices

        return {
          type: 'data',
          data: filtered.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            status: i.status,
            total: i.total,
            paidAmount: i.paidAmount,
            dueDate: i.dueDate,
            customerId: i.customerId,
            createdAt: i.createdAt,
          })),
        }
      }

      // ─── APPOINTMENTS ──────────────────────────────────────────────────────

      case 'get_appointments': {
        const appointments = await getAppointments()
        const upcomingOnly = input.upcoming_only as boolean | undefined
        const now = new Date().toISOString()
        const filtered = upcomingOnly
          ? appointments.filter((a) => a.startAt > now)
          : appointments

        return {
          type: 'data',
          data: filtered
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
            .map((a) => ({
              id: a.id,
              customerId: a.customerId,
              startAt: a.startAt,
              endAt: a.endAt,
              notes: a.notes,
            })),
        }
      }

      // ─── CAMPAIGNS ─────────────────────────────────────────────────────────

      case 'get_campaigns': {
        const campaigns = await getCampaigns()
        return {
          type: 'data',
          data: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            subject: c.subject,
            body: c.body,
            audienceType: c.audienceType,
            scheduledAt: c.scheduledAt,
            sentAt: c.sentAt,
          })),
        }
      }

      // ─── WRITE OPERATIONS (require approval) ───────────────────────────────

      case 'create_campaign': {
        const scheduledAt = input.scheduled_at as string | undefined
        return {
          type: 'requires_approval',
          action: {
            tool: 'create_campaign',
            input,
            preview: `Create campaign "${input.name}"\nSubject: ${input.subject}\nAudience: ${input.audience_type}\n${scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : 'Saved as draft'}`,
          },
        }
      }

      case 'send_campaign': {
        return {
          type: 'requires_approval',
          action: {
            tool: 'send_campaign',
            input,
            preview: `Send campaign ID: ${input.campaign_id} immediately to all recipients`,
          },
        }
      }

      case 'draft_reply': {
        return {
          type: 'data',
          data: {
            draft: true,
            communication_id: input.communication_id,
            subject: input.subject ?? '(Re: original subject)',
            body: input.body,
            channel: input.channel,
          },
        }
      }

      case 'send_communication': {
        // Resolve real customer UUID and contact details before showing preview
        let contactId = input.contact_id as string
        let contactEmail = input.contact_email as string | undefined
        let contactPhone = input.contact_phone as string | undefined
        let contactName = input.contact_name as string

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId ?? '')
        if (!isUUID) {
          const customers = await getCustomers()
          const query = (contactId ?? contactName ?? '').toLowerCase()
          const match = customers.find(
            (c) =>
              c.name.toLowerCase().includes(query) ||
              c.companyName?.toLowerCase().includes(query) ||
              c.emails.some((e) => e.toLowerCase().includes(query))
          )
          if (match) {
            contactId = match.id
            contactName = match.name || contactName
            contactEmail = contactEmail || match.emails[0]
            contactPhone = contactPhone || match.phones[0]
          }
        }

        // Store resolved values back so executeConfirmedAction gets them
        const resolvedInput = { ...input, contact_id: contactId, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone }

        return {
          type: 'requires_approval',
          action: {
            tool: 'send_communication',
            input: resolvedInput,
            preview: `Send ${input.channel} to ${contactName}${contactEmail ? ` (${contactEmail})` : ''}\nSubject: ${input.subject ?? '(no subject)'}\n\n${input.body}`,
          },
        }
      }

      case 'navigate_to': {
        return {
          type: 'data',
          data: { navigating: true, path: input.path },
        }
      }

      default:
        return { type: 'error', message: `Unknown tool: ${toolName}` }
    }
  } catch (err) {
    return {
      type: 'error',
      message: err instanceof Error ? err.message : 'Tool execution failed',
    }
  }
}

export async function executeConfirmedAction(action: PendingAction): Promise<ToolResult> {
  const { tool, input } = action

  try {
    switch (tool) {
      case 'create_campaign': {
        const result = await createCampaign({
          name: input.name as string,
          subject: input.subject as string,
          body: input.body as string,
          audienceType: input.audience_type as any,
          audienceFilters: {},
          scheduledAt: (input.scheduled_at as string) ?? null,
        })
        if ('error' in result) return { type: 'error', message: result.error }
        return { type: 'data', data: result.data }
      }

      case 'send_campaign': {
        const result = await sendCampaign(input.campaign_id as string)
        return { type: 'data', data: result }
      }

      case 'send_communication': {
        // Resolve contact_id — AI may pass a name instead of a UUID
        let contactId = input.contact_id as string
        let contactEmail = input.contact_email as string | undefined
        let contactPhone = input.contact_phone as string | undefined
        let contactName = input.contact_name as string

        // If contactId doesn't look like a UUID, look up the customer by name
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contactId ?? '')
        if (!isUUID) {
          const { getCustomers } = await import('@/lib/actions/customers')
          const customers = await getCustomers()
          const query = (contactId ?? contactName ?? '').toLowerCase()
          const match = customers.find(
            (c) =>
              c.name.toLowerCase().includes(query) ||
              c.companyName?.toLowerCase().includes(query) ||
              c.emails.some((e) => e.toLowerCase().includes(query))
          )
          if (!match) {
            return { type: 'error', message: `Could not find customer: ${contactId || contactName}` }
          }
          contactId = match.id
          contactName = match.name || contactName
          contactEmail = contactEmail || match.emails[0]
          contactPhone = contactPhone || match.phones[0]
        }

        const result = await addCommunication({
          channel: input.channel as any,
          subject: (input.subject as string) ?? '',
          body: input.body as string,
          contactName,
          contactId,
          contactEmail,
          contactPhone,
          direction: 'outbound',
          read: true,
          createdAt: new Date().toISOString(),
        })
        if ('error' in result) return { type: 'error', message: result.error }
        return { type: 'data', data: result.data }
      }

      default:
        return { type: 'error', message: `No executor for confirmed action: ${tool}` }
    }
  } catch (err) {
    return {
      type: 'error',
      message: err instanceof Error ? err.message : 'Action execution failed',
    }
  }
}