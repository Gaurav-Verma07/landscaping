"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, LayoutGrid, Calendar } from "lucide-react"
import { useProjectStore } from "@/lib/project-store"
import { useCustomerStore } from "@/lib/customer-store"
import { applyTemplatePlaceholders, useCommunicationStore } from "@/lib/communication-store"
import { useBillingStore } from "@/lib/billing-store"
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/project-types"
import { toast } from "sonner"

type JobBoardView = "kanban" | "timeline"

/** Earliest milestone due date (ISO) or project createdAt. */
function getProjectDate(project: Project): string | null {
  const withDates = (project.timeline || [])
    .map((m) => m.dueDate)
    .filter((d): d is string => !!d)
  if (withDates.length > 0) {
    return withDates.sort()[0]
  }
  return project.createdAt || null
}

/** Group key for timeline sections. */
function getTimelineGroup(dateIso: string | null): "overdue" | "this_week" | "next_week" | "later" | "no_date" {
  if (!dateIso) return "no_date"
  const d = new Date(dateIso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const nextWeekStart = new Date(weekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)
  const nextWeekEnd = new Date(nextWeekStart)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)
  if (d < today) return "overdue"
  if (d >= weekStart && d <= weekEnd) return "this_week"
  if (d >= nextWeekStart && d <= nextWeekEnd) return "next_week"
  if (d > nextWeekEnd) return "later"
  return "later"
}

const TIMELINE_GROUP_LABELS: Record<string, string> = {
  overdue: "Overdue",
  this_week: "This week",
  next_week: "Next week",
  later: "Later",
  no_date: "No date",
}

const SUPERVISOR_PHOTO_REMINDER_STORAGE_KEY = "landscaping-v2-supervisor-photo-reminders"
const SUPERVISOR_PHOTO_REMINDER_TEMPLATE_ID = "tpl-supervisor-photos-missing"

