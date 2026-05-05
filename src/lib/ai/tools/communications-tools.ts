import type { AITool } from '../provider.interface'

export const communicationTools: AITool[] = [
  {
    name: 'get_communications',
    description: 'Get inbox messages. Can filter by direction (inbound/outbound), read status, or contact. Returns subject, body preview, sender, and timestamp.',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['inbound', 'outbound'],
          description: 'Filter by message direction',
        },
        unread_only: {
          type: 'boolean',
          description: 'If true, return only unread messages',
        },
        contact_id: {
          type: 'string',
          description: 'Filter by a specific contact ID',
        },
        limit: {
          type: 'number',
          description: 'Max number of messages to return (default 20)',
        },
      },
    },
  },
  {
    name: 'draft_reply',
    description: 'Draft a reply to an existing communication. Returns a draft for the user to review and approve before sending. NEVER sends without approval.',
    parameters: {
      type: 'object',
      properties: {
        communication_id: {
          type: 'string',
          description: 'ID of the communication to reply to',
        },
        subject: {
          type: 'string',
          description: 'Reply subject line',
        },
        body: {
          type: 'string',
          description: 'Reply body content',
        },
        channel: {
          type: 'string',
          enum: ['email', 'sms'],
          description: 'Channel to reply via',
        },
      },
      required: ['communication_id', 'body', 'channel'],
    },
  },
  {
    name: 'send_communication',
    description: 'Send a communication to a contact. ALWAYS requires explicit user approval before executing.',
    parameters: {
      type: 'object',
      properties: {
        contact_id: {
          type: 'string',
          description: 'Recipient contact ID (UUID) or their name — the system will resolve the correct ID automatically',
        },
        contact_name: {
          type: 'string',
          description: 'Recipient name',
        },
        contact_email: {
          type: 'string',
          description: 'Recipient email (required for email channel)',
        },
        contact_phone: {
          type: 'string',
          description: 'Recipient phone (required for SMS channel)',
        },
        subject: {
          type: 'string',
          description: 'Message subject',
        },
        body: {
          type: 'string',
          description: 'Message body',
        },
        channel: {
          type: 'string',
          enum: ['email', 'sms'],
          description: 'Channel to send via',
        },
      },
      required: ['contact_id', 'contact_name', 'body', 'channel'],
    },
  },
]