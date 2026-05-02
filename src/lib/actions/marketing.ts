'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Campaign, CampaignSend, AudienceType, AudienceFilters } from '@/types/marketing-types'
import { sendBulkEmails } from '@/lib/actions/email'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// ============================================
// CAMPAIGNS
// ============================================

export async function getCampaigns(): Promise<Campaign[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapCampaign)
}

export async function createCampaign(input: {
  name: string
  subject: string
  body: string
  audienceType: AudienceType
  audienceFilters: AudienceFilters
  scheduledAt?: string | null
}) {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      profile_id: user.id,
      name: input.name,
      subject: input.subject,
      body: input.body,
      audience_type: input.audienceType,
      audience_filters: input.audienceFilters,
      status: input.scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: input.scheduledAt ?? null,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/marketing')
  return { data: mapCampaign(data) }
}

export async function updateCampaign(id: string, input: Partial<{
  name: string
  subject: string
  body: string
  audienceType: AudienceType
  audienceFilters: AudienceFilters
  scheduledAt: string | null
  status: string
}>) {
  const { supabase } = await getUser()
  const { error } = await supabase
    .from('campaigns')
    .update({
      name: input.name,
      subject: input.subject,
      body: input.body,
      audience_type: input.audienceType,
      audience_filters: input.audienceFilters,
      scheduled_at: input.scheduledAt,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/marketing')
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const { supabase } = await getUser()
  await supabase.from('campaigns').delete().eq('id', id)
  revalidatePath('/dashboard/marketing')
  return { success: true }
}

// ============================================
// RESOLVE RECIPIENTS
// ============================================

export async function resolveRecipients(
  audienceType: AudienceType,
  filters: AudienceFilters
): Promise<{ email: string; name: string }[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const recipients: { email: string; name: string }[] = []

  // Customers
  const isCustomerAudience = ['all_customers', 'active_customers', 'past_customers', 'leads'].includes(audienceType)
  if (isCustomerAudience) {
    let query = supabase
      .from('customers')
      .select('name, emails, status, tags, lead_source, addresses')
      .eq('profile_id', user.id)

    if (audienceType === 'active_customers') query = query.eq('status', 'Active')
    if (audienceType === 'past_customers') query = query.eq('status', 'Past')
    if (audienceType === 'leads') query = query.eq('status', 'Lead')

    const { data } = await query
    for (const c of data ?? []) {
      if (!c.emails?.length) continue
      if (filters.tags?.length && !filters.tags.some((t: string) => c.tags?.includes(t))) continue
      if (filters.leadSource && c.lead_source !== filters.leadSource) continue
      if (filters.location && !c.addresses?.some((a: string) => a.toLowerCase().includes(filters.location!.toLowerCase()))) continue
      recipients.push({ email: c.emails[0], name: c.name })
    }
  }

  // Prospects
  const isProspectAudience = ['all_prospects', 'contacted_prospects', 'responded_prospects'].includes(audienceType)
  if (isProspectAudience) {
    let query = supabase
      .from('outreach_prospects')
      .select('name, company, email, stage, location')
      .eq('profile_id', user.id)
      .not('email', 'is', null)

    if (audienceType === 'contacted_prospects') query = query.eq('stage', 'Contacted')
    if (audienceType === 'responded_prospects') query = query.eq('stage', 'Responded')

    const { data } = await query
    for (const p of data ?? []) {
      if (!p.email) continue
      if (filters.location && !p.location?.toLowerCase().includes(filters.location.toLowerCase())) continue
      recipients.push({ email: p.email, name: p.name || p.company })
    }
  }

  // Deduplicate by email
  const seen = new Set<string>()
  return recipients.filter(r => {
    if (seen.has(r.email)) return false
    seen.add(r.email)
    return true
  })
}

// ============================================
// SEND CAMPAIGN
// ============================================

export async function sendCampaign(campaignId: string): Promise<{ sent: number; failed: number; error?: string }> {
  const { supabase, user } = await getUser()
  if (!user) return { sent: 0, failed: 0, error: 'Not authenticated' }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) return { sent: 0, failed: 0, error: 'Campaign not found' }

  // Mark as sending
  await supabase.from('campaigns').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', campaignId)

  const recipients = await resolveRecipients(campaign.audience_type, campaign.audience_filters ?? {})

  if (recipients.length === 0) {
    await supabase.from('campaigns').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      total_recipients: 0,
      total_sent: 0,
      total_failed: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', campaignId)
    return { sent: 0, failed: 0 }
  }

  // Send emails
  const result = await sendBulkEmails(
    recipients.map(r => ({ email: r.email, name: r.name, prospectId: '' })),
    campaign.subject,
    campaign.body
  )

  // Log each send
  const now = new Date().toISOString()
  const sendLogs = recipients.map((r, i) => ({
    campaign_id: campaignId,
    profile_id: user.id,
    recipient_email: r.email,
    recipient_name: r.name,
    status: i < result.sent ? 'sent' : 'failed',
    error: result.errors[i - result.sent] ?? null,
    sent_at: now,
  }))

  if (sendLogs.length > 0) {
    await supabase.from('campaign_sends').insert(sendLogs)
  }

  // Update campaign stats
  const finalStatus = result.failed === recipients.length ? 'failed' : 'sent'
  await supabase.from('campaigns').update({
    status: finalStatus,
    sent_at: now,
    total_recipients: recipients.length,
    total_sent: result.sent,
    total_failed: result.failed,
    updated_at: now,
  }).eq('id', campaignId)

  revalidatePath('/dashboard/marketing')
  return { sent: result.sent, failed: result.failed }
}

export async function getCampaignSends(campaignId: string): Promise<CampaignSend[]> {
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('campaign_sends')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sent_at', { ascending: false })
  return (data ?? []).map(mapSend)
}

// ============================================
// MAPPERS
// ============================================

function mapCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    name: row.name as string,
    subject: row.subject as string,
    body: row.body as string,
    audienceType: row.audience_type as Campaign['audienceType'],
    audienceFilters: (row.audience_filters as AudienceFilters) ?? {},
    status: row.status as Campaign['status'],
    scheduledAt: (row.scheduled_at as string) ?? null,
    sentAt: (row.sent_at as string) ?? null,
    totalRecipients: (row.total_recipients as number) ?? 0,
    totalSent: (row.total_sent as number) ?? 0,
    totalFailed: (row.total_failed as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapSend(row: Record<string, unknown>): CampaignSend {
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    recipientEmail: row.recipient_email as string,
    recipientName: (row.recipient_name as string) ?? undefined,
    status: row.status as CampaignSend['status'],
    error: (row.error as string) ?? undefined,
    sentAt: row.sent_at as string,
  }
}