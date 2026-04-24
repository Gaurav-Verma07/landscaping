"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useLaborStore } from "@/lib/labor-store";
import { useProjectStore } from "@/lib/project-store";
import type { Employee, TimeEntry } from "@/lib/labor-types";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { toast } from "sonner";

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getEntryDuration(entry: TimeEntry): number | null {
  if (!entry.clockOutAt) return null;
  return (
    new Date(entry.clockOutAt).getTime() - new Date(entry.clockInAt).getTime()
  );
}

export function CrewWorkspace() {
  const {
    employees,
    timeEntries,
    getActiveTimeEntry,
    getTimeEntriesByEmployeeId,
    clockIn,
    clockOut,
    deleteEmployee,
  } = useLaborStore();
  const { projects } = useProjectStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [clockInEmployeeId, setClockInEmployeeId] = useState("");
  const [clockInProjectId, setClockInProjectId] = useState("");
  const [logsEmployeeId, setLogsEmployeeId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    if (logsEmployeeId) setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [logsEmployeeId, dateFrom, dateTo]);

  const handleClockIn = () => {
    if (!clockInEmployeeId || !clockInProjectId) {
      toast.error("Select employee and project.");
      return;
    }
    clockIn(clockInEmployeeId, clockInProjectId, false);
    toast.success("Clocked in.");
    setClockInEmployeeId("");
    setClockInProjectId("");
  };

  const logsEmployee = logsEmployeeId
    ? employees.find((e) => e.id === logsEmployeeId)
    : null;
  const allEntriesForEmployee = useMemo(() => {
    if (!logsEmployeeId) return [];
    return getTimeEntriesByEmployeeId(logsEmployeeId);
  }, [logsEmployeeId, getTimeEntriesByEmployeeId]);

  const filteredLogs = useMemo(() => {
    let list = allEntriesForEmployee;
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((e) => new Date(e.clockInAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      const toMs = to.getTime();
      list = list.filter((e) => new Date(e.clockInAt).getTime() <= toMs);
    }
    return list.sort(
      (a, b) =>
        new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime(),
    );
  }, [allEntriesForEmployee, dateFrom, dateTo]);

  const totalMs = useMemo(() => {
    return filteredLogs.reduce((sum, e) => {
      const d = getEntryDuration(e);
      return sum + (d ?? 0);
    }, 0);
  }, [filteredLogs]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredLogs.length / pagination.pageSize),
  );
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const pagedLogs = useMemo(() => {
    const start = pageIndex * pagination.pageSize;
    return filteredLogs.slice(start, start + pagination.pageSize);
  }, [filteredLogs, pageIndex, pagination.pageSize]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crew & Labor</h1>
          <p className="text-muted-foreground text-sm">
            Employees, time tracking (clock in/out by project). View logs per
            employee with date filter and totals.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <IconPlus className="size-4 mr-2" />
          Add employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <Select
            value={clockInEmployeeId}
            onValueChange={setClockInEmployeeId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clockInProjectId} onValueChange={setClockInProjectId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleClockIn}
            disabled={!clockInEmployeeId || !clockInProjectId}
          >
            Clock in
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crew / employees</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No employees yet.
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
                  const active = getActiveTimeEntry(emp.id);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={() => setLogsEmployeeId(emp.id)}
                        >
                          {emp.name}
                        </button>
                      </TableCell>
                      <TableCell>{emp.role}</TableCell>
                      <TableCell>{emp.skillLevel}</TableCell>
                      <TableCell>
                        {active ? (
                          <span className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default">Clocked in</Badge>
                            <Link
                              href={`/dashboard/projects/${active.projectId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {projects.find((p) => p.id === active.projectId)
                                ?.name ?? "Project"}
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => {
                                clockOut(active.id);
                                toast.success("Clocked out.");
                              }}
                            >
                              Clock out
                            </Button>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLogsEmployeeId(emp.id)}
                            >
                              View time logs
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(emp);
                                setFormOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                deleteEmployee(emp.id);
                                toast.success("Employee removed.");
                                setLogsEmployeeId((id) =>
                                  id === emp.id ? null : id,
                                );
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {logsEmployee && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">
              Time logs — {logsEmployee.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogsEmployeeId(null)}
            >
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[140px] h-9"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[140px] h-9"
              />
              <span className="text-sm font-medium">
                Total: {formatDuration(totalMs)}
              </span>
            </div>
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
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
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLogs.map((entry) => {
                      const duration = getEntryDuration(entry);
                      const project = projects.find(
                        (p) => p.id === entry.projectId,
                      );
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
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/dashboard/projects/${entry.projectId}`}
                              className="text-primary hover:underline text-sm"
                            >
                              {project?.name ?? entry.projectId}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            {duration != null
                              ? formatDuration(duration)
                              : "In progress"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between gap-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {filteredLogs.length === 0
                      ? 0
                      : pageIndex * pagination.pageSize + 1}
                    –
                    {Math.min(
                      (pageIndex + 1) * pagination.pageSize,
                      filteredLogs.length,
                    )}{" "}
                    of {filteredLogs.length}
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
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setPagination((p) => ({ ...p, pageIndex: 0 }))
                        }
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
                          setPagination((p) => ({
                            ...p,
                            pageIndex: Math.max(0, pageIndex - 1),
                          }))
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
                        onClick={() =>
                          setPagination((p) => ({
                            ...p,
                            pageIndex: pageCount - 1,
                          }))
                        }
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
      )}

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        onSaved={() => setEditing(null)}
      />
    </div>
  );
}
