'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SmtpRequiredBannerProps {
  /** Extra className for margin tweaks */
  className?: string
}

/**
 * Shows a warning banner when SMTP is not configured.
 * Drop this inside any dialog that sends email — render it only when
 * `smtpConfigured === false` AND the selected channel is 'email'.
 */
export function SmtpRequiredBanner({ className }: SmtpRequiredBannerProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="size-4" />
      <AlertDescription className="flex flex-wrap items-center gap-1">
        Email is not configured.{' '}
        <Link
          href="/dashboard/management/settings#email_config"
          className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
        >
          Set up SMTP in Settings → Email configuration
        </Link>{' '}
        to send emails.
      </AlertDescription>
    </Alert>
  )
}