function loadReminderMap(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(SUPERVISOR_PHOTO_REMINDER_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function saveReminderMap(map: Record<string, string>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SUPERVISOR_PHOTO_REMINDER_STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

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

const TIMELINE_ORDER = ["overdue", "this_week", "next_week", "later", "no_date"] as const

function TimelineView({ projects }: { projects: Project[] }) {
  const { getCustomer } = useCustomerStore()
  const sortedRows = useMemo(() => {
    const withGroup = projects.map((p) => ({
      project: p,
      dateIso: getProjectDate(p),
      group: getTimelineGroup(getProjectDate(p)),
    }))
    withGroup.sort((a, b) => {
      if (a.dateIso && b.dateIso) return new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime()
      if (!a.dateIso) return 1
      if (!b.dateIso) return -1
      return TIMELINE_ORDER.indexOf(a.group) - TIMELINE_ORDER.indexOf(b.group)
    })
    return withGroup
  }, [projects])

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left font-medium p-3 w-28">Due / Period</th>
            <th className="text-left font-medium p-3">Project</th>
            <th className="text-left font-medium p-3">Customer</th>
            <th className="text-left font-medium p-3 w-36">Status</th>
            <th className="text-left font-medium p-3 w-28">Duration</th>
            <th className="text-left font-medium p-3 w-32">Crew</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map(({ project, dateIso, group }) => {
            const customer = getCustomer(project.customerId)
            const dateLabel = dateIso
              ? new Date(dateIso).toLocaleDateString(undefined, { dateStyle: "short" })
              : "—"
            return (
              <tr key={project.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <span className="text-muted-foreground">{TIMELINE_GROUP_LABELS[group]}</span>
                  {dateIso && <span className="block text-xs mt-0.5">{dateLabel}</span>}
                </td>
                <td className="p-3">
                  <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline truncate block">
                    {project.name}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground truncate max-w-[180px]">
                  {customer?.name || customer?.companyName || "—"}
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="text-[10px]">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{project.durationEstimate || "—"}</td>
                <td className="p-3 text-muted-foreground truncate max-w-[120px]">{project.assignedCrew || "—"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sortedRows.length === 0 && (
        <p className="text-sm text-muted-foreground p-6 text-center">No projects to show.</p>
      )}
    </div>
  )
}

export default function JobBoardPage() {
  const { projects, updateProjectStatus, getSupervisorReports } = useProjectStore()
  const { getCustomer, addTimelineEvent } = useCustomerStore()
  const { triggerAutomation, addCommunication, templates } = useCommunicationStore()
  const { createInvoice, getInvoicesByProjectId } = useBillingStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [view, setView] = useState<JobBoardView>("kanban")
  const [reportsMap, setReportsMap] = useState<Record<string, any[]>>({})

 
  useEffect(() => {
    async function loadReports() {
      const map: Record<string, any[]> = {}
  
      for (const p of projects) {
        map[p.id] = await getSupervisorReports(p.id)
      }
  
      setReportsMap(map)
    }
  
    if (projects.length) {
      loadReports()
    }
  }, [projects])

  const sendSupervisorPhotosReminder = (project: Project) => {
    if (!project?.customerId) return
    const customer = getCustomer(project.customerId)
    if (!customer) return

    const alreadySentForToday = loadReminderMap()[project.id] === todayIso()
    if (alreadySentForToday) return

    const template = templates.find((t) => t.id === SUPERVISOR_PHOTO_REMINDER_TEMPLATE_ID)
    if (!template) {
      toast.error("Supervisor reminder template not found. Add it in Communication settings.")
      return
    }

    const contactName = customer.name || customer.companyName || "Customer"
    const date = todayIso()

    const { body, subject } = applyTemplatePlaceholders(
      template.body,
      template.subject,
      contactName,
      { date },
    )

    addCommunication({
      channel: template.channel,
      subject: template.channel === "email" ? subject : "",
      body,
      contactName,
      contactId: customer.id,
      contactEmail: template.channel === "email" ? customer.emails?.[0] : undefined,
      contactPhone: template.channel === "sms" ? customer.phones?.[0] : undefined,
      direction: "outbound",
      read: true,
      createdAt: new Date().toISOString(),
    })

    addTimelineEvent(customer.id, {
      type: "communication",
      title: template.channel === "email" ? subject || "Email" : "SMS",
      date: new Date().toISOString(),
      description: body.slice(0, 200),
    })

    const next = { ...loadReminderMap(), [project.id]: todayIso() }
    saveReminderMap(next)
    toast.success("Daily photo reminder sent.")
  }

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
    const project = projects.find((p) => p.id === projectId)
    const previousStatus = project?.status
    const wasCompleted = previousStatus === "Completed"

    const isSupervisorPhotosMissingToday = (projectId: string) => {
      const reports = reportsMap[projectId] || []
      const report = reports.find((r) => r.date === todayIso())
      return !report || report.photoUrls.length === 0
    }
    
    if (
      project &&
      previousStatus !== "In Progress" &&
      newStatus === "In Progress" &&
      isSupervisorPhotosMissingToday(project.id)
    ) {
      toast.error("Daily supervisor report with at least one photo is required before moving to In Progress.")
      sendSupervisorPhotosReminder(project)
      return
    }

    updateProjectStatus(projectId, newStatus)
    toast.success("Project status updated.")
    if (project && previousStatus !== "Awaiting Deposit" && newStatus === "Awaiting Deposit") {
      const existingDeposit = getInvoicesByProjectId(project.id).some((inv) => inv.type === "deposit")
      if (!existingDeposit) {
        const now = Date.now()
        const due = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        createInvoice({
          customerId: project.customerId,
          projectId: project.id,
          quoteId: null,
          type: "deposit",
          status: "draft",
          lineItems: [
            {
              id: `invli-${now}`,
              description: `Deposit for ${project.name}`,
              quantity: 1,
              unit: "item",
              unitPrice: project.estimatedPropertyValue ?? 0,
              amount: project.estimatedPropertyValue ?? 0,
              sortOrder: 0,
            },
          ],
          subtotal: project.estimatedPropertyValue ?? 0,
          taxRatePercent: 0,
          taxAmount: 0,
          total: project.estimatedPropertyValue ?? 0,
          dueDate: due,
          paymentTermsDays: 7,
          notes: "Auto-created deposit invoice from job board.",
        })
        toast.success("Deposit invoice draft created.")
      }
    }
    if (!wasCompleted && newStatus === "Completed" && project) {
      const customer = getCustomer(project.customerId)
      if (customer) {
        triggerAutomation("post_project", {
          contactId: customer.id,
          contactName: customer.name || customer.companyName || "Customer",
          contactEmail: customer.emails[0],
          contactPhone: customer.phones[0],
        })
      }
    }
  }

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="size-4" />
              Projects
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Job Board</h1>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as JobBoardView)}>
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="mr-1.5 size-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="mr-1.5 size-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === "kanban" && (
        <p className="text-muted-foreground text-sm">
          Drag cards between columns to update status. Columns: Planned → Awaiting Deposit → Materials Ordered → Scheduled → In Progress → Inspection → Completed.
        </p>
      )}
      {view === "timeline" && (
        <p className="text-muted-foreground text-sm">
          Table ordered by due date (earliest milestone or creation). Columns: Due/period, Project, Customer, Status, Duration, Crew.
        </p>
      )}

      {view === "kanban" && (
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
      )}

      {view === "timeline" && <TimelineView projects={projects} />}
    </div>
  )
}
