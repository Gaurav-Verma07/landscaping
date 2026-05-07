"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconDotsVertical,
  IconPlus,
  IconLayoutGrid,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/lib/stores";
import { useCustomerStore } from "@/lib/stores";
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  PROJECT_STATUS_LABELS,
} from "@/types/project-types";
import { ProjectFormDialog } from "./project-form-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { toast } from "sonner";

export function ProjectsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, deleteProject, loading: projectsLoading } = useProjectStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {getProject}= useProjectStore()
  const { getCustomer } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] =
    useState<ReturnType<typeof getProject>>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ReturnType<typeof getProject>>(null);
  const [defaultCustomerId, setDefaultCustomerId] = useState<
    string | undefined
  >(undefined);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  useEffect(() => {
    const newParam = searchParams.get("new");
    const customerId = searchParams.get("customerId");
    if (newParam === "1" && customerId) {
      setDefaultCustomerId(customerId);
      setFormOpen(true);
      router.replace("/dashboard/projects", { scroll: false });
    }
  }, [searchParams, router]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const customer = getCustomer(p.customerId);
      const nameMatch =
        !search || p.name.toLowerCase().includes(search.toLowerCase());
      const customerMatch =
        !search || customer?.name?.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      const typeMatch = typeFilter === "all" || p.projectType === typeFilter;
      return (nameMatch || customerMatch) && statusMatch && typeMatch;
    });
  }, [projects, search, statusFilter, typeFilter, getCustomer]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, statusFilter, typeFilter]);

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / pagination.pageSize),
  );
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const paged = useMemo(() => {
    const start = pageIndex * pagination.pageSize;
    return filtered.slice(start, start + pagination.pageSize);
  }, [filtered, pageIndex, pagination.pageSize]);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeleteTarget(null);
    toast.success("Project deleted.");
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage projects, timelines, and job board status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/projects/job-board">
              <IconLayoutGrid className="mr-2 size-4" />
              Job Board
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingProject(null);
              setFormOpen(true);
            }}
          >
            <IconPlus className="mr-2 size-4" />
            New project
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by project or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROJECT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectsLoading?
          <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
            Loading projects...
          </div>
          :paged.map((project) => {
          const customer = getCustomer(project.customerId);
          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {customer?.name ?? customer?.companyName ?? "—"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingProject(project);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(project)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {project.projectType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                  {project.priority !== "Medium" && (
                    <Badge variant="outline" className="text-xs">
                      {project.priority}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="text-sm text-muted-foreground">
                  {project.durationEstimate && (
                    <span>Est. {project.durationEstimate}</span>
                  )}
                  {project.assignedCrew && (
                    <span className="ml-2">· {project.assignedCrew}</span>
                  )}
                </div>
                <div className="flex justify-end flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="h-8">
                    <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-8">
                    <Link href="/dashboard/projects/job-board">Job board</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length > 0 && !projectsLoading && (
        <div className="flex items-center justify-between gap-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {pageIndex * pagination.pageSize + 1}–
              {Math.min((pageIndex + 1) * pagination.pageSize, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>
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
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
                <SelectItem value="36">36 per page</SelectItem>
                <SelectItem value="48">48 per page</SelectItem>
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
                onClick={() =>
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
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
                  setPagination((prev) => ({
                    ...prev,
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
                  setPagination((prev) => ({
                    ...prev,
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
                  setPagination((prev) => ({
                    ...prev,
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
      )}

      {filtered.length === 0 && !projectsLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {projects.length === 0
                ? "No projects yet."
                : "No projects match your filters."}
            </p>
            {projects.length === 0 && (
              <Button className="mt-4" onClick={() => setFormOpen(true)}>
                <IconPlus className="mr-2 size-4" />
                New project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setDefaultCustomerId(undefined);
        }}
        project={editingProject ?? null}
        defaultCustomerId={defaultCustomerId}
        onSaved={() => {
          setEditingProject(null);
          setDefaultCustomerId(undefined);
        }}
      />
      <DeleteProjectDialog
        project={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}
