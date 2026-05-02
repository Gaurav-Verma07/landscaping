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
import { Field, FieldLabel } from "@/components/ui/field"
import type { Supplier } from "@/types/quote-types"
import { useBillingStore } from "@/lib/stores"

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
  onSaved?: () => void
}

export function SupplierFormDialog({ open, onOpenChange, supplier, onSaved }: SupplierFormDialogProps) {
  const { createSupplier, updateSupplier } = useBillingStore()
  const [name, setName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (supplier) {
      setName(supplier.name)
      setContactPhone(supplier.contactPhone)
      setContactEmail(supplier.contactEmail)
      setAddress(supplier.address)
      setNotes(supplier.notes)
    } else {
      setName("")
      setContactPhone("")
      setContactEmail("")
      setAddress("")
      setNotes("")
    }
  }, [supplier, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required.")
      return
    }
    if (supplier) {
      updateSupplier(supplier.id, { name: name.trim(), contactPhone, contactEmail, address, notes })
      toast.success("Supplier updated.")
    } else {
      createSupplier({ name: name.trim(), contactPhone, contactEmail, address, notes })
      toast.success("Supplier created.")
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>Supplier directory entry for ordering and pricing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
          </Field>
          <Field>
            <FieldLabel>Phone</FieldLabel>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact phone" />
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact email" />
          </Field>
          <Field>
            <FieldLabel>Address</FieldLabel>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          </Field>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{supplier ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
