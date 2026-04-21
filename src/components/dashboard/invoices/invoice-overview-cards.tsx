"use client"

import * as React from "react"
import { DollarSign, Calendar, AlertTriangle, CheckCircle, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Invoice, InvoiceStatus } from "@/types/invoice.types"
import { cn } from "@/lib/utils"
import { money } from "@/components/dashboard/invoices/shared/format"

interface InvoiceOverviewCardsProps {
  invoices: Invoice[]
  className?: string
}

export function InvoiceOverviewCards({ invoices, className }: InvoiceOverviewCardsProps) {
  // Calculate overview statistics
  const stats = React.useMemo(() => {
    const total = invoices.length
    const outstanding = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length
    const dueIn7Days = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 24))
      return daysUntilDue >= 0 && daysUntilDue <= 7
    }).length
    const overdue = invoices.filter(inv => inv.status === 'overdue').length
    const paid = invoices.filter(inv => inv.status === 'paid').length
    const disputed = invoices.filter(inv => inv.status === 'disputed').length
    
    const totalOutstanding = invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0)
    
    const totalPaid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0)
    
    return {
      total,
      outstanding,
      dueIn7Days,
      overdue,
      paid,
      disputed,
      totalOutstanding,
      totalPaid
    }
  }, [invoices])

  const { outstanding, dueIn7Days, overdue, paid, disputed, totalOutstanding } = stats

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {/* Total Outstanding */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-3xl font-bold">{money(totalOutstanding)}</div>
          <p className="text-sm text-muted-foreground">
            {outstanding} invoices
          </p>
        </CardContent>
      </Card>

      {/* Due in 7 Days */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Due in 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={cn("text-3xl font-bold", dueIn7Days > 0 ? "text-red-500" : "text-gray-500")}>
            {dueIn7Days}
          </div>
          <p className="text-sm text-muted-foreground">
            invoices due soon
          </p>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-3xl font-bold text-red-500">{overdue}</div>
          <p className="text-sm text-muted-foreground">
            overdue invoices
          </p>
        </CardContent>
      </Card>

      {/* Paid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Paid
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-3xl font-bold text-green-500">{paid}</div>
          <p className="text-sm text-muted-foreground">
            paid invoices
          </p>
        </CardContent>
      </Card>

      {/* Disputed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Disputed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-3xl font-bold text-orange-500">{disputed}</div>
          <p className="text-sm text-muted-foreground">
            disputed invoices
          </p>
        </CardContent>
      </Card>
    </div>
  )
}




