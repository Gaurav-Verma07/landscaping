'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, Mail, MessageSquare } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { useOutreachStore } from '@/lib/stores'
import { useCommunicationStore } from '@/lib/stores'
import { sendBulkEmails } from '@/lib/actions/email'
import { CHANNEL_LABELS, type CommunicationChannel } from '@/types/communication-types'
import type { OutreachProspect } from '@/types/outreach-types'
import { applyTemplatePlaceholders } from '@/utils/utils'

interface ProspectSendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect?: OutreachProspect | null
  prospects?: OutreachProspect[]
  onSent?: () => void
}

export function ProspectSendMessageDialog({
  open, onOpenChange, prospect, prospects, onSent,
}: ProspectSendMessageDialogProps) {
  const isBulk = !!prospects && prospects.length > 0
  const allProspects = isBulk ? prospects : prospect ? [prospect] : []

  const { bulkUpdate } = useOutreachStore()
  const { templates, addCommunication, refresh: refreshComms } = useCommunicationStore()

  const [channel, setChannel] = useState<CommunicationChannel>('email')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const selectedTemplate = templateId ? templates.find((t) => t.id === templateId) : null
  const withEmail = allProspects.filter(p => p.email?.trim())
  const withoutEmail = allProspects.filter(p => !p.email?.trim())

  useEffect(() => {
    if (selectedTemplate) {
      const contactName = isBulk ? '{{contact_name}}' : (prospect?.name || prospect?.company || '')
      const { body: b, subject: s } = applyTemplatePlaceholders(
        selectedTemplate.body, selectedTemplate.subject, contactName,
      )
      setChannel(selectedTemplate.channel)
      setSubject(s)
      setBody(b)
    }
  }, [selectedTemplate?.id])

  useEffect(() => {
    if (open) { setChannel('email'); setTemplateId(''); setSubject(''); setBody('') }
  }, [open])

  const handleSend = async () => {
    if (allProspects.length === 0) return
    if (!body.trim()) { toast.error('Please enter a message.'); return }
    if (channel === 'email' && !subject.trim()) { toast.error('Please enter a subject.'); return }
    if (channel === 'email' && withEmail.length === 0) {
      toast.error('None of the selected prospects have an email address.')
      return
    }

    setSending(true)
    try {
      if (channel === 'email') {
        const recipients = withEmail.map(p => ({
          email: p.email!,
          name: p.name || p.company,
          prospectId: p.id,
        }))

        const result = await sendBulkEmails(recipients, subject, body)

        // Log each email in Communications with prospectId + contactType: 'prospect'
        const now = new Date().toISOString()
        for (const p of withEmail) {
          addCommunication({
            channel: 'email',
            subject,
            body,
            contactName: p.name || p.company,
            contactId: null,
            prospectId: p.id,
            contactType: 'prospect',
            contactEmail: p.email,
            direction: 'outbound',
            read: true,
            createdAt: now,
          })
        }

        // Move New → Contacted
        const newProspectIds = withEmail.filter(p => p.stage === 'New').map(p => p.id)
        if (newProspectIds.length > 0) {
          await bulkUpdate(newProspectIds, { stage: 'Contacted' })
        }

        await refreshComms()

        const parts = [`Sent ${result.sent} email${result.sent !== 1 ? 's' : ''}.`]
        if (result.failed > 0) parts.push(`${result.failed} failed.`)
        if (withoutEmail.length > 0) parts.push(`${withoutEmail.length} skipped (no email).`)
        toast.success(parts.join(' '))
        if (result.errors.length > 0) console.error('Email errors:', result.errors)
      } else {
        const now = new Date().toISOString()
        for (const p of allProspects) {
          addCommunication({
            channel: 'sms',
            subject: '',
            body,
            contactName: p.name || p.company,
            contactId: null,
            prospectId: p.id,
            contactType: 'prospect',
            contactPhone: p.phone,
            direction: 'outbound',
            read: true,
            createdAt: now,
          })
        }
        toast.success(`${allProspects.length} SMS logged.`)
      }

      onSent?.()
      onOpenChange(false)
    } catch {
      toast.error('Failed to send messages.')
    } finally {
      setSending(false)
    }
  }

  if (allProspects.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? `Send Bulk Message (${allProspects.length})` : 'Send Message'}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              {isBulk ? (
                <span className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="default"><Mail className="size-3 mr-1" />{withEmail.length} with email</Badge>
                  {withoutEmail.length > 0 && (
                    <Badge variant="secondary">
                      <AlertTriangle className="size-3 mr-1" />
                      {withoutEmail.length} missing email — will be skipped
                    </Badge>
                  )}
                </span>
              ) : (
                <span>Sending to <span className="font-medium">{prospect?.company || prospect?.name}</span></span>
              )}
            </div>
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
                  <SelectItem key={t.id} value={t.id}>{t.name} ({CHANNEL_LABELS[t.channel]})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Use {`{{contact_name}}`} — replaced with each prospect's name.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Channel</FieldLabel>
            <Select value={channel} onValueChange={(v) => setChannel(v as CommunicationChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email"><span className="flex items-center gap-2"><Mail className="size-4" />{CHANNEL_LABELS.email}</span></SelectItem>
                <SelectItem value="sms"><span className="flex items-center gap-2"><MessageSquare className="size-4" />{CHANNEL_LABELS.sms}</span></SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {!isBulk && channel === 'email' && (
            <Field>
              <FieldLabel>To</FieldLabel>
              <Input value={prospect?.email || 'No email on file'} disabled className="bg-muted" />
            </Field>
          )}

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
              placeholder={isBulk ? "Use {{contact_name}} to personalise..." : "Type your message..."}
              rows={5}
              className="resize-none"
            />
          </Field>

          {channel === 'email' && (
            <p className="text-xs text-muted-foreground">
              Emails sent via your SMTP config in Settings → Email configuration.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || (channel === 'email' && withEmail.length === 0)}>
            {sending ? (
              <><Loader2 className="size-4 mr-2 animate-spin" />Sending...</>
            ) : channel === 'email' ? (
              `Send ${withEmail.length} email${withEmail.length !== 1 ? 's' : ''}`
            ) : (
              `Send ${allProspects.length} SMS`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}