"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconDotsVertical,
  IconPlus,
  IconLayoutGrid,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useProjectStore } from "@/lib/project-store"
import { useCustomerStore } from "@/lib/customer-store"
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  PROJECT_STATUS_LABELS,
} from "@/lib/project-types"
import { ProjectFormDialog } from "./project-form-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { toast } from "sonner"

export function ProjectsWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { projects, getProject, deleteProject } = useProjectStore()
  const { getCustomer } = useCustomerStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ReturnType<typeof getProject>>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReturnType<typeof getProject>>(null)
  const [defaultCustomerId, setDefaultCustomerId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const newParam = searchParams.get("new")
    const customerId = searchParams.get("customerId")
    if (newParam === "1" && customerId) {
      setDefaultCustomerId(customerId)
      setFormOpen(true)
      router.replace("/dashboard/projects", { scroll: false })
    }
  }, [searchParams, router])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const customer = getCustomer(p.customerId)
      const nameMatch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      const customerMatch = !search || customer?.name?.toLowerCase().includes(search.toLowerCase())
      const statusMatch = statusFilter === "all" || p.status === statusFilter
      const typeMatch = typeFilter === "all" || p.projectType === typeFilter
      return (nameMatch || customerMatch) && statusMatch && typeMatch
    })
  }, [projects, search, statusFilter, typeFilter, getCustomer])

  const handleDelete = (id: string) => {
    deleteProject(id)
    setDeleteTarget(null)
    toast.success("Project deleted.")
  }

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
          <Button size="sm" onClick={() => { setEditingProject(null); setFormOpen(true) }}>
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
              <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
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
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => {
          const customer = getCustomer(project.customerId)
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/job-board`)}>
                        Job board
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingProject(project); setFormOpen(true) }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
                  <Badge variant="secondary" className="text-xs">{project.projectType}</Badge>
                  <Badge variant="outline" className="text-xs">{PROJECT_STATUS_LABELS[project.status]}</Badge>
                  {project.priority !== "Medium" && (
                    <Badge variant="outline" className="text-xs">{project.priority}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {project.durationEstimate && (
                  <span>Est. {project.durationEstimate}</span>
                )}
                {project.assignedCrew && (
                  <span className="ml-2">· {project.assignedCrew}</span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {projects.length === 0 ? "No projects yet." : "No projects match your filters."}
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
        onOpenChange={(open) => { setFormOpen(open); if (!open) setDefaultCustomerId(undefined) }}
        project={editingProject ?? null}
        defaultCustomerId={defaultCustomerId}
        onSaved={() => { setEditingProject(null); setDefaultCustomerId(undefined) }}
      />
      <DeleteProjectDialog
        project={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  )
}
