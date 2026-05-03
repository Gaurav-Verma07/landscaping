"use client"

import { useState, useMemo } from "react"
import { IconTrash, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuditStore } from "@/lib/stores"
import { AUDIT_ACTION_LABELS, type AuditAction } from "@/types/audit-types"
import { toast } from "sonner"

const PAGE_SIZE = 25
const ACTION_FILTER_ALL = "all"

export function AdminWorkspace() {
  const { entries, clear, loading: auditLoading } = useAuditStore()
  const [actionFilter, setActionFilter] = useState<string>(ACTION_FILTER_ALL)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (actionFilter === ACTION_FILTER_ALL) return entries
    return entries.filter((e) => e.action === actionFilter)
  }, [entries, actionFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageIndex = Math.min(page, pageCount - 1)
  const paged = useMemo(
    () => filtered.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
    [filtered, pageIndex],
  )

  const actions: AuditAction[] = [
    "quote_created",
    "quote_sent",
    "quote_accepted",
    "contract_signed",
    "invoice_created",
    "payment_recorded",
    "project_created",
    "project_status_changed",
    "appointment_created",
    "customer_created",
    "automation_triggered",
  ]

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin & Audit</h1>
          <p className="text-muted-foreground text-sm">
            Audit trail of key actions. Retention is local; clear when needed.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clear()
            toast.success("Audit log cleared.")
          }}
        >
          <IconTrash className="mr-2 size-4" />
          Clear log
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ACTION_FILTER_ALL}>All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {AUDIT_ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading?
            <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
            Loading audits...
          </div>
          : filtered.length !== 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Time</TableHead>
                    <TableHead className="w-44">Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(e.timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>{AUDIT_ACTION_LABELS[e.action]}</TableCell>
                      <TableCell className="font-mono text-sm">{e.entityType} · {e.entityId}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{e.details || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Showing {filtered.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1}–
                  {Math.min((pageIndex + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(0)} disabled={pageIndex === 0} aria-label="First page">
                    <IconChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageIndex === 0} aria-label="Previous">
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={pageIndex >= pageCount - 1} aria-label="Next">
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(pageCount - 1)} disabled={pageIndex >= pageCount - 1} aria-label="Last page">
                    <IconChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )
          : (
            <p className="text-sm text-muted-foreground py-6 text-center">No audit entries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
