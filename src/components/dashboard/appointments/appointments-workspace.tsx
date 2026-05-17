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
  IconList,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconBuildingSkyscraper,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useAppointmentStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { useProjectStore } from "@/lib/stores"
import type { Appointment } from "@/types/appointment-types"
import { AppointmentFormDialog } from "./appointment-form-dialog"
import { AppointmentCalendarView } from "./appointments-calender"

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "list" | "calendar"

// ─── Status helpers ──────────────────────────────────────────────────────────

function getAptStatus(apt: Appointment) {
  const now   = new Date()
  const start = new Date(apt.startAt)
  const end   = new Date(apt.endAt)
  if (end < now) return "past"
  if (start < now && end > now) return "ongoing"
  const diffH = (start.getTime() - now.getTime()) / 36e5
  if (diffH <= 2) return "urgent"
  return "upcoming"
}

const STATUS_META = {
  past:     { label: "Past",        variant: "secondary" as const, rowClass: "opacity-60" },
  ongoing:  { label: "In Progress", variant: "default"   as const, rowClass: "bg-emerald-50/50 dark:bg-emerald-950/10" },
  urgent:   { label: "Soon",        variant: "outline"   as const, rowClass: "bg-amber-50/50 dark:bg-amber-950/10" },
  upcoming: { label: "Scheduled",   variant: "outline"   as const, rowClass: "" },
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

// ─── List Row ────────────────────────────────────────────────────────────────

function AppointmentListRow({
  apt,
  getCustomer,
  getProject,
  onEdit,
  onDelete,
}: {
  apt: Appointment
  getCustomer: (id: string) => { name?: string; companyName?: string } | undefined
  getProject:  (id: string) => { name: string } | undefined
  onEdit:   (apt: Appointment) => void
  onDelete: (id: string) => void
}) {
  const customer = getCustomer(apt.customerId)
  const project  = apt.projectId ? getProject(apt.projectId) : null
  const start    = new Date(apt.startAt)
  const end      = new Date(apt.endAt)
  const status   = getAptStatus(apt)
  const meta     = STATUS_META[status]

  return (
    <TableRow className={meta.rowClass}>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm whitespace-nowrap">
            {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <IconClock className="size-3" />
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Link
          href={`/dashboard/customers/${apt.customerId}`}
          className="font-medium text-primary hover:underline"
        >
          {customer?.name ?? customer?.companyName ?? "—"}
        </Link>
      </TableCell>
      <TableCell>
        {project ? (
          <Link
            href={`/dashboard/projects/${apt.projectId}`}
            className="flex items-center gap-1 text-primary hover:underline text-sm"
          >
            <IconBuildingSkyscraper className="size-3 flex-shrink-0" />
            {project.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1 text-sm text-muted-foreground max-w-[180px] truncate">
          <IconMapPin className="size-3 flex-shrink-0" />
          {apt.address}
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant={meta.variant}
          className={`text-xs ${
            status === "ongoing" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300" :
            status === "urgent"  ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300" : ""
          }`}
        >
          {meta.label}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
        {apt.notes || "—"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(apt)}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(apt.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ─── Main Workspace ───────────────────────────────────────────────────────────

export function AppointmentsWorkspace() {
  const { appointments, getAppointmentsByCustomerId, deleteAppointment } = useAppointmentStore()
  const { customers, getCustomer } = useCustomerStore()
  const { getProject } = useProjectStore()

  const [view, setView]                 = useState<ViewMode>("list")
  const [customerFilter, setCustomerFilter] = useState<string>("all")
  const [search, setSearch]             = useState("")
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState<Appointment | null>(null)
  const [pagination, setPagination]     = useState({ pageIndex: 0, pageSize: 10 })
  const [weekStart, setWeekStart]       = useState<Date>(() => getMondayOf(new Date()))

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list =
      customerFilter === "all"
        ? [...appointments].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
        : getAppointmentsByCustomerId(customerFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((apt) => {
        const customer = getCustomer(apt.customerId)
        const project  = apt.projectId ? getProject(apt.projectId) : null
        return (
          (customer?.name        ?? "").toLowerCase().includes(q) ||
          (customer?.companyName ?? "").toLowerCase().includes(q) ||
          apt.address.toLowerCase().includes(q)                   ||
          (apt.notes             ?? "").toLowerCase().includes(q)  ||
          (project?.name         ?? "").toLowerCase().includes(q)
        )
      })
    }
    return list
  }, [appointments, customerFilter, getAppointmentsByCustomerId, search, getCustomer, getProject])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [customerFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const paged = useMemo(() => {
    const start = pageIndex * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pageIndex, pagination.pageSize])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleEdit(apt: Appointment) {
    setEditing(apt)
    setFormOpen(true)
  }

  function handleDelete(id: string) {
    deleteAppointment(id)
  }

  function handleWeekChange(dir: 1 | -1) {
    setWeekStart((w) => addWeeks(w, dir))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments & Calendar</h1>
          <p className="text-muted-foreground text-sm">
            Book appointments linked to customers and projects.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <IconPlus className="size-4 mr-2" />
          New appointment
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/50 gap-0.5">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs gap-1.5"
            onClick={() => setView("list")}
          >
            <IconList className="size-3.5" />
            List
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs gap-1.5"
            onClick={() => setView("calendar")}
          >
            <IconCalendar className="size-3.5" />
            Calendar
          </Button>
        </div>

        {/* Search + filter — shown in both list and calendar views */}
        <Input
          placeholder="Search by customer, address, project, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name || c.companyName || c.emails?.[0] || "—"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── List View ── */}
      {view === "list" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Appointments</span>
              <span className="text-sm font-normal text-muted-foreground">{filtered.length} total</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paged.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                {appointments.length === 0
                  ? "No appointments yet. Create your first one!"
                  : "No appointments match your filters."}
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((apt) => (
                      <AppointmentListRow
                        key={apt.id}
                        apt={apt}
                        getCustomer={getCustomer}
                        getProject={getProject}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {filtered.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}–
                    {Math.min((pageIndex + 1) * pagination.pageSize, filtered.length)} of{" "}
                    {filtered.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(pagination.pageSize)}
                      onValueChange={(v) =>
                        setPagination((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }))
                      }
                    >
                      <SelectTrigger className="h-8 w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((n) => (
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
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                        disabled={pageIndex === 0}
                      >
                        <IconChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, pageIndex - 1) }))}
                        disabled={pageIndex === 0}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() =>
                          setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, pageIndex + 1) }))
                        }
                        disabled={pageIndex >= pageCount - 1}
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))}
                        disabled={pageIndex >= pageCount - 1}
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
      )}

      {/* ── Calendar View ── */}
      {view === "calendar" && (
        <AppointmentCalendarView
          appointments={filtered}
          weekStart={weekStart}
          onWeekChange={handleWeekChange}
          onGoToToday={() => setWeekStart(getMondayOf(new Date()))}
          getCustomer={getCustomer}
          getProject={getProject}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── Form dialog ── */}
      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editing}
        onSaved={() => setEditing(null)}
      />
    </div>
  )
}