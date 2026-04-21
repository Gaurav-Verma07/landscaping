"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Save } from "lucide-react"

import type { PricingSettings } from "@/lib/mock/backend"
import { setMockDb } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

export function PricingBackendWorkspace() {
  const db = useMockDb()
  const current = db.management.pricing

  const [draft, setDraft] = useState<PricingSettings>(() => ({ ...current }))

  React.useEffect(() => {
    setDraft({ ...current })
  }, [current.updatedAt])

  const preview = useMemo(() => {
    const materials = 8000
    const labor = 4500

    const mMarkup = materials * (draft.materialMarkupPct / 100)
    const lMarkup = labor * (draft.laborMarkupPct / 100)

    const base = materials + labor + mMarkup + lMarkup
    const overhead = base * (draft.overheadPct / 100)
    const profit = base * (draft.profitPct / 100)

    const taxableBase =
      draft.salesTaxAppliesTo === "materials_only"
        ? materials + mMarkup
        : draft.salesTaxAppliesTo === "labor_only"
        ? labor + lMarkup
        : materials + labor + mMarkup + lMarkup
    const tax = taxableBase * (draft.salesTaxRatePct / 100)

    const total = base + overhead + profit + tax

    return { materials, labor, mMarkup, lMarkup, base, overhead, profit, tax, total }
  }, [draft])

  const save = () => {
    const now = new Date().toISOString()
    setMockDb((prev) => ({
      ...prev,
      management: { ...prev.management, pricing: { ...draft, updatedAt: now } },
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Backend</h1>
          <p className="text-muted-foreground">Company-wide defaults used by estimates and invoices (mock DB backed).</p>
        </div>
        <Button onClick={save}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Markups & margins</CardTitle>
              <CardDescription>Controls the default sell price from cost.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="m">Material markup %</Label>
                  <Input
                    id="m"
                    inputMode="decimal"
                    value={String(draft.materialMarkupPct)}
                    onChange={(e) => setDraft({ ...draft, materialMarkupPct: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="l">Labor markup %</Label>
                  <Input
                    id="l"
                    inputMode="decimal"
                    value={String(draft.laborMarkupPct)}
                    onChange={(e) => setDraft({ ...draft, laborMarkupPct: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="oh">Overhead %</Label>
                  <Input
                    id="oh"
                    inputMode="decimal"
                    value={String(draft.overheadPct)}
                    onChange={(e) => setDraft({ ...draft, overheadPct: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p">Profit %</Label>
                  <Input
                    id="p"
                    inputMode="decimal"
                    value={String(draft.profitPct)}
                    onChange={(e) => setDraft({ ...draft, profitPct: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tax & rounding</CardTitle>
              <CardDescription>Defaults used when you generate an invoice.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tax">Sales tax %</Label>
                  <Input
                    id="tax"
                    inputMode="decimal"
                    value={String(draft.salesTaxRatePct)}
                    onChange={(e) => setDraft({ ...draft, salesTaxRatePct: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tax applies to</Label>
                  <Select
                    value={draft.salesTaxAppliesTo}
                    onValueChange={(v) => setDraft({ ...draft, salesTaxAppliesTo: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials_only">Materials only</SelectItem>
                      <SelectItem value="labor_only">Labor only</SelectItem>
                      <SelectItem value="materials_and_labor">Materials & labor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Rounding</Label>
                  <Select value={draft.rounding} onValueChange={(v) => setDraft({ ...draft, rounding: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="nearest_1">Nearest $1</SelectItem>
                      <SelectItem value="nearest_5">Nearest $5</SelectItem>
                      <SelectItem value="nearest_10">Nearest $10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="storm">Storm bonus %</Label>
                  <Input
                    id="storm"
                    inputMode="decimal"
                    value={String(draft.stormModeBonusPct)}
                    onChange={(e) => setDraft({ ...draft, stormModeBonusPct: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>Effect on a sample job cost.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Materials cost</span>
                  <span className="font-medium">{money(preview.materials)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Labor cost</span>
                  <span className="font-medium">{money(preview.labor)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Material markup</span>
                  <span className="font-medium">{money(preview.mMarkup)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Labor markup</span>
                  <span className="font-medium">{money(preview.lMarkup)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base</span>
                  <span className="font-medium">{money(preview.base)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overhead</span>
                  <span className="font-medium">{money(preview.overhead)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="font-medium">{money(preview.profit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{money(preview.tax)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-xl font-semibold">{money(preview.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

