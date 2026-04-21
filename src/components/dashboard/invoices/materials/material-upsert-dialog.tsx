"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"

import type { Material } from "@/types/invoice.types"
import { mockVendors } from "@/lib/mock/invoice-mock-data"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type Unit = "per_m2" | "per_unit" | "per_sq_ft" | "per_sq_yd"

export function MaterialUpsertDialog({
  open,
  onOpenChange,
  material,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: Material | null
  onSave: (material: Material) => void
}) {
  const isEdit = !!material

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState<Unit>("per_unit")
  const [unitPrice, setUnitPrice] = useState("0")
  const [vendorId, setVendorId] = useState("")
  const [sku, setSku] = useState("")
  const [stock, setStock] = useState("0")
  const [reorderLevel, setReorderLevel] = useState("0")
  const [autoPullEnabled, setAutoPullEnabled] = useState(false)

  const vendorName = useMemo(
    () => mockVendors.find((v) => v.id === vendorId)?.name ?? "",
    [vendorId]
  )

  useEffect(() => {
    if (!open) return
    if (material) {
      setName(material.name)
      setDescription(material.description ?? "")
      setUnit(material.unit as Unit)
      setUnitPrice(String(material.unitPrice ?? 0))
      setVendorId(material.vendorId)
      setSku(material.sku ?? "")
      setStock(String(material.stock ?? 0))
      setReorderLevel(String(material.reorderLevel ?? 0))
      setAutoPullEnabled(!!material.autoPullEnabled)
    } else {
      setName("")
      setDescription("")
      setUnit("per_unit")
      setUnitPrice("0")
      setVendorId(mockVendors[0]?.id ?? "")
      setSku("")
      setStock("0")
      setReorderLevel("0")
      setAutoPullEnabled(false)
    }
  }, [open, material])

  const canSave = name.trim().length > 0 && vendorId.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit material" : "Add material"}</DialogTitle>
          <DialogDescription>
            Keep your pricebook clean and consistent. Stock tracking is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mat-name">Name</Label>
            <Input id="mat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Asphalt shingles - Architectural" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mat-desc">Description</Label>
            <Input id="mat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_unit">Unit</SelectItem>
                  <SelectItem value="per_sq_ft">Sq ft</SelectItem>
                  <SelectItem value="per_sq_yd">Sq yd</SelectItem>
                  <SelectItem value="per_m2">m²</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mat-price">Unit price</Label>
              <Input id="mat-price" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {mockVendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mat-sku">SKU (optional)</Label>
              <Input id="mat-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ABC-123" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mat-stock">Stock</Label>
              <Input id="mat-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mat-reorder">Reorder level</Label>
              <Input id="mat-reorder" inputMode="numeric" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="grid gap-1">
              <Label>Auto-pull enabled</Label>
              <div className="text-xs text-muted-foreground">Marks this item as eligible for vendor ordering automation.</div>
            </div>
            <Switch checked={autoPullEnabled} onCheckedChange={setAutoPullEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              const nowIso = new Date().toISOString().slice(0, 10)
              const toSave: Material = {
                id: material?.id ?? `mat-${Math.random().toString(16).slice(2, 8)}`,
                name: name.trim(),
                description: description.trim() || undefined,
                unit,
                unitPrice: Number(unitPrice) || 0,
                vendorId,
                vendorName,
                sku: sku.trim() || undefined,
                stock: Number(stock) || 0,
                reorderLevel: Number(reorderLevel) || 0,
                lastOrdered: material?.lastOrdered ?? nowIso,
                autoPullEnabled,
                priceHistory: material?.priceHistory ?? [],
              }
              onSave(toSave)
              onOpenChange(false)
            }}
          >
            {isEdit ? "Save changes" : "Add material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

