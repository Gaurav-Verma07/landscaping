'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getCampaignSends } from '@/lib/actions/marketing'
import type { Campaign, CampaignSend } from '@/lib/marketing-types'

interface CampaignSendsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
}

export function CampaignSendsDialog({ open, onOpenChange, campaign }: CampaignSendsDialogProps) {
  const [sends, setSends] = useState<CampaignSend[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !campaign) return
    setLoading(true)
    getCampaignSends(campaign.id).then(data => {
      setSends(data)
      setLoading(false)
    })
  }, [open, campaign?.id])

  if (!campaign) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send log — {campaign.name}</DialogTitle>
          <DialogDescription>
            {campaign.totalSent} sent · {campaign.totalFailed} failed · {campaign.totalRecipients} total recipients
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : sends.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No send records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sends.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{s.recipientName || '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.recipientEmail}</div>
                    </TableCell>
                    <TableCell>
                      {s.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="size-3.5" /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-destructive">
                          <XCircle className="size-3.5" /> Failed
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(s.sentAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {s.error || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}