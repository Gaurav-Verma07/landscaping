"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, MapPin, Pencil, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useProjectStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { useAppointmentStore } from "@/lib/stores"
import { useDocumentStore } from "@/lib/stores"
import { PROJECT_STATUS_LABELS, MILESTONE_TYPE_LABELS } from "@/types/project-types"
import { DOCUMENT_TYPE_LABELS } from "@/types/document-types"
import { ProjectFormDialog } from "@/components/dashboard/projects/project-form-dialog"
import { ProjectTimelineSection } from "@/components/dashboard/projects/project-timeline-section"
import { ProjectSupervisorReportsSection } from "@/components/dashboard/projects/project-supervisor-reports-section"
import {  useCommunicationStore } from "@/lib/stores"
import { toast } from "sonner"
import { applyTemplatePlaceholders } from "../../../../../utils/utils"

const SUPERVISOR_PHOTO_REMINDER_STORAGE_KEY = "landscaping-v2-supervisor-photo-reminders"
const SUPERVISOR_PHOTO_REMINDER_TEMPLATE_ID = "tpl-supervisor-photos-missing"

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { getProject, getSupervisorReports } = useProjectStore()
  const { getCustomer, addTimelineEvent } = useCustomerStore()
  const { getAppointmentsByProjectId } = useAppointmentStore()
  const { getDocumentsByProjectId } = useDocumentStore()
  const { addCommunication, templates } = useCommunicationStore()
  const [reports, setReports] = useState([])
  const project = getProject(id)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    async function loadReports() {
      const data = await getSupervisorReports(project.id)
      setReports(data)
    }
  
    if (project?.id) {
      loadReports()
    }
  }, [project?.id])

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
  const projectAppointments = project ? getAppointmentsByProjectId(project.id) : []
  const projectDocuments = project ? getDocumentsByProjectId(project.id) : []

  const today = new Date().toISOString().slice(0, 10)
  const todayReport = reports.find((r) => r.date === today)
  const missingPhotosToday = !todayReport || todayReport.photoUrls.length === 0

  const loadReminderMap = (): Record<string, string> => {
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

  const saveReminderMap = (map: Record<string, string>) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(SUPERVISOR_PHOTO_REMINDER_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }

  const sendSupervisorPhotosReminder = () => {
    const customer = getCustomer(project.customerId)
    if (!customer) return

    const reminderMap = loadReminderMap()
    if (reminderMap[project.id] === today) {
      toast.info("Reminder already sent today.")
      return
    }

    const template = templates.find((t) => t.id === SUPERVISOR_PHOTO_REMINDER_TEMPLATE_ID)
    if (!template) {
      toast.error("Reminder template not found. Add it in Communication settings.")
      return
    }

    const contactName = customer.name || customer.companyName || "Customer"
    const { body, subject } = applyTemplatePlaceholders(
      template.body,
      template.subject,
      contactName,
      { date: today },
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

    saveReminderMap({ ...reminderMap, [project.id]: today })
    toast.success("Daily photo reminder sent.")
  }

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
          <TabsTrigger value="location">Location</TabsTrigger>
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
          {missingPhotosToday && (
            <Card className="mb-4 border-warning/50 bg-warning/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily photos required</CardTitle>
                <p className="text-muted-foreground text-sm">
                  No daily supervisor report with photos submitted for today ({today}). Add photos to keep the project moving.
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Submitting a report with at least one photo satisfies this requirement.
                </p>
                <Button size="sm" variant="outline" onClick={sendSupervisorPhotosReminder}>
                  Send reminder
                </Button>
              </CardContent>
            </Card>
          )}
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

        <TabsContent value="location" className="flex-1 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="size-4" />
                  Site coordinates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {project.siteLat != null && project.siteLng != null ? (
                  <>
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span className="font-medium">GPS location saved</span>
                    </div>
                    <div className="rounded-md border bg-muted/40 p-3 space-y-1 font-mono text-xs">
                      <p>Lat: {project.siteLat}</p>
                      <p>Lng: {project.siteLng}</p>
                      <p>Radius: {project.gpsRadiusMeters}m</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${project.siteLat},${project.siteLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <MapPin className="size-3" />
                      Open in Google Maps
                    </a>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="size-4 shrink-0" />
                      <span>No site coordinates saved yet</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Coordinates will be auto-geocoded from the customer address on the first crew clock-in, or you can set them manually via Edit.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">GPS verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">On-site radius:</span>{" "}
                  {project.gpsRadiusMeters}m
                </p>
                <p className="text-xs text-muted-foreground">
                  Crew members within {project.gpsRadiusMeters}m of the site coordinates are marked as on-site when clocking in. Those outside are flagged for supervisor review.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3 mr-1.5" />
                  Edit location
                </Button>
              </CardContent>
            </Card>
          </div>
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