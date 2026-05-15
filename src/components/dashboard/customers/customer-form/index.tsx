"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import type { Customer, CustomerFormData } from "@/types/customer-types"
import { customerToFormData } from "@/utils/customer-form-utils"
import { BasicInfoSection } from "./basic-info-section"
import { ContactSection } from "./contact-section"
import { LeadStatusSection } from "./lead-status-section"
import { TagsSection } from "./tags-section"
import { AttachmentsSection } from "./attachments-section"

export type CustomerFormProps = {
  customer: Customer | null
  onSubmit: (
    data: CustomerFormData,
    initialFiles?: File[],
  ) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  showActions?: boolean
  formId?: string
}

export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  showActions = true,
  formId,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>(() =>
    customerToFormData(customer),
  )
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: CustomerFormData = {
      ...form,
      phones: form.phones.filter(Boolean),
      emails: form.emails.filter(Boolean),
      addresses: form.addresses.filter(Boolean),
    }
    if (customer === null && selectedFiles.length > 0) {
      onSubmit(data, selectedFiles)
    } else {
      onSubmit(data)
    }
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="customer-form max-w-2xl"
    >
      <FieldGroup className="space-y-6">
        <BasicInfoSection form={form} setForm={setForm} />
        <ContactSection form={form} setForm={setForm} />
        <LeadStatusSection form={form} setForm={setForm} />
        <TagsSection form={form} setForm={setForm} />

        {customer === null && (
          <AttachmentsSection
            selectedFiles={selectedFiles}
            onFilesChange={setSelectedFiles}
          />
        )}
      </FieldGroup>

      {showActions && (
        <div className="flex gap-3 pt-5">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  )
}
