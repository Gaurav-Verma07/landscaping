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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, FieldLabel } from "@/components/ui/field"
import type { FollowUpSequenceStep } from "@/lib/communication-types"
import type { MessageTemplate } from "@/lib/communication-types"
import { IconPlus, IconTrash } from "@tabler/icons-react"

interface FollowUpSequenceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: MessageTemplate[]
  onSave: (data: { name: string; steps: FollowUpSequenceStep[] }) => void
}

export function FollowUpSequenceFormDialog({
  open,
  onOpenChange,
  templates,
  onSave,
}: FollowUpSequenceFormDialogProps) {
  const [name, setName] = React.useState("")
  const [steps, setSteps] = React.useState<FollowUpSequenceStep[]>([
    { delayDays: 0, templateId: "" },
    { delayDays: 3, templateId: "" },
  ])

  const addStep = () => {
    setSteps((prev) => [...prev, { delayDays: 0, templateId: "" }])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, patch: Partial<FollowUpSequenceStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const handleSubmit = () => {
    const valid = steps.filter((s) => s.templateId)
    if (!name.trim() || valid.length === 0) return
    onSave({ name: name.trim(), steps: valid })
    onOpenChange(false)
    setName("")
    setSteps([{ delayDays: 0, templateId: "" }, { delayDays: 3, templateId: "" }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add follow-up sequence</DialogTitle>
          <DialogDescription>
            Multi-step sequence: each step sends a template after a delay (e.g. Day 0, Day 3, Day 7).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <FieldGroup>
            <FieldLabel>Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quote follow-up sequence" />
          </FieldGroup>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Steps</FieldLabel>
              <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                <IconPlus className="size-4" />
                Add step
              </Button>
            </div>
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2 items-center rounded border p-2">
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  placeholder="Days"
                  value={step.delayDays}
                  onChange={(e) => updateStep(index, { delayDays: parseInt(e.target.value, 10) || 0 })}
                />
                <Select
                  value={step.templateId || "none"}
                  onValueChange={(v) => updateStep(index, { templateId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Template</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                  <IconTrash className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !steps.some((s) => s.templateId)}>
            Add sequence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
