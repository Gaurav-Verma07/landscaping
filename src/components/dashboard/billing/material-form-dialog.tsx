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
import { Field, FieldLabel } from "@/components/ui/field"
import type { MaterialCatalogItem } from "@/lib/quote-types"
import { useBillingStore } from "@/lib/billing-store"

interface MaterialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: MaterialCatalogItem | null
  onSaved?: () => void
}

export function MaterialFormDialog({ open, onOpenChange, material, onSaved }: MaterialFormDialogProps) {
  const { createMaterial, updateMaterial, suppliers } = useBillingStore()
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [defaultPrice, setDefaultPrice] = useState("")
  const [supplierId, setSupplierId] = useState<string>("")
  const [sku, setSku] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (material) {
      setName(material.name)
      setUnit(material.unit)
      setDefaultPrice(String(material.defaultPrice))
      setSupplierId(material.supplierId ?? "")
      setSku(material.sku ?? "")
      setNotes(material.notes)
    } else {
      setName("")
      setUnit("item")
      setDefaultPrice("")
      setSupplierId("")
      setSku("")
      setNotes("")
    }
  }, [material, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required.")
      return
    }
    const price = Number(defaultPrice)
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid default price.")
      return
    }
    if (material) {
      updateMaterial(material.id, { name: name.trim(), unit: unit.trim() || "item", defaultPrice: price, supplierId: supplierId || null, sku: sku.trim() || null, notes })
      toast.success("Material updated.")
    } else {
      createMaterial({ name: name.trim(), unit: unit.trim() || "item", defaultPrice: price, supplierId: supplierId || null, sku: sku.trim() || null, notes })
      toast.success("Material created.")
    }
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{material ? "Edit material" : "New material"}</DialogTitle>
          <DialogDescription>Material catalog entry with default price for quotes and invoices.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Material name" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Unit</FieldLabel>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. m², bag, tonne" />
            </Field>
            <Field>
              <FieldLabel>Default price (£)</FieldLabel>
              <Input type="number" min={0} step={0.01} value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Supplier</FieldLabel>
            <Select value={supplierId || "none"} onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>SKU</FieldLabel>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Supplier SKU" />
          </Field>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{material ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
