'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { useOutreachStore } from '@/lib/outreach-store'
import { useCommunicationStore } from '@/lib/communication-store'
import { applyTemplatePlaceholders } from '@/lib/communication-store'
import { CHANNEL_LABELS, type CommunicationChannel } from '@/lib/communication-types'
import type { OutreachProspect } from '@/lib/outreach-types'

interface ProspectSendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: OutreachProspect | null
  onSent?: () => void
}

export function ProspectSendMessageDialog({
  open,
  onOpenChange,
  prospect,
  onSent,
}: ProspectSendMessageDialogProps) {
  const { moveProspectStage } = useOutreachStore()
  const { templates, addCommunication } = useCommunicationStore()

  const [channel, setChannel] = useState<CommunicationChannel>('email')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const selectedTemplate = templateId ? templates.find((t) => t.id === templateId) : null

  // Pre-fill from template
  useEffect(() => {
    if (selectedTemplate && prospect) {
      const { body: b, subject: s } = applyTemplatePlaceholders(
        selectedTemplate.body,
        selectedTemplate.subject,
        prospect.name || prospect.company,
      )
      setChannel(selectedTemplate.channel)
      setSubject(s)
      setBody(b)
    }
  }, [selectedTemplate?.id, prospect?.id])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setChannel('email')
      setTemplateId('')
      setSubject('')
      setBody('')
    }
  }, [open])

  const handleSend = async () => {
    if (!prospect) return
    if (!body.trim()) { toast.error('Please enter a message.'); return }
    if (channel === 'email' && !subject.trim()) { toast.error('Please enter a subject.'); return }

    setSending(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      const now = new Date().toISOString()

      addCommunication({
        channel,
        subject: channel === 'email' ? subject : '',
        body,
        contactName: prospect.name || prospect.company,
        contactId: prospect.id,
        contactEmail: prospect.email,
        contactPhone: prospect.phone,
        direction: 'outbound',
        read: true,
        createdAt: now,
      })

      // Auto-move stage to Contacted
      if (prospect.stage === 'New') {
        await moveProspectStage(prospect.id, 'Contacted')
      }

      toast.success('Message sent. Prospect moved to Contacted.')
      onSent?.()
      onOpenChange(false)
    } catch {
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  if (!prospect) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Sending to <span className="font-medium">{prospect.company || prospect.name}</span>
            {prospect.stage === 'New' && ' — stage will move to Contacted after sending.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field>
            <FieldLabel>Use template</FieldLabel>
            <Select value={templateId || 'none'} onValueChange={(v) => setTemplateId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="None – write from scratch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None – write from scratch</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({CHANNEL_LABELS[t.channel]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Picks channel, subject and body — you can edit after.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Channel</FieldLabel>
            <Select value={channel} onValueChange={(v) => setChannel(v as CommunicationChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">{CHANNEL_LABELS.email}</SelectItem>
                <SelectItem value="sms">{CHANNEL_LABELS.sms}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>To</FieldLabel>
            <Input
              value={
                channel === 'email'
                  ? prospect.email || 'No email on file'
                  : prospect.phone || 'No phone on file'
              }
              disabled
              className="bg-muted"
            />
          </Field>

          {channel === 'email' && (
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            </Field>
          )}

          <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="resize-none"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}