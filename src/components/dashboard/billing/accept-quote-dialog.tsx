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
import type { Quote } from "@/types/quote-types"
import { useBillingStore } from "@/lib/stores"
import { useCustomerStore } from "@/lib/stores"
import { useProjectStore } from "@/lib/stores"
import { useCommunicationStore } from "@/lib/stores"
import { useAuditStore } from "@/lib/stores"
import {
  TIMELINE_MILESTONE_TYPES,
  MILESTONE_TYPE_LABELS,
  type TimelineMilestoneType,
} from "@/types/project-types"

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
  const { acceptQuote, contractTemplates, updateContract} = useBillingStore()
  const { getCustomer } = useCustomerStore()
  const { createProject} = useProjectStore()
  const { triggerAutomation } = useCommunicationStore()
  const { log: auditLog } = useAuditStore()
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

  const handleAccept = async () => {
    if (!quote || quote.status !== "sent") return
    if (!title.trim()) {
      toast.error("Enter a contract title.")
      return
    }
  
    const contract = await acceptQuote(quote.id, title.trim(), content.trim())
    if (!contract) {
      toast.error("Quote could not be accepted.")
      return
    }
    toast.success("Quote accepted. Contract created.")
    auditLog("quote_accepted", "quote", quote.id, quote.quoteNumber)
    auditLog("contract_signed", "contract", contract.id, contract.contractNumber)
  
    const customer = getCustomer(quote.customerId)
    if (customer) {
      triggerAutomation("quote_accepted", {
        contactId: customer.id,
        contactName: customer.name || customer.companyName || "Customer",
        contactEmail: customer.emails[0],
        contactPhone: customer.phones[0],
      })
    }
  
    if (createProjectFromContract && !contract.projectId) {
      const now = Date.now()
      const defaultTimeline = TIMELINE_MILESTONE_TYPES.map((type: TimelineMilestoneType, index) => ({
        id: `milestone-${now}-${index}`,
        type,
        title: MILESTONE_TYPE_LABELS[type],
        dueDate: null,
        completedAt: null,
        order: index,
        notes: undefined,
      }))
      const project = await createProject({
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
        siteLat: null,
        siteLng: null,
        gpsRadiusMeters: 200,
        timeline: defaultTimeline,
      })
      if (project) {
        await updateContract(contract.id, { projectId: project.id })
        toast.success("Project created and linked to contract.")
      }
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
