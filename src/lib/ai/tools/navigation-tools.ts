import type { AITool } from '../provider.interface'

export const navigationTools: AITool[] = [
  {
    name: 'navigate_to',
    description: 'Navigate the user to a specific page in the dashboard. Use this when the user asks to "open", "go to", or "show" a module.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The dashboard path to navigate to',
          enum: [
            '/dashboard',
            '/dashboard/customers',
            '/dashboard/projects',
            '/dashboard/quotes',
            '/dashboard/invoices',
            '/dashboard/contracts',
            '/dashboard/appointments',
            '/dashboard/crew',
            '/dashboard/equipment',
            '/dashboard/documents',
            '/dashboard/communications',
            '/dashboard/communications/settings',
            '/dashboard/outreach',
            '/dashboard/marketing',
            '/dashboard/management/settings',
            '/dashboard/admin',
          ],
        },
        reason: {
          type: 'string',
          description: 'Brief explanation of why navigating here',
        },
      },
      required: ['path'],
    },
  },
]