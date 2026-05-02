"use client"

import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import type { CustomerFormData } from "@/types/customer-types"

type Props = {
  form: CustomerFormData
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>
}

export function TagsSection({ form, setForm }: Props) {
  return (
    <Field>
      <FieldLabel>Tags (comma-separated)</FieldLabel>
      <Input
        value={form.tags.join(", ")}
        onChange={(e) =>
          setForm((p) => ({
            ...p,
            tags: e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }))
        }
        placeholder="e.g. commercial, residential"
      />
    </Field>
  )
}
