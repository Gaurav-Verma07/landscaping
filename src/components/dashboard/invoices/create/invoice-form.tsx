"use client"

import * as React from "react"
import { useState } from "react"
import { Calendar, Calculator, FileText, Upload, X, Plus, Minus, Save, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Invoice, InvoiceLineItem, InvoiceTaxItem, InvoiceAttachment } from "@/types/invoice.types"
import { mockProjects, mockMaterials, mockLaborRates } from "@/lib/mock/invoice-mock-data"
import { cn } from "@/lib/utils"

interface InvoiceFormProps {
  invoice?: Invoice;
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientId: invoice?.clientId || "",
    projectId: invoice?.projectId || "",
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    issueDate: invoice?.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || "",
    status: invoice?.status || "draft",
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: invoice?.notes || "",
    lineItems: invoice?.lineItems || [],
    taxItems: invoice?.taxItems || [],
    attachments: invoice?.attachments || []
  })

  // Auto-calculate totals
  React.useEffect(() => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = formData.taxItems.reduce((sum, item) => sum + (item.isPercentage ? (subtotal * item.rate / 100) : item.amount), 0)
    const discountAmount = formData.discount ? (subtotal * formData.discount / 100) : 0
    const total = subtotal + taxAmount - discountAmount
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax: taxAmount,
      discount: formData.discount,
      total
    }))
  }, [formData.lineItems, formData.taxItems, formData.discount])

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: `line-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        unit: "per_m2",
        totalPrice: 0,
        taxable: true
      }]
    }))
  }

  const handleRemoveLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }))
  }

  const handleAddTaxItem = () => {
    setFormData(prev => ({
      ...prev,
      taxItems: [...prev.taxItems, {
        id: `tax-${Date.now()}`,
        name: "",
        rate: 0,
        amount: 0,
        isPercentage: true
      }]
    }))
  }

  const handleRemoveTaxItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      taxItems: prev.taxItems.filter(item => item.id !== id)
    }))
  }

  const handleAddAttachment = () => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, {
        id: `att-${Date.now()}`,
        fileName: "",
        fileSize: 0,
        fileType: "",
        uploadedAt: new Date().toISOString()
      }]
    }))
  }

  const handleRemoveAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }))
  }

  const handleSave = () => {
    if (!formData.clientId || !formData.projectName) {
      alert("Please select a client and project")
      return
    }
    
    const invoiceToSave: Invoice = {
      id: formData.invoiceNumber || "",
      invoiceNumber: formData.invoiceNumber,
      clientId: formData.clientId,
      clientName: mockProjects.find(p => p.id === formData.clientId)?.name || "",
      projectId: formData.projectId,
      projectName: mockProjects.find(p => p.id === formData.projectId)?.name || "",
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      createdDate: formData.createdDate || new Date().toISOString().split('T')[0],
      status: formData.status,
      subtotal: formData.subtotal,
      tax: formData.tax,
      discount: formData.discount,
      total: formData.total,
      balance: formData.total,
      notes: formData.notes,
      lineItems: formData.lineItems,
      taxItems: formData.taxItems,
      attachments: formData.attachments,
      paymentHistory: [],
      reminders: []
    }
    
    onSave?.(invoiceToSave)
  }

  const handleCancel = () => {
    onCancel?.()
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {invoice ? `Edit Invoice #${invoice.invoiceNumber}` : "Create New Invoice"}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Client and Project Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a client</SelectItem>
                {mockProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a project</SelectItem>
                {mockProjects.filter(project => project.clientId === formData.clientId).map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoiceNumber">Invoice #</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              placeholder="Auto-generated"
            />
          </div>
          
          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'draft' | 'sent' | 'paid') => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Line Items</h3>
            <Button variant="outline" size="sm" onClick={handleAddLineItem}>
              <Plus className="h-4 w-4" />
              Add Line Item
            </Button>
          </div>
          
          <div className="space-y-2">
            {formData.lineItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRemoveLineItem(item.id)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Line {index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const updatedItems = formData.lineItems.map(lineItem => 
                          lineItem.id === item.id ? { ...lineItem, description: e.target.value } : lineItem
                        )
                        setFormData(prev => ({ ...prev, lineItems: updatedItems }))
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor={`quantity-${item.id}`} className="text-xs">Qty</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updatedItems = formData.lineItems.map(lineItem => 
                          lineItem.id === item.id ? { ...lineItem, quantity: parseInt(e.target.value) } : lineItem
                        )
                        setFormData(prev => ({ ...prev, lineItems: updatedItems }))
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${item.id}`} className="text-xs">Description</Label>
                    <Input
                      id={`description-${item.id}`}
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const updatedItems = formData.lineItems.map(lineItem => 
                          lineItem.id === item.id ? { ...lineItem, description: e.target.value } : lineItem
                        )
                        setFormData(prev => ({ ...prev, lineItems: updatedItems }))
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`unit-${item.id}`} className="text-xs">Unit</Label>
                    <Select value={item.unit} onValueChange={(value) => {
                      const updatedItems = formData.lineItems.map(lineItem => 
                          lineItem.id === item.id ? { ...lineItem, unit: value } : lineItem
                        )
                        setFormData(prev => ({ ...prev, lineItems: updatedItems }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_m2">m²</SelectItem>
                        <SelectItem value="per_unit">unit</SelectItem>
                        <SelectItem value="per_sq_ft">sq ft</SelectItem>
                        <SelectItem value="per_sq_yd">sq yd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`price-${item.id}`} className="text-xs">Unit Price</Label>
                    <Input
                      id={`price-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updatedItems = formData.lineItems.map(lineItem => 
                          lineItem.id === item.id ? { ...lineItem, unitPrice: parseFloat(e.target.value) } : lineItem
                        )
                        setFormData(prev => ({ ...prev, lineItems: updatedItems }))
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor={`total-${item.id}`} className="text-xs">Total</Label>
                    <div className="text-sm font-medium">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Tax Items</h3>
            <Button variant="outline" size="sm" onClick={handleAddTaxItem}>
              <Plus className="h-4 w-4" />
              Add Tax Item
            </Button>
          </div>
          
          <div className="space-y-2">
            {formData.taxItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRemoveTaxItem(item.id)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Tax {index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Tax name"
                      value={item.name}
                      onChange={(e) => {
                        const updatedItems = formData.taxItems.map(taxItem => 
                          taxItem.id === item.id ? { ...taxItem, name: e.target.value } : taxItem
                        )
                        setFormData(prev => ({ ...prev, taxItems: updatedItems }))
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor={`rate-${item.id}`} className="text-xs">Rate</Label>
                    <Input
                      id={`rate-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => {
                        const updatedItems = formData.taxItems.map(taxItem => 
                          taxItem.id === item.id ? { ...taxItem, rate: parseFloat(e.target.value) } : taxItem
                        )
                        setFormData(prev => ({ ...prev, taxItems: updatedItems }))
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`is-percentage-${item.id}`} className="text-xs">Type</Label>
                      <Select value={item.isPercentage ? "percentage" : "fixed"} onValueChange={(value) => {
                        const updatedItems = formData.taxItems.map(taxItem => 
                          taxItem.id === item.id ? { ...taxItem, isPercentage: value === "percentage" } : taxItem
                        )
                        setFormData(prev => ({ ...prev, taxItems: updatedItems }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                      <Input
                        id={`amount-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => {
                          const updatedItems = formData.taxItems.map(taxItem => 
                          taxItem.id === item.id ? { ...taxItem, amount: parseFloat(e.target.value) } : taxItem
                        )
                        setFormData(prev => ({ ...prev, taxItems: updatedItems }))
                      }}
                      className="w-full"
                      disabled={!item.isPercentage}
                      placeholder={item.isPercentage ? "%" : "Amount"}
                      />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discount */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Discount</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount-type">Type</Label>
              <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="discount-amount">Amount</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                disabled={discountType === "fixed"}
                placeholder={discountType === "percentage" ? "%" : "Amount"}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Attachments</h3>
            <Button variant="outline" size="sm" onClick={handleAddAttachment}>
              <Plus className="h-4 w-4" />
              Add Attachment
            </Button>
          </div>
          
          <div className="space-y-2">
            {formData.attachments.map((attachment, index) => (
              <div key={attachment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRemoveAttachment(attachment.id)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Attachment {index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="File name"
                      value={attachment.fileName}
                      onChange={(e) => {
                        const updatedAttachments = formData.attachments.map(att => 
                          att.id === attachment.id ? { ...att, fileName: e.target.value } : att
                        )
                        setFormData(prev => ({ ...prev, attachments: updatedAttachments }))
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`file-type-${attachment.id}`} className="text-xs">Type</Label>
                    <Select value={attachment.fileType} onValueChange={(value) => {
                      const updatedAttachments = formData.attachments.map(att => 
                          att.id === attachment.id ? { ...att, fileType: value } : att
                        )
                        setFormData(prev => ({ ...prev, attachments: updatedAttachments }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="doc">Document</SelectItem>
                        <SelectItem value="img">Image</SelectItem>
                        <SelectItem value="zip">Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add internal notes..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full"
          />
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Subtotal</Label>
            <div className="text-2xl font-bold">${formData.subtotal.toFixed(2)}</div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Tax</Label>
            <div className="text-2xl font-bold">${formData.tax.toFixed(2)}</div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Discount</Label>
            <div className="text-2xl font-bold">-${formData.discount.toFixed(2)}</div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Total</Label>
            <div className="text-2xl font-bold">${formData.total.toFixed(2)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.clientId || !formData.projectName}>
            {invoice ? "Save Changes" : "Create Invoice"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}




