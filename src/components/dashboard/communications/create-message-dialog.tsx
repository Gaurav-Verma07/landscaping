"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type { CommunicationChannel } from "@/lib/communication-types"
import { CHANNEL_LABELS } from "@/lib/communication-types"
import { useCustomerStore } from "@/lib/customer-store"
import { useCommunicationStore, applyTemplatePlaceholders } from "@/lib/communication-store"
import { toast } from "sonner"

interface CreateMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMessageDialog({ open, onOpenChange }: CreateMessageDialogProps) {
  const { customers, addTimelineEvent } = useCustomerStore()
  const { templates, addCommunication } = useCommunicationStore()

  const [channel, setChannel] = React.useState<CommunicationChannel>("email")
  const [contactId, setContactId] = React.useState("")
  const [templateId, setTemplateId] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const contact = contactId ? customers.find((c) => c.id === contactId) : null
  const selectedTemplate = templateId ? templates.find((t) => t.id === templateId) : null

  React.useEffect(() => {
    if (selectedTemplate && contact) {
      const { body: b, subject: s } = applyTemplatePlaceholders(
        selectedTemplate.body,
        selectedTemplate.subject,
        contact.name
      )
      setChannel(selectedTemplate.channel)
      setSubject(s)
      setBody(b)
    }
  }, [selectedTemplate?.id, contact?.id])

  const reset = () => {
    setChannel("email")
    setContactId("")
    setTemplateId("")
    setSubject("")
    setBody("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSend = async () => {
    if (!contact) {
      toast.error("Please select a contact.")
      return
    }
    if (!body.trim()) {
      toast.error("Please enter a message.")
      return
    }
    if (channel === "email" && !subject.trim()) {
      toast.error("Please enter a subject for email.")
      return
    }
    setSending(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      const now = new Date().toISOString()
      addCommunication({
        channel,
        subject: channel === "email" ? subject : "",
        body,
        contactName: contact.name,
        contactId: contact.id,
        contactEmail: contact.emails?.[0],
        contactPhone: contact.phones?.[0],
        direction: "outbound",
        read: true,
        createdAt: now,
      })
      addTimelineEvent(contact.id, {
        type: "communication",
        title: channel === "email" ? subject || "Email" : channel === "sms" ? "SMS" : "Call",
        date: now,
        description: body.slice(0, 200),
      })
      toast.success("Message sent.")
      handleOpenChange(false)
    } catch {
      toast.error("Failed to send.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create message</DialogTitle>
          <DialogDescription>Compose and send an email or SMS to a contact. Use a template to fill subject and body.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <FieldGroup>
            <FieldLabel>Use template</FieldLabel>
            <Select value={templateId || "none"} onValueChange={(v) => setTemplateId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="None – write from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None – write from scratch</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({CHANNEL_LABELS[t.channel]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Optional. Picks channel, subject and body; you can edit after.</FieldDescription>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Channel</FieldLabel>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as CommunicationChannel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">{CHANNEL_LABELS.email}</SelectItem>
                <SelectItem value="sms">{CHANNEL_LABELS.sms}</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>To</FieldLabel>
            <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select contact</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.companyName ? ` · ${c.companyName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contact && (
              <FieldDescription>
                {channel === "email"
                  ? contact.emails?.[0] || "No email"
                  : contact.phones?.[0] || "No phone"}
              </FieldDescription>
            )}
          </FieldGroup>
          {channel === "email" && (
            <FieldGroup>
              <FieldLabel>Subject</FieldLabel>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
            </FieldGroup>
          )}
          <FieldGroup>
            <FieldLabel>Message</FieldLabel>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="resize-none"
            />
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
