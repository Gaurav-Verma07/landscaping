"use client"

import { useMemo, useState } from "react"
import {
  IconPlus,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { useOutreachStore } from "@/lib/outreach-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  OUTREACH_STAGE_LABELS,
  OUTREACH_TARGET_TYPE_LABELS,
  type OutreachProspect,
  type OutreachStage,
  type OutreachTargetType,
} from "@/lib/outreach-types"
import { Search } from 'lucide-react'
import { FindLeadsDialog } from './find-leads-dialog'

const STAGES: OutreachStage[] = ["New", "Contacted", "Responded", "Qualified", "Partner", "Archived"]

function ProspectFormDialog({
  open,
  onOpenChange,
  prospect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: OutreachProspect | null
}) {
  const { createProspect, updateProspect } = useOutreachStore()
  const isEdit = !!prospect

  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [targetType, setTargetType] = useState<OutreachTargetType>("Realtor")
  const [location, setLocation] = useState("")
  const [industry, setIndustry] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [stage, setStage] = useState<OutreachStage>("New")
  const [leadSource, setLeadSource] = useState("")

  const FORM_ID = "outreach-prospect-form"

  const reset = () => {
    setName("")
    setCompany("")
    setTargetType("Realtor")
    setLocation("")
    setIndustry("")
    setCompanySize("")
    setEmail("")
    setPhone("")
    setNotes("")
    setStage("New")
    setLeadSource("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
    } else if (prospect) {
      setName(prospect.name)
      setCompany(prospect.company)
      setTargetType(prospect.targetType)
      setLocation(prospect.location)
      setIndustry(prospect.industry)
      setCompanySize(prospect.companySize)
      setEmail(prospect.email ?? "")
      setPhone(prospect.phone ?? "")
      setNotes(prospect.notes)
      setStage(prospect.stage)
      setLeadSource(prospect.leadSource)
    }
    onOpenChange(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() && !company.trim()) return
    if (isEdit && prospect) {
      updateProspect(prospect.id, {
        name: name.trim(),
        company: company.trim(),
        targetType,
        location: location.trim(),
        industry: industry.trim(),
        companySize: companySize.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim(),
        stage,
        leadSource: leadSource.trim(),
      })
    } else {
      createProspect({
        name: name.trim(),
        company: company.trim(),
        targetType,
        location: location.trim(),
        industry: industry.trim(),
        companySize: companySize.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim(),
        stage,
        leadSource: leadSource.trim() || "Manual",
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit prospect" : "New prospect"}</DialogTitle>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Contact / name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" />
            </Field>
            <Field>
              <FieldLabel>Company</FieldLabel>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Realty" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>Target type</FieldLabel>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as OutreachTargetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OUTREACH_TARGET_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / region" />
            </Field>
            <Field>
              <FieldLabel>Industry</FieldLabel>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Residential" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>Company size</FieldLabel>
              <Input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="e.g. 1–10" />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Stage</FieldLabel>
              <Select value={stage} onValueChange={(v) => setStage(v as OutreachStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OUTREACH_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Lead source</FieldLabel>
              <Input value={leadSource} onChange={(e) => setLeadSource(e.target.value)} placeholder="e.g. LinkedIn search" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Context, last touch, next step…" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProspectViewDialog({
  open,
  onOpenChange,
  prospect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: OutreachProspect | null
}) {
  if (!prospect) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prospect details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Company:</span>{" "}
            <span>{prospect.company || "—"}</span>
          </div>
          <div>
            <span className="font-medium">Contact:</span>{" "}
            <span>{prospect.name || "—"}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline">{OUTREACH_TARGET_TYPE_LABELS[prospect.targetType]}</Badge>
            {prospect.location && <Badge variant="outline">{prospect.location}</Badge>}
            {prospect.industry && <Badge variant="outline">{prospect.industry}</Badge>}
          </div>
          <div>
            <span className="font-medium">Stage:</span>{" "}
            <span>{OUTREACH_STAGE_LABELS[prospect.stage]}</span>
          </div>
          <div>
            <span className="font-medium">Company size:</span>{" "}
            <span>{prospect.companySize || "—"}</span>
          </div>
          <div>
            <span className="font-medium">Email:</span>{" "}
            <span>{prospect.email || "—"}</span>
          </div>
          <div>
            <span className="font-medium">Phone:</span>{" "}
            <span>{prospect.phone || "—"}</span>
          </div>
          <div>
            <span className="font-medium">Lead source:</span>{" "}
            <span>{prospect.leadSource || "—"}</span>
          </div>
          {prospect.notes && (
            <div className="mt-2">
              <span className="font-medium">Notes:</span>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{prospect.notes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function OutreachWorkspace() {
  const { prospects, moveProspectStage, deleteProspect } = useOutreachStore()
  const [search, setSearch] = useState("")
  const [targetFilter, setTargetFilter] = useState<string>("all")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OutreachProspect | null>(null)
  const [viewing, setViewing] = useState<OutreachProspect | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [findLeadsOpen, setFindLeadsOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return prospects.filter((p) => {
      if (targetFilter !== "all" && p.targetType !== targetFilter) return false
      if (stageFilter !== "all" && p.stage !== stageFilter) return false
      if (!q) return true
      const text = [
        p.name,
        p.company,
        p.location,
        p.industry,
        p.companySize,
        p.email ?? "",
        p.phone ?? "",
        p.notes,
        p.leadSource,
      ]
        .join(" ")
        .toLowerCase()
      return text.includes(q)
    })
  }, [prospects, search, targetFilter, stageFilter])

  const grouped = useMemo(() => {
    const map: Record<OutreachStage, OutreachProspect[]> = {
      New: [],
      Contacted: [],
      Responded: [],
      Qualified: [],
      Partner: [],
      Archived: [],
    }
    filtered.forEach((p) => {
      map[p.stage].push(p)
    })
    return map
  }, [filtered])

  const total = prospects.length
  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const paged = useMemo(() => {
    const start = pageIndex * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pageIndex, pagination.pageSize])

  const totalContacted = grouped.Contacted.length
  const totalQualified = grouped.Qualified.length
  const totalPartners = grouped.Partner.length

  return (
    <div className="flex flex-1 flex-col gap-6">
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Lead Generation & Outreach</h1>
    <p className="text-muted-foreground text-sm">
      Track alliance prospects (realtors, contractors, designers, lawn care companies) through an outreach pipeline.
    </p>
  </div>
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setFindLeadsOpen(true)}
    >
      <Search className="mr-2 size-4" />
      Find Leads
    </Button>
    <Button
      size="sm"
      onClick={() => {
        setEditing(null)
        setFormOpen(true)
      }}
    >
      <IconPlus className="mr-2 size-4" />
      New prospect
    </Button>
  </div>
</div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name, company, location, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Target type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All target types</SelectItem>
            {Object.entries(OUTREACH_TARGET_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {OUTREACH_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {total} prospect{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartners}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prospects table</CardTitle>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {filtered.length === 0 ? "No prospects yet." : "No prospects match your filters."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company / Name</TableHead>
                    <TableHead>Target type</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium truncate">
                          {p.company || p.name || "Unnamed prospect"}
                        </div>
                        {p.name && p.company && (
                          <div className="text-xs text-muted-foreground truncate">
                            {p.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{OUTREACH_TARGET_TYPE_LABELS[p.targetType]}</TableCell>
                      <TableCell>{OUTREACH_STAGE_LABELS[p.stage]}</TableCell>
                      <TableCell>{p.location}</TableCell>
                      <TableCell>{p.industry}</TableCell>
                      <TableCell className="truncate max-w-[140px]">{p.email}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{p.phone}</TableCell>
                      <TableCell className="w-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setViewing(p)
                                setViewOpen(true)
                              }}
                            >
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(p)
                                setFormOpen(true)
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {STAGES.filter((s) => s !== p.stage).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => moveProspectStage(p.id, s)}
                              >
                                Move to {OUTREACH_STAGE_LABELS[s]}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteProspect(p.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {filtered.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}–
                  {Math.min((pageIndex + 1) * pagination.pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pagination.pageSize)}
                    onValueChange={(v) =>
                      setPagination((prev) => ({
                        ...prev,
                        pageSize: Number(v),
                        pageIndex: 0,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} per page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Page {pageIndex + 1} of {pageCount}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                      disabled={pageIndex === 0}
                      aria-label="First page"
                    >
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setPagination((p) => ({ ...p, pageIndex: Math.max(0, pageIndex - 1) }))
                      }
                      disabled={pageIndex === 0}
                      aria-label="Previous page"
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          pageIndex: Math.min(pageCount - 1, pageIndex + 1),
                        }))
                      }
                      disabled={pageIndex >= pageCount - 1}
                      aria-label="Next page"
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))}
                      disabled={pageIndex >= pageCount - 1}
                      aria-label="Last page"
                    >
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProspectFormDialog open={formOpen} onOpenChange={setFormOpen} prospect={editing} />
      <ProspectViewDialog open={viewOpen} onOpenChange={setViewOpen} prospect={viewing} />
      <FindLeadsDialog open={findLeadsOpen} onOpenChange={setFindLeadsOpen} />

    </div>
  )
}

