"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  IconPlus,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getGpsStatus, type Employee, type TimeEntry } from "@/types/labor-types";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { toast } from "sonner";
import { Loader2, MapPin, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveTimeEntries, useClockOut, useDeleteEmployee, useEmployees, useTimeEntriesByEmployee } from "@/lib/hooks/use-labor";
import { useProjects } from "@/lib/hooks/use-projects";
import { ClockInDialog } from "./clock-in-dialog";
import { SupervisorOverrideDialog } from "./supervisor-override-dialog";

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function entryDurationMs(entry: TimeEntry): number | null {
  if (!entry.clockOutAt) return null
  return new Date(entry.clockOutAt).getTime() - new Date(entry.clockInAt).getTime()
}


// GPS badge

function GpsBadge({
  entry,
  onOverride,
}:{
  entry: TimeEntry
  onOverride?: ()=>void
}){
  const status= getGpsStatus(entry)

  if(status=== 'no_gps'){
    return(
      <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
        <MapPin className="size-3"/>
        No GPS
      </Badge>
    )
  }

  if(status==='verified'){
    return(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
            variant="outline"
            className="text-xs gap-1 border-green-300 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
            >
              <ShieldCheck className="size-3"/>
              On site
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {entry.distanceMeters!= null
            ? `${entry.distanceMeters}m from site · ±${Math.round(entry.accuracyMeters ?? 0)}m accuracy` 
              : 'GPS verified'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if(status==='overridden'){
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-xs gap-1 border-blue-300 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
            >
              <ShieldCheck className="size-3" />
              Overridden
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{entry.overrideReason ?? 'Supervisor approved'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  //unverified
  return(
    <div className="flex items-center gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
            variant="outline"
            className="text-xs gap-1 border-red-300 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
            >
              <ShieldAlert className="size-3"/>
              Off site
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {entry.distanceMeters!= null
              ? `${entry.distanceMeters}m from site`
              : 'GPS check failed'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {onOverride &&(
        <Button
        size="sm"
        variant="ghost"
        className="h-5 text-xs px-1.5 text-muted-foreground hover:text-foreground"
        onClick={onOverride}
        >
          <ShieldOff className="size-3 mr-1"/>
          Override
        </Button>
      )}
    </div>
  )
}

export function CrewWorkspace() {
  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: employees = [], isLoading: laborLoading } = useEmployees()
  const { data: activeEntries = [] } = useActiveTimeEntries()
  const { data: projects = [] } = useProjects()

  const clockOutMutation = useClockOut()
  const deleteEmployeeMutation = useDeleteEmployee()

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  // Clock-in dialog
  const [clockInEmployee, setClockInEmployee] = useState<Employee | null>(null)

  // Override dialog
  const [overrideEntry, setOverrideEntry] = useState<TimeEntry | null>(null)
  const [overrideEmployeeName, setOverrideEmployeeName] = useState('')

  // Time-log panel
  const [logsEmployeeId, setLogsEmployeeId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // ── Helpers to set filters and reset page ────────────────────────────────────
  const selectEmployee = (id: string) => {
    setLogsEmployeeId(id)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  // ── Time-log query (per selected employee) ───────────────────────────────────
  const { data: rawLogs = [], isLoading: logsLoading } = useTimeEntriesByEmployee(logsEmployeeId)

  const logsEmployee = useMemo(
    () => employees.find((e) => e.id === logsEmployeeId) ?? null,
    [employees, logsEmployeeId],
  )

  // ── Active entry lookup ───────────────────────────────────────────────────────
  const getActiveEntry = useCallback(
    (employeeId: string) => activeEntries.find((e) => e.employeeId === employeeId) ?? null,
    [activeEntries],
  )

  // ── Clock-out handler ────────────────────────────────────────────────────────
  const handleClockOut = async (entryId: string) => {
    const result = await clockOutMutation.mutateAsync(entryId)
    if ('error' in result && result.error) {
      toast.error(result.error as string)
    } else {
      toast.success('Clocked out')
    }
  }

  // ── Delete employee ──────────────────────────────────────────────────────────
  const handleDelete = async (emp: Employee) => {
    await deleteEmployeeMutation.mutateAsync(emp.id)
    toast.success('Employee removed')
    if (logsEmployeeId === emp.id) setLogsEmployeeId(null)
  }

  // ── Filtered + paginated time logs ───────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let list = rawLogs
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      list = list.filter((e) => new Date(e.clockInAt).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter((e) => new Date(e.clockInAt).getTime() <= to.getTime())
    }
    return list.sort(
      (a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime(),
    )
  }, [rawLogs, dateFrom, dateTo])

  const totalMs = useMemo(
    () => filteredLogs.reduce((sum, e) => sum + (entryDurationMs(e) ?? 0), 0),
    [filteredLogs],
  )

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / pagination.pageSize))
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1)
  const pagedLogs = useMemo(() => {
    const start = pageIndex * pagination.pageSize
    return filteredLogs.slice(start, start + pagination.pageSize)
  }, [filteredLogs, pageIndex, pagination.pageSize])

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crew &amp; Labor</h1>
          <p className="text-muted-foreground text-sm">
            Manage employees, track time with GPS verification, and review clock-in logs.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <IconPlus className="size-4 mr-2" />
          Add employee
        </Button>
      </div>

      {/* Employees table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crew / employees</CardTitle>
        </CardHeader>
        <CardContent>
          {laborLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading employees…
            </div>
          ) : employees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No employees yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const active = getActiveEntry(emp.id)
                  const activeProject = active
                    ? projects.find((p) => p.id === active.projectId)
                    : null

                  return (
                    <TableRow key={emp.id}>
                      {/* Name */}
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={() => selectEmployee(emp.id)}
                        >
                          {emp.name}
                        </button>
                      </TableCell>

                      {/* Role */}
                      <TableCell>{emp.role}</TableCell>

                      {/* Skill */}
                      <TableCell>{emp.skillLevel}</TableCell>

                      {/* Clock-in status */}
                      <TableCell>
                        {active ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default" className="text-xs">Clocked in</Badge>

                            {/* GPS badge */}
                            <GpsBadge
                              entry={active}
                              onOverride={
                                getGpsStatus(active) === 'unverified'
                                  ? () => {
                                      setOverrideEntry(active)
                                      setOverrideEmployeeName(emp.name)
                                    }
                                  : undefined
                              }
                            />

                            {/* Project link */}
                            {activeProject && (
                              <Link
                                href={`/dashboard/projects/${activeProject.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {activeProject.name}
                              </Link>
                            )}

                            {/* Clock out */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              disabled={clockOutMutation.isPending}
                              onClick={() => handleClockOut(active.id)}
                            >
                              Clock out
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => setClockInEmployee(emp)}
                          >
                            <MapPin className="size-3" />
                            Clock in
                          </Button>
                        )}
                      </TableCell>

                      {/* Row menu */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => selectEmployee(emp.id)}>
                              View time logs
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(emp)
                                setFormOpen(true)
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(emp)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Time log panel */}
      {logsEmployee && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">
              Time logs — {logsEmployee.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLogsEmployeeId(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date filter row */}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-[140px] h-9"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-[140px] h-9"
              />
              <span className="text-sm font-medium ml-auto">
                Total: {formatDuration(totalMs)}
              </span>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                Loading logs…
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No time entries in this range.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock in</TableHead>
                      <TableHead>Clock out</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>GPS</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLogs.map((entry) => {
                      const duration = entryDurationMs(entry)
                      const project = projects.find((p) => p.id === entry.projectId)
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {new Date(entry.clockInAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(entry.clockInAt).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {entry.clockOutAt
                              ? new Date(entry.clockOutAt).toLocaleTimeString()
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {project ? (
                              <Link
                                href={`/dashboard/projects/${entry.projectId}`}
                                className="text-primary hover:underline text-sm"
                              >
                                {project.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <GpsBadge
                              entry={entry}
                              onOverride={
                                getGpsStatus(entry) === 'unverified'
                                  ? () => {
                                      setOverrideEntry(entry)
                                      setOverrideEmployeeName(logsEmployee.name)
                                    }
                                  : undefined
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {duration != null ? formatDuration(duration) : (
                              <span className="text-muted-foreground">In progress</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing{' '}
                    {filteredLogs.length === 0 ? 0 : pageIndex * pagination.pageSize + 1}–
                    {Math.min((pageIndex + 1) * pagination.pageSize, filteredLogs.length)}{' '}
                    of {filteredLogs.length}
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
                        {[10, 25, 50].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} per page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      Page {pageIndex + 1} of {pageCount}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                        disabled={pageIndex === 0} aria-label="First page">
                        <IconChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, pageIndex - 1) }))}
                        disabled={pageIndex === 0} aria-label="Previous page">
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, pageIndex + 1) }))}
                        disabled={pageIndex >= pageCount - 1} aria-label="Next page">
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))}
                        disabled={pageIndex >= pageCount - 1} aria-label="Last page">
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

      {/* ── Dialogs ── */}
      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        onSaved={() => setEditing(null)}
      />

      <ClockInDialog
        open={!!clockInEmployee}
        onOpenChange={(v) => { if (!v) setClockInEmployee(null) }}
        employeeId={clockInEmployee?.id ?? ''}
        employeeName={clockInEmployee?.name ?? ''}
        onSuccess={() => setClockInEmployee(null)}
      />

      <SupervisorOverrideDialog
        open={!!overrideEntry}
        onOpenChange={(v) => { if (!v) setOverrideEntry(null) }}
        entry={overrideEntry}
        employeeName={overrideEmployeeName}
      />
    </div>
  )
}
