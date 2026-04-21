"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Plus, Search, Copy, Trash2, FileText, Wand2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type TemplateCategory = "residential" | "commercial" | "repairs" | "insurance"

type TemplateLineItem = {
  id: string
  description: string
  unit: "sqft" | "each" | "bundle" | "hour"
  qty: number
  unitPrice: number
}

type EstimateTemplate = {
  id: string
  name: string
  category: TemplateCategory
  tags: string[]
  notes?: string
  lineItems: TemplateLineItem[]
  updatedAt: string
}

const seedTemplates: EstimateTemplate[] = [
  {
    id: "tpl-001",
    name: "Residential Replace (Asphalt Shingle)",
    category: "residential",
    tags: ["roof replacement", "asphalt"],
    notes: "Baseline scope for standard residential shingle replacement.",
    lineItems: [
      { id: "li-1", description: "Tear-off & disposal", unit: "sqft", qty: 2000, unitPrice: 1.25 },
      { id: "li-2", description: "Synthetic underlayment", unit: "sqft", qty: 2000, unitPrice: 0.35 },
      { id: "li-3", description: "Architectural shingles install", unit: "sqft", qty: 2000, unitPrice: 2.65 },
      { id: "li-4", description: "Flashing / pipe boots", unit: "each", qty: 4, unitPrice: 55 },
    ],
    updatedAt: "2025-12-21",
  },
  {
    id: "tpl-002",
    name: "Storm Claim (Hail) – Standard Scope",
    category: "insurance",
    tags: ["insurance", "hail", "supplement-ready"],
    notes: "Includes documentation checklist placeholders.",
    lineItems: [
      { id: "li-1", description: "Tarp / emergency dry-in", unit: "hour", qty: 3, unitPrice: 95 },
      { id: "li-2", description: "Replace shingles", unit: "sqft", qty: 2200, unitPrice: 2.75 },
      { id: "li-3", description: "Drip edge", unit: "each", qty: 120, unitPrice: 4.25 },
    ],
    updatedAt: "2025-12-18",
  },
  {
    id: "tpl-003",
    name: "Leak Repair (Service Call)",
    category: "repairs",
    tags: ["repair", "leak"],
    lineItems: [
      { id: "li-1", description: "Service call", unit: "each", qty: 1, unitPrice: 175 },
      { id: "li-2", description: "Repair labor", unit: "hour", qty: 2, unitPrice: 95 },
      { id: "li-3", description: "Sealant / misc materials", unit: "each", qty: 1, unitPrice: 45 },
    ],
    updatedAt: "2025-11-30",
  },
]

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function sumTemplate(t: EstimateTemplate) {
  return t.lineItems.reduce((acc, li) => acc + li.qty * li.unitPrice, 0)
}

export default function EstimateTemplatesPage() {
  const [templates, setTemplates] = useState<EstimateTemplate[]>(seedTemplates)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<TemplateCategory | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      const matchesCategory = category === "all" ? true : t.category === category
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (t.notes ?? "").toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [templates, query, category])

  const handleDuplicate = (tpl: EstimateTemplate) => {
    const randomId = () => Math.random().toString(16).slice(2, 8);
    const copy: EstimateTemplate = {
      ...tpl,
      id: `tpl-${randomId()}`,
      name: `${tpl.name} (Copy)`,
      updatedAt: new Date().toISOString().slice(0, 10),
      lineItems: tpl.lineItems.map((li) => ({ ...li, id: `li-${randomId()}` })),
    }
    setTemplates((prev) => [copy, ...prev])
    setSelectedId(copy.id)
  }

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Reusable scopes and line items for consistent estimating.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Browse</CardTitle>
          <CardDescription>Search by name, tag, or notes. Filter by category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label htmlFor="tpl-search" className="sr-only">
                Search templates
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tpl-search"
                  placeholder="Search templates..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="sr-only">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="repairs">Repairs</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[140px]">Category</TableHead>
                      <TableHead className="w-[140px] text-right">Total</TableHead>
                      <TableHead className="w-[120px]">Updated</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length ? (
                      filtered.map((t) => (
                        <TableRow
                          key={t.id}
                          className={selectedId === t.id ? "bg-muted/50" : "cursor-pointer"}
                          onClick={() => setSelectedId(t.id)}
                        >
                          <TableCell>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="mr-1">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{t.category}</TableCell>
                          <TableCell className="text-right font-medium">{money(sumTemplate(t))}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{t.updatedAt}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleDuplicate(t)}>
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Duplicate</span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setDeleteId(t.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No templates found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selected ? "Template details" : "Select a template"}
                  </CardTitle>
                  <CardDescription>
                    {selected
                      ? "Review scope, line items, and totals."
                      : "Pick a template from the list to preview it here."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selected ? (
                    <>
                      <div>
                        <div className="text-lg font-semibold">{selected.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{selected.category}</div>
                      </div>

                      {selected.notes ? (
                        <div className="text-sm text-muted-foreground">{selected.notes}</div>
                      ) : null}

                      <Separator />

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Line items</div>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[70px] text-right">Qty</TableHead>
                                <TableHead className="w-[90px] text-right">Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selected.lineItems.map((li) => (
                                <TableRow key={li.id}>
                                  <TableCell>
                                    <div className="text-sm">{li.description}</div>
                                    <div className="text-xs text-muted-foreground">{li.unit}</div>
                                  </TableCell>
                                  <TableCell className="text-right">{li.qty}</TableCell>
                                  <TableCell className="text-right">{money(li.unitPrice)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="text-sm text-muted-foreground">Template total</div>
                          <div className="text-lg font-semibold">{money(sumTemplate(selected))}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid gap-2">
                        <Button variant="outline" className="justify-start">
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate proposal text (stub)
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Plus className="mr-2 h-4 w-4" />
                          Start estimate from template (stub)
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Tip: keep templates small and composable (e.g., “Tear-off”, “Underlayment”, “Flashing”) so you can mix-and-match.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create dialog (stub) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New template</DialogTitle>
            <DialogDescription>
              Create a reusable scope with line items. (Starter UI — persistence can be wired later.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="tpl-name">Name</Label>
              <Input id="tpl-name" placeholder="e.g. Residential Replace (Asphalt)" />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select defaultValue="residential">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="repairs">Repairs</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tpl-notes">Notes</Label>
              <Textarea id="tpl-notes" placeholder="Optional internal notes..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Create (stub)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => (!open ? setDeleteId(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              This removes the template from the list. (Local only for now.)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

