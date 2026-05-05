import type { AITool } from '../provider.interface'

export const customerTools: AITool[] = [
  {
    name: 'get_customers',
    description: 'Get the list of customers. Optionally filter by status (Active, Lead, Past, Maintenance). Returns name, company, email, phone, status, and ID for each customer.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by customer status',
          enum: ['Active', 'Lead', 'Past', 'Maintenance'],
        },
        limit: {
          type: 'number',
          description: 'Max number of customers to return (default 20)',
        },
      },
    },
  },
  {
    name: 'get_customer',
    description: 'Get full details for a specific customer by ID including notes, timeline, and contact info.',
    parameters: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'The customer ID',
        },
      },
      required: ['customer_id'],
    },
  },
]