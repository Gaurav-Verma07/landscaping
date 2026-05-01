import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Simple secret to prevent unauthorized calls
// Set CRON_SECRET in your .env.local and in Vercel env vars
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  // Verify secret header
  const secret = req.headers.get('x-cron-secret')
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to bypass RLS — this runs server-side only
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const now = new Date().toISOString()

    // Fetch all due scheduled campaigns with their owner's SMTP config
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        profiles (
          smtp_host, smtp_port, smtp_email,
          smtp_password, smtp_from_name
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)

    if (error) throw error
    if (!campaigns?.length) {
      return NextResponse.json({ processed: 0, message: 'No campaigns due' })
    }

    let processed = 0

    for (const campaign of campaigns) {
      const profile = campaign.profiles as any
      if (!profile?.smtp_host || !profile?.smtp_email || !profile?.smtp_password) {
        await supabase
          .from('campaigns')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', campaign.id)
        continue
      }

      // Mark as sending
      await supabase
        .from('campaigns')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', campaign.id)

      // Resolve recipients
      const recipients = await resolveRecipients(supabase, campaign)

      if (recipients.length === 0) {
        await supabase.from('campaigns').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          total_recipients: 0,
          total_sent: 0,
          total_failed: 0,
          updated_at: new Date().toISOString(),
        }).eq('id', campaign.id)
        processed++
        continue
      }

      // Create SMTP transporter
      const transporter = nodemailer.createTransport({
        host: profile.smtp_host,
        port: profile.smtp_port ?? 587,
        secure: profile.smtp_port === 465,
        auth: { user: profile.smtp_email, pass: profile.smtp_password },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      })

      let sent = 0
      let failed = 0
      const sendLogs: any[] = []
      const sentAt = new Date().toISOString()

      for (const r of recipients) {
        try {
          const personalBody = campaign.body.replace(/\{\{contact_name\}\}/gi, r.name || r.email)
          await transporter.sendMail({
            from: `"${profile.smtp_from_name || 'Outreach'}" <${profile.smtp_email}>`,
            to: r.name ? `"${r.name}" <${r.email}>` : r.email,
            subject: campaign.subject,
            text: personalBody,
            html: personalBody.replace(/\n/g, '<br />'),
          })
          sent++
          sendLogs.push({
            campaign_id: campaign.id,
            profile_id: campaign.profile_id,
            recipient_email: r.email,
            recipient_name: r.name,
            status: 'sent',
            sent_at: sentAt,
          })
        } catch (err) {
          failed++
          sendLogs.push({
            campaign_id: campaign.id,
            profile_id: campaign.profile_id,
            recipient_email: r.email,
            recipient_name: r.name,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
            sent_at: sentAt,
          })
        }
      }

      // Log sends
      if (sendLogs.length > 0) {
        await supabase.from('campaign_sends').insert(sendLogs)
      }

      // Update campaign status
      await supabase.from('campaigns').update({
        status: failed === recipients.length ? 'failed' : 'sent',
        sent_at: sentAt,
        total_recipients: recipients.length,
        total_sent: sent,
        total_failed: failed,
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id)

      processed++
    }

    return NextResponse.json({ processed })
  } catch (err) {
    console.error('Campaign cron error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing in browser
export async function GET(req: NextRequest) {
  return POST(req)
}

async function resolveRecipients(
  supabase: any,
  campaign: any
): Promise<{ email: string; name: string }[]> {
  const recipients: { email: string; name: string }[] = []
  const audienceType = campaign.audience_type
  const profileId = campaign.profile_id

  const isCustomer = ['all_customers', 'active_customers', 'past_customers', 'leads'].includes(audienceType)
  if (isCustomer) {
    let query = supabase
      .from('customers')
      .select('name, emails, status')
      .eq('profile_id', profileId)

    if (audienceType === 'active_customers') query = query.eq('status', 'Active')
    if (audienceType === 'past_customers') query = query.eq('status', 'Past')
    if (audienceType === 'leads') query = query.eq('status', 'Lead')

    const { data } = await query
    for (const c of data ?? []) {
      if (c.emails?.length) recipients.push({ email: c.emails[0], name: c.name })
    }
  }

  const isProspect = ['all_prospects', 'contacted_prospects', 'responded_prospects'].includes(audienceType)
  if (isProspect) {
    let query = supabase
      .from('outreach_prospects')
      .select('name, company, email, stage')
      .eq('profile_id', profileId)
      .not('email', 'is', null)

    if (audienceType === 'contacted_prospects') query = query.eq('stage', 'Contacted')
    if (audienceType === 'responded_prospects') query = query.eq('stage', 'Responded')

    const { data } = await query
    for (const p of data ?? []) {
      if (p.email) recipients.push({ email: p.email, name: p.name || p.company })
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