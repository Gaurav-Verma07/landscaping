import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calendar, CheckCircle2, Circle, Clock, DollarSign, HardHat, Sun } from "lucide-react"
import Link from "next/link"

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Schedule</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">3 Jobs</div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
            <HardHat className="h-4 w-4 text-emerald-500" />
            <span>Crew 5 Assigned</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span>Low Weather Risk</span>
          </div>
          <div className="mt-4">
            <Link href="#" className="text-sm text-primary hover:underline flex items-center">
              View Calendar <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Active Projects Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5 Active</div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>2 Pending Approval</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>1 Completed (Not Invoiced)</span>
          </div>
          <div className="mt-4">
            <Link href="#" className="text-sm text-primary hover:underline flex items-center">
              View Projects <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Financial Snapshot */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Financial Snapshot</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">$12,560</div>
          <p className="text-xs text-muted-foreground">Unpaid Invoices Total</p>
          
          <div className="mt-3 space-y-1">
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid (30d):</span>
                <span className="font-medium text-emerald-600">$24,300</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Materials Due:</span>
                <span className="font-medium text-orange-600">$8,250</span>
             </div>
          </div>

          <div className="mt-4">
            <Link href="#" className="text-sm text-primary hover:underline flex items-center">
              Go To Invoices <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
