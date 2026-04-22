"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { useProjectStore } from "@/lib/project-store"
import { useCustomerStore } from "@/lib/customer-store"
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/project-types"
import { toast } from "sonner"

const COLUMN_ORDER: ProjectStatus[] = [
  "Planned",
  "Awaiting Deposit",
  "Materials Ordered",
  "Scheduled",
  "In Progress",
  "Inspection",
  "Completed",
]

function JobCard({
  project,
  isDragOverlay,
}: {
  project: Project
  isDragOverlay?: boolean
}) {
  const { getCustomer } = useCustomerStore()
  const customer = getCustomer(project.customerId)
  const displayName = customer?.name || customer?.companyName || "—"

  return (
    <Card className={`bg-card ${isDragOverlay ? "shadow-lg ring-2 ring-primary/20" : ""}`}>
      <CardHeader className="p-3 pb-1">
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="font-medium text-sm hover:underline truncate block"
          onClick={(e) => isDragOverlay && e.preventDefault()}
        >
          {project.name}
        </Link>
        <p className="text-xs text-muted-foreground truncate">{displayName}</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs space-y-1">
        {project.durationEstimate && (
          <p className="text-muted-foreground">Est. {project.durationEstimate}</p>
        )}
        {project.requiredMaterials.length > 0 && (
          <p className="text-muted-foreground truncate" title={project.requiredMaterials.join(", ")}>
            Materials: {project.requiredMaterials.slice(0, 2).join(", ")}
            {project.requiredMaterials.length > 2 ? "…" : ""}
          </p>
        )}
        {project.equipment.length > 0 && (
          <p className="text-muted-foreground truncate" title={project.equipment.join(", ")}>
            Equipment: {project.equipment.slice(0, 2).join(", ")}
            {project.equipment.length > 2 ? "…" : ""}
          </p>
        )}
        {project.assignedCrew && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {project.assignedCrew}
          </Badge>
        )}
        {project.dependencyProjectIds.length > 0 && (
          <p className="text-muted-foreground">Depends on {project.dependencyProjectIds.length} project(s)</p>
        )}
      </CardContent>
    </Card>
  )
}

function DraggableJobCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    data: { project },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-50" : ""}
    >
      <JobCard project={project} />
    </div>
  )
}

function DroppableColumn({
  status,
  projects,
}: {
  status: ProjectStatus
  projects: Project[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-2 bg-muted/30 min-h-[200px] transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-transparent"
      }`}
    >
      <div className="p-2 border-b shrink-0">
        <h3 className="font-medium text-sm">{PROJECT_STATUS_LABELS[status]}</h3>
        <p className="text-xs text-muted-foreground">{projects.length} project(s)</p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {projects.map((p) => (
          <DraggableJobCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}

export default function JobBoardPage() {
  const { projects, updateProjectStatus } = useProjectStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const projectsByStatus = useMemo(() => {
    const map: Record<ProjectStatus, Project[]> = {
      Planned: [],
      "Awaiting Deposit": [],
      "Materials Ordered": [],
      Scheduled: [],
      "In Progress": [],
      Inspection: [],
      Completed: [],
    }
    PROJECT_STATUSES.forEach((s) => { map[s] = [] })
    projects.forEach((p) => {
      if (map[p.status]) map[p.status].push(p)
    })
    return map
  }, [projects])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const projectId = active.id as string
    const newStatus = over.id as ProjectStatus
    if (!PROJECT_STATUSES.includes(newStatus)) return
    updateProjectStatus(projectId, newStatus)
    toast.success("Project status updated.")
  }

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="size-4" />
              Projects
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Job Board</h1>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Drag cards between columns to update status. Columns: Planned → Awaiting Deposit → Materials Ordered → Scheduled → In Progress → Inspection → Completed.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {COLUMN_ORDER.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              projects={projectsByStatus[status]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject ? <JobCard project={activeProject} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
