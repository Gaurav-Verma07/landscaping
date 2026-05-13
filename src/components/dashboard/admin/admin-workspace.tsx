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

const ACTION_GROUPS: { label: string; actions: AuditAction[] }[] = [
  {
    label: "Customers",
    actions: ["customer_created", "customer_updated", "customer_deleted"],
  },
  {
    label: "Projects",
    actions: ["project_created", "project_updated", "project_status_changed", "project_deleted"],
  },
  {
    label: "Quotes & Billing",
    actions: [
      "quote_created", "quote_sent", "quote_accepted", "quote_rejected",
      "contract_signed",
      "invoice_created", "invoice_sent", "payment_recorded",
      "material_created", "material_updated", "material_deleted",
      "supplier_created", "supplier_updated", "supplier_deleted",
    ],
  },
  {
    label: "Appointments",
    actions: ["appointment_created", "appointment_updated", "appointment_cancelled"],
  },
  {
    label: "Equipment",
    actions: [
      "equipment_asset_created", "equipment_asset_updated", "equipment_asset_deleted",
      "equipment_booking_created", "equipment_booking_updated", "equipment_booking_deleted",
    ],
  },
  {
    label: "Documents",
    actions: ["document_created", "document_deleted"],
  },
  {
    label: "Communications",
    actions: [
      "communication_sent",
      "communication_template_created", "communication_template_updated", "communication_template_deleted",
      "communication_rule_created", "communication_rule_updated", "communication_rule_deleted",
      "communication_sequence_created", "communication_sequence_deleted",
      "automation_triggered",
    ],
  },
  {
    label: "Outreach",
    actions: [
      "prospect_created", "prospect_updated", "prospect_deleted",
      "prospect_converted", "prospect_message_sent",
    ],
  },
  {
    label: "Crew & Labor",
    actions: [
      "employee_created", "employee_updated", "employee_deleted",
      "employee_clocked_in", "employee_clocked_out",
    ],
  },
  {
    label: "Marketing",
    actions: ["campaign_created", "campaign_sent", "campaign_deleted"],
  },
]

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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin & Audit</h1>
          <p className="text-muted-foreground text-sm">
            Audit trail of all actions across every module.
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
          <SelectTrigger className="w-[240px] h-9">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value={ACTION_FILTER_ALL}>All actions</SelectItem>
            {ACTION_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.label}</div>
                {group.actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {AUDIT_ACTION_LABELS[a]}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Audit log
            {entries.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({entries.length} entries)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
              Loading audits...
            </div>
          ) : filtered.length !== 0 ? (
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
                      <TableCell>{AUDIT_ACTION_LABELS[e.action] ?? e.action}</TableCell>
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
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No audit entries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}