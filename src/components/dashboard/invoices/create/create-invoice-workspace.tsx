"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Save, Send, Trash2 } from "lucide-react"

import type { Invoice, InvoiceLineItem, InvoiceTaxItem } from "@/types/invoice.types"
import { clearMockContext, newId, readMockContext, setMockContext, setMockDb, upsertById } from "@/lib/mock/backend"
import { useMockDb } from "@/lib/mock/backend/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { InvoiceStatusBadge } from "@/components/dashboard/invoices/shared/invoice-status-badge"
import { money } from "@/components/dashboard/invoices/shared/format"
import { AddLineItemDialog } from "@/components/dashboard/invoices/create/add-line-item-dialog"
import { cn } from "@/lib/utils"

type DiscountType = "percent" | "fixed"

function nextInvoiceNumber() {
  const y = new Date().getFullYear()
  const m = String(new Date().getMonth() + 1).padStart(2, "0")
  return `INV-${y}-${m}-${Math.random().toString(10).slice(2, 5)}`
}

export function CreateInvoiceWorkspace() {
  const router = useRouter()
  const db = useMockDb()

  const [clientId, setClientId] = useState<string>("")
  const [projectId, setProjectId] = useState<string>("")
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber())
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState<Invoice["status"]>("draft")
  const [notes, setNotes] = useState("")

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])

  const [taxRate, setTaxRate] = useState("0") // %
  const [discountType, setDiscountType] = useState<DiscountType>("fixed")
  const [discountValue, setDiscountValue] = useState("0")

  const [addItemOpen, setAddItemOpen] = useState(false)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [projectSearchOpen, setProjectSearchOpen] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [projectSearchQuery, setProjectSearchQuery] = useState("")

  React.useEffect(() => {
    const ctx = readMockContext()
    if (!ctx) return
    if (ctx.clientId) setClientId(ctx.clientId)
    if (ctx.projectId) setProjectId(ctx.projectId)
    clearMockContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const projectOptions = useMemo(() => db.projects, [db.projects])
  const clientOptions = useMemo(() => {
    return db.clients.map((c) => ({ id: c.id, name: c.name }))
  }, [db.clients])

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return clientOptions
    const query = clientSearchQuery.toLowerCase()
    return clientOptions.filter((c) => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query))
  }, [clientOptions, clientSearchQuery])

  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery) return projectOptions.filter((p) => p.clientId === clientId)
    const query = projectSearchQuery.toLowerCase()
    return projectOptions.filter(
      (p) => p.clientId === clientId && (p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query))
    )
  }, [projectOptions, clientId, projectSearchQuery])

  const projectForSelection = useMemo(() => {
    return projectOptions.find((p) => p.id === projectId) ?? null
  }, [projectId, projectOptions])

  const computed = useMemo(() => {
    const subtotal = lineItems.reduce((a, li) => a + li.totalPrice, 0)
    const taxableBase = lineItems.filter((li) => li.taxable).reduce((a, li) => a + li.totalPrice, 0)
    const tax = taxableBase * ((Number(taxRate) || 0) / 100)
    const disc =
      discountType === "percent"
        ? subtotal * ((Number(discountValue) || 0) / 100)
        : Number(discountValue) || 0
    const total = Math.max(0, subtotal + tax - disc)

    const taxItems: InvoiceTaxItem[] =
      (Number(taxRate) || 0) > 0
        ? [
            {
              id: "tax-sales",
              name: "Sales Tax",
              rate: Number(taxRate) || 0,
              amount: tax,
              isPercentage: true,
            },
          ]
        : []

    return { subtotal, taxableBase, tax, disc, total, taxItems }
  }, [lineItems, taxRate, discountType, discountValue])

  const canSave = clientId.length > 0 && invoiceNumber.trim().length > 0

  const reset = () => {
    setClientId("")
    setProjectId("")
    setInvoiceNumber(nextInvoiceNumber())
    setIssueDate(new Date().toISOString().slice(0, 10))
    setDueDate("")
    setStatus("draft")
    setNotes("")
    setLineItems([])
    setTaxRate("0")
    setDiscountType("fixed")
    setDiscountValue("0")
  }

  const saveStub = () => {
    const clientName = db.clients.find((c) => c.id === clientId)?.name ?? clientId
    const invoice: Invoice = {
      id: newId("inv"),
      invoiceNumber,
      clientId,
      clientName,
      projectId: projectId || undefined,
      projectName: projectForSelection?.name,
      issueDate,
      dueDate: dueDate || issueDate,
      createdDate: new Date().toISOString().slice(0, 10),
      status,
      subtotal: computed.subtotal,
      tax: computed.tax,
      discount: computed.disc,
      total: computed.total,
      balance: computed.total,
      notes: notes || undefined,
      attachments: [],
      lineItems,
      taxItems: computed.taxItems,
      paymentHistory: [],
      reminders: [],
      sentDate: status === "sent" ? new Date().toISOString().slice(0, 10) : undefined,
    }

    setMockDb((prev) => ({
      ...prev,
      invoices: upsertById(prev.invoices, invoice),
    }))
    router.push("/dashboard/invoices")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create invoice</h1>
          <p className="text-muted-foreground">Build an invoice from materials/labor and send it to the customer.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/invoices")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={reset}>
            <Trash2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={saveStub} disabled={!canSave}>
            <Save className="mr-2 h-4 w-4" />
            Save (stub)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
              <CardDescription>Who is this billed to and when is it due?</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Client</Label>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientSearchOpen}
                        className="w-full justify-between"
                      >
                        {clientId
                          ? clientOptions.find((c) => c.id === clientId)?.name || "Select client"
                          : "Select client"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search client..."
                          value={clientSearchQuery}
                          onValueChange={setClientSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {filteredClients.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.id}
                                onSelect={() => {
                                  setClientId(c.id)
                                  setProjectId("")
                                  setClientSearchOpen(false)
                                  setClientSearchQuery("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    clientId === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>Project (optional)</Label>
                  <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={projectSearchOpen}
                        className="w-full justify-between"
                        disabled={!clientId}
                      >
                        {projectId
                          ? projectOptions.find((p) => p.id === projectId)?.name || "Select project"
                          : "Select project"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search project..."
                          value={projectSearchQuery}
                          onValueChange={setProjectSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No project found.</CommandEmpty>
                          <CommandGroup>
                            {filteredProjects.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.id}
                                onSelect={() => {
                                  setProjectId(p.id)
                                  setProjectSearchOpen(false)
                                  setProjectSearchQuery("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    projectId === p.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {p.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="inv-number">Invoice #</Label>
                  <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full" />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Invoice["status"])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="issue-date">Issue date</Label>
                  <Input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due-date">Due date</Label>
                  <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Line items</CardTitle>
                  <CardDescription>Materials, labor, and fees.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setAddItemOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[90px] text-right">Qty</TableHead>
                      <TableHead className="w-[100px]">Unit</TableHead>
                      <TableHead className="w-[120px] text-right">Rate</TableHead>
                      <TableHead className="w-[90px] text-center">Tax</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length ? (
                      lineItems.map((li) => (
                        <TableRow key={li.id}>
                          <TableCell>
                            <Input
                              value={li.description}
                              onChange={(e) =>
                                setLineItems((prev) => prev.map((x) => (x.id === li.id ? { ...x, description: e.target.value } : x)))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              inputMode="decimal"
                              value={String(li.quantity)}
                              onChange={(e) => {
                                const q = Number(e.target.value) || 0
                                setLineItems((prev) =>
                                  prev.map((x) => (x.id === li.id ? { ...x, quantity: q, totalPrice: q * x.unitPrice } : x))
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={li.unit}
                              onChange={(e) =>
                                setLineItems((prev) => prev.map((x) => (x.id === li.id ? { ...x, unit: e.target.value } : x)))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              inputMode="decimal"
                              value={String(li.unitPrice)}
                              onChange={(e) => {
                                const r = Number(e.target.value) || 0
                                setLineItems((prev) =>
                                  prev.map((x) => (x.id === li.id ? { ...x, unitPrice: r, totalPrice: r * x.quantity } : x))
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={li.taxable}
                              onCheckedChange={(v) =>
                                setLineItems((prev) => prev.map((x) => (x.id === li.id ? { ...x, taxable: !!v } : x)))
                              }
                              aria-label="Taxable"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">{money(li.totalPrice)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLineItems((prev) => prev.filter((x) => x.id !== li.id))}
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No line items yet. Add materials or labor.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notes</CardTitle>
              <CardDescription>Internal notes (not shown to customer unless you choose).</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add notes..." />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>{invoiceNumber}</span>
                  <InvoiceStatusBadge status={status} />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{money(computed.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxable base</span>
                  <span className="font-medium">{money(computed.taxableBase)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{money(computed.tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">-{money(computed.disc)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-xl font-semibold">{money(computed.total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tax & discount</CardTitle>
                <CardDescription>Quick knobs for common invoice adjustments.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tax-rate">Sales tax % (taxable items)</Label>
                  <Input id="tax-rate" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Discount type</Label>
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="disc">Discount</Label>
                    <Input id="disc" inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-2">
              <Button onClick={() => { setStatus("sent"); saveStub() }} disabled={!canSave}>
                <Send className="mr-2 h-4 w-4" />
                Mark as sent (stub)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddLineItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onAdd={(item) => setLineItems((prev) => [...prev, item])}
      />
    </div>
  )
}
