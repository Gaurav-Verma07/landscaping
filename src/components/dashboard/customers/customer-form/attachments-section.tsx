"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Upload, X } from "lucide-react"
import { formatBytes } from "../../../../../utils/utils"

type Props = {
  selectedFiles: File[]
  onFilesChange: (files: File[]) => void
}

const UPLOAD_INPUT_ID = "customer-create-upload"

export function AttachmentsSection({
  selectedFiles,
  onFilesChange,
}: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length)
      onFilesChange([...selectedFiles, ...Array.from(files)])
    e.target.value = ""
  }

  const removeFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Notes + Media</h3>
      <Field>
        <FieldLabel htmlFor={UPLOAD_INPUT_ID}>
          Upload Photos / Docs
        </FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id={UPLOAD_INPUT_ID}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            onChange={handleFileChange}
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <label htmlFor={UPLOAD_INPUT_ID} className="cursor-pointer flex items-center gap-2">
              <Upload className="size-4" />
              Upload
            </label>
          </Button>
        </div>
        <FieldDescription>
          Upload photos, documents, or other files related to this customer
        </FieldDescription>
        {selectedFiles.length > 0 && (
          <ul className="mt-3 space-y-2">
            {selectedFiles.map((file, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="truncate text-foreground">{file.name}</span>
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatBytes(file.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove file"
                  onClick={() => removeFile(i)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Field>
    </div>
  )
}
