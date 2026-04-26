"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { useCustomerStore } from "@/lib/customer-store"
import { useAuditStore } from "@/lib/audit-store"
import type { CustomerStatus } from "@/lib/customer-types"

const CSV_HEADER = "name,companyName,email,phone,address,status"
const STATUSES: CustomerStatus[] = ["Lead", "Active", "Past", "Maintenance"]

function parseCsvRow(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === ",") {
      result.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(csv: string): { name: string; companyName: string; email: string; phone: string; address: string; status: CustomerStatus }[] {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = parseCsvRow(lines[0]).map((h) => h.toLowerCase())
  const nameIdx = header.indexOf("name")
  const companyIdx = header.indexOf("companyname")
  const emailIdx = header.indexOf("email")
  const phoneIdx = header.indexOf("phone")
  const addressIdx = header.indexOf("address")
  const statusIdx = header.indexOf("status")
  const rows: { name: string; companyName: string; email: string; phone: string; address: string; status: CustomerStatus }[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i])
    const get = (idx: number) => (idx >= 0 && cells[idx] !== undefined ? String(cells[idx]).trim() : "")
    const statusVal = statusIdx >= 0 ? get(statusIdx) : ""
    const status = STATUSES.includes(statusVal as CustomerStatus) ? (statusVal as CustomerStatus) : "Lead"
    rows.push({
      name: nameIdx >= 0 ? get(nameIdx) : "",
      companyName: companyIdx >= 0 ? get(companyIdx) : "",
      email: emailIdx >= 0 ? get(emailIdx) : "",
      phone: phoneIdx >= 0 ? get(phoneIdx) : "",
      address: addressIdx >= 0 ? get(addressIdx) : "",
      status,
    })
  }
  return rows.filter((r) => r.name || r.companyName || r.email || r.phone)
}

interface ImportCustomersCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void
}

export function ImportCustomersCsvDialog({
  open,
  onOpenChange,
  onImported,
}: ImportCustomersCsvDialogProps) {
  const { createCustomer } = useCustomerStore()
  const { log: auditLog } = useAuditStore()
  const [csv, setCsv] = useState("")
  const [importing, setImporting] = useState(false)

  const handleImport =async () => {
    const rows = parseCsv(csv)
    if (rows.length === 0) {
      toast.error("No valid rows. Use header: " + CSV_HEADER)
      return
    }
    setImporting(true)
    let created = 0
    for (const row of rows) {
      const customer =await createCustomer({
        name: row.name,
        companyName: row.companyName,
        phones: row.phone ? [row.phone] : [],
        emails: row.email ? [row.email] : [],
        addresses: row.address ? [row.address] : [],
        tags: [],
        leadSource: "other",
        partnerReferralName: "",
        status: row.status,
        reviewStatus: "",
        seasonalServiceEligibility: false,
      })
      auditLog("customer_created", "customer", customer.id, customer.name || customer.companyName || "Imported")
      created++
    }
    setImporting(false)
    toast.success(`Imported ${created} customer(s).`)
    setCsv("")
    onOpenChange(false)
    onImported?.()
  }

  const rows = parseCsv(csv)
  const canImport = rows.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import customers from CSV</DialogTitle>
          <DialogDescription>
            Paste CSV with header: {CSV_HEADER}. One row per customer. Status optional (Lead, Active, Past, Maintenance).
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>CSV content</FieldLabel>
          <Textarea
            placeholder={CSV_HEADER + "\nJohn Doe,Acme Ltd,john@acme.com,07700900123,1 High St,Lead"}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </Field>
        {rows.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {rows.length} row(s) will be imported.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canImport || importing}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
