"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Quote } from "@/lib/quote-types"
import { useBillingStore } from "@/lib/billing-store"
import { useCustomerStore } from "@/lib/customer-store"
import { useProjectStore } from "@/lib/project-store"

interface AcceptQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote | null
  onAccepted?: (contractId: string) => void
}

function replaceTemplateVars(text: string, vars: Record<string, string>): string {
  let out = text
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return out
}

export function AcceptQuoteDialog({
  open,
  onOpenChange,
  quote,
  onAccepted,
}: AcceptQuoteDialogProps) {
  const { acceptQuote, contractTemplates } = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const { createProject, updateContract } = useProjectStore()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [templateId, setTemplateId] = useState<string>("")
  const [createProjectFromContract, setCreateProjectFromContract] = useState(true)

  useEffect(() => {
    if (quote && open) {
      const customer = getCustomer(quote.customerId)
      const customerName = customer?.name || customer?.companyName || "Customer"
      setTitle(quote.quoteNumber + " - Contract")
      const vars: Record<string, string> = {
        company_name: "Landscaping",
        customer_name: customerName,
        scope_summary: quote.lineItems.map((l) => l.description).join("; ") || "As per quote",
        total: `£${quote.total.toFixed(2)}`,
        payment_terms: "As agreed",
      }
      const defaultContent = replaceTemplateVars(
        "This agreement is made between {{company_name}} and {{customer_name}}.\n\nScope: {{scope_summary}}\nTotal: {{total}}\n\nPayment terms: {{payment_terms}}.",
        vars,
      )
      setContent(defaultContent)
      setTemplateId(contractTemplates[0]?.id ?? "")
    }
  }, [quote, open, getCustomer, contractTemplates])

  useEffect(() => {
    if (templateId && contractTemplates.length) {
      const tpl = contractTemplates.find((t) => t.id === templateId)
      if (tpl && quote) {
        const customer = getCustomer(quote.customerId)
        const vars: Record<string, string> = {
          company_name: "Landscaping",
          customer_name: customer?.name || customer?.companyName || "Customer",
          scope_summary: quote.lineItems.map((l) => l.description).join("; ") || "As per quote",
          total: `£${quote.total.toFixed(2)}`,
          payment_terms: "As agreed",
        }
        setContent(replaceTemplateVars(tpl.content, vars))
      }
    }
  }, [templateId, contractTemplates, quote, getCustomer])

  const handleAccept = () => {
    if (!quote || quote.status !== "sent") return
    if (!title.trim()) {
      toast.error("Enter a contract title.")
      return
    }
    const contract = acceptQuote(quote.id, title.trim(), content.trim())
    if (!contract) {
      toast.error("Quote could not be accepted.")
      return
    }
    toast.success("Quote accepted. Contract created.")

    if (createProjectFromContract && !contract.projectId) {
      const project = createProject({
        name: title.trim(),
        customerId: quote.customerId,
        projectType: "Custom",
        status: "Planned",
        priority: "Medium",
        propertySize: "",
        estimatedLandscapeSqFt: null,
        remainingSqFt: null,
        estimatedPropertyValue: quote.total,
        terrainType: "",
        accessNotes: "",
        durationEstimate: "",
        requiredMaterials: [],
        equipment: [],
        assignedCrew: "",
        dependencyProjectIds: [],
      })
      updateContract(contract.id, { projectId: project.id })
      toast.success("Project created and linked to contract.")
      onAccepted?.(contract.id)
    } else {
      onAccepted?.(contract.id)
    }

    onOpenChange(false)
  }

  if (!quote) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Accept quote</DialogTitle>
          <DialogDescription>
            Create a contract from quote {quote.quoteNumber}. You can create a project and link it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto">
          <Field>
            <FieldLabel>Contract title</FieldLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contract title" />
          </Field>
          {contractTemplates.length > 0 && (
            <Field>
              <FieldLabel>Template</FieldLabel>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {contractTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field>
            <FieldLabel>Content</FieldLabel>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="font-mono text-sm" />
          </Field>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={createProjectFromContract}
              onChange={(e) => setCreateProjectFromContract(e.target.checked)}
            />
            <span className="text-sm">Create project and link to this contract</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAccept}>Accept quote & create contract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
