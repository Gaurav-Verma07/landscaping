"use client"

import * as React from "react"
import { Upload } from "lucide-react"
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
import { Label } from "@/components/ui/label"
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
import type { Project, ProjectStatus, WeatherRisk } from "@/lib/mock/backend"
import { newId } from "@/lib/mock/backend"

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectAdded?: (project: Project) => void
  defaultClientId?: string
  defaultClientName?: string
}

export function NewProjectDialog({ open, onOpenChange, onProjectAdded, defaultClientId, defaultClientName }: NewProjectDialogProps) {
  const [formData, setFormData] = React.useState({
    clientId: "",
    clientName: "",
    status: "Active",
    scheduledDate: "",
    crew: "",
    location: "",
    estValue: "",
    overdue: false,
    weatherRisk: "Low",
    tags: "",
    description: "",
  })

  const resetForm = () => {
    setFormData({
      clientId: defaultClientId ?? "",
      clientName: defaultClientName ?? "",
      status: "Active",
      scheduledDate: "",
      crew: "",
      location: "",
      estValue: "",
      overdue: false,
      weatherRisk: "Low",
      tags: "",
      description: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId || !formData.location) {
      return
    }

    const now = new Date().toISOString()
    const newProject: Project = {
      id: newId("proj"),
      clientId: formData.clientId,
      name: formData.clientName ? `${formData.clientName} - Project` : "New Project",
      status: (formData.status as ProjectStatus) || "Active",
      scheduledDate: formData.scheduledDate ? `${formData.scheduledDate}T00:00:00.000Z` : undefined,
      crew: formData.crew || "Unassigned",
      location: formData.location,
      estValue: Number.parseFloat(formData.estValue) || 0,
      overdue: formData.overdue,
      weatherRisk: (formData.weatherRisk as WeatherRisk) || "Low",
      tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      description: formData.description || undefined,
      createdAt: now,
      updatedAt: now,
    }

    onProjectAdded?.(newProject)
    resetForm()
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (open) resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultClientId, defaultClientName])

  const handleChange = (
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FieldGroup className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Project Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="clientId">Client ID</FieldLabel>
                  <Input
                    id="clientId"
                    value={formData.clientId}
                    onChange={(e) => handleChange("clientId", e.target.value)}
                    placeholder="client-001"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="clientName">Client name (optional)</FieldLabel>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    placeholder="John Carter"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="scheduledDate">Scheduled Date</FieldLabel>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleChange("scheduledDate", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="crew">Crew</FieldLabel>
                  <Select
                    value={formData.crew}
                    onValueChange={(value) => handleChange("crew", value)}
                  >
                    <SelectTrigger id="crew">
                      <SelectValue placeholder="Select crew" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Crew A">Crew A</SelectItem>
                      <SelectItem value="Crew B">Crew B</SelectItem>
                      <SelectItem value="Crew C">Crew C</SelectItem>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Enter project location"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="estValue">Estimated Value ($)</FieldLabel>
                  <Input
                    id="estValue"
                    type="number"
                    value={formData.estValue}
                    onChange={(e) => handleChange("estValue", e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="weatherRisk">Weather Risk</FieldLabel>
                  <Select
                    value={formData.weatherRisk}
                    onValueChange={(value) => handleChange("weatherRisk", value)}
                  >
                    <SelectTrigger id="weatherRisk">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter project description..."
                  rows={4}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tags">Tags</FieldLabel>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="residential, insurance, urgent (comma separated)"
                />
                <FieldDescription>
                  Add tags to categorize this project
                </FieldDescription>
              </Field>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Project Media</h3>
              <Field>
                <FieldLabel htmlFor="upload">Upload Photos / Docs</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="upload" className="cursor-pointer">
                      <Upload className="size-4" />
                      Upload
                    </label>
                  </Button>
                </div>
                <FieldDescription>
                  Upload before, during, and after photos, documents, or other files related to this project
                </FieldDescription>
              </Field>
            </div>
          </FieldGroup>
          </div>
          <DialogFooter className="px-6 py-4 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

