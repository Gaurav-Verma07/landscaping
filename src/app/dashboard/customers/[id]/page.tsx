"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  Pencil,
  Merge,
  MessageSquare,
  Mail,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  FolderKanban,
  Calendar,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { useCommunicationStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { useProjectStore } from "@/lib/stores"
import { useAppointmentStore } from "@/lib/stores"
import { useDocumentStore } from "@/lib/stores"
import { DOCUMENT_TYPE_LABELS } from "@/types/document-types"
import { PROJECT_STATUS_LABELS } from "@/types/project-types"
import {
  CUSTOMER_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/customer-types"
import { CHANNEL_LABELS } from "@/types/communication-types"
import { formatDate, formatBytes } from "@/utils/utils"
import { MergeCustomerModal } from "@/components/dashboard/customers/merge-customer-modal"
import { Badge } from "@/components/ui/badge"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const {
    getCustomer,
    addNote,
    addTimelineEvent,
    addAttachment,
    removeAttachment,
    refresh
  } = useCustomerStore()
  const { getCommunicationsByContactId } = useCommunicationStore()
  const { getProjectsByCustomerId } = useProjectStore()
  const { getAppointmentsByCustomerId } = useAppointmentStore()
  const { getDocumentsByCustomerId } = useDocumentStore()
  const customer = getCustomer(id)
  const customerComms = customer ? getCommunicationsByContactId(customer.id) : []
  const customerProjects = customer ? getProjectsByCustomerId(customer.id) : []
  const customerAppointments = customer ? getAppointmentsByCustomerId(customer.id) : []
  const customerDocuments = customer ? getDocumentsByCustomerId(customer.id) : []
  const [mergeOpen, setMergeOpen] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [timelineTitle, setTimelineTitle] = useState("")
  const [timelineType, setTimelineType] = useState<
    "communication" | "document"
  >("communication")
  const [showTimelineForm, setShowTimelineForm] = useState(false)

  if (!customer) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/customers">Back to customers</Link>
        </Button>
      </div>
    )
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    addNote(id, newNote.trim())
    setNewNote("")
  }

  const handleAddTimeline = (e: React.FormEvent) => {
    e.preventDefault()
    if (!timelineTitle.trim()) return
    addTimelineEvent(id, {
      type: timelineType,
      title: timelineTitle.trim(),
      date: new Date().toISOString(),
    })
    setTimelineTitle("")
    setShowTimelineForm(false)
  }

  const handleFileChange =async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await addAttachment(id, file)
      await refresh()
    }
    e.target.value = ""
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/customers">
          <ArrowLeft className="size-4" />
          Back to customers
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.name || "Unnamed customer"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {customer.companyName || "—"} ·{" "}
            {CUSTOMER_STATUS_LABELS[customer.status]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/customers/${id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMergeOpen(true)}>
            <Merge className="size-4" />
            Merge customer
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Overview
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Company</dt>
                <dd>{customer.companyName || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{CUSTOMER_STATUS_LABELS[customer.status]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lead Source</dt>
                <dd>
                  {LEAD_SOURCE_LABELS[customer.leadSource] ??
                    customer.leadSource ??
                    "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Partner Referral</dt>
                <dd>{customer.partnerReferralName || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Review Status</dt>
                <dd>{customer.reviewStatus || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Seasonal Eligible</dt>
                <dd>{customer.seasonalServiceEligibility ? "Yes" : "No"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Phone(s)</dt>
                <dd>
                  {customer.phones?.length
                    ? customer.phones.join(", ")
                    : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Email(s)</dt>
                <dd>
                  {customer.emails?.length
                    ? customer.emails.join(", ")
                    : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Address(es)</dt>
                <dd>
                  {customer.addresses?.length
                    ? customer.addresses.join("\n")
                    : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Tags</dt>
                <dd >
                  {customer.tags?.length ?                 
                  <div className="flex">
                    {
                      
                      customer.tags.map((tag: string, index: number)=>{
                        return(<Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-0.5 m-1 text-xs font-medium"
                      > {tag}</Badge>)
})
                    }
                  </div> : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="size-4" />
              Notes
            </h2>
            <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
              <Input
                placeholder="Add a note…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newNote.trim()}>
                Add
              </Button>
            </form>
            <ul className="space-y-3">
              {customer.notes.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No notes yet.
                </li>
              ) : (
                customer.notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-md border border-border bg-muted/30 p-3 text-sm"
                  >
                    <p className="whitespace-pre-wrap">{n.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                      {n.createdBy ? ` · ${n.createdBy}` : ""}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <Mail className="size-4" />
              Communications
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              All emails, SMS and calls with this customer (inbox and sent).
            </p>
            {customerComms.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border border-border p-4">
                No communications yet. Send a message from the Communications inbox or Create message.
              </p>
            ) : (
              <ul className="space-y-2">
                {customerComms.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 rounded-md border border-border p-3 text-sm"
                  >
                    <span className="text-muted-foreground shrink-0">
                      {c.channel === "email" ? "📧" : c.channel === "sms" ? "💬" : "📞"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {c.channel === "email" && c.subject ? c.subject : c.channel === "call" ? "Call" : "SMS"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {CHANNEL_LABELS[c.channel]} · {c.direction} · {formatDate(c.createdAt)}
                      </p>
                      {c.body ? (
                        <p className="mt-1 text-muted-foreground line-clamp-2">{c.body}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <FolderKanban className="size-4" />
              Projects
              {customerProjects.length > 0 ? ` (${customerProjects.length})` : ""}
            </h2>
            {customerProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects for this customer.</p>
            ) : (
              <ul className="space-y-2">
                {customerProjects.map((proj) => (
                  <li key={proj.id}>
                    <Link
                      href={`/dashboard/projects/${proj.id}`}
                      className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted/50"
                    >
                      <span className="font-medium">{proj.name}</span>
                      <span className="text-xs text-muted-foreground">{PROJECT_STATUS_LABELS[proj.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href={`/dashboard/projects?new=1&customerId=${id}`}>New project</Link>
            </Button>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <Calendar className="size-4" />
              Appointments
              {customerAppointments.length > 0 ? ` (${customerAppointments.length})` : ""}
            </h2>
            {customerAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments for this customer.</p>
            ) : (
              <ul className="space-y-2">
                {customerAppointments.slice(0, 5).map((apt) => (
                  <li key={apt.id}>
                    <span className="text-sm">
                      {new Date(apt.startAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      {" · "}
                      {apt.address}
                      {apt.projectId ? " · " : ""}
                      {apt.projectId ? (
                        <Link href={`/dashboard/projects/${apt.projectId}`} className="text-primary hover:underline">Project</Link>
                      ) : null}
                    </span>
                  </li>
                ))}
                {customerAppointments.length > 5 && (
                  <li className="text-sm text-muted-foreground">+{customerAppointments.length - 5} more</li>
                )}
              </ul>
            )}
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/appointments">View all appointments</Link>
            </Button>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="size-4" />
              Documents
              {customerDocuments.length > 0 ? ` (${customerDocuments.length})` : ""}
            </h2>
            {customerDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents for this customer.</p>
            ) : (
              <ul className="space-y-2">
                {customerDocuments.slice(0, 5).map((doc) => (
                  <li key={doc.id}>
                    <span className="text-sm">
                      {doc.name}
                      {doc.type ? ` (${DOCUMENT_TYPE_LABELS[doc.type]})` : ""}
                      {doc.projectId ? " · " : ""}
                      {doc.projectId ? (
                        <Link href={`/dashboard/projects/${doc.projectId}`} className="text-primary hover:underline">Project</Link>
                      ) : null}
                    </span>
                  </li>
                ))}
                {customerDocuments.length > 5 && (
                  <li className="text-sm text-muted-foreground">+{customerDocuments.length - 5} more</li>
                )}
              </ul>
            )}
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/documents">View all documents</Link>
            </Button>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <FileText className="size-4" />
              Timeline
            </h2>
            {!showTimelineForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimelineForm(true)}
              >
                <Plus className="size-4" />
                Add event
              </Button>
            ) : (
              <form
                onSubmit={handleAddTimeline}
                className="flex flex-wrap items-end gap-2 mb-4"
              >
                <select
                  value={timelineType}
                  onChange={(e) =>
                    setTimelineType(
                      e.target.value as "communication" | "document",
                    )
                  }
                  className="h-9 rounded-md border border-input px-3 text-sm"
                >
                  <option value="communication">Communication</option>
                  <option value="document">Document</option>
                </select>
                <Input
                  placeholder="Title"
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                  className="w-48"
                />
                <Button type="submit" disabled={!timelineTitle.trim()}>
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimelineForm(false)}
                >
                  Cancel
                </Button>
              </form>
            )}
            <ul className="space-y-2">
              {customer.timeline.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No timeline events yet.
                </li>
              ) : (
                customer.timeline.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-md border border-border p-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {e.type === "communication" ? "💬" : "📄"}
                    </span>
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date)}
                      </p>
                      {e.description ? (
                        <p className="mt-1 text-muted-foreground">
                          {e.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <Paperclip className="size-4" />
              Attachments
              {customer.attachments.length > 0
                ? ` (${customer.attachments.length})`
                : ""}
            </h2>
            <Field className="mb-4">
              <FieldLabel htmlFor="customer-detail-upload">
                Upload Photos / Docs
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="customer-detail-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  onChange={handleFileChange}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label
                    htmlFor="customer-detail-upload"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="size-4" />
                    Upload
                  </label>
                </Button>
              </div>
              <FieldDescription>
                Upload photos, documents, or other files related to this
                customer
              </FieldDescription>
            </Field>
            <ul className="space-y-2">
              {customer.attachments.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No attachments yet.
                </li>
              ) : (
                customer.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                  >
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[200px]"
                    >
                      {a.name}
                    </a>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {formatBytes(a.size)} · {formatDate(a.uploadedAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove"
                      onClick={() => removeAttachment(id, a.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      <MergeCustomerModal
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        currentCustomerId={id}
        onMerged={() => {
          setMergeOpen(false)
          router.push("/dashboard/customers")
        }}
      />
    </div>
  )
}
