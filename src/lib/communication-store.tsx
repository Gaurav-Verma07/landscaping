"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type {
  Communication,
  MessageTemplate,
  AutomationRule,
  FollowUpSequence,
  ScheduledMessage,
} from "@/lib/communication-types"
import { COMMUNICATION_SEED_DATA } from "@/lib/communication-seed"
import { MESSAGE_TEMPLATE_SEED } from "@/lib/communication-templates-seed"

const COMMS_STORAGE_KEY = "landscaping-v2-communications-sent"
const TEMPLATES_STORAGE_KEY = "landscaping-v2-communication-templates"
const RULES_STORAGE_KEY = "landscaping-v2-automation-rules"
const SEQUENCES_STORAGE_KEY = "landscaping-v2-followup-sequences"
const SCHEDULED_STORAGE_KEY = "landscaping-v2-scheduled-messages"

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadSentCommunications(): Communication[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(COMMS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Communication[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadTemplates(): MessageTemplate[] {
  if (typeof window === "undefined") return [...MESSAGE_TEMPLATE_SEED]
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!raw) return [...MESSAGE_TEMPLATE_SEED]
    const parsed = JSON.parse(raw) as MessageTemplate[]
    return Array.isArray(parsed) ? parsed : [...MESSAGE_TEMPLATE_SEED]
  } catch {
    return [...MESSAGE_TEMPLATE_SEED]
  }
}

function loadRules(): AutomationRule[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AutomationRule[]
  } catch {
    return []
  }
}

function loadSequences(): FollowUpSequence[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SEQUENCES_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FollowUpSequence[]
  } catch {
    return []
  }
}

function loadScheduled(): ScheduledMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SCHEDULED_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ScheduledMessage[]
  } catch {
    return []
  }
}

type CommunicationStoreValue = {
  communications: Communication[]
  templates: MessageTemplate[]
  rules: AutomationRule[]
  sequences: FollowUpSequence[]
  scheduledMessages: ScheduledMessage[]
  addCommunication: (comm: Omit<Communication, "id">) => Communication
  getTemplates: () => MessageTemplate[]
  addTemplate: (t: Omit<MessageTemplate, "id" | "updatedAt">) => MessageTemplate
  updateTemplate: (id: string, t: Partial<MessageTemplate>) => void
  deleteTemplate: (id: string) => void
  searchCommunications: (query: string) => Communication[]
  getCommunicationsByContactId: (contactId: string) => Communication[]
  addRule: (r: Omit<AutomationRule, "id" | "createdAt">) => AutomationRule
  updateRule: (id: string, r: Partial<AutomationRule>) => void
  deleteRule: (id: string) => void
  addSequence: (s: Omit<FollowUpSequence, "id" | "createdAt">) => FollowUpSequence
  updateSequence: (id: string, s: Partial<FollowUpSequence>) => void
  deleteSequence: (id: string) => void
  addScheduledMessage: (s: Omit<ScheduledMessage, "id" | "createdAt">) => ScheduledMessage
  updateScheduledStatus: (id: string, status: ScheduledMessage["status"]) => void
  runDueScheduledMessages: (contactName?: string, contactEmail?: string, contactPhone?: string) => ScheduledMessage[]
}

const CommunicationStoreContext = createContext<CommunicationStoreValue | null>(null)

