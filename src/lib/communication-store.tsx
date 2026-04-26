'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type {
  Communication, MessageTemplate, AutomationRule,
  FollowUpSequence, ScheduledMessage, AutomationTrigger,
} from '@/lib/communication-types'
import {
  getCommunications, getCommunicationsByContactId as getByContactIdAction,
  addCommunication as addCommunicationAction, markRead as markReadAction,
  getTemplates as getTemplatesAction, addTemplate as addTemplateAction,
  updateTemplate as updateTemplateAction, deleteTemplate as deleteTemplateAction,
  getRules, addRule as addRuleAction, updateRule as updateRuleAction, deleteRule as deleteRuleAction,
  getSequences, addSequence as addSequenceAction,
  updateSequence as updateSequenceAction, deleteSequence as deleteSequenceAction,
  getScheduledMessages, addScheduledMessage as addScheduledMessageAction,
  updateScheduledStatus as updateScheduledStatusAction,
  runDueScheduledMessages as runDueAction,
  triggerAutomation as triggerAutomationAction,
} from '@/lib/actions/communications'


type CommunicationStoreValue = {
  communications: Communication[]
  templates: MessageTemplate[]
  rules: AutomationRule[]
  sequences: FollowUpSequence[]
  scheduledMessages: ScheduledMessage[]
  loading: boolean
  addCommunication: (comm: Omit<Communication, 'id'>) => Promise<Communication | undefined>
  markRead: (id: string) => Promise<void>
  getTemplates: () => MessageTemplate[]
  addTemplate: (t: Omit<MessageTemplate, 'id' | 'updatedAt'>) => Promise<MessageTemplate | undefined>
  updateTemplate: (id: string, t: Partial<MessageTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  searchCommunications: (query: string) => Communication[]
  getCommunicationsByContactId: (contactId: string) => Communication[]
  addRule: (r: Omit<AutomationRule, 'id' | 'createdAt'>) => Promise<AutomationRule | undefined>
  updateRule: (id: string, r: Partial<AutomationRule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  addSequence: (s: Omit<FollowUpSequence, 'id' | 'createdAt'>) => Promise<void>
  updateSequence: (id: string, s: Partial<FollowUpSequence>) => Promise<void>
  deleteSequence: (id: string) => Promise<void>
  addScheduledMessage: (s: Omit<ScheduledMessage, 'id' | 'createdAt'>) => Promise<ScheduledMessage | undefined>
  updateScheduledStatus: (id: string, status: ScheduledMessage['status']) => Promise<void>
  runDueScheduledMessages: () => Promise<ScheduledMessage[]>
  triggerAutomation: (trigger: AutomationTrigger, opts: {
    contactId: string; contactName: string; contactEmail?: string
    contactPhone?: string; extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
  }) => Promise<void>
  refresh: () => Promise<void>
}

const CommunicationStoreContext = createContext<CommunicationStoreValue | null>(null)

export function CommunicationStoreProvider({ children }: { children: React.ReactNode }) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [sequences, setSequences] = useState<FollowUpSequence[]>([])
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [comms, tmpls, rls, seqs, sched] = await Promise.all([
      getCommunications(), getTemplatesAction(), getRules(),
      getSequences(), getScheduledMessages(),
    ])
    setCommunications(comms)
    setTemplates(tmpls)
    setRules(rls)
    setSequences(seqs)
    setScheduledMessages(sched)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [])

  const addCommunication = useCallback(async (comm: Omit<Communication, 'id'>) => {
    const result = await addCommunicationAction(comm)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const markRead = useCallback(async (id: string) => {
    await markReadAction(id)
    setCommunications((prev) => prev.map((c) => c.id === id ? { ...c, read: true } : c))
  }, [])

  const getTemplates = useCallback(() => templates, [templates])

  const addTemplate = useCallback(async (t: Omit<MessageTemplate, 'id' | 'updatedAt'>) => {
    const result = await addTemplateAction(t)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateTemplate = useCallback(async (id: string, t: Partial<MessageTemplate>) => {
    await updateTemplateAction(id, t)
    await refresh()
  }, [refresh])

  const deleteTemplate = useCallback(async (id: string) => {
    await deleteTemplateAction(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const searchCommunications = useCallback((query: string) => {
    const q = query.toLowerCase().trim()
    if (!q) return communications.slice(0, 10)
    return communications.filter((c) =>
      c.subject.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      (c.contactEmail?.toLowerCase().includes(q) ?? false) ||
      (c.contactPhone?.includes(q) ?? false)
    ).slice(0, 10)
  }, [communications])

  const getCommunicationsByContactId = useCallback(
    (contactId: string) => communications.filter((c) => c.contactId === contactId),
    [communications]
  )

  const addRule = useCallback(async (r: Omit<AutomationRule, 'id' | 'createdAt'>) => {
    const result = await addRuleAction(r)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateRule = useCallback(async (id: string, r: Partial<AutomationRule>) => {
    await updateRuleAction(id, r)
    await refresh()
  }, [refresh])

  const deleteRule = useCallback(async (id: string) => {
    await deleteRuleAction(id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const addSequence = useCallback(async (s: Omit<FollowUpSequence, 'id' | 'createdAt'>) => {
    await addSequenceAction(s)
    await refresh()
  }, [refresh])

  const updateSequence = useCallback(async (id: string, s: Partial<FollowUpSequence>) => {
    await updateSequenceAction(id, s)
    await refresh()
  }, [refresh])

  const deleteSequence = useCallback(async (id: string) => {
    await deleteSequenceAction(id)
    setSequences((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addScheduledMessage = useCallback(async (s: Omit<ScheduledMessage, 'id' | 'createdAt'>) => {
    const result = await addScheduledMessageAction(s)
    if ('error' in result) return undefined
    await refresh()
    return result.data
  }, [refresh])

  const updateScheduledStatus = useCallback(async (id: string, status: ScheduledMessage['status']) => {
    await updateScheduledStatusAction(id, status)
    setScheduledMessages((prev) => prev.map((s) => s.id === id ? { ...s, status } : s))
  }, [])

  const runDueScheduledMessages = useCallback(async () => {
    const due = await runDueAction()
    await refresh()
    return due
  }, [refresh])

  const triggerAutomation = useCallback(async (
    trigger: AutomationTrigger,
    opts: {
      contactId: string; contactName: string; contactEmail?: string
      contactPhone?: string; extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
    }
  ) => {
    await triggerAutomationAction(trigger, opts)
    await refresh()
  }, [refresh])

  const value: CommunicationStoreValue = {
    communications, templates, rules, sequences, scheduledMessages, loading,
    addCommunication, markRead, getTemplates, addTemplate, updateTemplate, deleteTemplate,
    searchCommunications, getCommunicationsByContactId,
    addRule, updateRule, deleteRule,
    addSequence, updateSequence, deleteSequence,
    addScheduledMessage, updateScheduledStatus, runDueScheduledMessages,
    triggerAutomation, refresh,
  }

  return (
    <CommunicationStoreContext.Provider value={value}>
      {children}
    </CommunicationStoreContext.Provider>
  )
}

export function useCommunicationStore() {
  const ctx = useContext(CommunicationStoreContext)
  if (!ctx) throw new Error('useCommunicationStore must be used within CommunicationStoreProvider')
  return ctx
}

// Keep this as a pure util — no server dependency
export function applyTemplatePlaceholders(
  body: string,
  subject: string,
  contactName: string,
  extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
): { body: string; subject: string } {
  const replace = (s: string) =>
    s.replace(/\{\{contact_name\}\}/gi, contactName)
     .replace(/\{\{invoice_number\}\}/g, extras?.invoice_number ?? '—')
     .replace(/\{\{due_date\}\}/g, extras?.due_date ?? '—')
     .replace(/\{\{date\}\}/g, extras?.date ?? '—')
     .replace(/\{\{time\}\}/g, extras?.time ?? '—')
  return { body: replace(body), subject: replace(subject) }
}

// Local helper for mapping raw rule rows returned from addRule
function mapRule(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    name: row.name as string,
    trigger: row.trigger as AutomationRule['trigger'],
    delayDays: (row.delay_days as number) ?? 0,
    templateId: row.template_id as string,
    enabled: (row.enabled as boolean) ?? true,
    createdAt: row.created_at as string,
  }
}