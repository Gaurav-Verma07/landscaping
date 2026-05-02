"use client"

import { useState } from "react"
import { Check, Circle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TIMELINE_MILESTONE_TYPES,
  MILESTONE_TYPE_LABELS,
  type Project,
  type TimelineMilestoneType,
} from "@/types/project-types"
import { useProjectStore } from "@/lib/stores"
import { format } from "date-fns"
import { toast } from "sonner"

interface ProjectTimelineSectionProps {
  project: Project
}

export function ProjectTimelineSection({ project }: ProjectTimelineSectionProps) {
  const { updateTimelineMilestone, addTimelineMilestone } = useProjectStore()
  const [addOpen, setAddOpen] = useState(false)
  const [newType, setNewType] = useState<TimelineMilestoneType>("work_phase")
  const [newTitle, setNewTitle] = useState("")
  const [newDueDate, setNewDueDate] = useState("")

  const handleAdd = () => {
    if (!newTitle.trim()) {
      toast.error("Title is required.")
      return
    }
    addTimelineMilestone(project.id, {
      type: newType,
      title: newTitle.trim(),
      dueDate: newDueDate || null,
      completedAt: null,
    })
    toast.success("Milestone added.")
    setNewTitle("")
    setNewDueDate("")
    setAddOpen(false)
  }

  const toggleComplete = (milestoneId: string, completed: boolean) => {
    updateTimelineMilestone(project.id, milestoneId, {
      completedAt: completed ? new Date().toISOString() : null,
    })
    toast.success(completed ? "Milestone marked complete." : "Milestone unmarked.")
  }

  const sortedTimeline = [...project.timeline].sort((a, b) => a.order - b.order)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Timeline</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add milestone
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          Deposit payment, material ordering, crew assignment, work phases, and final walkthrough. Mark complete as you progress.
        </p>
        <ul className="space-y-3">
          {sortedTimeline.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <button
                type="button"
                onClick={() => toggleComplete(m.id, !m.completedAt)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={m.completedAt ? "Mark incomplete" : "Mark complete"}
              >
                {m.completedAt ? (
                  <Check className="size-5 text-green-600" />
                ) : (
                  <Circle className="size-5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${m.completedAt ? "text-muted-foreground line-through" : ""}`}>
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {MILESTONE_TYPE_LABELS[m.type]}
                  {m.dueDate && ` · Due ${format(new Date(m.dueDate), "PP")}`}
                  {m.completedAt && ` · Done ${format(new Date(m.completedAt), "PP")}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {sortedTimeline.length === 0 && (
          <p className="text-muted-foreground text-sm py-4">No milestones yet. Add one to get started.</p>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add milestone</DialogTitle>
            <DialogDescription>Add a timeline milestone (e.g. deposit, materials, crew, work phase, walkthrough).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as TimelineMilestoneType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_MILESTONE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{MILESTONE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Deposit received"
              />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
