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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import type { Appointment, CreateAppointmentData } from "@/types/appointment-types"
import { useAppointmentStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { useProjectStore } from "@/lib/stores"
import { useCommunicationStore } from "@/lib/stores"

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  defaultCustomerId?: string
  defaultProjectId?: string
  onSaved?: () => void
}

function parseList(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean)
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  defaultCustomerId,
  defaultProjectId,
  onSaved,
}: AppointmentFormDialogProps) {
  const { appointments, createAppointment, updateAppointment } = useAppointmentStore()
  const { customers } = useCustomerStore()
  const { getProjectsByCustomerId } = useProjectStore()
  const { triggerAutomation } = useCommunicationStore()
  const isEdit = !!appointment

  const [customerId, setCustomerId] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [assignedUserIdsStr, setAssignedUserIdsStr] = useState("")
  const [equipmentRequiredStr, setEquipmentRequiredStr] = useState("")
  const [notes, setNotes] = useState("")

  const customerProjects = customerId ? getProjectsByCustomerId(customerId) : []

  useEffect(() => {
    if (appointment) {
      setCustomerId(appointment.customerId)
      setProjectId(appointment.projectId)
      setAddress(appointment.address)
      setStartAt(appointment.startAt.slice(0, 16))
      setEndAt(appointment.endAt.slice(0, 16))
      setAssignedUserIdsStr(appointment.assignedUserIds.join(", "))
      setEquipmentRequiredStr(appointment.equipmentRequired.join(", "))
      setNotes(appointment.notes)
    } else {
      setCustomerId(defaultCustomerId ?? "")
      setProjectId(defaultProjectId ?? null)
      setAddress("")
      const now = new Date()
      const end = new Date(now.getTime() + 60 * 60 * 1000)
      setStartAt(now.toISOString().slice(0, 16))
      setEndAt(end.toISOString().slice(0, 16))
      setAssignedUserIdsStr("")
      setEquipmentRequiredStr("")
      setNotes("")
    }
  }, [appointment, defaultCustomerId, defaultProjectId, open])

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!customerId.trim()) {
      toast.error("Select a customer.")
      return
    }
    if (!address.trim()) {
      toast.error("Enter an address.")
      return
    }
    if (!startAt || !endAt) {
      toast.error("Enter start and end date/time.")
      return
    }
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (end <= start) {
      toast.error("End time must be after start time.")
      return
    }
    const data: CreateAppointmentData = {
      customerId,
      projectId: projectId || null,
      address: address.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      assignedUserIds: parseList(assignedUserIdsStr),
      equipmentRequired: parseList(equipmentRequiredStr),
      notes: notes.trim(),
    }
    const overlaps = appointments.filter((a) => {
      if (isEdit && appointment && a.id === appointment.id) return false
      const aStart = new Date(a.startAt).getTime()
      const aEnd = new Date(a.endAt).getTime()
      const s = start.getTime()
      const eMs = end.getTime()
      const intersects = s < aEnd && eMs > aStart
      if (!intersects) return false
      const sameCustomer = a.customerId === customerId
      const overlapUsers =
        data.assignedUserIds.length > 0 &&
        a.assignedUserIds.some((id) => data.assignedUserIds.includes(id))
      return sameCustomer || overlapUsers
    })
    if (overlaps.length > 0) {
      toast.warning(
        `This appointment overlaps with ${overlaps.length} existing appointment${
          overlaps.length > 1 ? "s" : ""
        } for the same customer or assigned user(s).`,
      )
    }
    if (isEdit) {
      await updateAppointment(appointment.id, data)
      toast.success("Appointment updated.")
    } else {
      const created = await createAppointment(data)
      const customer = customers.find((c) => c.id === customerId)
      if (customer && created) {
        const startLocale = new Date(created.startAt)
        triggerAutomation("appointment_reminder", {
          contactId: customer.id,
          contactName: customer.name || customer.companyName || "Customer",
          contactEmail: customer.emails[0],
          contactPhone: customer.phones[0],
          extras: {
            date: startLocale.toLocaleDateString(),
            time: startLocale.toLocaleTimeString(),
          },
        })
      }
      toast.success("Appointment created.")
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit appointment" : "New appointment"}</DialogTitle>
          <DialogDescription>
            Link to a customer and project. Set address, date/time, and assigned users.
          </DialogDescription>
        </DialogHeader>
        <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Customer *</FieldLabel>
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setProjectId(null) }} required>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.companyName || c.emails?.[0] || '—'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Project</FieldLabel>
            <Select value={projectId ?? "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customerProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="apt-address">Address *</Label>
            <Input
              id="apt-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Site or meeting address"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="apt-start">Start *</Label>
              <Input
                id="apt-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="apt-end">End *</Label>
              <Input
                id="apt-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="apt-assigned">Assigned users (comma-separated IDs or names)</Label>
            <Input
              id="apt-assigned"
              value={assignedUserIdsStr}
              onChange={(e) => setAssignedUserIdsStr(e.target.value)}
              placeholder="e.g. user-1, John"
            />
          </Field>
          <Field>
            <Label htmlFor="apt-equipment">Equipment required (comma-separated)</Label>
            <Input
              id="apt-equipment"
              value={equipmentRequiredStr}
              onChange={(e) => setEquipmentRequiredStr(e.target.value)}
              placeholder="e.g. Shovel, Wheelbarrow"
            />
          </Field>
          <Field>
            <Label htmlFor="apt-notes">Notes</Label>
            <Textarea
              id="apt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              rows={2}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="appointment-form">
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
