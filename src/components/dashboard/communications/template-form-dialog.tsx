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
import { FieldGroup, FieldLabel } from "@/components/ui/field"
import type { MessageTemplate } from "@/lib/communication-types"
import type { CommunicationChannel } from "@/lib/communication-types"
import { CHANNEL_LABELS } from "@/lib/communication-types"

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate | null
  onSave: (t: Omit<MessageTemplate, "id" | "updatedAt">) => void
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateFormDialogProps) {
  const [name, setName] = React.useState("")
  const [channel, setChannel] = React.useState<CommunicationChannel>("email")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")

  const isEdit = !!template?.id

  React.useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name)
        setChannel(template.channel)
        setSubject(template.subject)
        setBody(template.body)
      } else {
        setName("")
        setChannel("email")
        setSubject("")
        setBody("")
      }
    }
  }, [open, template])

  const handleSubmit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (!body.trim()) return
    onSave({ name: trimmedName, channel, subject: subject.trim(), body: body.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "Add template"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the message template."
              : "Create a reusable message template for emails or SMS."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <FieldGroup>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quote follow-up"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Channel</FieldLabel>
            <Select value={channel} onValueChange={(v) => setChannel(v as CommunicationChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">{CHANNEL_LABELS.email}</SelectItem>
                <SelectItem value="sms">{CHANNEL_LABELS.sms}</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          {channel === "email" && (
            <FieldGroup>
              <FieldLabel>Subject</FieldLabel>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject or leave blank"
              />
            </FieldGroup>
          )}
          <FieldGroup>
            <FieldLabel>Body</FieldLabel>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message body. Use {{contact_name}}, {{invoice_number}}, etc. for placeholders."
              rows={5}
              className="resize-none"
            />
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !body.trim()}>
            {isEdit ? "Save" : "Add template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
