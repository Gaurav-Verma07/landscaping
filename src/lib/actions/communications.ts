'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Communication, MessageTemplate, AutomationRule,
  FollowUpSequence, ScheduledMessage, AutomationTrigger,
} from '@/lib/communication-types'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// ============================================
// COMMUNICATIONS
// ============================================

export async function getCommunications(): Promise<Communication[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('communications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapCommunication)
}

export async function getCommunicationsByContactId(contactId: string): Promise<Communication[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('communications')
    .select('*')
    .eq('profile_id', user.id)
    .eq('customer_id', contactId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapCommunication)
}

export async function addCommunication(comm: Omit<Communication, 'id'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('communications')
    .insert({
      profile_id: user.id,
      customer_id: comm.contactId,
      channel: comm.channel,
      subject: comm.subject,
      body: comm.body,
      contact_name: comm.contactName,
      contact_email: comm.contactEmail,
      contact_phone: comm.contactPhone,
      direction: comm.direction,
      read: comm.read,
      metadata: comm.metadata,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/communications')
  return { data: mapCommunication(data) }
}

export async function markRead(id: string) {
  const { supabase } = await getUser()
  await supabase.from('communications').update({ read: true }).eq('id', id)
  revalidatePath('/dashboard/communications')
  return { success: true }
}

// ============================================
// TEMPLATES
// ============================================

export async function getTemplates(): Promise<MessageTemplate[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .eq('profile_id', user.id)
    .order('name')
  return (data ?? []).map(mapTemplate)
}

export async function addTemplate(t: Omit<MessageTemplate, 'id' | 'updatedAt'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      profile_id: user.id,
      name: t.name,
      channel: t.channel,
      subject: t.subject,
      body: t.body,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/communications')
  return { data: mapTemplate(data) }
}

export async function updateTemplate(id: string, t: Partial<MessageTemplate>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('message_templates')
    .update({
      name: t.name,
      channel: t.channel,
      subject: t.subject,
      body: t.body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/communications')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const { supabase } = await getUser()
  await supabase.from('message_templates').delete().eq('id', id)
  revalidatePath('/dashboard/communications')
  return { success: true }
}

// ============================================
// AUTOMATION RULES
// ============================================

export async function getRules(): Promise<AutomationRule[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapRule)
}

export async function addRule(r: Omit<AutomationRule, 'id' | 'createdAt'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      profile_id: user.id,
      name: r.name,
      trigger: r.trigger,
      delay_days: r.delayDays,
      template_id: r.templateId,
      enabled: r.enabled,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/communications')
  return { data: mapRule(data) }
}

export async function updateRule(id: string, r: Partial<AutomationRule>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('automation_rules')
    .update({
      name: r.name,
      trigger: r.trigger,
      delay_days: r.delayDays,
      template_id: r.templateId,
      enabled: r.enabled,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteRule(id: string) {
  const { supabase } = await getUser()
  await supabase.from('automation_rules').delete().eq('id', id)
  return { success: true }
}

// ============================================
// FOLLOW-UP SEQUENCES
// ============================================

export async function getSequences(): Promise<FollowUpSequence[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('follow_up_sequences')
    .select('*, follow_up_sequence_steps(*)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapSequence)
}

export async function addSequence(s: Omit<FollowUpSequence, 'id' | 'createdAt'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: seq, error } = await supabase
    .from('follow_up_sequences')
    .insert({ profile_id: user.id, name: s.name })
    .select()
    .single()
  if (error) return { error: error.message }

  if (s.steps.length) {
    await supabase.from('follow_up_sequence_steps').insert(
      s.steps.map((step, i) => ({
        sequence_id: seq.id,
        delay_days: step.delayDays,
        template_id: step.templateId,
        sort_order: i,
      }))
    )
  }
  return { data: seq }
}

export async function updateSequence(id: string, s: Partial<FollowUpSequence>) {
  const { supabase } = await getUser()
  if (s.name) {
    await supabase.from('follow_up_sequences').update({ name: s.name }).eq('id', id)
  }
  if (s.steps) {
    await supabase.from('follow_up_sequence_steps').delete().eq('sequence_id', id)
    await supabase.from('follow_up_sequence_steps').insert(
      s.steps.map((step, i) => ({
        sequence_id: id,
        delay_days: step.delayDays,
        template_id: step.templateId,
        sort_order: i,
      }))
    )
  }
  return { success: true }
}

export async function deleteSequence(id: string) {
  const { supabase } = await getUser()
  await supabase.from('follow_up_sequences').delete().eq('id', id)
  return { success: true }
}

// ============================================
// SCHEDULED MESSAGES
// ============================================

export async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('profile_id', user.id)
    .order('send_at', { ascending: true })
  return (data ?? []).map(mapScheduledMessage)
}

export async function addScheduledMessage(s: Omit<ScheduledMessage, 'id' | 'createdAt'>) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert({
      profile_id: user.id,
      customer_id: s.contactId,
      contact_name: s.contactName,
      template_id: s.templateId,
      rule_id: s.ruleId,
      sequence_id: s.sequenceId,
      send_at: s.sendAt,
      status: s.status,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { data: mapScheduledMessage(data) }
}

export async function updateScheduledStatus(id: string, status: ScheduledMessage['status']) {
  const { supabase } = await getUser()
  await supabase.from('scheduled_messages').update({ status }).eq('id', id)
  return { success: true }
}

export async function runDueScheduledMessages(): Promise<ScheduledMessage[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'pending')
    .lte('send_at', now)
  const due = (data ?? []).map(mapScheduledMessage)
  await Promise.all(due.map((s) => updateScheduledStatus(s.id, 'sent')))
  return due
}

export async function triggerAutomation(
  trigger: AutomationTrigger,
  opts: {
    contactId: string
    contactName: string
    contactEmail?: string
    contactPhone?: string
    extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
  }
) {
  const { supabase, user } = await getUser()
  if (!user || !opts.contactId) return

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('profile_id', user.id)
    .eq('trigger', trigger)
    .eq('enabled', true)

  if (!rules?.length) return

  const dayMs = 24 * 60 * 60 * 1000
  await Promise.all(
    rules.map((rule) => {
      const sendAt = new Date(Date.now() + rule.delay_days * dayMs).toISOString()
      return supabase.from('scheduled_messages').insert({
        profile_id: user.id,
        customer_id: opts.contactId,
        contact_name: opts.contactName,
        template_id: rule.template_id,
        rule_id: rule.id,
        send_at: sendAt,
        status: 'pending',
      })
    })
  )
}

// ============================================
// MAPPERS
// ============================================

function mapCommunication(row: Record<string, unknown>): Communication {
  return {
    id: row.id as string,
    channel: row.channel as Communication['channel'],
    subject: (row.subject as string) ?? '',
    body: (row.body as string) ?? '',
    contactName: (row.contact_name as string) ?? '',
    contactId: (row.customer_id as string) ?? null,
    contactEmail: (row.contact_email as string) ?? undefined,
    contactPhone: (row.contact_phone as string) ?? undefined,
    direction: row.direction as Communication['direction'],
    read: (row.read as boolean) ?? false,
    createdAt: row.created_at as string,
    metadata: (row.metadata as Record<string, string>) ?? undefined,
  }
}

function mapTemplate(row: Record<string, unknown>): MessageTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    channel: row.channel as MessageTemplate['channel'],
    subject: (row.subject as string) ?? '',
    body: (row.body as string) ?? '',
    updatedAt: row.updated_at as string,
  }
}

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

function mapSequence(row: Record<string, unknown>): FollowUpSequence {
  const steps = (row.follow_up_sequence_steps as Record<string, unknown>[] ?? [])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((s) => ({
      delayDays: s.delay_days as number,
      templateId: s.template_id as string,
    }))
  return {
    id: row.id as string,
    name: row.name as string,
    steps,
    createdAt: row.created_at as string,
  }
}

function mapScheduledMessage(row: Record<string, unknown>): ScheduledMessage {
  return {
    id: row.id as string,
    contactId: (row.customer_id as string) ?? '',
    contactName: (row.contact_name as string) ?? '',
    templateId: (row.template_id as string) ?? '',
    sendAt: row.send_at as string,
    status: row.status as ScheduledMessage['status'],
    ruleId: (row.rule_id as string) ?? undefined,
    sequenceId: (row.sequence_id as string) ?? undefined,
    createdAt: row.created_at as string,
  }
}