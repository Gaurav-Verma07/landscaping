"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import type { CustomerFormData } from "@/types/customer-types"

type Props = {
  form: CustomerFormData
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>
}

const SEPARATORS = [",", "Enter"]

export function TagsSection({ form, setForm }: Props) {
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase()
    if (!trimmed) return
    setForm((prev) => {
      if (prev.tags.includes(trimmed)) return prev
      return { ...prev, tags: [...prev.tags, trimmed] }
    })
    setInputValue("")
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (SEPARATORS.includes(e.key)) {
      e.preventDefault()
      addTag(inputValue)
      return
    }
    // Backspace on empty input removes last tag
    if (e.key === "Backspace" && inputValue === "" && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow comma to trigger add mid-typing
    if (val.endsWith(",")) {
      addTag(val.slice(0, -1))
    } else {
      setInputValue(val)
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue)
  }

  return (
    <Field>
      <FieldLabel>Tags</FieldLabel>
      {/* Pill container — clicking anywhere focuses the input */}
      <div
        className="flex min-h-10 flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {form.tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
              aria-label={`Remove tag "${tag}"`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={form.tags.length === 0 ? "Type a tag and press Enter…" : ""}
          className="h-auto min-w-[140px] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Press <kbd className="rounded border px-1 font-mono text-[10px]">Enter</kbd> or{" "}
        <kbd className="rounded border px-1 font-mono text-[10px]">,</kbd> to add a tag.
        Backspace removes the last tag.
      </p>
    </Field>
  )
}