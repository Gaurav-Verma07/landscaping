"use client"

import * as React from "react"
import { Upload } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type { Client } from "@/lib/mock/backend"
import { newId } from "@/lib/mock/backend"

interface NewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientAdded?: (client: Client) => void
}

export function NewClientDialog({ open, onOpenChange, onClientAdded }: NewClientDialogProps) {
  const [formData, setFormData] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    leadSource: "",
    propertyAddress: "",
    billingAddress: "",
    homeType: "",
    roofType: "",
    roofAge: "",
    carrier: "",
    policyNo: "",
    claimNo: "",
    adjusterName: "",
    adjusterPhone: "",
    salesRep: "",
    preferredContact: "",
    internalNotes: "",
  })

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      leadSource: "",
      propertyAddress: "",
      billingAddress: "",
      homeType: "",
      roofType: "",
      roofAge: "",
      carrier: "",
      policyNo: "",
      claimNo: "",
      adjusterName: "",
      adjusterPhone: "",
      salesRep: "",
      preferredContact: "",
      internalNotes: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName || !formData.propertyAddress) {
      return
    }

    const now = new Date().toISOString()
    const newClient: Client = {
      id: newId("client"),
      name: formData.fullName,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      leadSource: formData.leadSource || undefined,
      status: "New Lead",
      propertyAddress: formData.propertyAddress,
      billingAddress: formData.billingAddress || undefined,
      homeType: formData.homeType || undefined,
      roofType: formData.roofType || undefined,
      roofAge: formData.roofAge || undefined,
      carrier: formData.carrier || undefined,
      policyNo: formData.policyNo || undefined,
      claimNo: formData.claimNo || undefined,
      adjusterName: formData.adjusterName || undefined,
      adjusterPhone: formData.adjusterPhone || undefined,
      rep: formData.salesRep.toUpperCase() || "LV",
      preferredContact: formData.preferredContact || undefined,
      internalNotes: formData.internalNotes || undefined,
      createdAt: now,
      updatedAt: now,
    }

    onClientAdded?.(newClient)
    resetForm()
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FieldGroup className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Client Information</h3>
              <Field>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Enter full name"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="client@example.com"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="leadSource">Lead Source</FieldLabel>
                <Select
                  value={formData.leadSource}
                  onValueChange={(value) => handleChange("leadSource", value)}
                >
                  <SelectTrigger id="leadSource">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="cold-call">Cold Call</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Property Details</h3>
              <Field>
                <FieldLabel htmlFor="propertyAddress">Property Address</FieldLabel>
                <Input
                  id="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={(e) => handleChange("propertyAddress", e.target.value)}
                  placeholder="Enter property address"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="billingAddress">Billing Address</FieldLabel>
                <Input
                  id="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e) => handleChange("billingAddress", e.target.value)}
                  placeholder="Enter billing address"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="homeType">Home Type</FieldLabel>
                  <Select
                    value={formData.homeType}
                    onValueChange={(value) => handleChange("homeType", value)}
                  >
                    <SelectTrigger id="homeType">
                      <SelectValue placeholder="Select home type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single-family</SelectItem>
                      <SelectItem value="multi-family">Multi-family</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="roofType">Roof Type</FieldLabel>
                  <Select
                    value={formData.roofType}
                    onValueChange={(value) => handleChange("roofType", value)}
                  >
                    <SelectTrigger id="roofType">
                      <SelectValue placeholder="Select roof type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asphalt-shingle">Asphalt Shingle</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="tile">Tile</SelectItem>
                      <SelectItem value="slate">Slate</SelectItem>
                      <SelectItem value="wood-shake">Wood Shake</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="roofAge">Roof Age</FieldLabel>
                  <Input
                    id="roofAge"
                    type="number"
                    value={formData.roofAge}
                    onChange={(e) => handleChange("roofAge", e.target.value)}
                    placeholder="years"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Insurance Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="carrier">Carrier</FieldLabel>
                  <Input
                    id="carrier"
                    value={formData.carrier}
                    onChange={(e) => handleChange("carrier", e.target.value)}
                    placeholder="Insurance carrier name"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="policyNo">Policy No.</FieldLabel>
                  <Input
                    id="policyNo"
                    value={formData.policyNo}
                    onChange={(e) => handleChange("policyNo", e.target.value)}
                    placeholder="Policy number"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="claimNo">Claim No.</FieldLabel>
                <Input
                  id="claimNo"
                  value={formData.claimNo}
                  onChange={(e) => handleChange("claimNo", e.target.value)}
                  placeholder="Claim number"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="adjusterName">Adjuster Name</FieldLabel>
                  <Input
                    id="adjusterName"
                    value={formData.adjusterName}
                    onChange={(e) => handleChange("adjusterName", e.target.value)}
                    placeholder="Adjuster full name"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="adjusterPhone">Phone</FieldLabel>
                  <Input
                    id="adjusterPhone"
                    type="tel"
                    value={formData.adjusterPhone}
                    onChange={(e) => handleChange("adjusterPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Assignment</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="salesRep">Sales Rep</FieldLabel>
                  <Select
                    value={formData.salesRep}
                    onValueChange={(value) => handleChange("salesRep", value)}
                  >
                    <SelectTrigger id="salesRep">
                      <SelectValue placeholder="Assign Rep" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lv">LV</SelectItem>
                      <SelectItem value="aj">AJ</SelectItem>
                      <SelectItem value="ns">NS</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="preferredContact">Preferred Contact</FieldLabel>
                  <Select
                    value={formData.preferredContact}
                    onValueChange={(value) => handleChange("preferredContact", value)}
                  >
                    <SelectTrigger id="preferredContact">
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Notes + Media</h3>
              <Field>
                <FieldLabel htmlFor="internalNotes">Internal Notes</FieldLabel>
                <Textarea
                  id="internalNotes"
                  value={formData.internalNotes}
                  onChange={(e) => handleChange("internalNotes", e.target.value)}
                  placeholder="Add any internal notes about this client..."
                  rows={4}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="upload">Upload Photos / Docs</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="upload" className="cursor-pointer">
                      <Upload className="size-4" />
                      Upload
                    </label>
                  </Button>
                </div>
                <FieldDescription>
                  Upload photos, documents, or other files related to this client
                </FieldDescription>
              </Field>
            </div>
          </FieldGroup>
          </div>
          <DialogFooter className="px-6 py-4 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

