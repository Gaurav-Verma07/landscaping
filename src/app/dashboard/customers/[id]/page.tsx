"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  Pencil,
  Merge,
  MessageSquare,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { useCustomerStore } from "@/lib/customer-store"
import {
  CUSTOMER_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/customer-types"
import { formatDate, formatBytes } from "@/lib/utils"
import { MergeCustomerModal } from "@/components/dashboard/customers/merge-customer-modal"

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
  } = useCustomerStore()
  const customer = getCustomer(id)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) addAttachment(id, file)
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
                <dd>
                  {customer.tags?.length ? customer.tags.join(", ") : "—"}
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
                      download={a.name}
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
