import type { AITool } from '../provider.interface'

export const projectTools: AITool[] = [
  {
    name: 'get_projects',
    description: 'Get all projects with their status, customer, type, and priority.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by project status',
          enum: ['Planned', 'Awaiting Deposit', 'Materials Ordered', 'Scheduled', 'In Progress', 'Inspection', 'Completed'],
        },
        limit: {
          type: 'number',
          description: 'Max number of projects to return (default 20)',
        },
      },
    },
  },
  {
    name: 'get_invoices',
    description: 'Get invoices. Can filter by status to find overdue, unpaid, or draft invoices.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'partial', 'paid', 'overdue'],
          description: 'Filter by invoice status',
        },
        limit: {
          type: 'number',
          description: 'Max invoices to return (default 20)',
        },
      },
    },
  },
  {
    name: 'get_appointments',
    description: 'Get upcoming or recent appointments with customer and time details.',
    parameters: {
      type: 'object',
      properties: {
        upcoming_only: {
          type: 'boolean',
          description: 'If true, return only future appointments',
        },
        limit: {
          type: 'number',
          description: 'Max appointments to return (default 10)',
        },
      },
    },
  },
]