export function CommunicationStoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sentComms, setSentComms] = useState<Communication[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [sequences, setSequences] = useState<FollowUpSequence[]>([])
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([])

  useEffect(() => {
    setSentComms(loadSentCommunications())
    setTemplates(loadTemplates())
    setRules(loadRules())
    setSequences(loadSequences())
    setScheduledMessages(loadScheduled())
  }, [])

  const communications = React.useMemo(
    () => [...COMMUNICATION_SEED_DATA, ...sentComms].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [sentComms]
  )

  const addCommunication = useCallback((comm: Omit<Communication, "id">) => {
    const full: Communication = { ...comm, id: `comm-${createId()}` }
    setSentComms((prev) => {
      const next = [full, ...prev]
      localStorage.setItem(COMMS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return full
  }, [])

  const persistTemplates = useCallback((list: MessageTemplate[]) => {
    setTemplates(list)
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(list))
  }, [])

  const getTemplates = useCallback(() => templates, [templates])

  const addTemplate = useCallback(
    (t: Omit<MessageTemplate, "id" | "updatedAt">) => {
      const now = new Date().toISOString()
      const full: MessageTemplate = { ...t, id: `tpl-${createId()}`, updatedAt: now }
      setTemplates((prev) => {
        const next = [full, ...prev]
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next))
        return next
      })
      return full
    },
    []
  )

  const updateTemplate = useCallback((id: string, data: Partial<MessageTemplate>) => {
    const now = new Date().toISOString()
    setTemplates((prev) => {
      const next = prev.map((x) =>
        x.id === id ? { ...x, ...data, updatedAt: now } : x
      )
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((x) => x.id !== id)
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const searchCommunications = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim()
      if (!q) return communications.slice(0, 10)
      return communications.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.body.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          (c.contactEmail?.toLowerCase().includes(q) ?? false) ||
          (c.contactPhone?.includes(q) ?? false)
      ).slice(0, 10)
    },
    [communications]
  )

  const getCommunicationsByContactId = useCallback(
    (contactId: string) =>
      communications.filter((c) => c.contactId === contactId),
    [communications]
  )

  const addRule = useCallback(
    (r: Omit<AutomationRule, "id" | "createdAt">) => {
      const now = new Date().toISOString()
      const full: AutomationRule = { ...r, id: `rule-${createId()}`, createdAt: now }
      setRules((prev) => {
        const next = [full, ...prev]
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(next))
        return next
      })
      return full
    },
    []
  )

  const updateRule = useCallback((id: string, data: Partial<AutomationRule>) => {
    setRules((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, ...data } : x))
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => {
      const next = prev.filter((x) => x.id !== id)
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addSequence = useCallback(
    (s: Omit<FollowUpSequence, "id" | "createdAt">) => {
      const now = new Date().toISOString()
      const full: FollowUpSequence = { ...s, id: `seq-${createId()}`, createdAt: now }
      setSequences((prev) => {
        const next = [full, ...prev]
        localStorage.setItem(SEQUENCES_STORAGE_KEY, JSON.stringify(next))
        return next
      })
      return full
    },
    []
  )

  const updateSequence = useCallback((id: string, data: Partial<FollowUpSequence>) => {
    setSequences((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, ...data } : x))
      localStorage.setItem(SEQUENCES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const deleteSequence = useCallback((id: string) => {
    setSequences((prev) => {
      const next = prev.filter((x) => x.id !== id)
      localStorage.setItem(SEQUENCES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addScheduledMessage = useCallback(
    (s: Omit<ScheduledMessage, "id" | "createdAt">) => {
      const now = new Date().toISOString()
      const full: ScheduledMessage = { ...s, id: `sched-${createId()}`, createdAt: now }
      setScheduledMessages((prev) => {
        const next = [full, ...prev]
        localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(next))
        return next
      })
      return full
    },
    []
  )

  const updateScheduledStatus = useCallback((id: string, status: ScheduledMessage["status"]) => {
    setScheduledMessages((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, status } : x))
      localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const runDueScheduledMessages = useCallback(
    (contactName?: string, contactEmail?: string, contactPhone?: string): ScheduledMessage[] => {
      const now = new Date().toISOString()
      const due = scheduledMessages.filter(
        (s) => s.status === "pending" && s.sendAt <= now
      )
      due.forEach((s) => updateScheduledStatus(s.id, "sent"))
      return due
    },
    [scheduledMessages, updateScheduledStatus]
  )

  const value: CommunicationStoreValue = {
    communications,
    templates,
    rules,
    sequences,
    scheduledMessages,
    addCommunication,
    getTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    searchCommunications,
    getCommunicationsByContactId,
    addRule,
    updateRule,
    deleteRule,
    addSequence,
    updateSequence,
    deleteSequence,
    addScheduledMessage,
    updateScheduledStatus,
    runDueScheduledMessages,
  }

  return (
    <CommunicationStoreContext.Provider value={value}>
      {children}
    </CommunicationStoreContext.Provider>
  )
}

export function useCommunicationStore() {
  const ctx = useContext(CommunicationStoreContext)
  if (!ctx) throw new Error("useCommunicationStore must be used within CommunicationStoreProvider")
  return ctx
}

export function applyTemplatePlaceholders(
  body: string,
  subject: string,
  contactName: string,
  extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
): { body: string; subject: string } {
  let outBody = body
    .replace(/\{\{contact_name\}\}/gi, contactName)
    .replace(/\{\{invoice_number\}\}/g, extras?.invoice_number ?? "—")
    .replace(/\{\{due_date\}\}/g, extras?.due_date ?? "—")
    .replace(/\{\{date\}\}/g, extras?.date ?? "—")
    .replace(/\{\{time\}\}/g, extras?.time ?? "—")
  let outSubject = subject
    .replace(/\{\{contact_name\}\}/gi, contactName)
    .replace(/\{\{invoice_number\}\}/g, extras?.invoice_number ?? "—")
    .replace(/\{\{due_date\}\}/g, extras?.due_date ?? "—")
  return { body: outBody, subject: outSubject }
}
