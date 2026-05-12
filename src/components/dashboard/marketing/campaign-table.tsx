'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { IconDotsVertical } from '@tabler/icons-react'
import { Send, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMarketingStore } from '@/lib/stores'
import { getProfile } from '@/lib/actions/profile'
import {
  AUDIENCE_TYPE_LABELS, CAMPAIGN_STATUS_LABELS, type Campaign,
} from '@/types/marketing-types'
import Link from 'next/link'

interface CampaignTableProps {
  campaigns: Campaign[]
  onEdit: (c: Campaign) => void
  onViewSends: (c: Campaign) => void
}

function statusVariant(status: Campaign['status']) {
  if (status === 'sent') return 'default'
  if (status === 'sending') return 'secondary'
  if (status === 'scheduled') return 'outline'
  if (status === 'failed') return 'destructive'
  return 'secondary'
}

export function CampaignTable({ campaigns, onEdit, onViewSends }: CampaignTableProps) {
  const { deleteCampaign, sendCampaign, loading: marketLoading } = useMarketingStore()
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    getProfile().then((data) => {
      if (data) {
        const p = data as any
        setSmtpConfigured(!!(p.smtp_host && p.smtp_email && p.smtp_password))
      } else {
        setSmtpConfigured(false)
      }
    }).catch(() => setSmtpConfigured(false))
  }, [])

  const handleSend = async (campaign: Campaign) => {
    if (campaign.status === 'sent') return
    setSendingId(campaign.id)
    try {
      const result = await sendCampaign(campaign.id)
      if (result.error) { toast.error(result.error); return }
      const parts = [`Sent ${result.sent} email${result.sent !== 1 ? 's' : ''}.`]
      if (result.failed > 0) parts.push(`${result.failed} failed.`)
      toast.success(parts.join(' '))
    } catch {
      toast.error('Failed to send campaign.')
    } finally {
      setSendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteCampaign(deleteId)
    toast.success('Campaign deleted.')
    setDeleteId(null)
  }

  if (marketLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Loading campaigns...
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        No campaigns yet. Create one to get started.
      </div>
    )
  }

  const smtpBlocked = smtpConfigured === false

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map(c => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.subject}</div>
              </TableCell>
              <TableCell className="text-sm">{AUDIENCE_TYPE_LABELS[c.audienceType]}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(c.status)} className="text-xs">
                  {CAMPAIGN_STATUS_LABELS[c.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {c.status === 'sent' ? (
                  <span>{c.totalSent.toLocaleString()} / {c.totalRecipients.toLocaleString()}</span>
                ) : '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <IconDotsVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(c)}>Edit</DropdownMenuItem>
                    {c.status === 'sent' && (
                      <DropdownMenuItem onClick={() => onViewSends(c)}>View sends</DropdownMenuItem>
                    )}
                    {c.status !== 'sent' && c.status !== 'sending' && (
                      smtpBlocked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* DropdownMenuItem doesn't forward refs cleanly when disabled, wrap in span */}
                            <span>
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <AlertTriangle className="size-4 mr-2 text-amber-500" />
                                Send now
                              </DropdownMenuItem>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px] text-center">
                            Email not configured.{' '}
                            <Link
                              href="/dashboard/management/settings#email_config"
                              className="underline underline-offset-2"
                            >
                              Set up SMTP in Settings
                            </Link>{' '}
                            to send campaigns.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleSend(c)}
                          disabled={sendingId === c.id}
                        >
                          {sendingId === c.id ? (
                            <><Loader2 className="size-4 mr-2 animate-spin" />Sending...</>
                          ) : (
                            <><Send className="size-4 mr-2" />Send now</>
                          )}
                        </DropdownMenuItem>
                      )
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(c.id)}
                      disabled={c.status === 'sending'}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign and all its send history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}