'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Reply } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { useCommunicationStore } from '@/lib/stores'
import { useOutreachStore } from '@/lib/stores'
import type { Communication } from '@/types/communication-types'

interface LogReplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalComm: Communication | null
}

export function LogReplyDialog({ open, onOpenChange, originalComm }: LogReplyDialogProps) {
  const { addCommunication, refresh: refreshComms } = useCommunicationStore()
  const { moveProspectStage, refresh: refreshOutreach } = useOutreachStore()
  const [replyBody, setReplyBody] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!replyBody.trim()) { toast.error('Please paste the reply content.'); return }
    if (!originalComm) return

    setSaving(true)
    try {
      // Log reply as inbound communication
      await addCommunication({
        channel: originalComm.channel,
        subject: originalComm.subject ? `Re: ${originalComm.subject}` : '',
        body: replyBody.trim(),
        contactName: originalComm.contactName,
        contactId: originalComm.contactId,
        prospectId: originalComm.prospectId,
        contactType: originalComm.contactType,
        contactEmail: originalComm.contactEmail,
        contactPhone: originalComm.contactPhone,
        direction: 'inbound',
        read: false,
        createdAt: new Date().toISOString(),
      })

      // Move prospect to Responded if it has a prospectId
      if (originalComm.prospectId) {
        await moveProspectStage(originalComm.prospectId, 'Responded')
        await refreshOutreach()
        toast.success('Reply logged. Prospect moved to Responded.')
      } else {
        toast.success('Reply logged.')
      }

      await refreshComms()
      setReplyBody('')
      onOpenChange(false)
    } catch {
      toast.error('Failed to log reply.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setReplyBody('')
    onOpenChange(next)
  }

  if (!originalComm) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Reply className="size-4" />
            Log Reply from {originalComm.contactName}
          </DialogTitle>
          <DialogDescription>
            Paste the reply you received. It will be logged as an inbound message
            {originalComm.prospectId ? ' and the prospect will move to Responded.' : '.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {originalComm.subject && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Re: {originalComm.subject}
            </div>
          )}
          <Field>
            <FieldLabel>Reply content</FieldLabel>
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Paste the prospect's reply here..."
              rows={6}
              className="resize-none"
              autoFocus
            />
            <FieldDescription>
              Copy the reply from your email inbox and paste it here.
            </FieldDescription>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !replyBody.trim()}>
            {saving ? 'Saving...' : 'Log reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}