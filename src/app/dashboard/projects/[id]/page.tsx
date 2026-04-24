"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useProjectStore } from "@/lib/project-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useAppointmentStore } from "@/lib/appointment-store"
import { useDocumentStore } from "@/lib/document-store"
import { PROJECT_STATUS_LABELS, MILESTONE_TYPE_LABELS } from "@/lib/project-types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/document-types"
import { ProjectFormDialog } from "@/components/dashboard/projects/project-form-dialog"
import { ProjectTimelineSection } from "@/components/dashboard/projects/project-timeline-section"
import { ProjectSupervisorReportsSection } from "@/components/dashboard/projects/project-supervisor-reports-section"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { getProject, getSupervisorReports } = useProjectStore()
  const { getCustomer } = useCustomerStore()
  const { getAppointmentsByProjectId } = useAppointmentStore()
  const { getDocumentsByProjectId } = useDocumentStore()
  const project = getProject(id)
  const [editOpen, setEditOpen] = useState(false)
  const projectAppointments = project ? getAppointmentsByProjectId(project.id) : []
  const projectDocuments = project ? getDocumentsByProjectId(project.id) : []

  if (!project) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/projects">Back to projects</Link>
        </Button>
      </div>
    )
  }

  const customer = getCustomer(project.customerId)
  const reports = getSupervisorReports(project.id)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="size-4" />
            Back to projects
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <Badge variant="secondary">{project.projectType}</Badge>
        <Badge variant="outline">{PROJECT_STATUS_LABELS[project.status]}</Badge>
        <Badge variant="outline">{project.priority}</Badge>
        {customer && (
          <span className="text-muted-foreground text-sm">
            ·{" "}
            <Link href={`/dashboard/customers/${customer.id}`} className="hover:underline">
              {customer.name || customer.companyName}
            </Link>
          </span>
        )}
      </div>

      <Tabs defaultValue="overview" className="flex flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Supervisor reports</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({projectAppointments.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({projectDocuments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Property size:</span> {project.propertySize || "—"}</p>
                <p><span className="text-muted-foreground">Estimated landscape:</span> {project.estimatedLandscapeSqFt != null ? `${project.estimatedLandscapeSqFt} sq ft` : "—"}</p>
                <p><span className="text-muted-foreground">Remaining sq ft:</span> {project.remainingSqFt != null ? project.remainingSqFt : "—"}</p>
                <p><span className="text-muted-foreground">Estimated property value:</span> {project.estimatedPropertyValue != null ? `£${project.estimatedPropertyValue.toLocaleString()}` : "—"}</p>
                <p><span className="text-muted-foreground">Terrain:</span> {project.terrainType || "—"}</p>
                {project.accessNotes && (
                  <p><span className="text-muted-foreground">Access notes:</span> {project.accessNotes}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Job board</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Duration:</span> {project.durationEstimate || "—"}</p>
                <p><span className="text-muted-foreground">Assigned crew:</span> {project.assignedCrew || "—"}</p>
                {project.requiredMaterials.length > 0 && (
                  <p><span className="text-muted-foreground">Materials:</span> {project.requiredMaterials.join(", ")}</p>
                )}
                {project.equipment.length > 0 && (
                  <p><span className="text-muted-foreground">Equipment:</span> {project.equipment.join(", ")}</p>
                )}
                {project.dependencyProjectIds.length > 0 && (
                  <p><span className="text-muted-foreground">Dependencies:</span> {project.dependencyProjectIds.length} project(s)</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline summary</CardTitle>
              <p className="text-muted-foreground text-sm">
                {project.timeline.filter((m) => m.completedAt).length} of {project.timeline.length} milestones completed
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.timeline.slice(0, 5).map((m) => (
                  <Badge key={m.id} variant={m.completedAt ? "default" : "outline"}>
                    {MILESTONE_TYPE_LABELS[m.type]}
                    {m.completedAt && " ✓"}
                  </Badge>
                ))}
                {project.timeline.length > 5 && (
                  <Badge variant="outline">+{project.timeline.length - 5} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 mt-4">
          <ProjectTimelineSection project={project} />
        </TabsContent>

        <TabsContent value="reports" className="flex-1 mt-4">
          <ProjectSupervisorReportsSection project={project} reports={reports} />
        </TabsContent>

        <TabsContent value="appointments" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appointments for this project</CardTitle>
            </CardHeader>
            <CardContent>
              {projectAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments linked to this project.</p>
              ) : (
                <ul className="space-y-2">
                  {projectAppointments.map((apt) => (
                    <li key={apt.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span>
                        {new Date(apt.startAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        {" · "}
                        {apt.address}
                      </span>
                      {apt.notes && <span className="text-muted-foreground truncate max-w-xs">{apt.notes}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/dashboard/appointments">All appointments</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents for this project</CardTitle>
            </CardHeader>
            <CardContent>
              {projectDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents linked to this project.</p>
              ) : (
                <ul className="space-y-2">
                  {projectDocuments.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span className="font-medium">{doc.name}</span>
                      <Badge variant="secondary">{DOCUMENT_TYPE_LABELS[doc.type]}</Badge>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          Open
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/dashboard/documents">All documents</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSaved={() => setEditOpen(false)}
      />
    </div>
  )
}
