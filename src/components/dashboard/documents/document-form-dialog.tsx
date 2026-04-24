"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type DocumentRecord, type CreateDocumentData, type DocumentType } from "@/lib/document-types"
import { useDocumentStore } from "@/lib/document-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useProjectStore } from "@/lib/project-store"

function parseTags(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean)
}

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: DocumentRecord | null
  defaultCustomerId?: string
  defaultProjectId?: string
  onSaved?: () => void
}

export function DocumentFormDialog({ open, onOpenChange, document, defaultCustomerId, defaultProjectId, onSaved }: DocumentFormDialogProps) {
  const { createDocument, updateDocument } = useDocumentStore()
  const { customers } = useCustomerStore()
  const { getProjectsByCustomerId } = useProjectStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!document

  const [customerId, setCustomerId] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const [type, setType] = useState<DocumentType>("other")
  const [name, setName] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [tagsStr, setTagsStr] = useState("")

  const customerProjects = customerId ? getProjectsByCustomerId(customerId) : []

  useEffect(() => {
    if (document) {
      setCustomerId(document.customerId ?? "")
      setProjectId(document.projectId ?? null)
      setType(document.type)
      setName(document.name)
      setFileUrl(document.fileUrl)
      setTagsStr(document.tags.join(", "))
    } else {
      setCustomerId(defaultCustomerId ?? "")
      setProjectId(defaultProjectId ?? null)
      setType("other")
      setName("")
      setFileUrl("")
      setTagsStr("")
    }
  }, [document, defaultCustomerId, defaultProjectId, open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFileUrl(reader.result as string)
    reader.readAsDataURL(file)
    if (!name.trim()) setName(file.name)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Enter a name.")
      return
    }
    if (!fileUrl && !isEdit) {
      toast.error("Select a file to upload.")
      return
    }
    const data: CreateDocumentData = {
      customerId: customerId || null,
      projectId: projectId || null,
      type,
      name: name.trim(),
      fileUrl: fileUrl || document!.fileUrl,
      tags: parseTags(tagsStr),
    }
    if (isEdit) {
      updateDocument(document.id, data)
      toast.success("Document updated.")
    } else {
      createDocument(data)
      toast.success("Document added.")
    }
    onOpenChange(false)
    onSaved?.()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit document" : "Upload document"}</DialogTitle>
          <DialogDescription>
            Link to a customer and/or project. Add to the file vault with type and tags.
          </DialogDescription>
        </DialogHeader>
        <form id="document-form" onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Customer</FieldLabel>
            <Select value={customerId || "none"} onValueChange={(v) => { setCustomerId(v === "none" ? "" : v); setProjectId(null) }}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name || c.companyName || c.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Project</FieldLabel>
            <Select value={projectId ?? "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customerProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Name *</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" required />
          </Field>
          <Field>
            <FieldLabel>{isEdit ? "File (leave empty to keep current)" : "File *"}</FieldLabel>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </Field>
          <Field>
            <FieldLabel>Tags (comma-separated)</FieldLabel>
            <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="e.g. permit, 2024" />
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="document-form">{isEdit ? "Save" : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
