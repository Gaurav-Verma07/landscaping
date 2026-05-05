import type { AITool } from '../provider.interface'

export const campaignTools: AITool[] = [
  {
    name: 'get_campaigns',
    description: 'Get all email campaigns including their status (draft, scheduled, sent), audience, and send stats.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_campaign',
    description: 'Create a new email campaign. ALWAYS requires user approval before executing. Returns a preview for the user to confirm.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Campaign name',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        body: {
          type: 'string',
          description: 'Email body content (plain text or HTML)',
        },
        audience_type: {
          type: 'string',
          description: 'Who to send to',
          enum: ['all_customers', 'active_customers', 'leads', 'past_customers', 'manual'],
        },
        scheduled_at: {
          type: 'string',
          description: 'ISO 8601 datetime to schedule the send (e.g. 2026-03-31T13:00:00). Omit to save as draft.',
        },
      },
      required: ['name', 'subject', 'body', 'audience_type'],
    },
  },
  {
    name: 'send_campaign',
    description: 'Send an existing campaign immediately. ALWAYS requires user approval before executing.',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'The campaign ID to send',
        },
      },
      required: ['campaign_id'],
    },
  },
]