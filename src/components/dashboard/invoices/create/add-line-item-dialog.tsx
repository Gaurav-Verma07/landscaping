"use client"

import * as React from "react"
import { useMemo, useState } from "react"

import type { InvoiceLineItem, LaborRate, Material } from "@/types/invoice.types"
import { useMockDb } from "@/lib/mock/backend/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type Source = "material" | "labor" | "custom"

export function AddLineItemDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: InvoiceLineItem) => void
}) {
  const db = useMockDb()
  const materials = db.materials
  const laborRates = db.laborRates

  const [source, setSource] = useState<Source>("material")
  const [materialId, setMaterialId] = useState<string>("")
  const [laborId, setLaborId] = useState<string>("")
  const [description, setDescription] = useState("")
  const [qty, setQty] = useState("1")
  const [unit, setUnit] = useState("per_unit")
  const [unitPrice, setUnitPrice] = useState("0")
  const [taxable, setTaxable] = useState(true)

  const selectedMaterial = useMemo<Material | undefined>(
    () => materials.find((m) => m.id === materialId),
    [materials, materialId]
  )
  const selectedLabor = useMemo<LaborRate | undefined>(
    () => laborRates.find((r) => r.id === laborId),
    [laborRates, laborId]
  )

  React.useEffect(() => {
    if (!open) return
    setSource("material")
    setMaterialId(materials[0]?.id ?? "")
    setLaborId(laborRates[0]?.id ?? "")
    setQty("1")
    // defaults will be applied by the effect below
  }, [open, materials, laborRates])

  React.useEffect(() => {
    if (!open) return
    if (source === "material" && selectedMaterial) {
      setDescription(selectedMaterial.name)
      setUnit(selectedMaterial.unit)
      setUnitPrice(String(selectedMaterial.unitPrice ?? 0))
      setTaxable(true)
    }
    if (source === "labor" && selectedLabor) {
      setDescription(selectedLabor.roleName)
      setUnit(selectedLabor.rateType === "hourly" ? "per_hour" : selectedLabor.rateType === "daily" ? "per_day" : "per_unit")
      setUnitPrice(String(selectedLabor.rate ?? 0))
      setTaxable(false)
    }
    if (source === "custom") {
      setDescription("")
      setUnit("per_unit")
      setUnitPrice("0")
      setTaxable(true)
    }
  }, [open, source, selectedMaterial, selectedLabor])

  const canAdd = description.trim().length > 0 && Number(qty) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add line item</DialogTitle>
          <DialogDescription>
            Add materials, labor, or a custom fee.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="material">Material (pricebook)</SelectItem>
                <SelectItem value="labor">Labor (rates)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {source === "material" ? (
            <div className="grid gap-2">
              <Label>Material</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {source === "labor" ? (
            <div className="grid gap-2">
              <Label>Labor role</Label>
              <Select value={laborId} onValueChange={setLaborId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {laborRates.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.roleName} ({r.rateType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="li-desc">Description</Label>
            <Input id="li-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="li-qty">Qty</Label>
              <Input id="li-qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="li-unit">Unit</Label>
              <Input id="li-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="li-rate">Unit price</Label>
              <Input id="li-rate" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="grid gap-1">
              <Label>Taxable</Label>
              <div className="text-xs text-muted-foreground">Controls whether this item is included in tax base.</div>
            </div>
            <Switch checked={taxable} onCheckedChange={setTaxable} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canAdd}
            onClick={() => {
              const q = Number(qty) || 0
              const r = Number(unitPrice) || 0
              onAdd({
                id: `line-${Math.random().toString(16).slice(2, 10)}`,
                description: description.trim(),
                quantity: q,
                unitPrice: r,
                unit,
                totalPrice: q * r,
                materialId: source === "material" ? materialId : undefined,
                service: source === "labor" ? true : undefined,
                taxable,
              })
              onOpenChange(false)
            }}
          >
            Add item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

