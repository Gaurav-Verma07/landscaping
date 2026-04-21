"use client"

import * as React from "react"
import { useState } from "react"
import { format, subDays, addDays, startOfMonth, endOfMonth, isSameMonth, isToday } from "date-fns"
import { Search, Filter, Plus, Download, Calendar, AlertTriangle, FileText, DollarSign, Clock, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Invoice, InvoiceStatus, PaymentMethod } from "@/types/invoice.types"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InvoicesTableProps {
  invoices?: Invoice[]
  onInvoiceSelect?: (invoice: Invoice) => void
  onInvoiceEdit?: (invoice: Invoice) => void
  onInvoiceDelete?: (invoiceId: string) => void
  onBulkAction?: (action: string, invoiceIds: string[]) => void
  className?: string
}

export function InvoicesTable({ 
  invoices = [], 
  onInvoiceSelect, 
  onInvoiceEdit, 
  onInvoiceDelete,
  onBulkAction,
  className 
}: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    dateRange: { start: "", end: "" },
    clientId: ""
  })
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  
  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !filters.status || invoice.status === filters.status
    
    const matchesClient = !filters.clientId || invoice.clientId === filters.clientId
    
    const matchesDateRange = !filters.dateRange.start || !filters.dateRange.end || (
      new Date(invoice.issueDate) >= new Date(filters.dateRange.start) &&
      new Date(invoice.issueDate) <= new Date(filters.dateRange.end)
    )
    
    return matchesSearch && matchesStatus && matchesClient && matchesDateRange
  })
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id))
    } else {
      setSelectedInvoices([])
    }
  }
  
  const handleBulkAction = (action: string) => {
    onBulkAction?.(action, selectedInvoices)
  }
  
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'text-green-500 bg-green-50'
      case 'overdue':
        return 'text-red-500 bg-red-50'
      case 'disputed':
        return 'text-orange-500 bg-orange-50'
      case 'sent':
        return 'text-blue-500 bg-blue-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Invoices</h2>
          <p className="text-muted-foreground">
            Manage your invoices, track payments, and monitor outstanding balances
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('send-reminders')} disabled={selectedInvoices.length === 0}>
              Send Reminders
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('export-csv')} disabled={selectedInvoices.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => console.log("Exporting invoices to CSV")}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search invoices..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Invoice Table */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSelectAll(true)}>
                  Select All
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedInvoices.length} of {filteredInvoices.length} selected
                </span>
              </div>
              
              {selectedInvoices.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('send-reminders')}>
                  Send Reminders
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-2 py-3">
                  <Button variant="outline" size="sm" onClick={() => handleSelectAll(true)}>
                    Select All
                  </Button>
                </TableHead>
                <TableHead className="px-2 py-3">Invoice #</TableHead>
                <TableHead className="px-2 py-3">Client</TableHead>
                <TableHead className="px-2 py-3">Project</TableHead>
                <TableHead className="px-2 py-3">Amount</TableHead>
                <TableHead className="px-2 py-3">Status</TableHead>
                <TableHead className="px-2 py-3">Due Date</TableHead>
                <TableHead className="w-12 px-2 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className={cn(
                    "hover:bg-muted/50 cursor-pointer",
                    invoice.status === 'overdue' ? "bg-red-50" : "",
                    invoice.status === 'paid' ? "bg-green-50" : ""
                  )}
                  onClick={() => onInvoiceSelect?.(invoice)}
                >
                  <TableCell className="w-12 px-2 py-3">
                    <Button variant="outline" size="sm" onClick={() => {
                      if (selectedInvoices.includes(invoice.id)) {
                        setSelectedInvoices(prev => prev.filter(id => id !== invoice.id))
                      } else {
                        setSelectedInvoices(prev => [...prev, invoice.id])
                      }
                    }}>
                      {selectedInvoices.includes(invoice.id) ? "Selected" : "Select"}
                    </Button>
                  </TableCell>
                  <TableCell className="px-2 py-3 font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="px-2 py-3">{invoice.clientName}</TableCell>
                  <TableCell className="px-2 py-3">{invoice.projectName || '-'}</TableCell>
                  <TableCell className="px-2 py-3 text-right">
                    ${invoice.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onInvoiceSelect?.(invoice)}>
                        <FileText className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}




