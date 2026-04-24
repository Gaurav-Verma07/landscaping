"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDocumentStore } from "@/lib/document-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useProjectStore } from "@/lib/project-store"
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type DocumentRecord, type DocumentType } from "@/lib/document-types"
import { DocumentFormDialog } from "./document-form-dialog"

export function DocumentsWorkspace() {
  const { documents, deleteDocument } = useDocumentStore()
  const { getCustomer } = useCustomerStore()
  const { getProject } = useProjectStore()
  const [customerFilter, setCustomerFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentRecord | null>(null)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [customerFilter, projectFilter, typeFilter, search])

  const filtered = useMemo(() => {
    let list = documents
    if (customerFilter !== "all") list = list.filter((d) => d.customerId === customerFilter)
    if (projectFilter !== "all") list = list.filter((d) => d.projectId === projectFilter)
    if (typeFilter !== "all") list = list.filter((d) => d.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [documents, customerFilter, projectFilter, typeFilter, search])

  const { customers } = useCustomerStore()
  const { projects } = useProjectStore()

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const paged = useMemo(() => {
    const start = pageIndex * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pageIndex, pagination.pageSize])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents & Media</h1>
          <p className="text-muted-foreground text-sm">
            Per-customer and per-project file vault. Contracts, quotes, invoices, photos, receipts, permits. Searchable and tagged.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <IconPlus className="size-4 mr-2" />
          Upload document
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name || c.companyName || c.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">File vault</CardTitle>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {documents.length === 0 ? "No documents yet." : "No documents match your filters."}
            </p>
          ) : (
            <>
            <ul className="space-y-2">
              {paged.map((doc) => {
                const customer = doc.customerId ? getCustomer(doc.customerId) : null
                const project = doc.projectId ? getProject(doc.projectId) : null
                return (
                  <li key={doc.id}>
                    <Card className="border">
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <Badge variant="secondary" className="shrink-0">{DOCUMENT_TYPE_LABELS[doc.type]}</Badge>
                          <span className="font-medium truncate">{doc.name}</span>
                          {doc.tags.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate">
                              {doc.tags.join(", ")}
                            </span>
                          )}
                          {customer && (
                            <Link href={`/dashboard/customers/${doc.customerId}`} className="text-xs text-primary hover:underline shrink-0">
                              {customer.name || customer.companyName}
                            </Link>
                          )}
                          {project && (
                            <Link href={`/dashboard/projects/${doc.projectId}`} className="text-xs text-primary hover:underline shrink-0">
                              {project.name}
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.fileUrl.startsWith("data:") || doc.fileUrl.startsWith("http") ? (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              Open
                            </a>
                          ) : null}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDotsVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing(doc); setFormOpen(true) }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteDocument(doc.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {filtered.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}–
                  {Math.min((pageIndex + 1) * pagination.pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pagination.pageSize)}
                    onValueChange={(v) => setPagination((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }))}
                  >
                    <SelectTrigger className="h-8 w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Page {pageIndex + 1} of {pageCount}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))} disabled={pageIndex === 0} aria-label="First page">
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, pageIndex - 1) }))} disabled={pageIndex === 0} aria-label="Previous page">
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, pageIndex + 1) }))} disabled={pageIndex >= pageCount - 1} aria-label="Next page">
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))} disabled={pageIndex >= pageCount - 1} aria-label="Last page">
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DocumentFormDialog open={formOpen} onOpenChange={setFormOpen} document={editing} onSaved={() => setEditing(null)} />
    </div>
  )
}
