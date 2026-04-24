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
import type {
  AutomationRule,
  AutomationTrigger,
} from "@/lib/communication-types";
import { AUTOMATION_TRIGGER_LABELS } from "@/lib/communication-types";
import type { MessageTemplate } from "@/lib/communication-types";

interface AutomationRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MessageTemplate[];
  onSave: (data: {
    name: string;
    trigger: AutomationTrigger;
    delayDays: number;
    templateId: string;
    enabled: boolean;
  }) => void;
}

export function AutomationRuleFormDialog({
  open,
  onOpenChange,
  templates,
  onSave,
}: AutomationRuleFormDialogProps) {
  const [name, setName] = React.useState("");
  const [trigger, setTrigger] = React.useState<AutomationTrigger>("quote_sent");
  const [delayDays, setDelayDays] = React.useState(3);
  const [templateId, setTemplateId] = React.useState("");

  const handleSubmit = () => {
    if (!name.trim() || !templateId) return;
    onSave({
      name: name.trim(),
      trigger,
      delayDays,
      templateId,
      enabled: true,
    });
    onOpenChange(false);
    setName("");
    setTrigger("quote_sent");
    setDelayDays(3);
    setTemplateId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add automation rule</DialogTitle>
          <DialogDescription>
            When a trigger happens, schedule a message after a delay using a
            template.
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
            <FieldLabel>Trigger</FieldLabel>
            <Select
              value={trigger}
              onValueChange={(v) => setTrigger(v as AutomationTrigger)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(AUTOMATION_TRIGGER_LABELS) as AutomationTrigger[]
                ).map((t) => (
                  <SelectItem key={t} value={t}>
                    {AUTOMATION_TRIGGER_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Delay (days after trigger)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value, 10) || 0)}
            />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !templateId}>
            Add rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
