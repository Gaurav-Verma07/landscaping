"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import type { MessageTemplate } from "@/types/communication-types";
import type { Customer } from "@/types/customer-types";

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MessageTemplate[];
  customers: Customer[];
  onSchedule: (data: {
    contactId: string;
    contactName: string;
    templateId: string;
    sendAt: string;
  }) => void;
}

export function ScheduleMessageDialog({
  open,
  onOpenChange,
  templates,
  customers,
  onSchedule,
}: ScheduleMessageDialogProps) {
  const [contactId, setContactId] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");
  const [sendAt, setSendAt] = React.useState("");

  const contact = contactId ? customers.find((c) => c.id === contactId) : null;

  const handleSubmit = () => {
    if (!contact || !templateId || !sendAt) return;
    onSchedule({
      contactId: contact.id,
      contactName: contact.name,
      templateId,
      sendAt: new Date(sendAt).toISOString(),
    });
    onOpenChange(false);
    setContactId("");
    setTemplateId("");
    setSendAt("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule message</DialogTitle>
          <DialogDescription>
            Schedule a one-off message to be sent at a specific date and time
            (demo: run &quot;Run due now&quot; to send).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <FieldGroup>
            <FieldLabel>Contact</FieldLabel>
            <Select
              value={contactId || "none"}
              onValueChange={(v) => setContactId(v === "none" ? "" : v)}
            >
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
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Template</FieldLabel>
            <Select
              value={templateId || "none"}
              onValueChange={(v) => setTemplateId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Send at (date & time)</FieldLabel>
            <Input
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
            />
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!contact || !templateId || !sendAt}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
