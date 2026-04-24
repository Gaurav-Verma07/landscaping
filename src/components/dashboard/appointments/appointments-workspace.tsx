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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useAppointmentStore } from "@/lib/appointment-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useProjectStore } from "@/lib/project-store"
import type { Appointment } from "@/lib/appointment-types"
import { AppointmentFormDialog } from "./appointment-form-dialog"

export function AppointmentsWorkspace() {
  const { appointments, getAppointmentsByCustomerId, deleteAppointment } = useAppointmentStore()
  const { customers, getCustomer } = useCustomerStore()
  const { getProject } = useProjectStore()
  const [customerFilter, setCustomerFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const filtered = useMemo(() => {
    let list = customerFilter === "all"
      ? [...appointments].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      : getAppointmentsByCustomerId(customerFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((apt) => {
        const customer = getCustomer(apt.customerId)
        const project = apt.projectId ? getProject(apt.projectId) : null
        return (
          (customer?.name ?? "").toLowerCase().includes(q) ||
          (customer?.companyName ?? "").toLowerCase().includes(q) ||
          apt.address.toLowerCase().includes(q) ||
          (apt.notes ?? "").toLowerCase().includes(q) ||
          (project?.name ?? "").toLowerCase().includes(q)
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments & Calendar</h1>
          <p className="text-muted-foreground text-sm">
            Book appointments linked to customers and projects. Search and filter.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <IconPlus className="size-4 mr-2" />
          New appointment
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by customer, address, project, notes..."
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
                {c.name || c.companyName || c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {paged.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {appointments.length === 0 ? "No appointments yet." : "No appointments match your filters."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((apt) => {
                    const customer = getCustomer(apt.customerId)
                    const project = apt.projectId ? getProject(apt.projectId) : null
                    const start = new Date(apt.startAt)
                    const end = new Date(apt.endAt)
                    return (
                      <TableRow key={apt.id}>
                        <TableCell className="whitespace-nowrap">
                          {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          {" · "}
                          {start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/customers/${apt.customerId}`} className="text-primary hover:underline">
                            {customer?.name ?? customer?.companyName ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {project ? (
                            <Link href={`/dashboard/projects/${apt.projectId}`} className="text-primary hover:underline">
                              {project.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{apt.address}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">{apt.notes || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDotsVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing(apt); setFormOpen(true) }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteAppointment(apt.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editing}
        onSaved={() => setEditing(null)}
      />
    </div>
  )
}
