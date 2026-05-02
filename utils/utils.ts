import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function appendEmpty(arr: string[]): string[] {
  return [...arr, ""]
}

export function updateAt(arr: string[], index: number, value: string): string[] {
  const out = [...arr]
  out[index] = value
  return out
}

export function removeAt(arr: string[], index: number): string[] {
  return arr.filter((_, i) => i !== index)
}

// Keep this as a pure util — no server dependency
export function applyTemplatePlaceholders(
  body: string,
  subject: string,
  contactName: string,
  extras?: { invoice_number?: string; due_date?: string; date?: string; time?: string }
): { body: string; subject: string } {
  const replace = (s: string) =>
    s.replace(/\{\{contact_name\}\}/gi, contactName)
     .replace(/\{\{invoice_number\}\}/g, extras?.invoice_number ?? '—')
     .replace(/\{\{due_date\}\}/g, extras?.due_date ?? '—')
     .replace(/\{\{date\}\}/g, extras?.date ?? '—')
     .replace(/\{\{time\}\}/g, extras?.time ?? '—')
  return { body: replace(body), subject: replace(subject) }
}