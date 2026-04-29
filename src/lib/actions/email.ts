'use server'

import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

export interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  body: string
}

export interface BulkEmailResult {
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

async function getSmtpConfig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('smtp_host, smtp_port, smtp_email, smtp_password, smtp_from_name, company_email')
    .eq('id', user.id)
    .single()

  if (!profile?.smtp_host || !profile?.smtp_email || !profile?.smtp_password) {
    return { error: 'SMTP not configured. Go to Settings → Email to set up your email.' }
  }

  return { profile }
}

function createTransporter(profile: {
  smtp_host: string
  smtp_port: number
  smtp_email: string
  smtp_password: string
}) {
  return nodemailer.createTransport({
    host: profile.smtp_host,
    port: profile.smtp_port ?? 587,
    secure: (profile.smtp_port ?? 587) === 465,
    auth: {
      user: profile.smtp_email,
      pass: profile.smtp_password,
    },
  })
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success?: boolean; error?: string }> {
  const config = await getSmtpConfig()
  if ('error' in config) return { error: config.error }

  const { profile } = config
  const transporter = createTransporter(profile)

  try {
    await transporter.sendMail({
      from: `"${profile.smtp_from_name || 'Outreach'}" <${profile.smtp_email}>`,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      text: options.body,
      html: options.body.replace(/\n/g, '<br />'),
    })
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send email.' }
  }
}

export async function sendBulkEmails(
  recipients: { email: string; name: string; prospectId: string }[],
  subject: string,
  body: string
): Promise<BulkEmailResult> {
  const config = await getSmtpConfig()
  if ('error' in config) {
    return { sent: 0, failed: 0, skipped: recipients.length, errors: [config.error!] }
  }

  const { profile } = config
  const transporter = createTransporter(profile)

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of recipients) {
    try {
      // Personalise body — replace {{contact_name}} placeholder
      const personalBody = body.replace(/\{\{contact_name\}\}/gi, recipient.name || recipient.email)

      await transporter.sendMail({
        from: `"${profile.smtp_from_name || 'Outreach'}" <${profile.smtp_email}>`,
        to: recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email,
        subject,
        text: personalBody,
        html: personalBody.replace(/\n/g, '<br />'),
      })
      sent++
    } catch (err) {
      failed++
      errors.push(`${recipient.email}: ${err instanceof Error ? err.message : 'Failed'}`)
    }
  }

  return { sent, failed, skipped: 0, errors }
}

export async function testSmtpConnection(
  host: string,
  port: number,
  email: string,
  password: string
): Promise<{ success?: boolean; error?: string }> {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: email, pass: password },
    connectionTimeout: 5000,
    greetingTimeout: 5000, 
    socketTimeout: 5000, 
  })
  try {
    await transporter.verify()
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Connection failed.' }
  }
}