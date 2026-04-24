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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { EMPLOYEE_ROLES, SKILL_LEVELS, type Employee, type CreateEmployeeData } from "@/lib/labor-types"
import { useLaborStore } from "@/lib/labor-store"

function parseList(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean)
}

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSaved?: () => void
}

export function EmployeeFormDialog({ open, onOpenChange, employee, onSaved }: EmployeeFormDialogProps) {
  const { createEmployee, updateEmployee } = useLaborStore()
  const isEdit = !!employee

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<CreateEmployeeData["role"]>("Crew")
  const [skillLevel, setSkillLevel] = useState<CreateEmployeeData["skillLevel"]>("Standard")
  const [certificationsStr, setCertificationsStr] = useState("")
  const [availability, setAvailability] = useState("")

  useEffect(() => {
    if (employee) {
      setName(employee.name)
      setEmail(employee.email)
      setPhone(employee.phone)
      setRole(employee.role)
      setSkillLevel(employee.skillLevel)
      setCertificationsStr(employee.certifications.join(", "))
      setAvailability(employee.availability)
    } else {
      setName("")
      setEmail("")
      setPhone("")
      setRole("Crew")
      setSkillLevel("Standard")
      setCertificationsStr("")
      setAvailability("")
    }
  }, [employee, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Enter name.")
      return
    }
    const data: CreateEmployeeData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      skillLevel,
      certifications: parseList(certificationsStr),
      availability: availability.trim() || "—",
    }
    if (isEdit) {
      updateEmployee(employee.id, data)
      toast.success("Employee updated.")
    } else {
      createEmployee(data)
      toast.success("Employee added.")
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "Add employee"}</DialogTitle>
          <DialogDescription>Crew member details for scheduling and time tracking.</DialogDescription>
        </DialogHeader>
        <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Name *</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Phone</FieldLabel>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={role} onValueChange={(v) => setRole(v as CreateEmployeeData["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Skill level</FieldLabel>
              <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as CreateEmployeeData["skillLevel"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <Label>Certifications (comma-separated)</Label>
            <Input value={certificationsStr} onChange={(e) => setCertificationsStr(e.target.value)} placeholder="First Aid, CPCS" />
          </Field>
          <Field>
            <Label>Availability</Label>
            <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Mon–Fri" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="employee-form">{isEdit ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
