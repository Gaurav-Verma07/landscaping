"use client"

import * as React from "react"
import { useState } from "react"
import { format, subDays, addDays, startOfMonth, endOfMonth, isSameMonth, isToday } from "date-fns"
import { Search, Filter, Plus, Download, Calendar, AlertTriangle, FileText, DollarSign, Clock, CheckCircle, X, Send, CreditCard, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockInvoices } from "@/lib/mock/invoice-mock-data"
import { Invoice, InvoiceStatus, PaymentMethod } from "@/types/invoice.types"
import { cn } from "@/lib/utils"

interface StatusDashboardProps {
  invoices?: Invoice[]
  onInvoiceSelect?: (invoice: Invoice) => void
  onInvoiceAction?: (invoice: Invoice, action: string) => void
  className?: string
}

export function StatusDashboard({ 
  invoices = mockInvoices, 
  onInvoiceSelect, 
  onInvoiceAction,
  className 
}: StatusDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    dateRange: { start: "", end: "" }
  })
  
  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !filters.status || invoice.status === filters.status
    
    const matchesDateRange = !filters.dateRange.start || !filters.dateRange.end || (
      new Date(invoice.issueDate) >= new Date(filters.dateRange.start) &&
      new Date(invoice.issueDate) <= new Date(filters.dateRange.end)
    )
    
    return matchesSearch && matchesStatus && matchesDateRange
  })
  
  // Calculate overview statistics
  const stats = React.useMemo(() => {
    const total = filteredInvoices.length
    const paid = filteredInvoices.filter(inv => inv.status === 'paid').length
    const unpaid = filteredInvoices.filter(inv => inv.status === 'sent').length
    const overdue = filteredInvoices.filter(inv => inv.status === 'overdue').length
    const disputed = filteredInvoices.filter(inv => inv.status === 'disputed').length
    
    const totalPaid = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0)
    
    const totalUnpaid = filteredInvoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0)
    
    return {
      total,
      paid,
      unpaid,
      overdue,
      disputed,
      totalPaid,
      totalUnpaid
    }
  }, [filteredInvoices, searchTerm, filters])
  
  const handleSendReminder = (invoice: Invoice) => {
    console.log("Sending reminder for invoice:", invoice.invoiceNumber)
    onInvoiceAction?.(invoice, "send-reminder")
  }
  
  const handleRecordPayment = (invoice: Invoice) => {
    console.log("Recording payment for invoice:", invoice.invoiceNumber)
    onInvoiceAction?.(invoice, "record-payment")
  }
  
  const handleOpenDispute = (invoice: Invoice) => {
    console.log("Opening dispute for invoice:", invoice.invoiceNumber)
    onInvoiceAction?.(invoice, "open-dispute")
  }
  
  const handleExportCSV = () => {
    console.log("Exporting invoices to CSV")
    // In a real app, this would generate and download CSV
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
    <div className={cn("flex flex-col h-full gap-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Status</h1>
          <p className="text-muted-foreground">
            Track payment status, send reminders, and manage disputes
          </p>
        </div>
        
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-filter">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="Start date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                />
                <Input
                  type="date"
                  placeholder="End date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
            <p className="text-sm text-muted-foreground">
              paid invoices
            </p>
            <div className="text-sm font-medium">
              ${stats.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.unpaid}</div>
            <p className="text-sm text-muted-foreground">
              unpaid invoices
            </p>
            <div className="text-sm font-medium">
              ${stats.totalUnpaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <p className="text-sm text-muted-foreground">
              overdue invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-orange-500" />
              Disputed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.disputed}</div>
            <p className="text-sm text-muted-foreground">
              disputed invoices
            </p>
          </CardContent>
        </Card>
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
          <CardTitle className="text-lg">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 py-3">Invoice #</TableHead>
                <TableHead className="px-2 py-3">Client</TableHead>
                <TableHead className="px-2 py-3">Project</TableHead>
                <TableHead className="px-2 py-3">Amount</TableHead>
                <TableHead className="px-2 py-3">Status</TableHead>
                <TableHead className="px-2 py-3">Due Date</TableHead>
                <TableHead className="px-2 py-3">Actions</TableHead>
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
                      {invoice.status === 'sent' && (
                        <Button variant="outline" size="sm" onClick={() => handleSendReminder(invoice)}>
                          <Send className="h-4 w-4" />
                          Send Reminder
                        </Button>
                      )}
                      
                      {invoice.status === 'sent' && (
                        <Button variant="outline" size="sm" onClick={() => handleRecordPayment(invoice)}>
                          <CreditCard className="h-4 w-4" />
                          Record Payment
                        </Button>
                      )}
                      
                      {invoice.status === 'paid' && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenDispute(invoice)}>
                          <MessageSquare className="h-4 w-4" />
                          Open Dispute
                        </Button>
                      )}
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




