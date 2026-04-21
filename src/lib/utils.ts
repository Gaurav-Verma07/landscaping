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
