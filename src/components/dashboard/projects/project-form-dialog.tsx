/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  type Project,
  type CreateProjectData,
} from "@/types/project-types"
import { useProjectStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { Loader2, MapPin, Navigation } from "lucide-react"
import { CustomerCombobox } from "@/components/ui/customers-combobox"

const FORM_ID = "project-form-dialog"

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  defaultCustomerId?: string
  onSaved?: () => void
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  defaultCustomerId,
  onSaved,
}: ProjectFormDialogProps) {
  const { createProject, updateProject } = useProjectStore()
  const { customers } = useCustomerStore()
  const isEdit = !!project

  const [name, setName] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [projectType, setProjectType] = useState<CreateProjectData["projectType"]>("Custom")
  const [status, setStatus] = useState<CreateProjectData["status"]>("Planned")
  const [priority, setPriority] = useState<CreateProjectData["priority"]>("Medium")
  const [propertySize, setPropertySize] = useState("")
  const [estimatedLandscapeSqFt, setEstimatedLandscapeSqFt] = useState<string>("")
  const [remainingSqFt, setRemainingSqFt] = useState<string>("")
  const [estimatedPropertyValue, setEstimatedPropertyValue] = useState<string>("")
  const [terrainType, setTerrainType] = useState("")
  const [accessNotes, setAccessNotes] = useState("")
  const [durationEstimate, setDurationEstimate] = useState("")
  const [requiredMaterialsStr, setRequiredMaterialsStr] = useState("")
  const [equipmentStr, setEquipmentStr] = useState("")
  const [assignedCrew, setAssignedCrew] = useState("")
  const [dependencyProjectIds, setDependencyProjectIds] = useState<string[]>([])
  const [siteLat, setSiteLat] = useState<string>(project?.siteLat?.toString() ?? '')
  const [siteLng, setSiteLng] = useState<string>(project?.siteLng?.toString() ?? '')
  const [gpsRadius, setGpsRadius] = useState<string>(project?.gpsRadiusMeters?.toString() ?? '200')
  const [locatingMe, setLocatingMe] = useState(false)
  useEffect(() => {
    if (project) {
      setName(project.name)
      setCustomerId(project.customerId)
      setProjectType(project.projectType)
      setStatus(project.status)
      setPriority(project.priority)
      setPropertySize(project.propertySize)
      setEstimatedLandscapeSqFt(project.estimatedLandscapeSqFt != null ? String(project.estimatedLandscapeSqFt) : "")
      setRemainingSqFt(project.remainingSqFt != null ? String(project.remainingSqFt) : "")
      setEstimatedPropertyValue(project.estimatedPropertyValue != null ? String(project.estimatedPropertyValue) : "")
      setTerrainType(project.terrainType)
      setAccessNotes(project.accessNotes)
      setDurationEstimate(project.durationEstimate)
      setRequiredMaterialsStr(project.requiredMaterials.join(", "))
      setEquipmentStr(project.equipment.join(", "))
      setAssignedCrew(project.assignedCrew)
      setDependencyProjectIds(project.dependencyProjectIds)
      setSiteLat(project?.siteLat?.toString() ?? '')
      setSiteLng(project?.siteLng?.toString() ?? '')
      setGpsRadius(project?.gpsRadiusMeters?.toString() ?? '200')
    } else {
      setName("")
      setCustomerId(defaultCustomerId ?? "")
      setProjectType("Custom")
      setStatus("Planned")
      setPriority("Medium")
      setPropertySize("")
      setEstimatedLandscapeSqFt("")
      setRemainingSqFt("")
      setEstimatedPropertyValue("")
      setTerrainType("")
      setAccessNotes("")
      setDurationEstimate("")
      setRequiredMaterialsStr("")
      setEquipmentStr("")
      setAssignedCrew("")
      setDependencyProjectIds([])
      setSiteLat(project?.siteLat?.toString() ?? '')
      setSiteLng(project?.siteLng?.toString() ?? '')
      setGpsRadius(project?.gpsRadiusMeters?.toString() ?? '200')
      setLocatingMe(false)
    }
  }, [project, defaultCustomerId, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Project name is required.")
      return
    }
    if (!customerId) {
      toast.error("Please select a customer.")
      return
    }

    const estimatedSqFt = estimatedLandscapeSqFt ? Number(estimatedLandscapeSqFt) : null
    const remaining = remainingSqFt ? Number(remainingSqFt) : null
    const propValue = estimatedPropertyValue ? Number(estimatedPropertyValue) : null

    if (isEdit && project) {
      updateProject(project.id, {
        name: name.trim(),
        customerId,
        projectType,
        status,
        priority,
        propertySize: propertySize.trim(),
        estimatedLandscapeSqFt: estimatedSqFt,
        remainingSqFt: remaining,
        estimatedPropertyValue: propValue,
        terrainType: terrainType.trim(),
        accessNotes: accessNotes.trim(),
        durationEstimate: durationEstimate.trim(),
        requiredMaterials: parseList(requiredMaterialsStr),
        equipment: parseList(equipmentStr),
        assignedCrew: assignedCrew.trim(),
        dependencyProjectIds,
        siteLat: siteLat ? parseFloat(siteLat) : null,
        siteLng: siteLng ? parseFloat(siteLng) : null,
        gpsRadiusMeters: gpsRadius ? parseInt(gpsRadius) : 200,
      })
      toast.success("Project updated.")
    } else {
      createProject({
        name: name.trim(),
        customerId,
        projectType,
        status,
        priority,
        propertySize: propertySize.trim(),
        estimatedLandscapeSqFt: estimatedSqFt,
        remainingSqFt: remaining,
        estimatedPropertyValue: propValue,
        terrainType: terrainType.trim(),
        accessNotes: accessNotes.trim(),
        durationEstimate: durationEstimate.trim(),
        requiredMaterials: parseList(requiredMaterialsStr),
        equipment: parseList(equipmentStr),
        assignedCrew: assignedCrew.trim(),
        dependencyProjectIds,
        siteLat: siteLat ? parseFloat(siteLat) : null,
        siteLng: siteLng ? parseFloat(siteLng) : null,
        gpsRadiusMeters: gpsRadius ? parseInt(gpsRadius) : 200,
      })
      toast.success("Project created.")
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update project details and property info." : "Create a project and link it to a customer."}
          </DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Project name *</FieldLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Back Garden Redesign"
                />
              </Field>
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <CustomerCombobox
                  customers={customers}
                  value={customerId}
                  onChange={setCustomerId}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Project type</FieldLabel>
                <Select value={projectType} onValueChange={(v) => setProjectType(v as CreateProjectData["projectType"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={status} onValueChange={(v) => setStatus(v as CreateProjectData["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={priority} onValueChange={(v) => setPriority(v as CreateProjectData["priority"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Property details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Property size</FieldLabel>
                  <Input
                    value={propertySize}
                    onChange={(e) => setPropertySize(e.target.value)}
                    placeholder="e.g. 0.25 acres"
                  />
                </Field>
                <Field>
                  <FieldLabel>Estimated landscape (sq ft)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={estimatedLandscapeSqFt}
                    onChange={(e) => setEstimatedLandscapeSqFt(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </Field>
                <Field>
                  <FieldLabel>Remaining sq ft</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={remainingSqFt}
                    onChange={(e) => setRemainingSqFt(e.target.value)}
                    placeholder="—"
                  />
                </Field>
                <Field>
                  <FieldLabel>Estimated property value</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={estimatedPropertyValue}
                    onChange={(e) => setEstimatedPropertyValue(e.target.value)}
                    placeholder="—"
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel>Terrain type</FieldLabel>
                  <Input
                    value={terrainType}
                    onChange={(e) => setTerrainType(e.target.value)}
                    placeholder="e.g. Flat, sloped"
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel>Access notes</FieldLabel>
                  <Textarea
                    value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)}
                    placeholder="Gate width, restrictions..."
                    rows={2}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Job board</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Duration estimate</FieldLabel>
                  <Input
                    value={durationEstimate}
                    onChange={(e) => setDurationEstimate(e.target.value)}
                    placeholder="e.g. 2 weeks"
                  />
                </Field>
                <Field>
                  <FieldLabel>Assigned crew</FieldLabel>
                  <Input
                    value={assignedCrew}
                    onChange={(e) => setAssignedCrew(e.target.value)}
                    placeholder="e.g. Crew A"
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel>Required materials (comma-separated)</FieldLabel>
                  <Input
                    value={requiredMaterialsStr}
                    onChange={(e) => setRequiredMaterialsStr(e.target.value)}
                    placeholder="Topsoil, Mulch, Edging"
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel>Equipment (comma-separated)</FieldLabel>
                  <Input
                    value={equipmentStr}
                    onChange={(e) => setEquipmentStr(e.target.value)}
                    placeholder="Mower, Edger"
                  />
                </Field>
              </div>
            </div>

          {/* Site Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Site Location (GPS)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!navigator.geolocation) return toast.error('Geolocation not supported')
                  setLocatingMe(true)
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setSiteLat(pos.coords.latitude.toFixed(6))
                      setSiteLng(pos.coords.longitude.toFixed(6))
                      setLocatingMe(false)
                      toast.success('Location captured')
                    },
                    (err) => {
                      setLocatingMe(false)
                      const msgs: Record<number, string> = {
                        1: 'Location permission denied',
                        2: 'Location unavailable',
                        3: 'Request timed out',
                      }
                      toast.error(msgs[err.code] ?? 'Could not get location')
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }}
                disabled={locatingMe}
              >
                {locatingMe
                  ? <><Loader2 className="size-3 mr-1.5 animate-spin" />Locating…</>
                  : <><Navigation className="size-3 mr-1.5" />Use my location</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-geocode from the customer address on first clock-in.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Latitude</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 37.7749"
                  value={siteLat}
                  onChange={(e) => setSiteLat(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Longitude</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. -122.4194"
                  value={siteLng}
                  onChange={(e) => setSiteLng(e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>On-site radius (metres)</FieldLabel>
              <Input
                type="number"
                min="50"
                max="2000"
                value={gpsRadius}
                onChange={(e) => setGpsRadius(e.target.value)}
              />
              <FieldDescription>Default 200m. Increase for large properties.</FieldDescription>
            </Field>
          </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID}>
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
